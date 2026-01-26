/**
 * Specification Generator
 * Generates implementation-ready specs from analysis results
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCost } from './gemini';
import { buildSystemInstruction, getCurrentDateTimeContext } from './context';
import {
  GenerationContext,
  GeneratedDocument,
  DocumentToGenerate,
  SpecAnalysisResult,
} from '@/lib/templates/types';
import { getTemplate } from '@/lib/templates/registry';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a single document from template and context
 */
export async function generateDocument(
  docToGenerate: DocumentToGenerate,
  context: GenerationContext
): Promise<GeneratedDocument> {
  const template = getTemplate(docToGenerate.templateId);

  if (!template) {
    throw new Error(`Template not found: ${docToGenerate.templateId}`);
  }

  // If template is a function, execute it with context
  if (typeof template.template === 'function') {
    const content = template.template(context);

    return {
      path: docToGenerate.path,
      content,
      docType: docToGenerate.docType,
      title: docToGenerate.title,
      metadata: {
        templateId: template.id,
        generatedFrom: context.sourcePath,
        techStack: context.techStack,
      },
    };
  }

  // If template is a string, use AI to fill it
  const templateString = template.template;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite', // Use Flash for generation (cheaper)
    systemInstruction: buildSystemInstruction(`You are a technical specification writer.
Your task is to fill in specification templates with concrete, implementation-ready content.

Guidelines:
- Be specific and detailed
- Use actual code examples where appropriate
- Follow best practices for the technology stack
- Make specs actionable for developers or AI coding assistants
- Include all necessary details (file paths, API routes, etc.)`, {
      includeDateContext: true,
    }),
  });

  const prompt = `
${getCurrentDateTimeContext()}

# Document Generation Task

Fill in the following specification template with detailed, implementation-ready content.

## Source Information

**Source Document**: ${context.sourcePath}

**Excerpt**:
${context.sourceContent.substring(0, 2000)}...

## Technology Stack
${JSON.stringify(context.techStack, null, 2)}

## Context

${docToGenerate.feature ? `**Feature**: ${JSON.stringify(docToGenerate.feature, null, 2)}` : ''}
${docToGenerate.constraint ? `**Constraint**: ${JSON.stringify(docToGenerate.constraint, null, 2)}` : ''}
${docToGenerate.decision ? `**Decision**: ${JSON.stringify(docToGenerate.decision, null, 2)}` : ''}

**All Features**: ${JSON.stringify(context.features.map(f => f.name))}
**All Constraints**: ${JSON.stringify(context.constraints.map(c => c.category))}

## Template Variables
${JSON.stringify(docToGenerate.variables, null, 2)}

## Template to Fill

${templateString}

---

Generate the complete specification document. Replace all placeholders with concrete details.
Output ONLY the filled template content, no JSON or markdown wrappers.
`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Calculate usage
    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-flash-lite', inputTokens, outputTokens);

    return {
      path: docToGenerate.path,
      content,
      docType: docToGenerate.docType,
      title: docToGenerate.title,
      metadata: {
        templateId: template.id,
        generatedFrom: context.sourcePath,
        techStack: context.techStack,
        prompt,
        tokensUsed: inputTokens + outputTokens,
        cost,
      },
    };
  } catch (error) {
    console.error(`Failed to generate document ${docToGenerate.path}:`, error);
    throw new Error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate all documents from analysis result
 */
export async function generateDocumentsFromAnalysis(
  sourceContent: string,
  sourcePath: string,
  sourceDocId: string,
  projectId: string,
  analysis: SpecAnalysisResult
): Promise<GeneratedDocument[]> {
  const context: GenerationContext = {
    sourcePath,
    sourceContent,
    sourceDocId,
    techStack: analysis.detectedTechStack,
    features: analysis.features,
    constraints: analysis.constraints,
    decisions: analysis.decisions,
    projectId,
  };

  const documents: GeneratedDocument[] = [];

  // Generate each document
  for (const docToGenerate of analysis.documentsToGenerate) {
    try {
      const doc = await generateDocument(docToGenerate, context);
      documents.push(doc);
    } catch (error) {
      console.error(`Failed to generate ${docToGenerate.path}:`, error);
      // Continue with other documents even if one fails
    }
  }

  return documents;
}

/**
 * Generate a single custom document with custom prompt (for on-demand generation)
 */
export async function generateCustomDocument(
  title: string,
  prompt: string,
  outputPath: string,
  context: Partial<GenerationContext>
): Promise<GeneratedDocument> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: buildSystemInstruction(`You are a technical specification writer.
Generate complete, implementation-ready documentation based on user requests.`, {
      includeDateContext: true,
    }),
  });

  const fullPrompt = `
${getCurrentDateTimeContext()}

# Custom Document Generation

${context.techStack ? `**Technology Stack**: ${JSON.stringify(context.techStack, null, 2)}` : ''}
${context.features ? `**Features**: ${JSON.stringify(context.features, null, 2)}` : ''}
${context.constraints ? `**Constraints**: ${JSON.stringify(context.constraints, null, 2)}` : ''}

---

${prompt}

---

Generate a complete markdown document for: **${title}**

Output ONLY the document content in markdown format.
`;

  try {
    const result = await model.generateContent(fullPrompt);
    const content = result.response.text();

    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

    return {
      path: outputPath,
      content,
      docType: 'GENERAL' as any, // User can override
      title,
      metadata: {
        templateId: 'custom',
        generatedFrom: context.sourcePath || 'custom-request',
        techStack: context.techStack || {},
        prompt: fullPrompt,
        tokensUsed: inputTokens + outputTokens,
        cost,
      },
    };
  } catch (error) {
    console.error('Failed to generate custom document:', error);
    throw new Error(`Custom generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
