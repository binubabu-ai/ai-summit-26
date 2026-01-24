import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveRevision } from '@/lib/revision-control';

/**
 * POST /api/revisions/[id]/approve
 * Approve a proposed revision and make it the main version
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

    const revision = await approveRevision(revisionId, user.id);

    return NextResponse.json({
      success: true,
      revision: {
        id: revision.id,
        status: revision.status,
        isMain: revision.isMain,
        isNowMain: true,
        approvedAt: revision.approvedAt,
        approvedBy: revision.approvedBy,
      },
      message: 'Revision approved and is now the main version',
    });
  } catch (error: any) {
    console.error('Approve revision error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve revision' },
      { status: 500 }
    );
  }
}
