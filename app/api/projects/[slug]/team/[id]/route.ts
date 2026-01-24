import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { requirePermissionBySlug } from '@/lib/permissions';

/**
 * PATCH /api/projects/[slug]/team/[id]
 * Update a team member's role
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
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
    const { slug, id: memberId } = params;

    // Check if user has permission to manage team
    await requirePermissionBySlug(user.id, slug, 'canManageTeam');

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    // Validate role
    if (!['EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EDITOR or VIEWER' },
        { status: 400 }
      );
    }

    // Get member
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change own role
    if (member.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Cannot change owner's role
    if (member.userId === member.project.ownerId) {
      return NextResponse.json(
        { error: 'Cannot change project owner role' },
        { status: 400 }
      );
    }

    // Update role
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Track in audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: member.projectId,
        action: 'member_role_updated',
        actorId: user.id,
        actorType: 'user',
        changes: {
          memberId,
          userId: member.userId,
          oldRole: member.role,
          newRole: role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error: any) {
    console.error('Update member role error:', error);

    if (error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[slug]/team/[id]
 * Remove a team member from the project
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
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
    const { slug, id: memberId } = params;

    // Check if user has permission to manage team
    await requirePermissionBySlug(user.id, slug, 'canManageTeam');

    // Get member
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove project owner
    if (member.userId === member.project.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      );
    }

    // Cannot remove self through this endpoint (use leave endpoint)
    if (member.userId === user.id) {
      return NextResponse.json(
        { error: 'Use the leave endpoint to remove yourself' },
        { status: 400 }
      );
    }

    // Delete member
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Track in audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: member.projectId,
        action: 'member_removed',
        actorId: user.id,
        actorType: 'user',
        changes: {
          memberId,
          userId: member.userId,
          role: member.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Remove member error:', error);

    if (error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
