/**
 * Conflict Detection Service
 * 3-stage pipeline for detecting documentation conflicts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext } from './context';
import { findSimilarModules, generateTextEmbedding, cosineSimilarity } from './embeddings';

const prisma = new PrismaClient();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Thresholds
const VECTOR_SIMILARITY_THRESHOLD = 0.90;  // Stage 1: High similarity indicates potential conflict
const ENTITY_MATCH_THRESHOLD = 0.70;       // Stage 2: Entity overlap threshold
const LLM_CONFIDENCE_THRESHOLD = 0.75;     // Stage 3: LLM confidence threshold

export interface ConflictCandidate {
  moduleId: string;
  moduleKey: string;
  documentId: string;
  similarity: number;
  matchedContent: string;
}

export interface ExtractedEntity {
  type: 'api_endpoint' | 'version' | 'date' | 'concept' | 'spec' | 'configuration';
  value: string;
  context: string;
  confidence: number;
}

export interface EntityConflict {
  sourceModule: {
    id: string;
    key: string;
    entities: ExtractedEntity[];
  };
  conflictingModule: {
    id: string;
    key: string;
    entities: ExtractedEntity[];
  };
  matchingEntities: Array<{
    entity: string;
    sourceValue: string;
    conflictingValue: string;
    type: string;
  }>;
  overlapScore: number;
}

export interface DetectedConflict {
  conflictType: 'content' | 'scope' | 'version' | 'dependency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  sourceModuleId: string;
  conflictingModuleId: string;
  conflictingDocId: string;
  detectedBy: 'ai' | 'rule';
  confidence: number;
  resolutionSuggestions: string[];
  evidence: {
    vectorSimilarity?: number;
    entityMatches?: string[];
    llmReasoning?: string;
  };
}

export interface ConflictDetectionResult {
  conflicts: DetectedConflict[];
  summary: {
    totalConflicts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  usage: {
    stage1Tokens: number;
    stage2Tokens: number;
    stage3Tokens: number;
    totalCost: number;
  };
}

/**
 * Stage 1: Vector Similarity Screening
 * Fast initial pass to find potential conflicts using embeddings
 */
export async function stage1_VectorSimilarity(
  moduleId: string,
  moduleContent: string,
  projectId: string
): Promise<ConflictCandidate[]> {
  // Use embedding service to find similar modules
  const similarModules = await findSimilarModules(
    moduleContent,
    projectId,
    moduleId,
    VECTOR_SIMILARITY_THRESHOLD
  );

  return similarModules.map(sim => ({
    moduleId: sim.moduleId,
    moduleKey: sim.moduleKey,
    documentId: sim.documentId,
    similarity: sim.similarity,
    matchedContent: sim.matchedChunk,
  }));
}

/**
 * Stage 2: Entity Extraction
 * Extract and compare entities (APIs, versions, specs) between modules
 */
