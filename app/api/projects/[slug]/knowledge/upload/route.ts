import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { logDocumentUpload } from '@/lib/knowledge/audit';
import { convertToMarkdown, cleanMarkdown } from '@/lib/utils/document-converter';

// POST /api/projects/:slug/knowledge/upload
// Upload documents for processing
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

    // Verify user has access to this project
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

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.md', '.markdown', '.txt', '.docx'];

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      const hasAllowedExtension = allowedExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasAllowedExtension) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported format. Supported: ${allowedExtensions.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Create documents in "raw" state
    const uploadedDocs = await Promise.all(
      files.map(async (file) => {
        // Convert file to markdown (handles .docx, .txt, .md)
        let content: string;
        let conversionWarnings: string[] | undefined;

        try {
          const result = await convertToMarkdown(file);
          content = cleanMarkdown(result.markdown);
          conversionWarnings = result.warnings;
        } catch (conversionError) {
          // Fallback: try reading as text
          console.warn(`Conversion failed for ${file.name}, falling back to text:`, conversionError);
          const rawContent = await file.text();
          content = rawContent.replace(/\0/g, ''); // Remove null bytes
        }

        // Generate path from filename (convert extension to .md)
        const baseName = file.name.replace(/\.(docx|txt|md|markdown)$/i, '');
        const path = `uploads/${baseName.replace(/\s+/g, '-').toLowerCase()}.md`;

        // Check if document already exists
        const existing = await prisma.document.findFirst({
          where: {
            projectId: project.id,
            path,
          },
        });

        if (existing) {
          // Update existing document
          return prisma.document.update({
            where: { id: existing.id },
            data: {
              content,
              uploadState: 'raw',
              uploadedAt: new Date(),
              processedAt: null,
              processingError: null,
            },
            select: {
              id: true,
              path: true,
              uploadState: true,
              uploadedAt: true,
            },
          });
        }

        // Create new document
        return prisma.document.create({
          data: {
            projectId: project.id,
            path,
            content,
            uploadState: 'raw',
            uploadedAt: new Date(),
            editorialState: 'draft',
            groundingState: 'ungrounded',
          },
          select: {
            id: true,
            path: true,
            uploadState: true,
            uploadedAt: true,
          },
        });
      })
    );

    // Log audit
    await logDocumentUpload(
      project.id,
      uploadedDocs.map(d => d.id),
      user.id
    );

    return NextResponse.json({
      uploaded: uploadedDocs.length,
      documents: uploadedDocs,
      status: 'uploaded',
      message: `${uploadedDocs.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('Failed to upload documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
