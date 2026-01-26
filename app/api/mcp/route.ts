import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashApiKey, isValidApiKeyFormat } from '@/lib/api-keys';
import {
  createRevision,
  proposeRevision,
  getRevisionStatus,
  listRevisions,
  rebaseRevision,
} from '@/lib/revision-control';

/**
 * MCP Server Endpoint
 * Handles Model Context Protocol requests from AI assistants
 *
 * Authentication: Bearer token with project-scoped API key
 * Format: Authorization: Bearer dj_proj_{projectId}_{randomString}
 */

// POST /api/mcp - Handle MCP requests
export async function POST(request: NextRequest) {
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Validate key format
    if (!isValidApiKeyFormat(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    // Hash the key and find it in database
    const keyHash = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: keyHash },
      include: {
        project: {
          include: {
            docs: true,
          },
        },
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'API key has expired' },
        { status: 401 }
      );
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 },
        lastUsedFrom: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Parse MCP request
    const body = await request.json();
    const { method, params } = body;

    // Route to appropriate handler
    switch (method) {
      case 'tools/list':
        return handleToolsList(apiKeyRecord.project);

      case 'tools/call':
        return handleToolsCall(apiKeyRecord.project, params);

      case 'resources/list':
        return handleResourcesList(apiKeyRecord.project);

      case 'resources/read':
        return handleResourcesRead(apiKeyRecord.project, params);

      case 'prompts/list':
        return handlePromptsList(apiKeyRecord.project);

      case 'prompts/get':
        return handlePromptsGet(apiKeyRecord.project, params);

      default:
        return NextResponse.json(
          { error: `Unknown method: ${method}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// List available tools
function handleToolsList(project: any) {
  return NextResponse.json({
    tools: [
      {
        name: 'read_document',
        description: 'Read the content of a document in the project',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the document (e.g., "architecture.md", "api/auth.md")',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_documents',
        description: 'Search for documents by content or path',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_documents',
        description: 'List all documents in the project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'propose_change',
        description: 'Propose a change to a document (creates a proposal for review)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the document to change',
            },
            newContent: {
              type: 'string',
              description: 'New content for the document',
            },
            title: {
              type: 'string',
              description: 'Title for the proposal',
            },
            rationale: {
              type: 'string',
              description: 'Explanation of why this change is needed',
            },
          },
          required: ['path', 'newContent', 'title', 'rationale'],
        },
      },
      {
        name: 'get_project_info',
        description: 'Get information about the current project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_revision',
        description: 'Create a new revision (draft or proposed) with grounding status',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the document',
            },
            content: {
              type: 'string',
              description: 'New content for the revision',
            },
            title: {
              type: 'string',
              description: 'Title describing the changes',
            },
            description: {
              type: 'string',
              description: 'Detailed rationale for the changes',
            },
            status: {
              type: 'string',
              description: 'Status: "draft" or "proposed" (default: draft)',
              enum: ['draft', 'proposed'],
              default: 'draft',
            },
            basedOn: {
              type: 'string',
              description: 'Revision ID this is based on (optional, defaults to current main)',
            },
          },
          required: ['path', 'content', 'title'],
        },
      },
      {
        name: 'propose_revision',
        description: 'Move a draft revision to proposed status (ready for review)',
        inputSchema: {
          type: 'object',
          properties: {
            revisionId: {
              type: 'string',
              description: 'ID of the draft revision to propose',
            },
          },
          required: ['revisionId'],
        },
      },
      {
        name: 'get_revision_status',
        description: 'Check the status of a revision (approved, rejected, pending, conflicted)',
        inputSchema: {
          type: 'object',
          properties: {
            revisionId: {
              type: 'string',
              description: 'ID of the revision to check',
            },
          },
          required: ['revisionId'],
        },
      },
      {
        name: 'list_revisions',
        description: 'List all revisions for a document',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the document',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'query_grounded_knowledge',
        description: 'Search across grounded documentation modules for specific information',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query or keywords to search for',
            },
            category: {
              type: 'string',
              description: 'Optional category filter (tag) for modules',
            },
            minConfidence: {
              type: 'number',
              description: 'Minimum confidence score (0.0-1.0, default: 0.5)',
              default: 0.5,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_grounding_status',
        description: 'Check grounding status for documents and their modules',
        inputSchema: {
          type: 'object',
          properties: {
            documentPath: {
              type: 'string',
              description: 'Optional document path to check specific document status',
            },
          },
        },
      },
      {
        name: 'list_grounded_modules',
        description: 'List all grounded modules in the project with metadata',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter (tag)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of modules to return (default: 50)',
              default: 50,
            },
          },
        },
      },
    ],
  });
}

// Handle tool execution
async function handleToolsCall(project: any, params: any) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'read_document':
        return await readDocument(project, args);

      case 'search_documents':
        return await searchDocuments(project, args);

      case 'list_documents':
        return await listDocuments(project);

      case 'propose_change':
        return await proposeChange(project, args);

      case 'get_project_info':
        return await getProjectInfo(project);

      case 'create_revision':
        return await createRevisionTool(project, args);

      case 'propose_revision':
        return await proposeRevisionTool(project, args);

      case 'get_revision_status':
        return await getRevisionStatusTool(project, args);

      case 'list_revisions':
        return await listRevisionsTool(project, args);

      case 'query_grounded_knowledge':
        return await queryGroundedKnowledge(project, args);

      case 'get_grounding_status':
        return await getGroundingStatus(project, args);

      case 'list_grounded_modules':
        return await listGroundedModules(project, args);

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${name}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`Tool ${name} failed:`, error);
    return NextResponse.json(
      { error: `Tool execution failed: ${error}` },
      { status: 500 }
    );
  }
}

// Tool implementations
async function readDocument(project: any, args: { path: string }) {
  const doc = await prisma.document.findUnique({
    where: {
      projectId_path: {
        projectId: project.id,
        path: args.path,
      },
    },
    include: {
      mainRevision: true,
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: `Document not found: ${args.path}` },
      { status: 404 }
    );
  }

  // Return grounding information
  const groundingInfo = {
    isGrounded: true, // This is the main version
    revisionId: doc.mainRevisionId || 'none',
    content: doc.content,
  };

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(groundingInfo, null, 2),
      },
    ],
  });
}

async function searchDocuments(project: any, args: { query: string; limit?: number }) {
  const limit = args.limit || 10;

  const docs = await prisma.document.findMany({
    where: {
      projectId: project.id,
      OR: [
        { path: { contains: args.query, mode: 'insensitive' } },
        { content: { contains: args.query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    select: {
      path: true,
      content: true,
      updatedAt: true,
    },
  });

  const results = docs.map((doc) => ({
    path: doc.path,
    excerpt: doc.content.substring(0, 200) + '...',
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2),
      },
    ],
  });
}

async function listDocuments(project: any) {
  const docs = await prisma.document.findMany({
    where: { projectId: project.id },
    select: {
      path: true,
      updatedAt: true,
      freshnessScore: true,
      riskScore: true,
    },
    orderBy: { path: 'asc' },
  });

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(docs, null, 2),
      },
    ],
  });
}

async function proposeChange(
  project: any,
  args: { path: string; newContent: string; title: string; rationale: string }
) {
  // Find the document
  const doc = await prisma.document.findUnique({
    where: {
      projectId_path: {
        projectId: project.id,
        path: args.path,
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: `Document not found: ${args.path}` },
      { status: 404 }
    );
  }

  // Create a revision directly as "proposed" status
  const revision = await createRevision({
    documentId: doc.id,
    content: args.newContent,
    title: args.title,
    description: args.rationale,
    status: 'proposed',
    authorType: 'ai',
    sourceClient: 'mcp-client',
  });

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/revisions/${revision.id}`;

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: `Revision proposed successfully!\n\nTitle: ${args.title}\nRevision ID: ${revision.id}\nStatus: ${revision.status}\nReview URL: ${reviewUrl}\n\nThe revision is now ${revision.hasConflicts ? 'CONFLICTED and needs rebasing' : 'pending review'}.`,
      },
    ],
  });
}

