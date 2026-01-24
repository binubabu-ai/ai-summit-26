import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { auditProject } from '@/lib/ai/audit';
import { checkPermission } from '@/lib/permissions';

/**
 * POST /api/audit/project
 * Runs AI audit on a single project
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

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Check if user has access to this project
    const hasAccess = await checkPermission(user.id, projectId, 'canViewDocs');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get project with documents
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        docs: {
          select: {
            id: true,
            path: true,
            content: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Run AI audit
    const auditResult = await auditProject(
      project.id,
      project.name,
      project.docs
    );

    // Save audit to database
    const audit = await prisma.audit.create({
      data: {
        auditType: 'project',
        targetId: projectId,
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
    console.error('Error running project audit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run audit' },
      { status: 500 }
    );
  }
}
