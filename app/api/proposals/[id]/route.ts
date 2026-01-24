import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/proposals/[id] - Get a single proposal with changes
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        changes: {
          include: {
            document: {
              select: {
                id: true,
                path: true,
                content: true, // Current main content for comparison
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}
