import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-keys';

// GET /api/projects/:id/api-keys - List all API keys for a project
export async function GET(
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

    const { id: projectId } = await context.params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!project || (project.ownerId !== user.id && project.members.length === 0)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all API keys for this project (exclude the actual hash)
    const apiKeys = await prisma.apiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        requestCount: true,
        // Don't return the key hash for security
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/projects/:id/api-keys - Create a new API key
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

    const { id: projectId } = await context.params;
    const body = await request.json();
    const { name, expiresAt } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Verify user owns this project (only owners can create API keys)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can create API keys' },
        { status: 403 }
      );
    }

    // Generate the API key
    const { key, keyPrefix, keyHash } = generateApiKey(projectId);

    // Store the key in database
    const apiKey = await prisma.apiKey.create({
      data: {
        projectId,
        name,
        key: keyHash, // Store hash, not the actual key
        keyPrefix,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        permissions: {
          read: true,
          search: true,
          propose: true,
        },
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // Return the key ONLY ONCE - user must copy it now!
    return NextResponse.json({
      ...apiKey,
      key, // ⚠️ This is the only time the plaintext key is returned
      warning: 'Save this key now. You won\'t be able to see it again!',
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
