import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { detectProjectConflicts, storeConflicts } from '@/lib/ai/conflict-detection';
import { logConflictDetect } from '@/lib/knowledge/audit';

// GET /api/projects/:slug/knowledge/conflicts
// List all conflicts for a project with filtering
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
    const { searchParams } = new URL(request.url);

    // Query parameters
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const conflictType = searchParams.get('type');
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build where clause
    const where: any = {
      module: {
        document: {
          projectId: project.id,
          ...(documentId && { id: documentId }),
        },
      },
    };

    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (conflictType) where.conflictType = conflictType;

    // Get conflicts with pagination
    const [conflicts, total] = await Promise.all([
      prisma.moduleConflict.findMany({
        where,
        select: {
          id: true,
          conflictType: true,
          severity: true,
          description: true,
          status: true,
          detectedBy: true,
          detectedAt: true,
          resolvedAt: true,
          module: {
            select: {
              id: true,
              moduleKey: true,
              title: true,
              document: {
                select: {
                  path: true,
                },
              },
            },
          },
          conflictingModuleId: true,
          conflictingDocId: true,
        },
        orderBy: [
          { severity: 'desc' },
          { detectedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.moduleConflict.count({ where }),
    ]);

    // Get severity breakdown
    const severityBreakdown = await prisma.moduleConflict.groupBy({
      by: ['severity'],
      where: {
        module: {
          document: {
            projectId: project.id,
          },
        },
        status: 'open',
      },
      _count: true,
    });

    const breakdown: Record<string, number> = {};
    severityBreakdown.forEach(item => {
      breakdown[item.severity] = item._count;
    });

    return NextResponse.json({
      conflicts,
      total,
      limit,
      offset,
      hasMore: offset + conflicts.length < total,
      severityBreakdown: breakdown,
    });
  } catch (error) {
    console.error('Failed to fetch conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflicts' },
      { status: 500 }
    );
  }
}

// POST /api/projects/:slug/knowledge/conflicts
// Run conflict detection for project
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
    const body = await request.json();
    const { groundedOnly = false, maxModules = 1000 } = body;

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

    // Run conflict detection
    const result = await detectProjectConflicts(project.id, {
      groundedOnly,
      maxModules,
    });

    // Store detected conflicts
    const stored = await storeConflicts(result.conflicts);

    // Log audit
    await logConflictDetect(
      project.id,
      result.conflicts.length,
      stored.created,
      user.id
    );

    return NextResponse.json({
      detected: result.conflicts.length,
      stored: stored.created,
      summary: result.summary,
      usage: result.usage,
      message: `Detected ${result.conflicts.length} conflict(s), stored ${stored.created} new conflict(s)`,
    });
  } catch (error) {
    console.error('Failed to detect conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to detect conflicts' },
      { status: 500 }
    );
  }
}
