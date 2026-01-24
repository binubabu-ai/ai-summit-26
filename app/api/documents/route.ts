import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

// GET /api/documents?projectId=xxx - List documents for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      include: {
        _count: {
          select: { versions: true },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document
const createDocumentSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  content: z.string().default(''),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let user;
    try {
      user = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { path, projectId, content } = validation.data;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create documents
    const hasPermission = await checkPermission(user.id, projectId, 'canCreateDocs');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to create documents in this project' },
        { status: 403 }
      );
    }

    // Check if document already exists
    const existing = await prisma.document.findUnique({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A document with this path already exists in this project' },
        { status: 409 }
      );
    }

    // Create document and initial version
    const document = await prisma.document.create({
      data: {
        path,
        projectId,
        content,
        versions: {
          create: {
            content,
            authorId: user.id,
            authorType: 'user',
          },
        },
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
