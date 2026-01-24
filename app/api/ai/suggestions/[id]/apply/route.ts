import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/ai/suggestions/:id/apply
 * Apply a suggestion to the document
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await context.params;

    // Get suggestion
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
      include: {
        document: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Verify user has access
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: suggestion.document.projectId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: { userId: user.id },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this document' },
        { status: 403 }
      );
    }

    // Check if already applied
    if (suggestion.status === 'applied') {
      return NextResponse.json(
        { error: 'Suggestion already applied' },
        { status: 400 }
      );
    }

    // Apply the suggestion to the document content
    const currentContent = suggestion.document.content;
    const newContent = currentContent.replace(
      suggestion.originalText,
      suggestion.suggestedText
    );

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: suggestion.documentId },
      data: {
        content: newContent,
      },
    });

    // Mark suggestion as applied
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });

    // Create version entry
    await prisma.version.create({
      data: {
        docId: suggestion.documentId,
        content: newContent,
        authorId: user.id,
        authorType: 'user',
        changeRationale: `Applied AI suggestion: ${suggestion.title}`,
        aiGenerated: true,
      },
    });

    return NextResponse.json({
      success: true,
      newContent,
    });
  } catch (error) {
    console.error('Apply suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to apply suggestion' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/suggestions/:id/reject
 * Reject a suggestion
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await context.params;

    // Update suggestion status
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to reject suggestion' },
      { status: 500 }
    );
  }
}
