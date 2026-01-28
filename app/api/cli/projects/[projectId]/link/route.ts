import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

type Params = {
  params: Promise<{
    projectId: string;
  }>;
};

/**
 * POST /api/cli/projects/[projectId]/link
 * Link CLI user to project by adding them as a VIEWER member
 * Supports both cookie auth (web) and Bearer token auth (CLI)
 */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Fetch project to verify it exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is already the owner
    if (project.ownerId === user.id) {
      return NextResponse.json({
        success: true,
        message: 'You are already the owner of this project',
        role: 'OWNER',
        alreadyMember: true,
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: `You are already a member of this project with role: ${existingMember.role}`,
        role: existingMember.role,
        alreadyMember: true,
      });
    }

    // Add user as VIEWER member
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'VIEWER',
        invitedBy: null, // Self-joined via CLI
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'cli_member_added',
        actorId: user.id,
        actorType: 'user',
        changes: {
          projectName: project.name,
          projectSlug: project.slug,
          newMemberId: user.id,
          role: 'VIEWER',
          source: 'cli_link',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully linked to project! You can now access it in the web UI.',
      role: newMember.role,
      alreadyMember: false,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
    });
  } catch (error) {
    console.error('CLI link error:', error);
    return NextResponse.json(
      { error: 'Failed to link to project' },
      { status: 500 }
    );
  }
}
