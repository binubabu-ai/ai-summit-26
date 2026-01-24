import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/search?q={query}&projectId={projectId}&limit={limit}
 * Search for users to add to a project
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search users by email or name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        // Exclude current user from results
        NOT: {
          id: currentUser.id,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
      take: limit,
    });

    // If projectId is provided, check which users are already in the project
    let usersWithProjectStatus = users;

    if (projectId) {
      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId,
          userId: {
            in: users.map((u) => u.id),
          },
        },
        select: {
          userId: true,
        },
      });

      const memberUserIds = new Set(projectMembers.map((m) => m.userId));

      usersWithProjectStatus = users.map((user) => ({
        ...user,
        alreadyInProject: memberUserIds.has(user.id),
      }));
    } else {
      usersWithProjectStatus = users.map((user) => ({
        ...user,
        alreadyInProject: false,
      }));
    }

    return NextResponse.json({
      users: usersWithProjectStatus,
    });
  } catch (error: any) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
