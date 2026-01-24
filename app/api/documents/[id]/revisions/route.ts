import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listRevisions } from '@/lib/revision-control';

/**
 * GET /api/documents/[id]/revisions
 * List all revisions for a document
 */
export async function GET(
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
    const documentId = params.id;

    const revisions = await listRevisions(documentId);

    return NextResponse.json({
      success: true,
      revisions: revisions.map((revision) => ({
        id: revision.id,
        title: revision.title,
        description: revision.description,
        status: revision.status,
        isMain: revision.isMain,
        basedOn: revision.basedOn,
        hasConflicts: revision.hasConflicts,
        conflictReason: revision.conflictReason,
        authorId: revision.authorId,
        authorType: revision.authorType,
        author: revision.author
          ? {
              id: revision.author.id,
              name: revision.author.name,
              email: revision.author.email,
            }
          : null,
        sourceClient: revision.sourceClient,
        createdAt: revision.createdAt,
        proposedAt: revision.proposedAt,
        approvedAt: revision.approvedAt,
        rejectedAt: revision.rejectedAt,
        diff: revision.diffs[0] || null,
      })),
    });
  } catch (error: any) {
    console.error('List revisions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list revisions' },
      { status: 500 }
    );
  }
}
