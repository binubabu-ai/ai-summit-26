import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * GET /api/projects/[slug] - Get a single project by slug
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        docs: {
          orderBy: { path: 'asc' },
          select: {
            id: true,
            path: true,
            updatedAt: true,
          },
        },
        proposals: {
          where: {
            status: 'OPEN',
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            docs: true,
            proposals: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const hasAccess =
      project.ownerId === user.id ||
      (await prisma.projectMember.findFirst({
        where: {
          projectId: project.id,
          userId: user.id,
        },
      }));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[slug] - Update a project
 */
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owner can update project details' },
        { status: 403 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: validation.data,
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[slug] - Delete a project
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Get project and verify ownership
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, ownerId: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owner can delete the project' },
        { status: 403 }
      );
    }

    // Delete project (cascades to all related data via Prisma schema)
    await prisma.project.delete({
      where: { id: project.id },
    });

    // Track in audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'project_deleted',
        actorId: user.id,
        actorType: 'user',
        changes: {
          projectName: project.name,
          projectSlug: slug,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
