import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const rejectSchema = z.object({
  reason: z.string().optional(),
});

// POST /api/proposals/[id]/reject - Reject a proposal
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    const proposal = await prisma.proposal.findUnique({
      where: { id },
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

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: reason
          ? `${proposal.description}\n\nRejection reason: ${reason}`
          : proposal.description,
      },
    });

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to reject proposal' },
      { status: 500 }
    );
  }
}
