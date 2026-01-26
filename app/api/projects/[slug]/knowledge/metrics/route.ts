import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { getConflictStats } from '@/lib/ai/conflict-detection';
import { getEmbeddingStats } from '@/lib/ai/embeddings';

// GET /api/projects/:slug/knowledge/metrics
// Get comprehensive knowledge system metrics
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

    // Get document statistics
    const [
      totalDocs,
      groundedDocs,
      activeDocs,
      expiringDocs,
      needsReview,
    ] = await Promise.all([
      prisma.document.count({
        where: { projectId: project.id },
      }),
      prisma.document.count({
        where: {
          projectId: project.id,
          groundingState: 'grounded',
        },
      }),
      prisma.document.count({
        where: {
          projectId: project.id,
          editorialState: 'active',
          groundingState: 'grounded',
        },
      }),
      prisma.document.count({
        where: {
          projectId: project.id,
          expiresAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            gte: new Date(),
          },
        },
      }),
      prisma.document.count({
        where: {
          projectId: project.id,
          nextReviewDue: {
            lte: new Date(),
          },
        },
      }),
    ]);

    // Get module statistics
    const [totalModules, groundedModules] = await Promise.all([
      prisma.documentModule.count({
        where: { document: { projectId: project.id } },
      }),
      prisma.documentModule.count({
        where: {
          document: { projectId: project.id },
          isGrounded: true,
        },
      }),
    ]);

    // Get category breakdown (using tags)
    const modulesWithTags = await prisma.documentModule.findMany({
      where: {
        document: { projectId: project.id },
        isGrounded: true,
      },
      select: {
        tags: true,
      },
    });

    const categoryBreakdown: Record<string, number> = {};
    modulesWithTags.forEach(module => {
      if (module.tags && Array.isArray(module.tags)) {
        (module.tags as string[]).forEach(tag => {
          categoryBreakdown[tag] = (categoryBreakdown[tag] || 0) + 1;
        });
      }
    });

    // Get top categories
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    // Get module type breakdown
    const moduleTypeStats = await prisma.documentModule.groupBy({
      by: ['moduleType', 'isGrounded'],
      where: {
        document: { projectId: project.id },
      },
      _count: true,
    });

    const moduleTypes: Record<string, { total: number; grounded: number }> = {};
    moduleTypeStats.forEach(stat => {
      if (!moduleTypes[stat.moduleType]) {
        moduleTypes[stat.moduleType] = { total: 0, grounded: 0 };
      }
      moduleTypes[stat.moduleType].total += stat._count;
      if (stat.isGrounded) {
        moduleTypes[stat.moduleType].grounded += stat._count;
      }
    });

    // Get conflict statistics
    const conflictStats = await getConflictStats(project.id);

    // Get embedding statistics
    const embeddingStats = await getEmbeddingStats(project.id);

    // Calculate health score (0-100)
    const groundingCoverage = totalDocs > 0 ? (groundedDocs / totalDocs) : 0;
    const conflictRate = totalModules > 0 ? (conflictStats.openConflicts / totalModules) : 0;
    const activeRate = groundedDocs > 0 ? (activeDocs / groundedDocs) : 0;

    const healthScore = Math.round(
      (groundingCoverage * 40) + // 40% weight on grounding coverage
      ((1 - conflictRate) * 30) + // 30% weight on low conflicts
      (activeRate * 20) +         // 20% weight on active docs
      (expiringDocs === 0 ? 10 : 0) // 10% weight on no expiring docs
    );

    // Calculate freshness score (based on recent updates)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyUpdated = await prisma.document.count({
      where: {
        projectId: project.id,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const freshnessScore = totalDocs > 0
      ? Math.round((recentlyUpdated / totalDocs) * 100)
      : 0;

    // Get recent grounding activity
    const recentGroundingHistory = await prisma.moduleGroundingHistory.findMany({
      where: {
        module: {
          document: {
            projectId: project.id,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        reason: true,
        occurredAt: true,
        module: {
          select: {
            moduleKey: true,
            title: true,
            document: {
              select: {
                path: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      health: {
        overallScore: healthScore,
        freshnessScore,
        groundingCoverage: Math.round(groundingCoverage * 100),
        conflictRate: Math.round(conflictRate * 100),
        status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor',
      },
      documents: {
        total: totalDocs,
        grounded: groundedDocs,
        active: activeDocs,
        expiringWithin7Days: expiringDocs,
        needsReview,
      },
      modules: {
        total: totalModules,
        grounded: groundedModules,
        coverage: totalModules > 0 ? Math.round((groundedModules / totalModules) * 100) : 0,
        byType: moduleTypes,
      },
      categories: {
        total: Object.keys(categoryBreakdown).length,
        topCategories,
      },
      conflicts: conflictStats,
      embeddings: embeddingStats,
      recentActivity: recentGroundingHistory,
    });
  } catch (error) {
    console.error('Failed to fetch knowledge metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge metrics' },
      { status: 500 }
    );
  }
}
