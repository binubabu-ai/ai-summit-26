import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/projects/[slug]/team/leave
 * Leave a project (remove yourself)
 */
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

    const params = await context.params;
    const { slug } = params;

    // Get project
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Cannot leave if you're the owner
    if (project.ownerId === user.id) {
      return NextResponse.json(
        { error: 'Project owner cannot leave. Transfer ownership or delete the project instead.' },
        { status: 400 }
      );
    }

    // Find member record
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 400 }
      );
    }

    // Delete member
    await prisma.projectMember.delete({
      where: { id: member.id },
    });

    // Track in audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'member_left',
        actorId: user.id,
        actorType: 'user',
        changes: {
          memberId: member.id,
          userId: user.id,
          role: member.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'You have left the project',
    });
  } catch (error: any) {
    console.error('Leave project error:', error);
    return NextResponse.json(
      { error: 'Failed to leave project' },
      { status: 500 }
    );
  }
}
