import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { auditDocument } from '@/lib/ai/audit';
import { checkPermission } from '@/lib/permissions';

/**
 * POST /api/audit/document
 * Runs AI audit on a single document
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
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access to this document's project
    const hasAccess = await checkPermission(user.id, document.projectId, 'canViewDocs');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run AI audit
    const auditResult = await auditDocument(
      document.id,
      document.path,
      document.content,
      document.updatedAt
    );

    // Save audit to database
    const audit = await prisma.audit.create({
      data: {
        auditType: 'document',
        targetId: documentId,
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
    console.error('Error running document audit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run audit' },
      { status: 500 }
    );
  }
}
