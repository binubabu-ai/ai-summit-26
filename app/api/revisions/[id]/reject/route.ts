import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rejectRevision } from '@/lib/revision-control';

/**
 * POST /api/revisions/[id]/reject
 * Reject a proposed revision
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const revisionId = params.id;

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const revision = await rejectRevision(revisionId, user.id, reason);

    return NextResponse.json({
      success: true,
      revision: {
        id: revision.id,
        status: revision.status,
        rejectedAt: revision.rejectedAt,
        rejectedBy: revision.rejectedBy,
      },
      message: 'Revision rejected',
    });
  } catch (error: any) {
    console.error('Reject revision error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject revision' },
      { status: 500 }
    );
  }
}
