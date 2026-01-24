import { NextRequest, NextResponse } from 'next/server';
import { getRevisionStatus } from '@/lib/revision-control';

/**
 * GET /api/revisions/[id]/status
 * Get the status of a revision (for MCP bidirectional flow)
 * This endpoint can be called without authentication for MCP clients
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const revisionId = params.id;

    const status = await getRevisionStatus(revisionId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Get revision status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get revision status' },
      { status: 500 }
    );
  }
}
