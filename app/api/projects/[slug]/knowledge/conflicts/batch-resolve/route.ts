import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { batchResolveConflicts, ResolutionStrategy } from '@/lib/ai/resolution-suggester';
import { logConflictResolve } from '@/lib/knowledge/audit';

// POST /api/projects/:slug/knowledge/conflicts/batch-resolve
// Resolve multiple conflicts with the same strategy
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
    const { conflictIds, strategy } = body;

    if (!conflictIds || !Array.isArray(conflictIds) || conflictIds.length === 0) {
      return NextResponse.json(
        { error: 'conflictIds array is required' },
        { status: 400 }
      );
    }

    if (!strategy) {
      return NextResponse.json(
        { error: 'Resolution strategy is required' },
        { status: 400 }
      );
    }

    const validStrategies: ResolutionStrategy[] = [
      'merge',
      'replace',
      'deprecate',
      'clarify',
      'split_scope',
      'version_both',
    ];

    if (!validStrategies.includes(strategy)) {
      return NextResponse.json(
        { error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Verify all conflicts belong to this project
    const conflicts = await prisma.moduleConflict.findMany({
      where: {
        id: { in: conflictIds },
        module: {
          document: {
            projectId: project.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (conflicts.length !== conflictIds.length) {
      return NextResponse.json(
        { error: 'Some conflicts not found or access denied' },
        { status: 404 }
      );
    }

    // Batch resolve
    const result = await batchResolveConflicts(
      conflictIds,
      strategy,
      user.id
    );

    // Log audit for successfully resolved conflicts
    // Get the conflicts that were successfully resolved
    const resolvedConflicts = await prisma.moduleConflict.findMany({
      where: {
        id: { in: conflictIds },
        status: 'resolved',
      },
      select: {
        id: true,
        module: {
          select: {
            document: {
              select: {
                projectId: true,
              },
            },
          },
        },
      },
    });

    // Log each resolved conflict
    await Promise.all(
      resolvedConflicts.map(conflict =>
        logConflictResolve(
          conflict.module.document.projectId,
          conflict.id,
          strategy,
          user.id
        )
      )
    );

    return NextResponse.json({
      resolved: result.resolved,
      failed: result.failed,
      errors: result.errors,
      strategy,
      message: `${result.resolved} conflict(s) resolved, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Failed to batch resolve conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to batch resolve conflicts' },
      { status: 500 }
    );
  }
}
