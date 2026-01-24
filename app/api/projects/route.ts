import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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

    return NextResponse.json(projects);
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
  ),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let user;
    try {
      user = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, slug } = validation.data;

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

    // Create project and default README.md in a transaction
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        ownerId: user.id, // Set current user as owner
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
