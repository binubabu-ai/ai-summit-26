import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { suggestResolution, applyResolution, ResolutionStrategy } from '@/lib/ai/resolution-suggester';
import { logConflictResolve, logConflictDismiss } from '@/lib/knowledge/audit';

// GET /api/projects/:slug/knowledge/conflicts/:conflictId
// Get detailed conflict information with resolution suggestions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; conflictId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, conflictId } = await context.params;

    // Get conflict with full details
    const conflict = await prisma.moduleConflict.findFirst({
      where: {
        id: conflictId,
        module: {
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
      },
      include: {
        module: {
          select: {
            id: true,
            moduleKey: true,
            title: true,
            content: true,
            isGrounded: true,
            confidenceScore: true,
            tags: true,
            document: {
              select: {
                path: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!conflict) {
      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Get conflicting module if exists
    let conflictingModule = null;
    if (conflict.conflictingModuleId) {
      conflictingModule = await prisma.documentModule.findUnique({
        where: { id: conflict.conflictingModuleId },
        select: {
          id: true,
          moduleKey: true,
          title: true,
          content: true,
          isGrounded: true,
          confidenceScore: true,
          tags: true,
          document: {
            select: {
              path: true,
              updatedAt: true,
            },
          },
        },
      });
    }

    // Generate resolution suggestions
    const suggestions = await suggestResolution(conflictId);

    return NextResponse.json({
      conflict: {
        ...conflict,
        conflictingModule,
      },
      resolutionSuggestions: suggestions.suggestions,
      recommendedStrategy: suggestions.recommendedStrategy,
      reasoning: suggestions.reasoning,
      aiUsage: suggestions.usage,
    });
  } catch (error) {
    console.error('Failed to fetch conflict details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict details' },
      { status: 500 }
    );
  }
}

// POST /api/projects/:slug/knowledge/conflicts/:conflictId/resolve
// Resolve a conflict using specified strategy
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; conflictId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, conflictId } = await context.params;
    const body = await request.json();
    const { strategy, customContent } = body;

    if (!strategy) {
      return NextResponse.json(
        { error: 'Resolution strategy is required' },
        { status: 400 }
      );
    }

    const validStrategies: ResolutionStrategy[] = [
      'merge',
      'replace',
      'deprecate',
      'clarify',
      'split_scope',
      'version_both',
    ];

    if (!validStrategies.includes(strategy)) {
      return NextResponse.json(
        { error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify user has access to this conflict
    const conflict = await prisma.moduleConflict.findFirst({
      where: {
        id: conflictId,
        module: {
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
      },
    });

    if (!conflict) {
      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Apply resolution
    const result = await applyResolution(
      conflictId,
      strategy,
      customContent,
      user.id
    );

    // Get project ID for audit logging
    const conflictWithProject = await prisma.moduleConflict.findUnique({
      where: { id: conflictId },
      select: {
        module: {
          select: {
            document: {
              select: {
                projectId: true,
              },
            },
          },
        },
      },
    });

    if (conflictWithProject) {
      // Log audit
      await logConflictResolve(
        conflictWithProject.module.document.projectId,
        conflictId,
        strategy,
        user.id
      );
    }

    return NextResponse.json({
      success: result.success,
      updatedModules: result.updatedModules,
      createdModules: result.createdModules,
      strategy,
      message: 'Conflict resolved successfully',
    });
  } catch (error) {
    console.error('Failed to resolve conflict:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:slug/knowledge/conflicts/:conflictId
// Dismiss/ignore a conflict
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; conflictId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, conflictId } = await context.params;

    // Verify user has access to this conflict
    const conflict = await prisma.moduleConflict.findFirst({
      where: {
        id: conflictId,
        module: {
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
      },
    });

    if (!conflict) {
      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Mark as ignored instead of deleting
    await prisma.moduleConflict.update({
      where: { id: conflictId },
      data: {
        status: 'ignored',
        resolvedAt: new Date(),
        resolvedBy: user.id,
        resolutionNote: 'Conflict dismissed by user',
      },
    });

    // Get project ID for audit logging
    const conflictWithProject = await prisma.moduleConflict.findUnique({
      where: { id: conflictId },
      select: {
        module: {
          select: {
            document: {
              select: {
                projectId: true,
              },
            },
          },
        },
      },
    });

    if (conflictWithProject) {
      // Log audit
      await logConflictDismiss(
        conflictWithProject.module.document.projectId,
        conflictId,
        user.id
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conflict ignored',
    });
  } catch (error) {
    console.error('Failed to dismiss conflict:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss conflict' },
      { status: 500 }
    );
  }
}
