/**
 * AI Context Helper
 * Provides standardized context for all AI calls, including date/time information
 */

/**
 * Get current date/time context for AI calls
 * Ensures AI has accurate temporal awareness for:
 * - TTL calculations
 * - Expiry detection
 * - Freshness scoring
 * - Temporal conflict detection
 */
export function getCurrentDateTimeContext(): string {
  const now = new Date();

  return `
# Current Date & Time Context

**Current Date:** ${now.toISOString().split('T')[0]} (YYYY-MM-DD)
**Current DateTime (UTC):** ${now.toISOString()}
**Current DateTime (Local):** ${now.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateStyle: 'full',
    timeStyle: 'long'
  })}
**Unix Timestamp:** ${now.getTime()}
**Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}

IMPORTANT: Use this date/time when:
- Calculating document age or freshness
- Determining if content is expired (check expiresAt fields)
- Evaluating if reviews are overdue (check nextReviewDue fields)
- Comparing temporal data (created dates, updated dates, published dates)
- Making recommendations about content currency
`.trim();
}

/**
 * Build system instruction with date/time context
 */
export function buildSystemInstruction(
  baseInstruction: string,
  options?: {
    includeDateContext?: boolean;
    additionalContext?: string;
  }
): string {
  const { includeDateContext = true, additionalContext } = options || {};

  let instruction = baseInstruction;

  if (includeDateContext) {
    instruction += '\n\n' + getCurrentDateTimeContext();
  }

  if (additionalContext) {
    instruction += '\n\n' + additionalContext;
  }

  return instruction;
}

/**
 * Build document context for AI calls
 */
export interface DocumentContext {
  documentPath: string;
  documentContent: string;
  selectedText?: string;
  projectName?: string;
  relatedDocs?: string[];
  metadata?: {
    createdAt?: Date | string;
    updatedAt?: Date | string;
    expiresAt?: Date | string;
    lastReviewedAt?: Date | string;
    freshnessScore?: number;
    groundingState?: string;
    editorialState?: string;
  };
}

export function buildDocumentContext(context: DocumentContext): string {
  let prompt = `
# Document Context

**Path:** ${context.documentPath}
**Project:** ${context.projectName || 'Unknown'}
`;

  // Add metadata context if available
  if (context.metadata) {
    const { metadata } = context;

    if (metadata.createdAt || metadata.updatedAt || metadata.expiresAt) {
      prompt += '\n## Temporal Information\n';

      if (metadata.createdAt) {
        const createdDate = typeof metadata.createdAt === 'string'
          ? new Date(metadata.createdAt)
          : metadata.createdAt;
        prompt += `- Created: ${createdDate.toISOString().split('T')[0]}\n`;
      }

      if (metadata.updatedAt) {
        const updatedDate = typeof metadata.updatedAt === 'string'
          ? new Date(metadata.updatedAt)
          : metadata.updatedAt;
        prompt += `- Last Updated: ${updatedDate.toISOString().split('T')[0]}\n`;

        // Calculate age
        const now = new Date();
        const daysSinceUpdate = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
        prompt += `- Age: ${daysSinceUpdate} days since last update\n`;
      }

      if (metadata.expiresAt) {
        const expiresDate = typeof metadata.expiresAt === 'string'
          ? new Date(metadata.expiresAt)
          : metadata.expiresAt;
        prompt += `- Expires: ${expiresDate.toISOString().split('T')[0]}\n`;

        // Calculate days until expiry
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          prompt += `- ⚠️ EXPIRED ${Math.abs(daysUntilExpiry)} days ago\n`;
        } else if (daysUntilExpiry < 7) {
          prompt += `- ⚠️ Expiring in ${daysUntilExpiry} days\n`;
        } else {
          prompt += `- Expires in ${daysUntilExpiry} days\n`;
        }
      }

      if (metadata.lastReviewedAt) {
        const reviewedDate = typeof metadata.lastReviewedAt === 'string'
          ? new Date(metadata.lastReviewedAt)
          : metadata.lastReviewedAt;
        prompt += `- Last Reviewed: ${reviewedDate.toISOString().split('T')[0]}\n`;
      }
    }

    if (metadata.freshnessScore !== undefined) {
      prompt += `\n## Quality Metrics\n`;
      prompt += `- Freshness Score: ${metadata.freshnessScore.toFixed(2)}/1.0\n`;
    }

    if (metadata.groundingState || metadata.editorialState) {
      prompt += `\n## Document State\n`;
      if (metadata.groundingState) {
        prompt += `- Grounding State: ${metadata.groundingState}\n`;
      }
      if (metadata.editorialState) {
        prompt += `- Editorial State: ${metadata.editorialState}\n`;
      }
    }
  }

  // Add document content
  prompt += `
## Document Content:
\`\`\`markdown
${context.documentContent}
\`\`\`
`;

  if (context.selectedText) {
    prompt += `\n## Selected Text:\n\`\`\`\n${context.selectedText}\n\`\`\`\n`;
  }

  if (context.relatedDocs && context.relatedDocs.length > 0) {
    prompt += `\n## Related Documents:\n${context.relatedDocs.map(doc => `- ${doc}`).join('\n')}\n`;
  }

  return prompt;
}

