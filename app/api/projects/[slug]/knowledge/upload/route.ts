import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { logDocumentUpload } from '@/lib/knowledge/audit';

// POST /api/projects/:slug/knowledge/upload
// Upload documents for processing
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!project || (project.ownerId !== user.id && project.members.length === 0)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported type: ${file.type}` },
          { status: 400 }
        );
      }
    }

    // Create documents in "raw" state
    const uploadedDocs = await Promise.all(
      files.map(async (file) => {
        const rawContent = await file.text();

        // Sanitize content: remove null bytes (PostgreSQL doesn't allow them in text fields)
        const content = rawContent.replace(/\0/g, '');

        // Generate path from filename
        const path = `uploads/${file.name.replace(/\s+/g, '-').toLowerCase()}`;

        // Check if document already exists
        const existing = await prisma.document.findFirst({
          where: {
            projectId: project.id,
            path,
          },
        });

        if (existing) {
          // Update existing document
          return prisma.document.update({
            where: { id: existing.id },
            data: {
              content,
              uploadState: 'raw',
              uploadedAt: new Date(),
              processedAt: null,
              processingError: null,
            },
            select: {
              id: true,
              path: true,
              uploadState: true,
              uploadedAt: true,
            },
          });
        }

        // Create new document
        return prisma.document.create({
          data: {
            projectId: project.id,
            path,
            content,
            uploadState: 'raw',
            uploadedAt: new Date(),
            editorialState: 'draft',
            groundingState: 'ungrounded',
          },
          select: {
            id: true,
            path: true,
            uploadState: true,
            uploadedAt: true,
          },
        });
      })
    );

    // Log audit
    await logDocumentUpload(
      project.id,
      uploadedDocs.map(d => d.id),
      user.id
    );

    return NextResponse.json({
      uploaded: uploadedDocs.length,
      documents: uploadedDocs,
      status: 'uploaded',
      message: `${uploadedDocs.length} document(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('Failed to upload documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
