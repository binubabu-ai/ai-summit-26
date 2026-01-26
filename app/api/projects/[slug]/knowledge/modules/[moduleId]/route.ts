import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/projects/:slug/knowledge/modules/:moduleId
// Get a single module with full details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; moduleId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, moduleId } = await context.params;

    // Get module with project access check
    const module = await prisma.documentModule.findFirst({
      where: {
        id: moduleId,
        document: {
          project: {
            slug,
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
      include: {
        document: {
          select: {
            id: true,
            path: true,
            projectId: true,
          },
        },
        conflicts: {
          where: {
            status: { in: ['open', 'acknowledged'] },
          },
          select: {
            id: true,
            conflictType: true,
            severity: true,
            description: true,
            detectedAt: true,
          },
        },
        groundingHistory: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            reason: true,
            source: true,
            occurredAt: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Failed to fetch module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/:slug/knowledge/modules/:moduleId
// Update module content, boundaries, or metadata
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; moduleId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, moduleId } = await context.params;
    const body = await request.json();

    // Verify user has access to this project
    const module = await prisma.documentModule.findFirst({
      where: {
        id: moduleId,
        document: {
          project: {
            slug,
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
      select: {
        id: true,
        content: true,
        isGrounded: true,
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (body.content !== undefined) {
      updateData.content = body.content;
      updateData.contentHash = crypto.createHash('sha256')
        .update(body.content)
        .digest('hex')
        .substring(0, 16);

      // If content changed and module was grounded, unground it
      if (module.isGrounded && body.content !== module.content) {
        updateData.isGrounded = false;

        // Record in history
        await prisma.moduleGroundingHistory.create({
          data: {
            moduleId: module.id,
            action: 'ungrounded',
            previousState: 'grounded',
            newState: 'ungrounded',
            reason: 'Content was modified',
            source: 'manual',
            triggeredBy: user.id,
            contentBefore: module.content,
            contentAfter: body.content,
          },
        });
      }
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startLine !== undefined) updateData.startLine = body.startLine;
    if (body.endLine !== undefined) updateData.endLine = body.endLine;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.moduleType !== undefined) updateData.moduleType = body.moduleType;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.dependsOn !== undefined) updateData.dependsOn = body.dependsOn;

    // Update module
    const updatedModule = await prisma.documentModule.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        document: {
          select: {
            path: true,
          },
        },
        conflicts: {
          where: { status: 'open' },
          select: {
            id: true,
            severity: true,
          },
        },
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error('Failed to update module:', error);
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:slug/knowledge/modules/:moduleId
// Delete a module
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; moduleId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, moduleId } = await context.params;

    // Verify user owns this project (only owners can delete modules)
    const module = await prisma.documentModule.findFirst({
      where: {
        id: moduleId,
        document: {
          project: {
            slug,
            ownerId: user.id,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Delete module (cascades to conflicts and history)
    await prisma.documentModule.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete module:', error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}
