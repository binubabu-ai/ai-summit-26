import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/projects - List user's projects (supports both cookie and Bearer token auth)
export async function GET() {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projects where user is owner or member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            docs: true,
            proposals: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase with hyphens only'
  ).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    let { name, slug } = validation.data;

    // Generate slug from name if not provided
    if (!slug) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists
    const existing = await prisma.project.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this slug already exists' },
        { status: 409 }
      );
    }

    // Generate API key
    const crypto = require('crypto');
    const keyBuffer = crypto.randomBytes(24);
    const apiKey = 'dj_' + keyBuffer.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '');

    // Create project with default document and API key
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        ownerId: user.id,
        apiKeys: {
          create: {
            name: 'Default Key',
            key: apiKey,
            keyPrefix: 'dj_',
          },
        },
        docs: {
          create: {
            path: 'README.md',
            content: `# ${name}

> **About this document**: This README serves as the introduction and overview for your project. Edit this file to describe what your project is about, its purpose, and any important information visitors should know.

## What is this project?

[Describe your project here - what it does, who it's for, and why it exists]

## Key Information

- **Project Name**: ${name}
- **Project Slug**: ${slug}
- **Created**: ${new Date().toLocaleDateString()}

## Getting Started

[Add instructions on how to get started with this project]

## Documentation Structure

Use this project to organize your documentation:

- Create new documents for different topics
- Use folders in paths (e.g., \`api/authentication.md\`)
- Keep related docs together
- Update this README as your project evolves

## Additional Resources

[Add links to related resources, external docs, or helpful references]

---

*This README was automatically generated. Feel free to customize it to fit your project's needs.*
`,
            versions: {
              create: {
                content: `# ${name}

> **About this document**: This README serves as the introduction and overview for your project. Edit this file to describe what your project is about, its purpose, and any important information visitors should know.

## What is this project?

[Describe your project here - what it does, who it's for, and why it exists]

## Key Information

- **Project Name**: ${name}
- **Project Slug**: ${slug}
- **Created**: ${new Date().toLocaleDateString()}

## Getting Started

[Add instructions on how to get started with this project]

## Documentation Structure

Use this project to organize your documentation:

- Create new documents for different topics
- Use folders in paths (e.g., \`api/authentication.md\`)
- Keep related docs together
- Update this README as your project evolves

## Additional Resources

[Add links to related resources, external docs, or helpful references]

---

*This README was automatically generated. Feel free to customize it to fit your project's needs.*
`,
                authorId: user.id,
                authorType: 'user',
              },
            },
          },
        },
      },
    });

    // Create audit log for project creation and API key generation
    await prisma.auditLog.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        action: 'project_created',
        actorId: user.id,
        actorType: 'user',
        changes: {
          projectName: name,
          projectSlug: slug,
          defaultAPIKeyCreated: true,
          defaultDocumentCreated: true,
        },
      },
    });

    // Return project with apiKey property (apiKey only shown once!)
    return NextResponse.json(
      {
        ...project,
        apiKey,
        warning: 'Save this API key now. You won\'t be able to see it again!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
