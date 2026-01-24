import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/proposals/[id]/approve - Approve and merge a proposal
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get proposal with changes
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        changes: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Proposal is not open' },
        { status: 400 }
      );
    }

    // TODO: Implement conflict detection in Phase 3

    // Merge changes: Update document content and create merge version
    for (const version of proposal.changes) {
      await prisma.document.update({
        where: { id: version.docId },
        data: {
          content: version.content,
          versions: {
            create: {
              content: version.content,
              authorId: null,
              authorType: 'system',
              changeType: 'merge',
            },
          },
        },
      });
    }

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { status: 'MERGED' },
    });

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error('Error approving proposal:', error);
    return NextResponse.json(
      { error: 'Failed to approve proposal' },
      { status: 500 }
    );
  }
}
