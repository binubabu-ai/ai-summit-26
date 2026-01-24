import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { auditDashboard } from '@/lib/ai/audit';

/**
 * POST /api/audit/dashboard
 * Runs AI audit on all user's projects
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all projects user owns or has access to
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { docs: true },
        },
        docs: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    const projectSummaries = projects.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      documentCount: p._count.docs,
      lastUpdated: p.docs[0]?.updatedAt || p.updatedAt,
    }));

    // Run AI audit
    const auditResult = await auditDashboard(projectSummaries);

    // Save audit to database
    const audit = await prisma.audit.create({
      data: {
        auditType: 'dashboard',
        targetId: null,
        userId: user.id,
        healthScore: auditResult.healthScore,
        consistencyScore: auditResult.consistencyScore,
        freshnessScore: auditResult.freshnessScore,
        qualityScore: auditResult.qualityScore,
        findings: auditResult.findings as any,
        duration: auditResult.duration,
        aiModel: auditResult.aiModel,
        cost: auditResult.cost,
      },
    });

    return NextResponse.json({
      auditId: audit.id,
      ...auditResult,
    });
  } catch (error) {
    console.error('Error running dashboard audit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run audit' },
      { status: 500 }
    );
  }
}
