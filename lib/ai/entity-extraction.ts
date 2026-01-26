/**
 * Entity Extraction Service
 * Extracts structured entities from documentation for various AI operations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext } from './context';
import prisma from '@/lib/prisma';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export type EntityType =
  | 'api_endpoint'
  | 'version'
  | 'date'
  | 'concept'
  | 'spec'
  | 'configuration'
  | 'dependency'
  | 'tool'
  | 'library'
  | 'command';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  context: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  categories: {
    apis: ExtractedEntity[];
    versions: ExtractedEntity[];
    dates: ExtractedEntity[];
    concepts: ExtractedEntity[];
    specs: ExtractedEntity[];
    configurations: ExtractedEntity[];
    dependencies: ExtractedEntity[];
    tools: ExtractedEntity[];
    libraries: ExtractedEntity[];
    commands: ExtractedEntity[];
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/**
 * Extract entities from text using AI
 */
export async function extractEntities(
  text: string,
  options?: {
    entityTypes?: EntityType[];
    minConfidence?: number;
  }
): Promise<EntityExtractionResult> {
  const { entityTypes, minConfidence = 0.70 } = options || {};

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',  // Cost-efficient for entity extraction
    systemInstruction: buildSystemInstruction(`You are a technical entity extraction specialist.
Extract structured entities from documentation with high precision.

Entity Types and Examples:
- api_endpoint: API routes, URLs (e.g., "/api/users", "POST /projects/:id/documents")
- version: Version numbers, releases (e.g., "v2.0.1", "Next.js 15", "2026-01-24 release")
- date: Dates, deadlines, timeframes (e.g., "January 2026", "Q1 2026", "2026-01-24")
- concept: Technical concepts, features (e.g., "grounding system", "module decomposition")
- spec: Requirements, specifications (e.g., "must support OAuth2", "max 2000 tokens")
- configuration: Config keys, settings (e.g., "GEMINI_API_KEY", "timeout: 5000ms")
- dependency: External dependencies (e.g., "requires Node.js 18+", "uses Prisma")
- tool: Tools, services, platforms (e.g., "Gemini API", "Claude Desktop", "GitHub")
- library: Libraries, packages (e.g., "@google/generative-ai", "lucide-react")
- command: CLI commands (e.g., "npm install", "prisma migrate dev")

Guidelines:
- Extract only explicit entities mentioned in the text
- Provide surrounding context for each entity
- Assign confidence score (0.0-1.0) based on clarity
- Include metadata where relevant (e.g., HTTP method for APIs)
- Avoid duplicates (normalize similar entities)

Return ONLY valid JSON, no additional text.`, {
      includeDateContext: true,
    }),
  });

  const entityTypeFilter = entityTypes
    ? `\nFocus on these entity types: ${entityTypes.join(', ')}`
    : '';

  const prompt = `
${getCurrentDateTimeContext()}

Extract entities from this text:

\`\`\`markdown
${text}
\`\`\`
${entityTypeFilter}

Return JSON array:
\`\`\`json
{
  "entities": [
    {
      "type": "api_endpoint",
      "value": "/api/users",
      "context": "User management endpoint mentioned in authentication section",
      "confidence": 0.95,
      "metadata": {
        "method": "GET",
        "authentication": "required"
      }
    },
    {
      "type": "version",
      "value": "v2.0.1",
      "context": "Current API version",
      "confidence": 0.90
    }
  ]
}
\`\`\`

IMPORTANT:
- Return ONLY the JSON object
- Extract all relevant entities
- Provide clear context for each
- Include metadata where helpful
- Confidence >0.90 = very clear, 0.70-0.90 = clear, <0.70 = uncertain
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  // Parse response
  let entities: ExtractedEntity[] = [];
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
    entities = parsed.entities || [];
  } catch (error) {
    console.error('Failed to parse entity extraction response:', error);
    throw new Error('AI failed to extract entities');
  }

  // Filter by confidence threshold
  const filteredEntities = entities.filter(e => e.confidence >= minConfidence);

  // Categorize entities
  const categories = {
    apis: filteredEntities.filter(e => e.type === 'api_endpoint'),
    versions: filteredEntities.filter(e => e.type === 'version'),
    dates: filteredEntities.filter(e => e.type === 'date'),
    concepts: filteredEntities.filter(e => e.type === 'concept'),
    specs: filteredEntities.filter(e => e.type === 'spec'),
    configurations: filteredEntities.filter(e => e.type === 'configuration'),
    dependencies: filteredEntities.filter(e => e.type === 'dependency'),
    tools: filteredEntities.filter(e => e.type === 'tool'),
    libraries: filteredEntities.filter(e => e.type === 'library'),
    commands: filteredEntities.filter(e => e.type === 'command'),
  };

  // Calculate usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-2.5-flash-lite', inputTokens, outputTokens);

  return {
    entities: filteredEntities,
    categories,
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Compare entities between two texts
 * Returns overlapping and conflicting entities
 */
export async function compareEntities(
  text1: string,
  text2: string,
  label1: string = 'Source',
  label2: string = 'Target'
): Promise<{
  overlapping: Array<{
    type: EntityType;
    value: string;
    inBoth: boolean;
    conflicts: boolean;
    text1Context: string;
    text2Context: string;
  }>;
  uniqueToText1: ExtractedEntity[];
  uniqueToText2: ExtractedEntity[];
  overlapScore: number;
}> {
  // Extract entities from both texts
  const [result1, result2] = await Promise.all([
    extractEntities(text1),
    extractEntities(text2),
  ]);

  const entities1 = result1.entities;
  const entities2 = result2.entities;

  // Find overlapping entities
  const overlapping: Array<{
    type: EntityType;
    value: string;
    inBoth: boolean;
    conflicts: boolean;
    text1Context: string;
    text2Context: string;
  }> = [];

  const matched1 = new Set<number>();
  const matched2 = new Set<number>();

  for (let i = 0; i < entities1.length; i++) {
    const e1 = entities1[i];

    for (let j = 0; j < entities2.length; j++) {
      const e2 = entities2[j];

      // Check if same type
      if (e1.type === e2.type) {
        const val1 = e1.value.toLowerCase();
        const val2 = e2.value.toLowerCase();

        // Check for match or containment
        if (val1 === val2 || val1.includes(val2) || val2.includes(val1)) {
          overlapping.push({
            type: e1.type,
            value: e1.value,
            inBoth: val1 === val2,
            conflicts: val1 !== val2, // Different values for same entity
            text1Context: e1.context,
            text2Context: e2.context,
          });

          matched1.add(i);
          matched2.add(j);
        }
      }
    }
  }

  // Get unique entities
  const uniqueToText1 = entities1.filter((_, idx) => !matched1.has(idx));
  const uniqueToText2 = entities2.filter((_, idx) => !matched2.has(idx));

  // Calculate overlap score
  const totalEntities = entities1.length + entities2.length;
  const overlapScore = totalEntities > 0
    ? (overlapping.length * 2) / totalEntities
    : 0;

  return {
    overlapping,
    uniqueToText1,
    uniqueToText2,
    overlapScore,
  };
}

/**
 * Extract key concepts for tagging/categorization
 */
export async function extractKeyConceptsForTags(
  text: string,
  maxTags: number = 5
): Promise<string[]> {
  const result = await extractEntities(text, {
    entityTypes: ['concept', 'tool', 'library'],
    minConfidence: 0.80,
  });

  // Sort by confidence and take top N
  const topConcepts = result.entities
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxTags)
    .map(e => e.value.toLowerCase().replace(/\s+/g, '-'));

  return topConcepts;
}

/**
 * Detect temporal conflicts in dates/versions
 */
export async function detectTemporalConflicts(
  modules: Array<{ id: string; content: string; moduleKey: string }>
): Promise<Array<{
  moduleId: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}>> {
  const conflicts: Array<{
    moduleId: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  for (const module of modules) {
    const result = await extractEntities(module.content, {
      entityTypes: ['date', 'version'],
      minConfidence: 0.80,
    });

    const dates = result.categories.dates;
    const versions = result.categories.versions;

    // Check for future dates (based on current date context)
    const now = new Date();
    for (const dateEntity of dates) {
      try {
        const parsedDate = new Date(dateEntity.value);
        if (!isNaN(parsedDate.getTime())) {
          const daysDiff = Math.floor((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff > 365) {
            conflicts.push({
              moduleId: module.id,
              issue: `Date "${dateEntity.value}" is ${daysDiff} days in the future - likely incorrect`,
              severity: 'medium',
            });
          }
        }
      } catch {
        // Skip unparseable dates
      }
    }

    // Check for deprecated versions (placeholder - would need version DB)
    for (const versionEntity of versions) {
      // Example: Check if version contains "deprecated", "legacy", "old"
      if (
        versionEntity.context.toLowerCase().includes('deprecated') ||
        versionEntity.context.toLowerCase().includes('legacy')
      ) {
        conflicts.push({
          moduleId: module.id,
          issue: `Potentially deprecated version referenced: ${versionEntity.value}`,
          severity: 'low',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Extract API surface from documentation
 * Useful for API documentation analysis
 */
export async function extractAPISurface(
  documentContent: string
): Promise<{
  endpoints: Array<{
    method: string;
    path: string;
    description: string;
    parameters?: string[];
    responses?: string[];
  }>;
  totalEndpoints: number;
}> {
  const result = await extractEntities(documentContent, {
    entityTypes: ['api_endpoint', 'spec'],
    minConfidence: 0.80,
  });

  const endpoints = result.categories.apis.map(api => {
    // Try to parse HTTP method from value or metadata
    let method = 'GET';
    let path = api.value;

    const methodMatch = api.value.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(.+)/i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
      path = methodMatch[2];
    } else if (api.metadata?.method) {
      method = api.metadata.method.toUpperCase();
    }

    return {
      method,
      path,
      description: api.context,
      parameters: api.metadata?.parameters,
      responses: api.metadata?.responses,
    };
  });

  return {
    endpoints,
    totalEndpoints: endpoints.length,
  };
}

/**
 * Extract configuration schema from documentation
 */
export async function extractConfigurationSchema(
  documentContent: string
): Promise<{
  configs: Array<{
    key: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
  }>;
  totalConfigs: number;
}> {
  const result = await extractEntities(documentContent, {
    entityTypes: ['configuration', 'spec'],
    minConfidence: 0.75,
  });

  const configs = result.categories.configurations.map(config => ({
    key: config.value,
    type: config.metadata?.type || 'string',
    required: config.metadata?.required !== false,
    description: config.context,
    defaultValue: config.metadata?.default,
  }));

  return {
    configs,
    totalConfigs: configs.length,
  };
}

/**
 * Batch entity extraction for multiple texts
 */
export async function batchExtractEntities(
  texts: Array<{ id: string; content: string }>,
  options?: {
    entityTypes?: EntityType[];
    minConfidence?: number;
  }
): Promise<Map<string, EntityExtractionResult>> {
  const results = new Map<string, EntityExtractionResult>();

  // Process in batches to avoid rate limits
  const BATCH_SIZE = 5;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(item => extractEntities(item.content, options))
    );

    batch.forEach((item, idx) => {
      results.set(item.id, batchResults[idx]);
    });

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Build entity index for a module
 * Stores extracted entities in database for fast lookup
 */
export interface ModuleEntityIndex {
  moduleId: string;
  entities: ExtractedEntity[];
  lastIndexedAt: Date;
}

export async function buildModuleEntityIndex(
  moduleId: string,
  moduleContent: string
): Promise<ModuleEntityIndex> {
  const result = await extractEntities(moduleContent);

  // Store in module metadata (using tags field for now)
  // TODO: Consider adding dedicated EntityIndex model if needed

  return {
    moduleId,
    entities: result.entities,
    lastIndexedAt: new Date(),
  };
}

/**
 * Find modules by entity
 * Useful for: "Find all modules that mention API endpoint X"
 */
export async function findModulesByEntity(
  entityType: EntityType,
  entityValue: string,
  projectId: string
): Promise<Array<{
  moduleId: string;
  moduleKey: string;
  documentPath: string;
  matchedEntity: ExtractedEntity;
}>> {
  // Get all modules in project
  const modules = await prisma.documentModule.findMany({
    where: {
      document: {
        projectId,
      },
    },
    select: {
      id: true,
      moduleKey: true,
      content: true,
      document: {
        select: {
          path: true,
        },
      },
    },
  });

  const matches: Array<{
    moduleId: string;
    moduleKey: string;
    documentPath: string;
    matchedEntity: ExtractedEntity;
  }> = [];

  // Search for entity in each module
  for (const module of modules) {
    // Quick text search first to avoid unnecessary AI calls
    if (!module.content.toLowerCase().includes(entityValue.toLowerCase())) {
      continue;
    }

    // Extract entities from module
    const result = await extractEntities(module.content, {
      entityTypes: [entityType],
      minConfidence: 0.70,
    });

    // Find matching entity
    const matchedEntity = result.entities.find(e =>
      e.value.toLowerCase().includes(entityValue.toLowerCase()) ||
      entityValue.toLowerCase().includes(e.value.toLowerCase())
    );

    if (matchedEntity) {
      matches.push({
        moduleId: module.id,
        moduleKey: module.moduleKey,
        documentPath: module.document.path,
        matchedEntity,
      });
    }
  }

  return matches;
}

/**
 * Get entity statistics for a project
 */
export async function getEntityStats(projectId: string): Promise<{
  totalEntities: number;
  byType: Record<EntityType, number>;
  topConcepts: Array<{ concept: string; count: number }>;
  topAPIs: Array<{ endpoint: string; count: number }>;
}> {
  // Get all modules
  const modules = await prisma.documentModule.findMany({
    where: {
      document: {
        projectId,
      },
      isGrounded: true, // Only grounded modules
    },
    select: {
      content: true,
    },
  });

  // Extract entities from all modules
  const allEntities: ExtractedEntity[] = [];

  for (const module of modules) {
    const result = await extractEntities(module.content, {
      minConfidence: 0.80,
    });
    allEntities.push(...result.entities);
  }

  // Count by type
  const byType = {} as Record<EntityType, number>;
  for (const entity of allEntities) {
    byType[entity.type] = (byType[entity.type] || 0) + 1;
  }

  // Top concepts
  const conceptCounts = new Map<string, number>();
  allEntities
    .filter(e => e.type === 'concept')
    .forEach(e => {
      const normalized = e.value.toLowerCase();
      conceptCounts.set(normalized, (conceptCounts.get(normalized) || 0) + 1);
    });

  const topConcepts = Array.from(conceptCounts.entries())
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top APIs
  const apiCounts = new Map<string, number>();
  allEntities
    .filter(e => e.type === 'api_endpoint')
    .forEach(e => {
      apiCounts.set(e.value, (apiCounts.get(e.value) || 0) + 1);
    });

  const topAPIs = Array.from(apiCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalEntities: allEntities.length,
    byType,
    topConcepts,
    topAPIs,
  };
}
