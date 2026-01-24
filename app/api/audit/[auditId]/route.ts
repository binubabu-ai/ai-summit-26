import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/audit/[auditId]
 * Retrieves audit results by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auditId } = await context.params;

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Check if user owns this audit
    if (audit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}