export async function stage2_EntityExtraction(
  sourceModule: { id: string; key: string; content: string },
  candidates: ConflictCandidate[]
): Promise<EntityConflict[]> {
  if (candidates.length === 0) return [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: buildSystemInstruction(`You are an entity extraction specialist.
Extract structured entities from documentation for conflict analysis.

Entity Types:
- api_endpoint: API routes, URLs, endpoints (e.g., "/api/users", "GET /projects")
- version: Version numbers, release info (e.g., "v2.0", "2026-01-24 release")
- date: Dates, deadlines, schedules (e.g., "January 2026", "Q1 2026")
- concept: Technical concepts, features (e.g., "authentication", "grounding system")
- spec: Specifications, requirements (e.g., "must support OAuth2", "returns 200 status")
- configuration: Config keys, settings (e.g., "apiKey", "timeout: 5000")

Return only the JSON array, no additional text.`, {
      includeDateContext: true,
    }),
  });

  // Extract entities from source module
  const sourcePrompt = `
${getCurrentDateTimeContext()}

Extract all entities from this module:

**Module:** ${sourceModule.key}

\`\`\`markdown
${sourceModule.content}
\`\`\`

Return JSON:
\`\`\`json
{
  "entities": [
    {
      "type": "api_endpoint",
      "value": "/api/users",
      "context": "User management endpoint",
      "confidence": 0.95
    }
  ]
}
\`\`\`
`;

  const sourceResult = await model.generateContent(sourcePrompt);
  const sourceResponse = sourceResult.response.text();

  let sourceEntities: ExtractedEntity[] = [];
  try {
    const jsonMatch = sourceResponse.match(/```json\n([\s\S]*?)\n```/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(sourceResponse);
    sourceEntities = parsed.entities || [];
  } catch (error) {
    console.error('Failed to parse source entities:', error);
    sourceEntities = [];
  }

  // Extract entities from each candidate
  const entityConflicts: EntityConflict[] = [];

  for (const candidate of candidates) {
    // Get full module content
    const candidateModule = await prisma.documentModule.findUnique({
      where: { id: candidate.moduleId },
      select: {
        id: true,
        moduleKey: true,
        content: true,
      },
    });

    if (!candidateModule) continue;

    const candidatePrompt = `
${getCurrentDateTimeContext()}

Extract all entities from this module:

**Module:** ${candidateModule.moduleKey}

\`\`\`markdown
${candidateModule.content}
\`\`\`

Return JSON:
\`\`\`json
{
  "entities": [
    {
      "type": "api_endpoint",
      "value": "/api/users",
      "context": "User management endpoint",
      "confidence": 0.95
    }
  ]
}
\`\`\`
`;

    const candidateResult = await model.generateContent(candidatePrompt);
    const candidateResponse = candidateResult.response.text();

    let candidateEntities: ExtractedEntity[] = [];
    try {
      const jsonMatch = candidateResponse.match(/```json\n([\s\S]*?)\n```/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(candidateResponse);
      candidateEntities = parsed.entities || [];
    } catch (error) {
      console.error('Failed to parse candidate entities:', error);
      candidateEntities = [];
    }

    // Compare entities
    const matchingEntities: EntityConflict['matchingEntities'] = [];

    for (const sourceEntity of sourceEntities) {
      for (const candidateEntity of candidateEntities) {
        // Check if same type and overlapping values
        if (sourceEntity.type === candidateEntity.type) {
          const sourceVal = sourceEntity.value.toLowerCase();
          const candidateVal = candidateEntity.value.toLowerCase();

          // Exact match or high similarity
          if (
            sourceVal === candidateVal ||
            sourceVal.includes(candidateVal) ||
            candidateVal.includes(sourceVal)
          ) {
            matchingEntities.push({
              entity: sourceEntity.type,
              sourceValue: sourceEntity.value,
              conflictingValue: candidateEntity.value,
              type: sourceEntity.type,
            });
          }
        }
      }
    }

    // Calculate overlap score
    const totalEntities = sourceEntities.length + candidateEntities.length;
    const overlapScore = totalEntities > 0
      ? (matchingEntities.length * 2) / totalEntities
      : 0;

    if (overlapScore >= ENTITY_MATCH_THRESHOLD) {
      entityConflicts.push({
        sourceModule: {
          id: sourceModule.id,
          key: sourceModule.key,
          entities: sourceEntities,
        },
        conflictingModule: {
          id: candidateModule.id,
          key: candidateModule.moduleKey,
          entities: candidateEntities,
        },
        matchingEntities,
        overlapScore,
      });
    }
  }

  return entityConflicts;
}

/**
 * Stage 3: LLM Deep Analysis
 * Confirm conflicts using LLM reasoning and classify severity
 */
export async function stage3_LLMAnalysis(
  entityConflicts: EntityConflict[]
): Promise<DetectedConflict[]> {
  if (entityConflicts.length === 0) return [];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',  // Use Pro for complex reasoning
    systemInstruction: buildSystemInstruction(`You are a documentation conflict analyzer.
Your task is to identify REAL conflicts that could confuse users or AI agents.

Conflict Types:
- content: Same topic with contradictory information
- scope: Overlapping but with different scope/context
- version: Same feature but different versions
- dependency: Circular or broken dependencies

Severity Levels:
- critical: Contradictory instructions that could break systems
- high: Significant inconsistencies that confuse users
- medium: Minor discrepancies that should be harmonized
- low: Stylistic differences or clarification opportunities

Return only confirmed conflicts with high confidence (>0.75).`, {
      includeDateContext: true,
    }),
  });

  const detectedConflicts: DetectedConflict[] = [];

  for (const entityConflict of entityConflicts) {
    // Get full module contents
    const [sourceModule, conflictingModule] = await Promise.all([
      prisma.documentModule.findUnique({
        where: { id: entityConflict.sourceModule.id },
        select: { id: true, moduleKey: true, content: true, documentId: true },
      }),
      prisma.documentModule.findUnique({
        where: { id: entityConflict.conflictingModule.id },
        select: { id: true, moduleKey: true, content: true, documentId: true },
      }),
    ]);

    if (!sourceModule || !conflictingModule) continue;

    const prompt = `
${getCurrentDateTimeContext()}

# Conflict Analysis Task

## Source Module
**Key:** ${sourceModule.moduleKey}
**Content:**
\`\`\`markdown
${sourceModule.content}
\`\`\`

## Potentially Conflicting Module
**Key:** ${conflictingModule.moduleKey}
**Content:**
\`\`\`markdown
${conflictingModule.content}
\`\`\`

## Entity Matches Detected
${entityConflict.matchingEntities.map(e =>
  `- ${e.entity}: "${e.sourceValue}" vs "${e.conflictingValue}"`
).join('\n')}

## Similarity Metrics
- Vector Similarity: High (>0.90)
- Entity Overlap Score: ${(entityConflict.overlapScore * 100).toFixed(0)}%

# Task

Analyze these two modules and determine if there is a REAL conflict.

Return JSON:
\`\`\`json
{
  "isConflict": true,
  "conflictType": "content",
  "severity": "high",
  "description": "Clear description of the conflict",
  "confidence": 0.92,
  "evidence": "Specific evidence from the content",
  "resolutionSuggestions": [
    "Merge both modules into one comprehensive guide",
    "Keep newer version and deprecate older one",
    "Clarify that they apply to different contexts"
  ]
}
\`\`\`

Return isConflict: false if:
- Modules cover different aspects of the same topic
- Information is complementary, not contradictory
- Similarity is due to shared terminology only
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Parse LLM response
    let analysis: any;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse LLM analysis:', error);
      continue;
    }

    // Only record if LLM confirms it's a conflict with high confidence
    if (analysis.isConflict && analysis.confidence >= LLM_CONFIDENCE_THRESHOLD) {
      detectedConflicts.push({
        conflictType: analysis.conflictType || 'content',
        severity: analysis.severity || 'medium',
        description: analysis.description,
        sourceModuleId: sourceModule.id,
        conflictingModuleId: conflictingModule.id,
        conflictingDocId: conflictingModule.documentId,
        detectedBy: 'ai',
        confidence: analysis.confidence,
        resolutionSuggestions: analysis.resolutionSuggestions || [],
        evidence: {
          vectorSimilarity: entityConflict.overlapScore,
          entityMatches: entityConflict.matchingEntities.map(e => `${e.entity}: ${e.sourceValue}`),
          llmReasoning: analysis.evidence || analysis.description,
        },
      });
    }
  }

  return detectedConflicts;
}

/**
 * Run full 3-stage conflict detection for a module
 */
export async function detectConflictsForModule(
  moduleId: string,
  projectId: string
): Promise<ConflictDetectionResult> {
  // Get module content
  const module = await prisma.documentModule.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      moduleKey: true,
      content: true,
    },
  });

  if (!module) {
    throw new Error('Module not found');
  }

  let stage1Tokens = 0;
  let stage2Tokens = 0;
  let stage3Tokens = 0;

  // Stage 1: Vector similarity screening
  const candidates = await stage1_VectorSimilarity(moduleId, module.content, projectId);
  stage1Tokens = Math.floor(module.content.length * 0.25); // Query embedding cost

  if (candidates.length === 0) {
    return {
      conflicts: [],
      summary: {
        totalConflicts: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      },
      usage: {
        stage1Tokens,
        stage2Tokens: 0,
        stage3Tokens: 0,
        totalCost: calculateCost('text-embedding-3-small', stage1Tokens, 0),
      },
    };
  }

  // Stage 2: Entity extraction
  const entityConflicts = await stage2_EntityExtraction(
    { id: module.id, key: module.moduleKey, content: module.content },
    candidates
  );

  // Estimate tokens for stage 2
  stage2Tokens = candidates.length * 1000; // Rough estimate

  if (entityConflicts.length === 0) {
    return {
      conflicts: [],
      summary: {
        totalConflicts: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      },
      usage: {
        stage1Tokens,
        stage2Tokens,
        stage3Tokens: 0,
        totalCost:
          calculateCost('text-embedding-3-small', stage1Tokens, 0) +
          calculateCost('gemini-2.5-flash-lite', stage2Tokens, stage2Tokens * 0.5),
      },
    };
  }

  // Stage 3: LLM deep analysis
  const detectedConflicts = await stage3_LLMAnalysis(entityConflicts);

  // Estimate tokens for stage 3
  stage3Tokens = entityConflicts.length * 2000; // Rough estimate for Pro model

  // Categorize by severity
  const summary = {
    totalConflicts: detectedConflicts.length,
    criticalCount: detectedConflicts.filter(c => c.severity === 'critical').length,
    highCount: detectedConflicts.filter(c => c.severity === 'high').length,
    mediumCount: detectedConflicts.filter(c => c.severity === 'medium').length,
    lowCount: detectedConflicts.filter(c => c.severity === 'low').length,
  };

  // Calculate total cost
  const totalCost =
    calculateCost('text-embedding-3-small', stage1Tokens, 0) +
    calculateCost('gemini-2.5-flash-lite', stage2Tokens, stage2Tokens * 0.5) +
    calculateCost('gemini-2.5-pro', stage3Tokens, stage3Tokens * 0.3);

  return {
    conflicts: detectedConflicts,
    summary,
    usage: {
      stage1Tokens,
      stage2Tokens,
      stage3Tokens,
      totalCost,
    },
  };
}

/**
 * Run conflict detection for entire project
 */
export async function detectProjectConflicts(
  projectId: string,
  options?: {
    groundedOnly?: boolean;
    maxModules?: number;
  }
): Promise<ConflictDetectionResult> {
  const { groundedOnly = false, maxModules = 1000 } = options || {};

  // Get all modules in project
  const where: any = {
    document: {
      projectId,
    },
  };

  if (groundedOnly) {
    where.isGrounded = true;
  }

  const modules = await prisma.documentModule.findMany({
    where,
    select: {
      id: true,
      moduleKey: true,
      content: true,
    },
    take: maxModules,
  });

  // Run detection for each module
  const allConflicts: DetectedConflict[] = [];
  let totalUsage = {
    stage1Tokens: 0,
    stage2Tokens: 0,
    stage3Tokens: 0,
    totalCost: 0,
  };

  // Deduplicate conflicts (A->B is same as B->A)
  const seenPairs = new Set<string>();

  for (const module of modules) {
    const result = await detectConflictsForModule(module.id, projectId);

    // Filter out duplicate pairs
    for (const conflict of result.conflicts) {
      const pairKey = [conflict.sourceModuleId, conflict.conflictingModuleId]
        .sort()
        .join('::');

      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        allConflicts.push(conflict);
      }
    }

    // Accumulate usage
    totalUsage.stage1Tokens += result.usage.stage1Tokens;
    totalUsage.stage2Tokens += result.usage.stage2Tokens;
    totalUsage.stage3Tokens += result.usage.stage3Tokens;
    totalUsage.totalCost += result.usage.totalCost;
  }

  // Categorize by severity
  const summary = {
    totalConflicts: allConflicts.length,
    criticalCount: allConflicts.filter(c => c.severity === 'critical').length,
    highCount: allConflicts.filter(c => c.severity === 'high').length,
    mediumCount: allConflicts.filter(c => c.severity === 'medium').length,
    lowCount: allConflicts.filter(c => c.severity === 'low').length,
  };

  return {
    conflicts: allConflicts,
    summary,
    usage: totalUsage,
  };
}

/**
 * Store detected conflicts in database
 */
export async function storeConflicts(
  conflicts: DetectedConflict[]
): Promise<{ created: number }> {
  // Check for existing conflicts and only create new ones
  const created = await Promise.all(
    conflicts.map(async (conflict) => {
      // Check if conflict already exists
      const existing = await prisma.moduleConflict.findFirst({
        where: {
          moduleId: conflict.sourceModuleId,
          conflictingModuleId: conflict.conflictingModuleId,
          status: { in: ['open', 'acknowledged'] },
        },
      });

      if (existing) return null;

      // Create new conflict
      return prisma.moduleConflict.create({
        data: {
          moduleId: conflict.sourceModuleId,
          conflictType: conflict.conflictType,
          severity: conflict.severity,
          description: conflict.description,
          conflictingModuleId: conflict.conflictingModuleId,
          conflictingDocId: conflict.conflictingDocId,
          conflictingLocation: conflict.evidence,
          detectedBy: conflict.detectedBy,
          status: 'open',
        },
      });
    })
  );

  return {
    created: created.filter(Boolean).length,
  };
}

/**
 * Get conflict statistics for a project
 */
export async function getConflictStats(projectId: string): Promise<{
  totalConflicts: number;
  openConflicts: number;
  resolvedConflicts: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> {
  const conflicts = await prisma.moduleConflict.findMany({
    where: {
      module: {
        document: {
          projectId,
        },
      },
    },
    select: {
      id: true,
      severity: true,
      conflictType: true,
      status: true,
    },
  });

  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const conflict of conflicts) {
    bySeverity[conflict.severity] = (bySeverity[conflict.severity] || 0) + 1;
    byType[conflict.conflictType] = (byType[conflict.conflictType] || 0) + 1;
  }

  return {
    totalConflicts: conflicts.length,
    openConflicts: conflicts.filter(c => c.status === 'open').length,
    resolvedConflicts: conflicts.filter(c => c.status === 'resolved').length,
    bySeverity,
    byType,
  };
}
