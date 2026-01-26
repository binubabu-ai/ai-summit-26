/**
 * Conflict Resolution Suggester Service
 * AI-powered suggestions for resolving documentation conflicts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext, buildConflictContext, ModuleContext } from './context';

const prisma = new PrismaClient();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export type ResolutionStrategy =
  | 'merge'         // Combine both modules into one
  | 'replace'       // Replace old with new
  | 'deprecate'     // Mark old as deprecated, keep both
  | 'clarify'       // Add clarifying context to distinguish
  | 'split_scope'   // Split into different contexts/scopes
  | 'version_both'; // Version both (e.g., v1 vs v2)

export interface ResolutionSuggestion {
  strategy: ResolutionStrategy;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  steps: string[];
  preview: {
    sourceModuleAfter?: string;
    conflictingModuleAfter?: string;
    newMergedContent?: string;
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
}

export interface ResolutionResult {
  suggestions: ResolutionSuggestion[];
  recommendedStrategy: ResolutionStrategy;
  reasoning: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/**
 * Generate resolution suggestions for a conflict
 */
export async function suggestResolution(
  conflictId: string
): Promise<ResolutionResult> {
  // Get conflict details
  const conflict = await prisma.moduleConflict.findUnique({
    where: { id: conflictId },
    include: {
      module: {
        select: {
          id: true,
          moduleKey: true,
          title: true,
          content: true,
          isGrounded: true,
          confidenceScore: true,
          moduleType: true,
          dependsOn: true,
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
    throw new Error('Conflict not found');
  }

  // Get conflicting module
  const conflictingModule = conflict.conflictingModuleId
    ? await prisma.documentModule.findUnique({
        where: { id: conflict.conflictingModuleId },
        select: {
          id: true,
          moduleKey: true,
          title: true,
          content: true,
          isGrounded: true,
          confidenceScore: true,
          moduleType: true,
          dependsOn: true,
          tags: true,
          document: {
            select: {
              path: true,
              updatedAt: true,
            },
          },
        },
      })
    : null;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',  // Use Pro for complex resolution reasoning
    systemInstruction: buildSystemInstruction(`You are a documentation conflict resolution expert.
Your task is to analyze conflicts and provide actionable resolution strategies.

Resolution Strategies:
1. merge: Combine both modules into one comprehensive module
2. replace: Replace older/incorrect module with newer/correct one
3. deprecate: Mark old module as deprecated, keep both for backward compatibility
4. clarify: Add clarifying context to distinguish between modules
5. split_scope: Split into different contexts (e.g., v1 vs v2, dev vs prod)
6. version_both: Explicitly version both modules

For each suggestion:
- Provide clear steps to implement
- Show preview of changes
- List pros and cons
- Estimate impact (low/medium/high)
- Assign confidence score (0.0-1.0)

Recommend the BEST strategy based on:
- Conflict type and severity
- Module grounding status
- Document update dates
- Content quality and completeness`, {
      includeDateContext: true,
    }),
  });

  const sourceModuleContext: ModuleContext = {
    moduleKey: conflict.module.moduleKey,
    title: conflict.module.title,
    content: conflict.module.content,
    isGrounded: conflict.module.isGrounded,
    confidenceScore: conflict.module.confidenceScore,
    moduleType: conflict.module.moduleType,
    dependsOn: conflict.module.dependsOn,
    tags: conflict.module.tags as string[] || [],
  };

  let conflictingModuleContext: ModuleContext | undefined;
  if (conflictingModule) {
    conflictingModuleContext = {
      moduleKey: conflictingModule.moduleKey,
      title: conflictingModule.title,
      content: conflictingModule.content,
      isGrounded: conflictingModule.isGrounded,
      confidenceScore: conflictingModule.confidenceScore,
      moduleType: conflictingModule.moduleType,
      dependsOn: conflictingModule.dependsOn,
      tags: conflictingModule.tags as string[] || [],
    };
  }

  const prompt = `
${getCurrentDateTimeContext()}

# Conflict Resolution Task

## Conflict Details
**Type:** ${conflict.conflictType}
**Severity:** ${conflict.severity}
**Description:** ${conflict.description}

## Source Module
**Module Key:** ${conflict.module.moduleKey}
**Document:** ${conflict.module.document.path}
**Last Updated:** ${conflict.module.document.updatedAt.toISOString().split('T')[0]}
**Grounded:** ${conflict.module.isGrounded ? 'Yes' : 'No'}
**Confidence:** ${(conflict.module.confidenceScore * 100).toFixed(0)}%

\`\`\`markdown
${conflict.module.content}
\`\`\`

${conflictingModule ? `
## Conflicting Module
**Module Key:** ${conflictingModule.moduleKey}
**Document:** ${conflictingModule.document.path}
**Last Updated:** ${conflictingModule.document.updatedAt.toISOString().split('T')[0]}
**Grounded:** ${conflictingModule.isGrounded ? 'Yes' : 'No'}
**Confidence:** ${(conflictingModule.confidenceScore * 100).toFixed(0)}%

\`\`\`markdown
${conflictingModule.content}
\`\`\`
` : ''}

# Task

Analyze this conflict and provide 2-4 resolution strategies.

Return JSON:
\`\`\`json
{
  "suggestions": [
    {
      "strategy": "merge",
      "title": "Merge into Comprehensive Guide",
      "description": "Combine both modules into one complete reference",
      "confidence": 0.85,
      "impact": "medium",
      "steps": [
        "Create new merged module with combined content",
        "Remove redundant sections",
        "Harmonize terminology",
        "Update cross-references"
      ],
      "preview": {
        "newMergedContent": "# Combined Module\\n\\n[merged content preview...]"
      },
      "tradeoffs": {
        "pros": [
          "Single source of truth",
          "No duplication",
          "Easier to maintain"
        ],
        "cons": [
          "May become too long",
          "Loses granular grounding tracking"
        ]
      }
    }
  ],
  "recommendedStrategy": "merge",
  "reasoning": "Merging provides the best balance of accuracy and maintainability given both modules cover the same API but with different levels of detail."
}
\`\`\`

IMPORTANT:
- Provide 2-4 distinct strategies
- Include concrete preview of changes
- List clear implementation steps
- Assign realistic confidence scores
- Consider grounding status and update dates in recommendations
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  // Parse response
  let parsed: any;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse resolution suggestions:', error);
    throw new Error('AI failed to generate resolution suggestions');
  }

  // Calculate usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

  return {
    suggestions: parsed.suggestions || [],
    recommendedStrategy: parsed.recommendedStrategy || 'merge',
    reasoning: parsed.reasoning || '',
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Apply resolution strategy to resolve conflict
 */
export async function applyResolution(
  conflictId: string,
  strategy: ResolutionStrategy,
  customContent?: {
    sourceModuleContent?: string;
    conflictingModuleContent?: string;
    mergedContent?: string;
  },
  resolvedBy?: string
): Promise<{
  success: boolean;
  updatedModules: string[];
  createdModules: string[];
}> {
  const conflict = await prisma.moduleConflict.findUnique({
    where: { id: conflictId },
    include: {
      module: true,
    },
  });

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  const updatedModules: string[] = [];
  const createdModules: string[] = [];

  try {
    switch (strategy) {
      case 'merge': {
        // Create new merged module or update source
        if (customContent?.mergedContent) {
          await prisma.documentModule.update({
            where: { id: conflict.moduleId },
            data: {
              content: customContent.mergedContent,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.moduleId);

          // Delete or deprecate conflicting module
          if (conflict.conflictingModuleId) {
            await prisma.documentModule.delete({
              where: { id: conflict.conflictingModuleId },
            });
          }
        }
        break;
      }

      case 'replace': {
        // Replace source with conflicting content
        if (customContent?.conflictingModuleContent && conflict.conflictingModuleId) {
          await prisma.documentModule.update({
            where: { id: conflict.moduleId },
            data: {
              content: customContent.conflictingModuleContent,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.moduleId);

          // Delete old conflicting module
          await prisma.documentModule.delete({
            where: { id: conflict.conflictingModuleId },
          });
        }
        break;
      }

      case 'deprecate': {
        // Mark conflicting module as deprecated (unground it)
        if (conflict.conflictingModuleId) {
          await prisma.documentModule.update({
            where: { id: conflict.conflictingModuleId },
            data: {
              isGrounded: false,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.conflictingModuleId);
        }
        break;
      }

      case 'clarify': {
        // Update both modules with clarifying context
        if (customContent?.sourceModuleContent) {
          await prisma.documentModule.update({
            where: { id: conflict.moduleId },
            data: {
              content: customContent.sourceModuleContent,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.moduleId);
        }

        if (customContent?.conflictingModuleContent && conflict.conflictingModuleId) {
          await prisma.documentModule.update({
            where: { id: conflict.conflictingModuleId },
            data: {
              content: customContent.conflictingModuleContent,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.conflictingModuleId);
        }
        break;
      }

      case 'split_scope':
      case 'version_both': {
        // Update module keys and tags to reflect scope/version
        // Implementation depends on custom content provided
        if (customContent?.sourceModuleContent) {
          await prisma.documentModule.update({
            where: { id: conflict.moduleId },
            data: {
              content: customContent.sourceModuleContent,
              updatedAt: new Date(),
            },
          });
          updatedModules.push(conflict.moduleId);
        }
        break;
      }
    }

    // Mark conflict as resolved
    await prisma.moduleConflict.update({
      where: { id: conflictId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNote: `Resolved using ${strategy} strategy`,
      },
    });

    // Get updated module content for history
    const updatedModule = await prisma.documentModule.findUnique({
      where: { id: conflict.moduleId },
      select: { content: true },
    });

    // Record in grounding history
    if (updatedModule) {
      await prisma.moduleGroundingHistory.create({
        data: {
          moduleId: conflict.moduleId,
          action: 'updated',
          previousState: 'conflicted',
          newState: 'resolved',
          reason: `Conflict resolved using ${strategy} strategy`,
          source: 'manual',
          triggeredBy: resolvedBy,
          contentAfter: updatedModule.content,
          occurredAt: new Date(),
        },
      });
    }

    return {
      success: true,
      updatedModules,
      createdModules,
    };
  } catch (error) {
    console.error('Failed to apply resolution:', error);
    throw new Error('Failed to apply conflict resolution');
  }
}

/**
 * Batch resolve similar conflicts
 * Applies same strategy to multiple conflicts
 */
export async function batchResolveConflicts(
  conflictIds: string[],
  strategy: ResolutionStrategy,
  resolvedBy?: string
): Promise<{
  resolved: number;
  failed: number;
  errors: Array<{ conflictId: string; error: string }>;
}> {
  let resolved = 0;
  let failed = 0;
  const errors: Array<{ conflictId: string; error: string }> = [];

  for (const conflictId of conflictIds) {
    try {
      await applyResolution(conflictId, strategy, undefined, resolvedBy);
      resolved++;
    } catch (error) {
      failed++;
      errors.push({
        conflictId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    resolved,
    failed,
    errors,
  };
}

/**
 * Generate merged content for merge strategy
 */
export async function generateMergedContent(
  sourceContent: string,
  conflictingContent: string,
  sourceModuleKey: string,
  conflictingModuleKey: string
): Promise<{
  mergedContent: string;
  mergedTitle: string;
  mergedDescription: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: buildSystemInstruction(`You are a documentation merge specialist.
Your task is to intelligently merge two conflicting modules into one coherent module.

Merge Guidelines:
- Preserve all important information from both modules
- Remove redundancies and duplications
- Harmonize terminology and style
- Organize content logically (general → specific)
- Use clear headings and structure
- Cite sources when appropriate (e.g., "As of version X...")
- Prioritize accuracy over brevity`, {
      includeDateContext: true,
    }),
  });

  const prompt = `
${getCurrentDateTimeContext()}

# Content Merge Task

## Source Module: ${sourceModuleKey}
\`\`\`markdown
${sourceContent}
\`\`\`

## Conflicting Module: ${conflictingModuleKey}
\`\`\`markdown
${conflictingContent}
\`\`\`

# Task

Merge these two modules into one comprehensive, conflict-free module.

Return JSON:
\`\`\`json
{
  "mergedContent": "# Merged Title\\n\\nMerged content here...",
  "mergedTitle": "Suggested title for merged module",
  "mergedDescription": "Brief description of what this merged module covers",
  "changesSummary": "What was merged, what was removed, what was harmonized",
  "confidence": 0.92
}
\`\`\`

IMPORTANT:
- Include ALL important information from both modules
- Remove contradictions by using the most recent/accurate information
- Use clear markdown structure
- Cite version/date context when reconciling differences
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  // Parse response
  let parsed: any;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse merge response:', error);
    throw new Error('AI failed to generate merged content');
  }

  // Calculate usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

  return {
    mergedContent: parsed.mergedContent || '',
    mergedTitle: parsed.mergedTitle || sourceModuleKey,
    mergedDescription: parsed.mergedDescription || '',
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Generate clarifying context for clarify strategy
 */
export async function generateClarifyingContext(
  sourceContent: string,
  conflictingContent: string,
  conflictDescription: string
): Promise<{
  sourceAddition: string;
  conflictingAddition: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: buildSystemInstruction(`You are a documentation clarity expert.
Your task is to add clarifying context to disambiguate similar content.

Add context that:
- Explains when/where each module applies
- Distinguishes scope or audience
- Adds version/date context if relevant
- Uses clear, concise language
- Appears at the TOP of the module as a callout or note`, {
      includeDateContext: true,
    }),
  });

  const prompt = `
${getCurrentDateTimeContext()}

# Clarification Task

These two modules conflict:
**Reason:** ${conflictDescription}

## Module 1
\`\`\`markdown
${sourceContent}
\`\`\`

## Module 2
\`\`\`markdown
${conflictingContent}
\`\`\`

# Task

Generate clarifying context to add to EACH module to disambiguate them.

Return JSON:
\`\`\`json
{
  "sourceAddition": "> **Note:** This applies to [specific context]. For [other context], see [other module].",
  "conflictingAddition": "> **Note:** This applies to [specific context]. For [other context], see [other module].",
  "reasoning": "Why this clarification helps"
}
\`\`\`

Use markdown callout format (> Note:) for clarity additions.
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  // Parse response
  let parsed: any;
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse clarification response:', error);
    throw new Error('AI failed to generate clarifying context');
  }

  // Calculate usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

  return {
    sourceAddition: parsed.sourceAddition || '',
    conflictingAddition: parsed.conflictingAddition || '',
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Get resolution recommendation based on conflict context
 */
export async function getQuickRecommendation(
  conflictType: string,
  severity: string,
  sourceIsGrounded: boolean,
  conflictingIsGrounded: boolean,
  sourceUpdatedAt: Date,
  conflictingUpdatedAt: Date
): Promise<ResolutionStrategy> {
  // Rule-based quick recommendation
  // If both grounded, prefer merge or clarify
  if (sourceIsGrounded && conflictingIsGrounded) {
    return severity === 'critical' ? 'merge' : 'clarify';
  }

  // If only source is grounded, deprecate conflicting
  if (sourceIsGrounded && !conflictingIsGrounded) {
    return 'deprecate';
  }

  // If only conflicting is grounded, replace source
  if (!sourceIsGrounded && conflictingIsGrounded) {
    return 'replace';
  }

  // If neither grounded, prefer newer content
  if (conflictingUpdatedAt > sourceUpdatedAt) {
    return 'replace';
  }

  return 'merge';
}

/**
 * Preview resolution impact before applying
 */
export async function previewResolutionImpact(
  conflictId: string,
  strategy: ResolutionStrategy
): Promise<{
  affectedModules: Array<{
    moduleId: string;
    moduleKey: string;
    action: 'update' | 'delete' | 'create' | 'unground';
    currentContent?: string;
    newContent?: string;
  }>;
  affectedDocuments: number;
  estimatedGroundingImpact: string;
}> {
  const conflict = await prisma.moduleConflict.findUnique({
    where: { id: conflictId },
    include: {
      module: {
        select: {
          id: true,
          moduleKey: true,
          content: true,
          documentId: true,
        },
      },
    },
  });

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  const affectedModules: Array<{
    moduleId: string;
    moduleKey: string;
    action: 'update' | 'delete' | 'create' | 'unground';
    currentContent?: string;
    newContent?: string;
  }> = [];

  const affectedDocs = new Set<string>();
  affectedDocs.add(conflict.module.documentId);

  switch (strategy) {
    case 'merge':
      affectedModules.push({
        moduleId: conflict.moduleId,
        moduleKey: conflict.module.moduleKey,
        action: 'update',
        currentContent: conflict.module.content,
      });
      if (conflict.conflictingModuleId) {
        affectedModules.push({
          moduleId: conflict.conflictingModuleId,
          moduleKey: 'conflicting-module',
          action: 'delete',
        });
      }
      break;

    case 'replace':
      affectedModules.push({
        moduleId: conflict.moduleId,
        moduleKey: conflict.module.moduleKey,
        action: 'update',
        currentContent: conflict.module.content,
      });
      if (conflict.conflictingModuleId) {
        affectedModules.push({
          moduleId: conflict.conflictingModuleId,
          moduleKey: 'conflicting-module',
          action: 'delete',
        });
      }
      break;

    case 'deprecate':
      if (conflict.conflictingModuleId) {
        affectedModules.push({
          moduleId: conflict.conflictingModuleId,
          moduleKey: 'conflicting-module',
          action: 'unground',
        });
      }
      break;

    case 'clarify':
      affectedModules.push({
        moduleId: conflict.moduleId,
        moduleKey: conflict.module.moduleKey,
        action: 'update',
        currentContent: conflict.module.content,
      });
      if (conflict.conflictingModuleId) {
        affectedModules.push({
          moduleId: conflict.conflictingModuleId,
          moduleKey: 'conflicting-module',
          action: 'update',
        });
      }
      break;
  }

  return {
    affectedModules,
    affectedDocuments: affectedDocs.size,
    estimatedGroundingImpact: affectedModules.some(m => m.action === 'delete' || m.action === 'unground')
      ? 'Will reduce grounded module count'
      : 'Will maintain or improve grounding coverage',
  };
}
