import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRevision } from '@/lib/revision-control';

/**
 * POST /api/revisions/create
 * Create a new revision (draft or proposed)
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
    const {
      documentId,
      content,
      title,
      description,
      status = 'draft',
      basedOn,
      sourceClient,
      sourceSessionId,
    } = body;

    if (!documentId || !content || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, content, title' },
        { status: 400 }
      );
    }

    if (status !== 'draft' && status !== 'proposed') {
      return NextResponse.json(
        { error: 'Status must be either "draft" or "proposed"' },
        { status: 400 }
      );
    }

    const revision = await createRevision({
      documentId,
      content,
      title,
      description,
      status,
      basedOn,
      authorId: user.id,
      authorType: 'user',
      sourceClient: sourceClient || 'web-ui',
      sourceSessionId,
    });

    return NextResponse.json({
      success: true,
      revision: {
        id: revision.id,
        documentId: revision.documentId,
        title: revision.title,
        description: revision.description,
        status: revision.status,
        isMain: revision.isMain,
        basedOn: revision.basedOn,
        hasConflicts: revision.hasConflicts,
        createdAt: revision.createdAt,
        reviewUrl: `/revisions/${revision.id}`,
      },
    });
  } catch (error: any) {
    console.error('Create revision error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create revision' },
      { status: 500 }
    );
  }
}
