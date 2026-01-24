import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/documents/[id]/versions - Get version history for a document
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const versions = await prisma.version.findMany({
      where: {
        docId: id,
        proposalId: null, // Only main branch versions
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
