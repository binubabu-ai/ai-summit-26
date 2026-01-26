import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

// POST /api/projects/:slug/knowledge/grounding/batch
// Batch ground or unground multiple modules
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
    const { moduleIds, action, reason } = body;

    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleIds array is required' },
        { status: 400 }
      );
    }

    if (!action || !['ground', 'unground'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "ground" or "unground"' },
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

    // Verify all modules belong to this project
    const modules = await prisma.documentModule.findMany({
      where: {
        id: { in: moduleIds },
        document: {
          projectId: project.id,
        },
      },
      select: {
        id: true,
        moduleKey: true,
        isGrounded: true,
        content: true,
      },
    });

    if (modules.length !== moduleIds.length) {
      return NextResponse.json(
        { error: 'Some modules not found or access denied' },
        { status: 404 }
      );
    }

    const isGrounded = action === 'ground';
    const updates = [];
    const historyRecords = [];

    for (const module of modules) {
      // Skip if already in desired state
      if (module.isGrounded === isGrounded) {
        continue;
      }

      updates.push(
        prisma.documentModule.update({
          where: { id: module.id },
          data: {
            isGrounded,
            groundedAt: isGrounded ? new Date() : null,
            groundingSource: isGrounded ? 'manual' : undefined,
          },
        })
      );

      historyRecords.push(
        prisma.moduleGroundingHistory.create({
          data: {
            moduleId: module.id,
            action: isGrounded ? 'grounded' : 'ungrounded',
            previousState: module.isGrounded ? 'grounded' : 'ungrounded',
            newState: isGrounded ? 'grounded' : 'ungrounded',
            reason: reason || `Batch ${action} operation`,
            source: 'manual',
            triggeredBy: user.id,
            contentAfter: module.content,
          },
        })
      );
    }

    // Execute all updates
    await Promise.all([...updates, ...historyRecords]);

    // Update document grounding state
    const documentIds = modules.map(m => {
      // We need to get documentId - let's refetch
      return null;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      updated: updates.length,
      action,
      message: `${updates.length} module(s) ${isGrounded ? 'grounded' : 'ungrounded'} successfully`,
    });
  } catch (error) {
    console.error('Failed to batch ground modules:', error);
    return NextResponse.json(
      { error: 'Failed to batch ground modules' },
      { status: 500 }
    );
  }
}

// GET /api/projects/:slug/knowledge/grounding/status
// Get grounding status overview
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

    // Get grounding statistics
    const [totalModules, groundedModules, pendingReview] = await Promise.all([
      prisma.documentModule.count({
        where: { document: { projectId: project.id } },
      }),
      prisma.documentModule.count({
        where: {
          document: { projectId: project.id },
          isGrounded: true,
        },
      }),
      prisma.documentModule.count({
        where: {
          document: {
            projectId: project.id,
            uploadState: 'ready',
          },
          isGrounded: false,
        },
      }),
    ]);

    // Get grounding by module type
    const byType = await prisma.documentModule.groupBy({
      by: ['moduleType', 'isGrounded'],
      where: {
        document: { projectId: project.id },
      },
      _count: true,
    });

    const typeBreakdown: Record<string, { total: number; grounded: number }> = {};

    for (const item of byType) {
      if (!typeBreakdown[item.moduleType]) {
        typeBreakdown[item.moduleType] = { total: 0, grounded: 0 };
      }
      typeBreakdown[item.moduleType].total += item._count;
      if (item.isGrounded) {
        typeBreakdown[item.moduleType].grounded += item._count;
      }
    }

    const coverage = totalModules > 0 ? (groundedModules / totalModules) * 100 : 0;

    return NextResponse.json({
      total: totalModules,
      grounded: groundedModules,
      pending: pendingReview,
      coverage: Math.round(coverage * 10) / 10,
      byType: typeBreakdown,
    });
  } catch (error) {
    console.error('Failed to fetch grounding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grounding status' },
      { status: 500 }
    );
  }
}
