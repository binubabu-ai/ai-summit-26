import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

// GET /api/projects/:slug/knowledge/status
// Get overall knowledge system status for a project
export async function GET(
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

    // Get document statistics
    const [
      totalDocs,
      rawDocs,
      processingDocs,
      readyDocs,
      failedDocs,
      groundedDocs,
      activeDocs,
    ] = await Promise.all([
      prisma.document.count({ where: { projectId: project.id } }),
      prisma.document.count({ where: { projectId: project.id, uploadState: 'raw' } }),
      prisma.document.count({ where: { projectId: project.id, uploadState: 'processing' } }),
      prisma.document.count({ where: { projectId: project.id, uploadState: 'ready' } }),
      prisma.document.count({ where: { projectId: project.id, uploadState: 'failed' } }),
      prisma.document.count({
        where: {
          projectId: project.id,
          groundingState: 'grounded',
        },
      }),
      prisma.document.count({
        where: {
          projectId: project.id,
          editorialState: 'active',
          groundingState: 'grounded',
        },
      }),
    ]);

    // Get module statistics
    const [totalModules, groundedModules, conflicts] = await Promise.all([
      prisma.documentModule.count({
        where: { document: { projectId: project.id } },
      }),
      prisma.documentModule.count({
        where: {
          document: { projectId: project.id },
          isGrounded: true,
        },
      }),
      prisma.moduleConflict.count({
        where: {
          module: { document: { projectId: project.id } },
          status: 'open',
        },
      }),
    ]);

    // Calculate coverage percentages
    const groundingCoverage = totalDocs > 0 ? (groundedDocs / totalDocs) * 100 : 0;
    const moduleGroundingCoverage = totalModules > 0 ? (groundedModules / totalModules) * 100 : 0;

    // Get recent processing activity
    const recentProcessing = await prisma.document.findMany({
      where: {
        projectId: project.id,
        uploadState: { in: ['processing', 'raw'] },
      },
      select: {
        id: true,
        path: true,
        uploadState: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      documents: {
        total: totalDocs,
        raw: rawDocs,
        processing: processingDocs,
        ready: readyDocs,
        failed: failedDocs,
        grounded: groundedDocs,
        active: activeDocs,
        groundingCoverage: Math.round(groundingCoverage * 10) / 10,
      },
      modules: {
        total: totalModules,
        grounded: groundedModules,
        coverage: Math.round(moduleGroundingCoverage * 10) / 10,
      },
      conflicts: {
        open: conflicts,
      },
      recentActivity: recentProcessing,
    });
  } catch (error) {
    console.error('Failed to fetch knowledge status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge status' },
      { status: 500 }
    );
  }
}
