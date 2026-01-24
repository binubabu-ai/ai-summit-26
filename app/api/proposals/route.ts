import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/proposals?projectId=xxx - List proposals for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { changes: true },
        },
      },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Create a new proposal
const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  branchName: z.string().min(1, 'Branch name is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createProposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if branch name already exists
    const existing = await prisma.proposal.findUnique({
      where: { branchName: data.branchName },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A proposal with this branch name already exists' },
        { status: 409 }
      );
    }

    const proposal = await prisma.proposal.create({
      data,
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
