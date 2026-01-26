import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

// GET /api/projects/:slug/knowledge/modules
// List all modules for a project with filtering
export async function GET(
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
    const { searchParams } = new URL(request.url);

    // Query parameters
    const documentId = searchParams.get('documentId');
    const isGrounded = searchParams.get('isGrounded');
    const moduleType = searchParams.get('moduleType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build where clause
    const where: any = {
      document: {
        projectId: project.id,
      },
    };

    if (documentId) {
      where.documentId = documentId;
    }

    if (isGrounded !== null && isGrounded !== undefined) {
      where.isGrounded = isGrounded === 'true';
    }

    if (moduleType) {
      where.moduleType = moduleType;
    }

    // Get modules with pagination
    const [modules, total] = await Promise.all([
      prisma.documentModule.findMany({
        where,
        select: {
          id: true,
          moduleKey: true,
          title: true,
          description: true,
          order: true,
          isGrounded: true,
          confidenceScore: true,
          moduleType: true,
          tags: true,
          dependsOn: true,
          createdAt: true,
          updatedAt: true,
          document: {
            select: {
              id: true,
              path: true,
            },
          },
          conflicts: {
            where: {
              status: 'open',
            },
            select: {
              id: true,
              severity: true,
            },
          },
        },
        orderBy: [
          { document: { path: 'asc' } },
          { order: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.documentModule.count({ where }),
    ]);

    return NextResponse.json({
      modules,
      total,
      limit,
      offset,
      hasMore: offset + modules.length < total,
    });
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
