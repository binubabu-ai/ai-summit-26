/**
 * Document Decomposition Service
 * Breaks documents into semantic modules using hybrid rule-based + AI approach
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext } from './context';
import crypto from 'crypto';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Token limits for modules
const MIN_MODULE_TOKENS = 300;
const MAX_MODULE_TOKENS = 2000;
const TYPICAL_TOKENS_PER_CHAR = 0.25; // Rough estimate: 4 chars per token

// Similarity thresholds
const HIGH_SIMILARITY_THRESHOLD = 0.85; // Merge sections above this
const LOW_COHESION_THRESHOLD = 0.60;    // Split sections below this

export interface RawSection {
  content: string;
  startLine: number;
  endLine: number;
  headingLevel: number | null;
  headingText: string | null;
  type: 'heading' | 'code' | 'list' | 'table' | 'paragraph';
}

export interface Module {
  moduleKey: string;
  title: string;
  description: string;
  content: string;
  contentHash: string;
  startLine: number;
  endLine: number;
  headingLevel: number | null;
  moduleType: string;
  order: number;
  estimatedTokens: number;
  dependsOn: string[];
  tags: string[];
}

export interface DecompositionResult {
  modules: Module[];
  summary: {
    totalModules: number;
    avgModuleSize: number;
    totalDependencies: number;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/**
 * Stage 1: Parse markdown structure into raw sections
 */
export function parseMarkdownStructure(content: string): RawSection[] {
  const lines = content.split('\n');
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;
  let currentContent: string[] = [];
  let currentStartLine = 0;

  const flushSection = (endLine: number) => {
    if (currentSection && currentContent.length > 0) {
      currentSection.content = currentContent.join('\n').trim();
      currentSection.endLine = endLine;
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }
    currentContent = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      // Flush previous section
      flushSection(lineNumber - 1);

      // Start new section
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      currentSection = {
        content: '',
        startLine: lineNumber,
        endLine: lineNumber,
        headingLevel: level,
        headingText: text,
        type: 'heading',
      };
      currentContent = [line];
      currentStartLine = lineNumber;
      continue;
    }

    // Check for code block
    if (line.trim().startsWith('```')) {
      if (currentSection?.type !== 'code') {
        // Start code block
        flushSection(lineNumber - 1);
        currentSection = {
          content: '',
          startLine: lineNumber,
          endLine: lineNumber,
          headingLevel: null,
          headingText: null,
          type: 'code',
        };
        currentContent = [line];
        currentStartLine = lineNumber;
      } else {
        // End code block
        currentContent.push(line);
        flushSection(lineNumber);
        currentSection = null;
      }
      continue;
    }

    // Check for table
    if (line.trim().startsWith('|')) {
      if (currentSection?.type !== 'table') {
        flushSection(lineNumber - 1);
        currentSection = {
          content: '',
          startLine: lineNumber,
          endLine: lineNumber,
          headingLevel: null,
          headingText: null,
          type: 'table',
        };
        currentContent = [line];
        currentStartLine = lineNumber;
      } else {
        currentContent.push(line);
      }
      continue;
    }

    // Check for list
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
    if (listMatch) {
      if (currentSection?.type !== 'list') {
        flushSection(lineNumber - 1);
        currentSection = {
          content: '',
          startLine: lineNumber,
          endLine: lineNumber,
          headingLevel: null,
          headingText: null,
          type: 'list',
        };
        currentContent = [line];
        currentStartLine = lineNumber;
      } else {
        currentContent.push(line);
      }
      continue;
    }

    // Regular paragraph/content
    if (currentSection) {
      currentContent.push(line);
    } else if (line.trim()) {
      // Start new paragraph section
      currentSection = {
        content: '',
        startLine: lineNumber,
        endLine: lineNumber,
        headingLevel: null,
        headingText: null,
        type: 'paragraph',
      };
      currentContent = [line];
      currentStartLine = lineNumber;
    }
  }

  // Flush final section
  flushSection(lines.length);

  return sections;
}

/**
 * Stage 2: AI-powered semantic boundary detection
 * Uses Gemini to analyze section coherence and suggest module boundaries
 */