async function getProjectInfo(project: any) {
  const docCount = await prisma.document.count({
    where: { projectId: project.id },
  });

  const proposalCount = await prisma.proposal.count({
    where: { projectId: project.id, status: 'OPEN' },
  });

  const info = {
    name: project.name,
    slug: project.slug,
    documentCount: docCount,
    openProposals: proposalCount,
    createdAt: project.createdAt.toISOString(),
  };

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(info, null, 2),
      },
    ],
  });
}

// Revision System Tools
async function createRevisionTool(
  project: any,
  args: {
    path: string;
    content: string;
    title: string;
    description?: string;
    status?: 'draft' | 'proposed';
    basedOn?: string;
  }
) {
  // Find the document
  const doc = await prisma.document.findUnique({
    where: {
      projectId_path: {
        projectId: project.id,
        path: args.path,
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: `Document not found: ${args.path}` },
      { status: 404 }
    );
  }

  // Create the revision
  const revision = await createRevision({
    documentId: doc.id,
    content: args.content,
    title: args.title,
    description: args.description,
    status: args.status || 'draft',
    basedOn: args.basedOn,
    authorType: 'ai',
    sourceClient: 'mcp-client',
  });

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/revisions/${revision.id}`;

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            revisionId: revision.id,
            status: revision.status,
            requiresApproval: revision.status === 'proposed',
            hasConflicts: revision.hasConflicts,
            reviewUrl,
            message:
              revision.status === 'draft'
                ? 'Draft revision created. Use propose_revision to submit for review.'
                : 'Revision proposed and ready for review.',
          },
          null,
          2
        ),
      },
    ],
  });
}

async function proposeRevisionTool(project: any, args: { revisionId: string }) {
  const revision = await proposeRevision(args.revisionId);

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            status: revision.status,
            hasConflicts: revision.hasConflicts,
            conflictReason: revision.conflictReason,
            proposedAt: revision.proposedAt,
            requiresApproval: revision.status === 'proposed',
            message:
              revision.status === 'conflicted'
                ? `Cannot propose: ${revision.conflictReason}`
                : 'Revision proposed successfully and is ready for review.',
          },
          null,
          2
        ),
      },
    ],
  });
}

async function getRevisionStatusTool(project: any, args: { revisionId: string }) {
  const status = await getRevisionStatus(args.revisionId);

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ...status,
            message:
              status.status === 'approved'
                ? '✅ Revision has been approved and is now the main version!'
                : status.status === 'rejected'
                ? '❌ Revision has been rejected'
                : status.status === 'conflicted'
                ? '⚠️ Revision has conflicts and needs rebasing'
                : status.status === 'proposed'
                ? '⏳ Revision is pending review'
                : '📝 Revision is still a draft',
          },
          null,
          2
        ),
      },
    ],
  });
}

async function listRevisionsTool(project: any, args: { path: string }) {
  // Find the document
  const doc = await prisma.document.findUnique({
    where: {
      projectId_path: {
        projectId: project.id,
        path: args.path,
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: `Document not found: ${args.path}` },
      { status: 404 }
    );
  }

  const revisions = await listRevisions(doc.id);

  const formattedRevisions = revisions.map((rev) => ({
    id: rev.id,
    title: rev.title,
    description: rev.description,
    status: rev.status,
    isMain: rev.isMain,
    hasConflicts: rev.hasConflicts,
    author: rev.author ? rev.author.name || rev.author.email : 'AI',
    createdAt: rev.createdAt.toISOString(),
    proposedAt: rev.proposedAt?.toISOString(),
    approvedAt: rev.approvedAt?.toISOString(),
  }));

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            documentPath: args.path,
            revisions: formattedRevisions,
            mainRevisionId: doc.mainRevisionId,
          },
          null,
          2
        ),
      },
    ],
  });
}

// Resources - expose documents as resources
function handleResourcesList(project: any) {
  const resources = project.docs.map((doc: any) => ({
    uri: `docs:///${project.slug}/${doc.path}`,
    name: doc.path,
    mimeType: 'text/markdown',
    description: `Document: ${doc.path}`,
  }));

  return NextResponse.json({ resources });
}

