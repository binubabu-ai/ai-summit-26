import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  getUserProjectRoleBySlug,
  requirePermissionBySlug,
  Role,
} from '@/lib/permissions';

/**
 * GET /api/projects/[slug]/team
 * Get all team members for a project
 */
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

    // Check if user has access to the project
    const userRole = await getUserProjectRoleBySlug(user.id, slug);
    if (!userRole) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Get all team members
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Add owner to the list if not already there
    const ownerAsMember = members.find((m) => m.userId === project.ownerId);
    if (!ownerAsMember) {
      const owner = await prisma.user.findUnique({
        where: { id: project.ownerId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });

      if (owner) {
        members.unshift({
          id: 'owner',
          projectId: project.id,
          userId: owner.id,
          role: 'OWNER',
          createdAt: new Date(),
          invitedBy: null,
          lastAccessAt: null,
          user: owner,
          inviter: null,
        } as any);
      }
    }

    return NextResponse.json({
      members,
      currentUserRole: userRole,
    });
  } catch (error: any) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[slug]/team
 * Add a user to the project team
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

    // Check if user has permission to manage team
    await requirePermissionBySlug(user.id, slug, 'canManageTeam');

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EDITOR or VIEWER' },
        { status: 400 }
      );
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      );
    }

    // Add user to project
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role,
        invitedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Track in audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'member_added',
        actorId: user.id,
        actorType: 'user',
        changes: {
          memberId: newMember.id,
          userId,
          role,
          invitedBy: user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      member: newMember,
    });
  } catch (error: any) {
    console.error('Add team member error:', error);

    if (error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}
