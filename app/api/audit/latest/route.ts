import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/audit/latest?level={dashboard|project|document}&targetId={id}
 * Retrieves the most recent audit for a given level and target
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const targetId = searchParams.get('targetId');

    if (!level) {
      return NextResponse.json({ error: 'level is required' }, { status: 400 });
    }

    // Build query conditions
    const where: any = {
      userId: user.id,
      auditType: level,
    };

    // For project and document level, require targetId
    if (level === 'project' || level === 'document') {
      if (!targetId) {
        return NextResponse.json({ error: 'targetId is required for project/document audits' }, { status: 400 });
      }
      where.targetId = targetId;
    } else {
      // For dashboard level, targetId should be null
      where.targetId = null;
    }

    // Find most recent audit
    const audit = await prisma.audit.findFirst({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!audit) {
      return NextResponse.json({ audit: null });
    }

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('Error fetching latest audit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}
