import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { logModuleGround } from '@/lib/knowledge/audit';

// POST /api/projects/:slug/knowledge/modules/:moduleId/ground
// Ground or unground a specific module
export async function POST(
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
    const { action, reason, confidence } = body;

    if (!action || !['ground', 'unground'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "ground" or "unground"' },
        { status: 400 }
      );
    }

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
      select: {
        id: true,
        moduleKey: true,
        content: true,
        isGrounded: true,
        documentId: true,
        document: {
          select: {
            groundingState: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const isGrounded = action === 'ground';

    // Check if state change is needed
    if (module.isGrounded === isGrounded) {
      return NextResponse.json({
        success: true,
        message: `Module already ${isGrounded ? 'grounded' : 'ungrounded'}`,
        module: {
          id: module.id,
          isGrounded: module.isGrounded,
        },
      });
    }

    // Update module grounding state
    const updatedModule = await prisma.documentModule.update({
      where: { id: moduleId },
      data: {
        isGrounded,
        groundedAt: isGrounded ? new Date() : null,
        groundingSource: isGrounded ? 'manual' : undefined,
        confidenceScore: confidence !== undefined ? confidence : undefined,
      },
      select: {
        id: true,
        moduleKey: true,
        isGrounded: true,
        groundedAt: true,
        confidenceScore: true,
      },
    });

    // Record in grounding history
    await prisma.moduleGroundingHistory.create({
      data: {
        moduleId: module.id,
        action: isGrounded ? 'grounded' : 'ungrounded',
        previousState: module.isGrounded ? 'grounded' : 'ungrounded',
        newState: isGrounded ? 'grounded' : 'ungrounded',
        reason: reason || `Manual ${action} operation`,
        source: 'manual',
        triggeredBy: user.id,
        contentAfter: module.content,
        confidenceScore: confidence,
      },
    });

    // Get project ID for audit logging
    const moduleWithProject = await prisma.documentModule.findUnique({
      where: { id: moduleId },
      select: {
        document: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (moduleWithProject) {
      // Log audit
      await logModuleGround(
        moduleWithProject.document.projectId,
        moduleId,
        isGrounded,
        reason || `Manual ${action} operation`,
        user.id
      );
    }

    // Check if we should update document grounding state
    // Document is grounded if ALL modules are grounded
    const moduleStats = await prisma.documentModule.aggregate({
      where: { documentId: module.documentId },
      _count: true,
    });

    const groundedModuleCount = await prisma.documentModule.count({
      where: {
        documentId: module.documentId,
        isGrounded: true,
      },
    });

    const allModulesGrounded = groundedModuleCount === moduleStats._count;

    if (allModulesGrounded && module.document.groundingState !== 'grounded') {
      await prisma.document.update({
        where: { id: module.documentId },
        data: {
          groundingState: 'grounded',
          groundedAt: new Date(),
        },
      });
    } else if (!allModulesGrounded && module.document.groundingState === 'grounded') {
      await prisma.document.update({
        where: { id: module.documentId },
        data: {
          groundingState: 'ungrounded',
          groundedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      module: updatedModule,
      message: `Module ${isGrounded ? 'grounded' : 'ungrounded'} successfully`,
    });
  } catch (error) {
    console.error('Failed to ground module:', error);
    return NextResponse.json(
      { error: 'Failed to ground module' },
      { status: 500 }
    );
  }
}
