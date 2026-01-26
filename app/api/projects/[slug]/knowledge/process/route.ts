import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { analyzeSourceDocument } from '@/lib/ai/spec-analyzer';
import { generateDocumentsFromAnalysis } from '@/lib/ai/spec-generator';
import { generateDocumentEmbeddings } from '@/lib/ai/embeddings';
import { logDocumentProcess } from '@/lib/knowledge/audit';
import '@/lib/templates'; // Initialize templates

// POST /api/projects/:slug/knowledge/process
// Process uploaded documents (generate specs or mark as ready)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await request.json();
    const { documentIds, mode } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'documentIds array is required' },
        { status: 400 }
      );
    }

    if (!mode || !['as-is', 'generate-specs'].includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be "as-is" or "generate-specs"' },
        { status: 400 }
      );
    }

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!project || (project.ownerId !== user.id && project.members.length === 0)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        projectId: project.id,
      },
      select: {
        id: true,
        path: true,
        content: true,
        uploadState: true,
      },
    });

    if (documents.length === 0) {
      return NextResponse.json({ error: 'No valid documents found' }, { status: 404 });
    }

    const processedDocs = [];
    const generatedDocs = [];
    let totalCost = 0;

    for (const doc of documents) {
      try {
        // Update state to processing
        await prisma.document.update({
          where: { id: doc.id },
          data: { uploadState: 'processing' },
        });

        if (mode === 'as-is') {
          // Mark as ready without decomposition
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              uploadState: 'ready',
              processedAt: new Date(),
            },
          });

          // Generate embeddings
          const embResult = await generateDocumentEmbeddings(doc.id, doc.content);
          totalCost += embResult.usage.cost;

          // Log audit
          await logDocumentProcess(project.id, doc.id, 'as-is', 0, user.id);

          processedDocs.push({
            documentId: doc.id,
            path: doc.path,
            mode: 'as-is',
            status: 'ready',
          });
        } else {
          // Generate implementation specs
          // Step 1: Analyze source document
          const analysis = await analyzeSourceDocument(doc.content, doc.path, {
            projectTechStack: {
              framework: 'nextjs',
              database: 'postgresql',
              orm: 'prisma',
              auth: 'supabase',
              language: 'typescript',
            },
          });

          totalCost += analysis.analysisCost;

          // Step 2: Generate documents from analysis
          const generated = await generateDocumentsFromAnalysis(
            doc.content,
            doc.path,
            doc.id,
            project.id,
            analysis
          );

          // Step 3: Create each generated document in database
          const createdDocs = await Promise.all(
            generated.map(async (genDoc) => {
              const created = await prisma.document.create({
                data: {
                  projectId: project.id,
                  path: genDoc.path,
                  content: genDoc.content,
                  docType: genDoc.docType,
                  sourceDocumentId: doc.id,
                  generatedBy: 'ai',
                  generationPrompt: genDoc.metadata.prompt,
                  templateUsed: genDoc.metadata.templateId,
                  uploadState: 'ready',
                  processedAt: new Date(),
                  editorialState: 'draft',
                  groundingState: 'ungrounded',
                },
                select: {
                  id: true,
                  path: true,
                  docType: true,
                },
              });

              // Generate embeddings for each generated doc
              const embResult = await generateDocumentEmbeddings(created.id, genDoc.content);
              totalCost += embResult.usage.cost + (genDoc.metadata.cost || 0);

              return {
                ...created,
                title: genDoc.title, // Attach title from generated doc (not stored in DB)
              };
            })
          );

          generatedDocs.push(...createdDocs);

          // Mark source document as ready
          await prisma.document.update({
            where: { id: doc.id },
            data: {
              uploadState: 'ready',
              processedAt: new Date(),
            },
          });

          // Log audit
          await logDocumentProcess(
            project.id,
            doc.id,
            'generate-specs',
            createdDocs.length,
            user.id
          );

          processedDocs.push({
            documentId: doc.id,
            path: doc.path,
            mode: 'generate-specs',
            status: 'ready',
            specsGenerated: createdDocs.length,
            analysis: {
              features: analysis.features.length,
              constraints: analysis.constraints.length,
              decisions: analysis.decisions.length,
              techStack: analysis.detectedTechStack,
            },
            generatedDocuments: createdDocs.map(d => ({
              id: d.id,
              path: d.path,
              docType: d.docType,
            })),
          });
        }
      } catch (error) {
        // Mark as failed
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            uploadState: 'failed',
            processingError: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        processedDocs.push({
          documentId: doc.id,
          path: doc.path,
          mode,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processed: processedDocs.length,
      documents: processedDocs,
      specsGenerated: generatedDocs.length,
      totalCost: totalCost.toFixed(4),
      status: 'completed',
    });
  } catch (error) {
    console.error('Failed to process documents:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}
