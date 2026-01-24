import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

// DELETE /api/projects/:slug/api-keys/:keyId - Delete an API key
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; keyId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, keyId } = await context.params;

    // Verify user owns this project
    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project || project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can delete API keys' },
        { status: 403 }
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: {
        id: keyId,
        projectId: project.id, // Ensure it belongs to this project
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/:slug/api-keys/:keyId - Update API key (toggle active status)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; keyId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, keyId } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    // Verify user owns this project
    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project || project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can update API keys' },
        { status: 403 }
      );
    }

    // Update the API key
    const apiKey = await prisma.apiKey.update({
      where: {
        id: keyId,
        projectId: project.id,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        requestCount: true,
      },
    });

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}