async function handleResourcesRead(project: any, params: any) {
  const { uri } = params;
  const path = uri.replace(`docs:///${project.slug}/`, '');

  const doc = await prisma.document.findUnique({
    where: {
      projectId_path: {
        projectId: project.id,
        path,
      },
    },
  });

  if (!doc) {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: doc.content,
      },
    ],
  });
}

// Prompts - provide helpful prompts for working with docs
function handlePromptsList(project: any) {
  return NextResponse.json({
    prompts: [
      {
        name: 'review_documentation',
        description: 'Review all documentation for inconsistencies and gaps',
      },
      {
        name: 'update_section',
        description: 'Update a specific section of documentation',
        arguments: [
          {
            name: 'path',
            description: 'Path to the document',
            required: true,
          },
          {
            name: 'section',
            description: 'Section to update',
            required: true,
          },
        ],
      },
    ],
  });
}

async function handlePromptsGet(project: any, params: any) {
  const { name, arguments: args } = params;

  if (name === 'review_documentation') {
    const docs = await prisma.document.findMany({
      where: { projectId: project.id },
      select: { path: true, content: true },
    });

    const docsText = docs
      .map((doc) => `## ${doc.path}\n\n${doc.content}`)
      .join('\n\n---\n\n');

    return NextResponse.json({
      description: 'Review all documentation',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review the following documentation for the ${project.name} project. Look for:\n- Inconsistencies or contradictions\n- Missing information or incomplete sections\n- Outdated content\n- Ambiguous statements\n\n${docsText}`,
          },
        },
      ],
    });
  }

  return NextResponse.json(
    { error: 'Unknown prompt' },
    { status: 400 }
  );
}

// Grounded Knowledge Tools
async function queryGroundedKnowledge(
  project: any,
  args: { query: string; category?: string; minConfidence?: number; limit?: number }
) {
  const minConfidence = args.minConfidence || 0.5;
  const limit = args.limit || 10;

  // Build where clause
  const where: any = {
    document: {
      projectId: project.id,
    },
    isGrounded: true,
    confidenceScore: { gte: minConfidence },
  };

  // Add category filter if provided
  if (args.category) {
    where.tags = {
      path: '$[*]',
      array_contains: args.category,
    };
  }

  // Search grounded modules
  const modules = await prisma.documentModule.findMany({
    where: {
      ...where,
      OR: [
        { title: { contains: args.query, mode: 'insensitive' } },
        { description: { contains: args.query, mode: 'insensitive' } },
        { content: { contains: args.query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      moduleKey: true,
      title: true,
      description: true,
      content: true,
      isGrounded: true,
      confidenceScore: true,
      tags: true,
      document: {
        select: {
          path: true,
          groundingState: true,
        },
      },
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { groundedAt: 'desc' },
    ],
    take: limit,
  });

  const results = modules.map((module) => ({
    moduleKey: module.moduleKey,
    title: module.title,
    description: module.description,
    content: module.content,
    documentPath: module.document.path,
    confidenceScore: module.confidenceScore,
    tags: module.tags,
    isGrounded: module.isGrounded,
  }));

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: args.query,
            resultsCount: results.length,
            results,
            message:
              results.length > 0
                ? `Found ${results.length} grounded module(s) matching your query.`
                : 'No grounded modules found matching your query.',
          },
          null,
          2
        ),
      },
    ],
  });
}

async function getGroundingStatus(project: any, args: { documentPath?: string }) {
  if (args.documentPath) {
    // Get specific document status
    const doc = await prisma.document.findUnique({
      where: {
        projectId_path: {
          projectId: project.id,
          path: args.documentPath,
        },
      },
      select: {
        path: true,
        groundingState: true,
        groundedAt: true,
        editorialState: true,
        uploadState: true,
        modules: {
          select: {
            id: true,
            moduleKey: true,
            title: true,
            isGrounded: true,
            confidenceScore: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: `Document not found: ${args.documentPath}` },
        { status: 404 }
      );
    }

    const groundedModules = doc.modules.filter(m => m.isGrounded).length;
    const totalModules = doc.modules.length;

    return NextResponse.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              documentPath: doc.path,
              groundingState: doc.groundingState,
              editorialState: doc.editorialState,
              uploadState: doc.uploadState,
              groundedAt: doc.groundedAt?.toISOString(),
              modulesGrounded: groundedModules,
              totalModules,
              groundingCoverage: totalModules > 0 ? (groundedModules / totalModules) * 100 : 0,
              modules: doc.modules,
            },
            null,
            2
          ),
        },
      ],
    });
  }

  // Get project-wide status
  const [totalDocuments, groundedDocuments, totalModules, groundedModules] = await Promise.all([
    prisma.document.count({
      where: { projectId: project.id },
    }),
    prisma.document.count({
      where: { projectId: project.id, groundingState: 'grounded' },
    }),
    prisma.documentModule.count({
      where: { document: { projectId: project.id } },
    }),
    prisma.documentModule.count({
      where: { document: { projectId: project.id }, isGrounded: true },
    }),
  ]);

  // Get breakdown by grounding state
  const documentsByState = await prisma.document.groupBy({
    by: ['groundingState'],
    where: { projectId: project.id },
    _count: true,
  });

  const stateBreakdown: Record<string, number> = {};
  documentsByState.forEach(item => {
    stateBreakdown[item.groundingState] = item._count;
  });

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            projectName: project.name,
            totalDocuments,
            groundedDocuments,
            documentGroundingCoverage: totalDocuments > 0 ? (groundedDocuments / totalDocuments) * 100 : 0,
            totalModules,
            groundedModules,
            moduleGroundingCoverage: totalModules > 0 ? (groundedModules / totalModules) * 100 : 0,
            stateBreakdown,
            message: `${groundedDocuments}/${totalDocuments} documents grounded (${((groundedDocuments / totalDocuments) * 100).toFixed(1)}%)`,
          },
          null,
          2
        ),
      },
    ],
  });
}

async function listGroundedModules(project: any, args: { category?: string; limit?: number }) {
  const limit = args.limit || 50;

  // Build where clause
  const where: any = {
    document: {
      projectId: project.id,
    },
    isGrounded: true,
  };

  // Add category filter if provided
  if (args.category) {
    where.tags = {
      path: '$[*]',
      array_contains: args.category,
    };
  }

  const modules = await prisma.documentModule.findMany({
    where,
    select: {
      id: true,
      moduleKey: true,
      title: true,
      description: true,
      moduleType: true,
      isGrounded: true,
      groundedAt: true,
      confidenceScore: true,
      tags: true,
      dependsOn: true,
      document: {
        select: {
          path: true,
        },
      },
    },
    orderBy: [
      { groundedAt: 'desc' },
      { confidenceScore: 'desc' },
    ],
    take: limit,
  });

  // Group by category if requested
  const categoryCounts: Record<string, number> = {};
  modules.forEach(module => {
    const tags = module.tags as string[] || [];
    tags.forEach(tag => {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    });
  });

  const formattedModules = modules.map(module => ({
    moduleKey: module.moduleKey,
    title: module.title,
    description: module.description,
    documentPath: module.document.path,
    moduleType: module.moduleType,
    confidenceScore: module.confidenceScore,
    groundedAt: module.groundedAt?.toISOString(),
    tags: module.tags,
    dependencies: module.dependsOn,
  }));

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            totalGrounded: formattedModules.length,
            modules: formattedModules,
            categoryBreakdown: categoryCounts,
            message: `${formattedModules.length} grounded module(s) available for context.`,
          },
          null,
          2
        ),
      },
    ],
  });
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