/**
 * Build project-level context for AI calls
 */
export interface ProjectContext {
  projectId: string;
  projectName: string;
  documentCount: number;
  groundedCount?: number;
  totalModules?: number;
  groundedModules?: number;
  conflictCount?: number;
  documents?: Array<{
    path: string;
    title?: string;
    groundingState?: string;
    editorialState?: string;
  }>;
}

export function buildProjectContext(context: ProjectContext): string {
  let prompt = `
# Project Context

**Project:** ${context.projectName}
**Total Documents:** ${context.documentCount}
`;

  if (context.groundedCount !== undefined) {
    const groundingPercentage = context.documentCount > 0
      ? ((context.groundedCount / context.documentCount) * 100).toFixed(1)
      : '0.0';
    prompt += `**Grounded Documents:** ${context.groundedCount} (${groundingPercentage}%)\n`;
  }

  if (context.totalModules !== undefined && context.groundedModules !== undefined) {
    const modulePercentage = context.totalModules > 0
      ? ((context.groundedModules / context.totalModules) * 100).toFixed(1)
      : '0.0';
    prompt += `**Grounded Modules:** ${context.groundedModules}/${context.totalModules} (${modulePercentage}%)\n`;
  }

  if (context.conflictCount !== undefined) {
    prompt += `**Active Conflicts:** ${context.conflictCount}\n`;
  }

  if (context.documents && context.documents.length > 0) {
    prompt += '\n## Available Documents:\n';
    for (const doc of context.documents) {
      const badges = [];
      if (doc.groundingState) badges.push(doc.groundingState);
      if (doc.editorialState) badges.push(doc.editorialState);

      const badgeStr = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
      prompt += `- ${doc.path}${doc.title ? ` - ${doc.title}` : ''}${badgeStr}\n`;
    }
  }

  return prompt;
}

/**
 * Build module context for AI calls
 */
export interface ModuleContext {
  moduleKey: string;
  title: string;
  content: string;
  isGrounded: boolean;
  confidenceScore: number;
  moduleType: string;
  dependsOn?: string[];
  tags?: string[];
}

export function buildModuleContext(module: ModuleContext): string {
  let prompt = `
# Module Context

**Module Key:** ${module.moduleKey}
**Title:** ${module.title}
**Type:** ${module.moduleType}
**Grounded:** ${module.isGrounded ? 'Yes' : 'No'}
**Confidence:** ${(module.confidenceScore * 100).toFixed(0)}%
`;

  if (module.dependsOn && module.dependsOn.length > 0) {
    prompt += `**Dependencies:** ${module.dependsOn.join(', ')}\n`;
  }

  if (module.tags && module.tags.length > 0) {
    prompt += `**Tags:** ${module.tags.join(', ')}\n`;
  }

  prompt += `
## Module Content:
\`\`\`markdown
${module.content}
\`\`\`
`;

  return prompt;
}

/**
 * Format date/time for AI consumption
 */
export function formatDateForAI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.toISOString().split('T')[0]} (${d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })})`;
}

/**
 * Calculate age in human-readable format
 */
export function calculateAge(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Build conflict context for AI calls
 */
export interface ConflictContext {
  conflictId: string;
  conflictType: string;
  severity: string;
  description: string;
  sourceModule: ModuleContext;
  conflictingModule?: ModuleContext;
  conflictingContent?: string;
}

export function buildConflictContext(conflict: ConflictContext): string {
  let prompt = `
# Conflict Analysis Context

**Conflict ID:** ${conflict.conflictId}
**Type:** ${conflict.conflictType}
**Severity:** ${conflict.severity}
**Description:** ${conflict.description}

## Source Module
${buildModuleContext(conflict.sourceModule)}
`;

  if (conflict.conflictingModule) {
    prompt += `\n## Conflicting Module\n${buildModuleContext(conflict.conflictingModule)}\n`;
  } else if (conflict.conflictingContent) {
    prompt += `\n## Conflicting Content:\n\`\`\`markdown\n${conflict.conflictingContent}\n\`\`\`\n`;
  }

  return prompt;
}
