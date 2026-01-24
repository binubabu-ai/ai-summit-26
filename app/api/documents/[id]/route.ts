import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/documents/[id] - Get a single document
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            authorId: true,
            authorType: true,
            createdAt: true,
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

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update a document
const updateDocumentSchema = z.object({
  content: z.string(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const body = await request.json();
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Check if document exists and user has access to the project
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // For now, only the project owner can edit documents
    // TODO: Check project members and their roles
    if (doc.project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to edit this document' },
        { status: 403 }
      );
    }

    // Update document and create new version
    const document = await prisma.document.update({
      where: { id },
      data: {
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

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const { id } = await params;

    // Check if document exists and user has access
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Only project owner can delete documents
    if (doc.project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this document' },
        { status: 403 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
