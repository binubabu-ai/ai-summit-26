/**
 * Specification Analyzer
 * Uses AI to analyze source documents and determine what specs to generate
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext } from './context';
import {
  SpecAnalysisResult,
  TechStack,
  Feature,
  Constraint,
  ArchitecturalDecision,
  DocumentToGenerate,
} from '@/lib/templates/types';
import { getApplicableTemplates } from '@/lib/templates/registry';
import { DocumentType } from '@prisma/client';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface AnalyzeOptions {
  projectTechStack?: Partial<TechStack>;
  existingDocs?: string[];
  generateAll?: boolean; // Generate all applicable templates
}

/**
 * Analyze source document to determine what specifications to generate
 */
export async function analyzeSourceDocument(
  content: string,
  sourcePath: string,
  options: AnalyzeOptions = {}
): Promise<SpecAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro', // Use Pro for analysis quality
    systemInstruction: buildSystemInstruction(`You are a technical architect and specification expert.
Your task is to analyze product/requirement documents and extract:
1. Technology stack being used or implied
2. Features that need to be implemented
3. Constraints (security, performance, validation, business rules)
4. Architectural decisions that need to be made

Be specific, concrete, and implementation-focused.`, {
      includeDateContext: true,
    }),
  });

  const prompt = `
${getCurrentDateTimeContext()}

# Document Analysis Task

Analyze the following source document and extract structured information.

## Source Document
**Path**: ${sourcePath}

**Content**:
${content}

## Context
${options.projectTechStack ? `**Known Tech Stack**: ${JSON.stringify(options.projectTechStack, null, 2)}` : '**Tech Stack**: Unknown - please detect from document'}

${options.existingDocs && options.existingDocs.length > 0 ? `**Existing Documents**: ${options.existingDocs.join(', ')}` : ''}

---

## Required Analysis

Please provide a JSON response with the following structure:

\`\`\`json
{
  "techStack": {
    "framework": "nextjs | react | vue | angular | other",
    "database": "postgresql | mysql | mongodb | other",
    "orm": "prisma | drizzle | typeorm | other",
    "auth": "supabase | clerk | nextauth | custom | other",
    "language": "typescript | javascript | python | other",
    "deployment": "vercel | aws | docker | other"
  },
  "confidence": 0.0-1.0,
  "features": [
    {
      "name": "Feature Name",
      "slug": "feature-slug",
      "description": "What this feature does",
      "requirements": ["Requirement 1", "Requirement 2"],
      "priority": "critical | high | medium | low",
      "estimatedComplexity": "simple | moderate | complex"
    }
  ],
  "constraints": [
    {
      "type": "security | performance | validation | business | technical",
      "category": "Category name",
      "rules": ["Rule 1", "Rule 2"],
      "severity": "hard | soft | info"
    }
  ],
  "decisions": [
    {
      "title": "Decision title",
      "context": "Why this decision is needed",
      "options": ["Option 1", "Option 2"],
      "decision": "Recommended decision (if clear from document)",
      "consequences": ["Consequence 1", "Consequence 2"],
      "status": "proposed | accepted | deprecated"
    }
  ],
  "suggestions": [
    "Suggestion 1: What other specs might be useful",
    "Suggestion 2: Areas that need clarification"
  ],
  "warnings": [
    "Warning 1: Missing information",
    "Warning 2: Ambiguous requirements"
  ]
}
\`\`\`

## Analysis Guidelines

### Tech Stack Detection
- Look for explicit mentions of technologies
- Infer from context (e.g., "App Router" = Next.js)
- If multiple options possible, choose most likely
- Default to "other" if truly unknown

### Feature Extraction
- Each feature should be a distinct capability
- Create meaningful slugs (kebab-case)
- Break large features into sub-features
- Include ALL requirements mentioned for each feature

### Constraint Identification
- Security: Authentication, authorization, encryption, compliance
- Performance: Response time, throughput, caching
- Validation: Input rules, business rules, data integrity
- Business: Business logic, workflows, policies
- Technical: Dependencies, integrations, compatibility

### Decision Recognition
- Architectural choices (state management, architecture patterns)
- Technology selections (database, hosting, libraries)
- Design decisions (API structure, data modeling)

### Slugs
- Use kebab-case
- Be descriptive but concise
- Examples: "user-authentication", "payment-processing", "admin-dashboard"

### Priorities
- Critical: Core functionality, must-have
- High: Important, should be in MVP
- Medium: Nice to have, can wait
- Low: Future enhancement

---

Provide ONLY valid JSON, no markdown formatting or explanation.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (in case model wrapped it in markdown)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const analysisData = JSON.parse(jsonText);

    // Merge with provided tech stack
    const techStack: TechStack = {
      ...analysisData.techStack,
      ...options.projectTechStack,
    };

    // Get applicable templates based on tech stack
    const applicableTemplates = getApplicableTemplates(techStack);

    // Determine which documents to generate
    const documentsToGenerate: DocumentToGenerate[] = [];

    // For each feature, generate implementation spec
    for (const feature of analysisData.features || []) {
      const implTemplate = applicableTemplates.find(t =>
        t.category === 'implementation' && t.id.includes(techStack.framework || '')
      );

      if (implTemplate) {
        documentsToGenerate.push({
          templateId: implTemplate.id,
          title: `${feature.name} - Implementation`,
          path: `specs/${feature.slug}/implementation.md`,
          docType: implTemplate.docType,
          category: 'implementation',
          priority: implTemplate.priority,
          feature,
          variables: { feature },
        });
      }
    }

    // Generate database schema if ORM detected
    if (techStack.orm) {
      const dbTemplate = applicableTemplates.find(t => t.category === 'database');
      if (dbTemplate) {
        documentsToGenerate.push({
          templateId: dbTemplate.id,
          title: 'Database Schema Specification',
          path: 'architecture/database-schema.md',
          docType: dbTemplate.docType,
          category: 'database',
          priority: dbTemplate.priority,
          variables: { features: analysisData.features },
        });
      }
    }

    // Generate security constraints if security requirements found
    const hasSecurityConstraints = (analysisData.constraints || []).some(
      (c: Constraint) => c.type === 'security'
    );

    if (hasSecurityConstraints) {
      const secTemplate = applicableTemplates.find(t => t.id === 'security-constraints');
      if (secTemplate) {
        documentsToGenerate.push({
          templateId: secTemplate.id,
          title: 'Security Constraints',
          path: 'constraints/security.md',
          docType: secTemplate.docType,
          category: 'constraint',
          priority: secTemplate.priority,
          variables: {},
        });
      }
    }

    // Calculate tokens and cost
    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

    return {
      detectedTechStack: techStack,
      confidence: analysisData.confidence || 0.8,
      features: analysisData.features || [],
      constraints: analysisData.constraints || [],
      decisions: analysisData.decisions || [],
      documentsToGenerate,
      suggestions: analysisData.suggestions || [],
      warnings: analysisData.warnings || [],
      analysisTokens: inputTokens + outputTokens,
      analysisCost: cost,
    };
  } catch (error) {
    console.error('Failed to analyze source document:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
