import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { proposeRevision } from '@/lib/revision-control';

/**
 * POST /api/revisions/[id]/propose
 * Move a draft revision to proposed status
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

    const revision = await proposeRevision(revisionId, user.id);

    return NextResponse.json({
      success: true,
      revision: {
        id: revision.id,
        status: revision.status,
        hasConflicts: revision.hasConflicts,
        conflictReason: revision.conflictReason,
        proposedAt: revision.proposedAt,
        requiresApproval: revision.status === 'proposed',
      },
    });
  } catch (error: any) {
    console.error('Propose revision error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to propose revision' },
      { status: 500 }
    );
  }
}
