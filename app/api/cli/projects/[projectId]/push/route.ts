import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { z } from 'zod';

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

// Schema for bulk document push
const pushDocumentsSchema = z.object({
  documents: z.array(z.object({
    path: z.string().min(1),
    content: z.string(),
  })),
});

/**
 * POST /api/cli/projects/[projectId]/push
 * Bulk push documents from CLI to cloud
 * Creates new documents or updates existing ones
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Require authentication
    let user;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - please run docjays login' },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create/edit documents
    const canCreate = await checkPermission(user.id, projectId, 'canCreateDocs');
    const canEdit = await checkPermission(user.id, projectId, 'canEditDocs');

    if (!canCreate && !canEdit) {
      return NextResponse.json(
        { error: 'Forbidden - you do not have permission to push documents to this project' },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = pushDocumentsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { documents } = validation.data;

    // Get existing documents for this project
    const existingDocs = await prisma.document.findMany({
      where: { projectId },
      select: { id: true, path: true, content: true },
    });

    const existingByPath = new Map(existingDocs.map(d => [d.path, d]));

    // Track results
    const results = {
      created: [] as string[],
      updated: [] as string[],
      unchanged: [] as string[],
      errors: [] as { path: string; error: string }[],
    };

    // Process each document
    for (const doc of documents) {
      try {
        const existing = existingByPath.get(doc.path);

        if (existing) {
          // Document exists - check if content changed
          if (existing.content === doc.content) {
            results.unchanged.push(doc.path);
          } else if (canEdit) {
            // Update existing document
            await prisma.document.update({
              where: { id: existing.id },
              data: {
                content: doc.content,
                versions: {
                  create: {
                    content: doc.content,
                    authorId: user.id,
                    authorType: 'cli',
                  },
                },
              },
            });
            results.updated.push(doc.path);
          } else {
            results.errors.push({
              path: doc.path,
              error: 'No permission to edit existing documents',
            });
          }
        } else if (canCreate) {
          // Create new document
          await prisma.document.create({
            data: {
              path: doc.path,
              projectId,
              content: doc.content,
              versions: {
                create: {
                  content: doc.content,
                  authorId: user.id,
                  authorType: 'cli',
                },
              },
            },
          });
          results.created.push(doc.path);
        } else {
          results.errors.push({
            path: doc.path,
            error: 'No permission to create new documents',
          });
        }
      } catch (error: any) {
        results.errors.push({
          path: doc.path,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
      },
      summary: {
        total: documents.length,
        created: results.created.length,
        updated: results.updated.length,
        unchanged: results.unchanged.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error: any) {
    console.error('Error pushing documents:', error);
    return NextResponse.json(
      { error: 'Failed to push documents', details: error.message },
      { status: 500 }
    );
  }
}