export async function detectSemanticBoundaries(
  sections: RawSection[],
  documentPath: string
): Promise<Module[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',  // Cost-efficient for decomposition
    systemInstruction: buildSystemInstruction(`You are a documentation structure expert.
Your task is to analyze document sections and create logical, semantically coherent modules.

Guidelines:
- Each module should cover ONE main topic or concept
- Modules should be self-contained but can reference other modules
- Aim for 5-15 modules per document
- Module size: 300-2000 tokens (roughly 1200-8000 characters)
- Merge related subsections under the same heading
- Keep code blocks, tables, and lists together in their modules
- Generate concise, descriptive module titles
- Create unique moduleKeys using kebab-case (e.g., "installation-guide", "api-reference")
- Extract relevant tags for categorization`, {
      includeDateContext: true,
    }),
  });

  // Group sections by heading hierarchy
  const structuredContent = sections.map((section, idx) => ({
    index: idx,
    content: section.content.substring(0, 500), // First 500 chars for analysis
    type: section.type,
    headingLevel: section.headingLevel,
    headingText: section.headingText,
    lines: `${section.startLine}-${section.endLine}`,
    estimatedTokens: Math.floor(section.content.length * TYPICAL_TOKENS_PER_CHAR),
  }));

  const prompt = `
${getCurrentDateTimeContext()}

# Document Decomposition Task

**Document:** ${documentPath}
**Total Sections:** ${sections.length}

## Section Structure:
${JSON.stringify(structuredContent, null, 2)}

## Full Document Content:
\`\`\`markdown
${sections.map(s => s.content).join('\n\n')}
\`\`\`

# Task

Analyze this document and break it into 5-15 logical modules. Each module should:
1. Have a unique moduleKey (kebab-case, e.g., "getting-started")
2. Have a descriptive title
3. Have a brief description (1-2 sentences)
4. Include one or more related sections (reference by index)
5. Be semantically coherent (cover one main topic)
6. Be appropriately sized (300-2000 tokens)

Return a JSON array of modules:
\`\`\`json
{
  "modules": [
    {
      "moduleKey": "installation",
      "title": "Installation Guide",
      "description": "Step-by-step installation instructions",
      "sectionIndexes": [0, 1, 2],
      "moduleType": "section",
      "tags": ["getting-started", "setup"],
      "reasoning": "These sections all cover installation steps"
    }
  ]
}
\`\`\`

IMPORTANT:
- Ensure moduleKeys are unique and descriptive
- Merge subsections under the same parent heading
- Keep code blocks, tables, and lists within their logical module
- Aim for balanced module sizes
- Extract meaningful tags for each module
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  // Parse AI response
  let aiModules: any[];
  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText);
    aiModules = parsed.modules || [];
  } catch (error) {
    console.error('Failed to parse decomposition response:', error);
    throw new Error('AI failed to generate valid module structure');
  }

  // Build final modules from AI analysis
  const modules: Module[] = aiModules.map((aiModule, idx) => {
    // Combine sections specified by AI
    const moduleSections = aiModule.sectionIndexes
      .map((i: number) => sections[i])
      .filter(Boolean);

    if (moduleSections.length === 0) {
      throw new Error(`Module ${aiModule.moduleKey} has no valid sections`);
    }

    const content = moduleSections.map((s: RawSection) => s.content).join('\n\n');
    const startLine = moduleSections[0].startLine;
    const endLine = moduleSections[moduleSections.length - 1].endLine;

    // Get heading level from first section with heading
    const headingSection = moduleSections.find((s: RawSection) => s.headingLevel !== null);

    return {
      moduleKey: aiModule.moduleKey,
      title: aiModule.title,
      description: aiModule.description || '',
      content,
      contentHash: crypto.createHash('sha256').update(content).digest('hex').substring(0, 16),
      startLine,
      endLine,
      headingLevel: headingSection?.headingLevel || null,
      moduleType: aiModule.moduleType || 'section',
      order: idx,
      estimatedTokens: Math.floor(content.length * TYPICAL_TOKENS_PER_CHAR),
      dependsOn: [], // Will be populated in stage 3
      tags: aiModule.tags || [],
    };
  });

  // Calculate usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

  return modules;
}

/**
 * Stage 3: Map dependencies between modules
 * Detects cross-references and builds dependency graph
 */
export async function mapDependencies(modules: Module[]): Promise<void> {
  // Extract internal references (markdown links, mentions)
  for (const module of modules) {
    const dependencies = new Set<string>();

    // Find markdown links: [text](path) or [text](#anchor)
    const linkMatches = module.content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
      const link = match[2];

      // Check if link references another module by anchor
      if (link.startsWith('#')) {
        const anchor = link.substring(1);
        const referencedModule = modules.find(m =>
          m.moduleKey === anchor ||
          m.title.toLowerCase().replace(/\s+/g, '-') === anchor
        );
        if (referencedModule && referencedModule.moduleKey !== module.moduleKey) {
          dependencies.add(referencedModule.moduleKey);
        }
      }
    }

    // Find module mentions by title or key
    for (const otherModule of modules) {
      if (otherModule.moduleKey === module.moduleKey) continue;

      // Check if module title is mentioned
      const titleRegex = new RegExp(`\\b${otherModule.title}\\b`, 'i');
      if (titleRegex.test(module.content)) {
        dependencies.add(otherModule.moduleKey);
      }
    }

    module.dependsOn = Array.from(dependencies);
  }
}

/**
 * Main decomposition function
 * Orchestrates all 3 stages to produce final modules
 */
export async function decomposeDocument(
  documentContent: string,
  documentPath: string,
  options?: {
    minModules?: number;
    maxModules?: number;
    preserveStructure?: boolean; // If true, strictly follow heading hierarchy
  }
): Promise<DecompositionResult> {
  const { minModules = 5, maxModules = 15, preserveStructure = false } = options || {};

  // Stage 1: Parse markdown structure
  const sections = parseMarkdownStructure(documentContent);

  if (sections.length === 0) {
    throw new Error('Document has no parseable content');
  }

  // If preserveStructure is true and we have few sections, use them directly
  if (preserveStructure && sections.length <= maxModules) {
    const modules = sections.map((section, idx) => ({
      moduleKey: section.headingText
        ? section.headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : `section-${idx + 1}`,
      title: section.headingText || `Section ${idx + 1}`,
      description: section.content.substring(0, 100).replace(/\n/g, ' ') + '...',
      content: section.content,
      contentHash: crypto.createHash('sha256').update(section.content).digest('hex').substring(0, 16),
      startLine: section.startLine,
      endLine: section.endLine,
      headingLevel: section.headingLevel,
      moduleType: section.type,
      order: idx,
      estimatedTokens: Math.floor(section.content.length * TYPICAL_TOKENS_PER_CHAR),
      dependsOn: [],
      tags: [],
    }));

    // Stage 3: Map dependencies
    await mapDependencies(modules);

    return {
      modules,
      summary: {
        totalModules: modules.length,
        avgModuleSize: modules.reduce((sum, m) => sum + m.estimatedTokens, 0) / modules.length,
        totalDependencies: modules.reduce((sum, m) => sum + m.dependsOn.length, 0),
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      },
    };
  }

  // Stage 2: AI-powered semantic boundary detection
  const modules = await detectSemanticBoundaries(sections, documentPath);

  // Stage 3: Map dependencies
  await mapDependencies(modules);

  // Validate modules
  for (const module of modules) {
    if (module.estimatedTokens < MIN_MODULE_TOKENS) {
      console.warn(`Module ${module.moduleKey} is below minimum token count: ${module.estimatedTokens}`);
    }
    if (module.estimatedTokens > MAX_MODULE_TOKENS) {
      console.warn(`Module ${module.moduleKey} exceeds maximum token count: ${module.estimatedTokens}`);
    }
  }

  // Calculate summary
  const summary = {
    totalModules: modules.length,
    avgModuleSize: modules.reduce((sum, m) => sum + m.estimatedTokens, 0) / modules.length,
    totalDependencies: modules.reduce((sum, m) => sum + m.dependsOn.length, 0),
  };

  // Usage tracking (from detectSemanticBoundaries)
  // Note: We don't have access to the actual tokens here, so we estimate
  const estimatedInputTokens = Math.floor(documentContent.length * TYPICAL_TOKENS_PER_CHAR);
  const estimatedOutputTokens = Math.floor(JSON.stringify(modules).length * TYPICAL_TOKENS_PER_CHAR);

  return {
    modules,
    summary,
    usage: {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      cost: calculateCost('gemini-2.5-flash-lite', estimatedInputTokens, estimatedOutputTokens),
    },
  };
}

/**
 * Generate module preview for UI
 * Shows user how document will be decomposed before committing
 */
export async function generateModulePreview(
  documentContent: string,
  documentPath: string
): Promise<{
  modules: Array<{
    moduleKey: string;
    title: string;
    description: string;
    lineRange: string;
    estimatedTokens: number;
    preview: string; // First 200 chars
  }>;
  totalModules: number;
}> {
  const result = await decomposeDocument(documentContent, documentPath);

  return {
    modules: result.modules.map(m => ({
      moduleKey: m.moduleKey,
      title: m.title,
      description: m.description,
      lineRange: `${m.startLine}-${m.endLine}`,
      estimatedTokens: m.estimatedTokens,
      preview: m.content.substring(0, 200).replace(/\n/g, ' ') + (m.content.length > 200 ? '...' : ''),
    })),
    totalModules: result.modules.length,
  };
}

/**
 * Re-decompose specific module if user adjusts boundaries
 */
export async function redecomposeModule(
  moduleContent: string,
  moduleKey: string,
  targetSubModules: number = 2
): Promise<Module[]> {
  const sections = parseMarkdownStructure(moduleContent);

  if (sections.length <= targetSubModules) {
    // Can't split further, return as is
    return [{
      moduleKey: `${moduleKey}-1`,
      title: sections[0]?.headingText || moduleKey,
      description: moduleContent.substring(0, 100),
      content: moduleContent,
      contentHash: crypto.createHash('sha256').update(moduleContent).digest('hex').substring(0, 16),
      startLine: sections[0]?.startLine || 1,
      endLine: sections[sections.length - 1]?.endLine || moduleContent.split('\n').length,
      headingLevel: sections[0]?.headingLevel || null,
      moduleType: 'section',
      order: 0,
      estimatedTokens: Math.floor(moduleContent.length * TYPICAL_TOKENS_PER_CHAR),
      dependsOn: [],
      tags: [],
    }];
  }

  // Use AI to split intelligently
  const modules = await detectSemanticBoundaries(sections, moduleKey);

  // Update moduleKeys to be nested under parent
  return modules.map((m, idx) => ({
    ...m,
    moduleKey: `${moduleKey}-${idx + 1}`,
  }));
}

/**
 * Merge multiple modules into one
 */
export function mergeModules(modules: Module[], moduleKeys: string[]): Module {
  const toMerge = modules.filter(m => moduleKeys.includes(m.moduleKey));

  if (toMerge.length === 0) {
    throw new Error('No modules to merge');
  }

  if (toMerge.length === 1) {
    return toMerge[0];
  }

  // Sort by order
  toMerge.sort((a, b) => a.order - b.order);

  const mergedContent = toMerge.map(m => m.content).join('\n\n');
  const mergedTitle = toMerge[0].title;
  const mergedKey = toMerge[0].moduleKey;

  return {
    moduleKey: mergedKey,
    title: mergedTitle,
    description: `Merged module containing: ${toMerge.map(m => m.title).join(', ')}`,
    content: mergedContent,
    contentHash: crypto.createHash('sha256').update(mergedContent).digest('hex').substring(0, 16),
    startLine: toMerge[0].startLine,
    endLine: toMerge[toMerge.length - 1].endLine,
    headingLevel: toMerge[0].headingLevel,
    moduleType: 'section',
    order: toMerge[0].order,
    estimatedTokens: Math.floor(mergedContent.length * TYPICAL_TOKENS_PER_CHAR),
    dependsOn: Array.from(new Set(toMerge.flatMap(m => m.dependsOn))),
    tags: Array.from(new Set(toMerge.flatMap(m => m.tags))),
  };
}

/**
 * Validate module structure
 */
export function validateModules(modules: Module[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate moduleKeys
  const keys = new Set<string>();
  for (const module of modules) {
    if (keys.has(module.moduleKey)) {
      errors.push(`Duplicate moduleKey: ${module.moduleKey}`);
    }
    keys.add(module.moduleKey);
  }

  // Check module sizes
  for (const module of modules) {
    if (module.estimatedTokens < MIN_MODULE_TOKENS) {
      warnings.push(`Module ${module.moduleKey} is too small: ${module.estimatedTokens} tokens`);
    }
    if (module.estimatedTokens > MAX_MODULE_TOKENS) {
      warnings.push(`Module ${module.moduleKey} is too large: ${module.estimatedTokens} tokens`);
    }
  }

  // Check dependencies are valid
  const validKeys = new Set(modules.map(m => m.moduleKey));
  for (const module of modules) {
    for (const dep of module.dependsOn) {
      if (!validKeys.has(dep)) {
        warnings.push(`Module ${module.moduleKey} references unknown dependency: ${dep}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
