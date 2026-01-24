/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompts
const SYSTEM_PROMPT = `You are an expert technical documentation assistant helping users improve their documentation.

Your role:
- Provide clear, actionable suggestions for documentation improvements
- Focus on clarity, accuracy, and completeness
- When suggesting changes, provide both the original and suggested text
- Explain your reasoning for each suggestion
- Be concise but thorough
- Always format suggestions as JSON when appropriate

Guidelines:
- Maintain consistent tone and style
- Use proper markdown formatting
- Ensure technical accuracy
- Consider the target audience
- Prioritize readability and clarity`;

const PROJECT_ASSISTANT_PROMPT = `You are a project-level documentation assistant with access to all documents in the project.

Your role:
- Answer questions by searching across all available documents
- Always cite your sources (document paths and line numbers)
- When suggesting changes, ONLY propose changes to the current document
- Identify contradictions and inconsistencies between documents
- Help maintain consistency across the project

Guidelines:
- Always provide sources for your answers
- Be aware of the full project context
- Highlight related information from other documents
- Suggest updates when information is outdated or contradicts other docs`;

const QUICK_DOC_CREATOR_PROMPT = `You are a documentation expert that converts raw text into structured markdown documents.

Your tasks:
1. Identify document type (meeting notes, observation, opportunity, technical doc, etc.)
2. Suggest appropriate file path (e.g., meetings/2026-01-24.md, observations/user-feedback.md)
3. Extract structure and create markdown headings
4. Format content professionally
5. Extract metadata (dates, participants, tags, etc.)

Document Type Guidelines:
- Meeting Notes: Include participants, agenda, discussion, action items
- Observations: Include context, findings, insights, recommendations
- Opportunities: Include description, potential impact, next steps
- Technical Docs: Include overview, details, examples, references

Always return valid JSON with formattedContent as a properly formatted markdown string.`;

// Model selection strategy (Updated January 2026)
// Latest Gemini 3 models (Preview) - Frontier intelligence with thinking & code execution
// - gemini-3-flash-preview: Best for speed + quality balance (chat, suggestions)
// - gemini-3-pro-preview: Highest capability (complex reasoning, audits)
//
// Stable Gemini 2.5 models - Production ready with 1M context window
// - gemini-2.5-flash: Optimized for agentic use, low-latency
// - gemini-2.5-flash-lite: Most cost-efficient for high volume
// - gemini-2.5-pro: Complex reasoning, STEM, large datasets
//
// Note: Gemini 2.0 models deprecated March 31, 2026

// Pricing (USD per 1M tokens)
const GEMINI_PRICING = {
  // Gemini 3 (Preview) - Latest frontier models
  'gemini-3-flash-preview': {
    input: 0.1,   // Estimated preview pricing
    output: 0.4,  // Estimated preview pricing
  },
  'gemini-3-pro-preview': {
    input: 2.0,   // Estimated preview pricing
    output: 8.0,  // Estimated preview pricing
  },
  // Gemini 2.5 (Stable) - Production ready
  'gemini-2.5-flash': {
    input: 0.075,
    output: 0.3,
  },
  'gemini-2.5-flash-lite': {
    input: 0.05,  // Most cost-efficient
    output: 0.2,
  },
  'gemini-2.5-pro': {
    input: 1.25,
    output: 5.0,
  },
  // Legacy models (for backward compatibility)
  'gemini-2.0-flash-exp': {
    input: 0,
    output: 0,
  },
  'gemini-1.5-pro': {
    input: 1.25,
    output: 5.0,
  },
  'gemini-1.5-flash': {
    input: 0.075,
    output: 0.3,
  },
};

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  documentPath: string;
  documentContent: string;
  selectedText?: string;
  projectName?: string;
  relatedDocs?: string[];
}

export interface Suggestion {
  type: 'rewrite' | 'addition' | 'deletion' | 'style' | 'clarity';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  confidence: number;
}

export interface ChatResponse {
  message: string;
  suggestions: Suggestion[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/**
 * Calculate cost for Gemini API usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING];
  if (!pricing) {
    console.warn(`Unknown model for pricing: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Parse Gemini response for suggestions
 */
function parseSuggestions(responseText: string): Suggestion[] {
  try {
    // Try to find JSON block in the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions;
      }
    }

    // Try parsing entire response as JSON
    const parsed = JSON.parse(responseText);
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions;
    }

    return [];
  } catch (error) {
    // If can't parse as JSON, return empty array
    return [];
  }
}

/**
 * Build conversation history for Gemini
 */
function buildConversationHistory(history: Message[]) {
  return history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

/**
 * Chat with document using Gemini
 */
export async function chatWithDocument(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Message[] = [],
  quickAction?: string
): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',  // Latest Gemini 3 with thinking & code execution
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build context prompt
  let contextPrompt = `
# Document Context

**Path:** ${context.documentPath}
**Project:** ${context.projectName || 'Unknown'}

## Current Document Content:
\`\`\`markdown
${context.documentContent}
\`\`\`
`;

  if (context.selectedText) {
    contextPrompt += `\n## Selected Text:\n\`\`\`\n${context.selectedText}\n\`\`\`\n`;
  }

  if (context.relatedDocs && context.relatedDocs.length > 0) {
    contextPrompt += `\n## Related Documents:\n${context.relatedDocs.join(', ')}\n`;
  }

  // Add instruction for quick actions
  let taskPrompt = userMessage;
  if (quickAction) {
    const quickActionPrompts = {
      concise: 'Make the selected text more concise while preserving meaning.',
      clarity: 'Improve the clarity and readability of the selected text.',
      examples: 'Add concrete examples to illustrate the selected text.',
      grammar: 'Fix any grammar, spelling, or punctuation errors in the selected text.',
      simplify: 'Simplify the selected text to make it easier to understand.',
    };

    taskPrompt = quickActionPrompts[quickAction as keyof typeof quickActionPrompts] || userMessage;
  }

  // Add suggestion format instruction
  const suggestionInstruction = `

When suggesting changes, respond with a JSON object in this format:
\`\`\`json
{
  "message": "Your explanation here",
  "suggestions": [
    {
      "type": "rewrite",
      "title": "Brief title",
      "description": "What this changes",
      "originalText": "Original text from document",
      "suggestedText": "Improved version",
      "reasoning": "Why this change is helpful",
      "confidence": 0.9
    }
  ]
}
\`\`\`

If no changes are needed, just provide a conversational response without the JSON format.
`;

  const fullPrompt = contextPrompt + '\n\n' + taskPrompt + suggestionInstruction;

  // Start chat with history
  const chat = model.startChat({
    history: buildConversationHistory(conversationHistory),
  });

  const result = await chat.sendMessage(fullPrompt);
  const response = result.response;
  const responseText = response.text();

  // Parse suggestions from response
  const suggestions = parseSuggestions(responseText);

  // Extract message (remove JSON if present)
  let message = responseText;
  const jsonBlockMatch = responseText.match(/```json\n[\s\S]*?\n```/);
  if (jsonBlockMatch) {
    message = responseText.replace(jsonBlockMatch[0], '').trim();
  } else {
    try {
      JSON.parse(responseText);
      // If entire response is JSON, extract message
      const parsed = JSON.parse(responseText);
      message = parsed.message || 'Changes suggested';
    } catch {
      // Not JSON, use as is
    }
  }

  // Calculate usage and cost
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-3-flash-preview', inputTokens, outputTokens);

  return {
    message,
    suggestions,
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Generate quick suggestion using Gemini
 */
export async function generateQuickSuggestion(
  selectedText: string,
  action: string,
  documentContext: string
): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',  // Most cost-efficient for high-volume quick suggestions
    systemInstruction: SYSTEM_PROMPT,
  });

  const actionPrompts = {
    concise: 'Make this text more concise while preserving meaning',
    clarity: 'Improve clarity and readability',
    examples: 'Add concrete examples',
    grammar: 'Fix grammar and spelling',
    simplify: 'Simplify for easier understanding',
  };

  const prompt = `
Document Context:
\`\`\`
${documentContext.substring(0, 1000)}
\`\`\`

Selected Text:
\`\`\`
${selectedText}
\`\`\`

Task: ${actionPrompts[action as keyof typeof actionPrompts] || action}

Respond with a JSON object:
\`\`\`json
{
  "message": "Brief explanation",
  "suggestions": [{
    "type": "${action}",
    "title": "Title",
    "description": "What changed",
    "originalText": "${selectedText.substring(0, 100)}...",
    "suggestedText": "Improved version",
    "reasoning": "Why this is better",
    "confidence": 0.9
  }]
}
\`\`\`
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  const suggestions = parseSuggestions(responseText);

  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const cost = calculateCost('gemini-2.5-flash-lite', inputTokens, outputTokens);

  return {
    message: suggestions.length > 0 ? 'Suggestion generated' : 'No changes suggested',
    suggestions,
    usage: {
      inputTokens,
      outputTokens,
      cost,
    },
  };
}

/**
 * Analyze document for issues
 */
export async function analyzeDocument(documentContent: string, documentPath: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',  // Stable model optimized for agentic analysis tasks
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = `
Analyze this document for potential issues:

Path: ${documentPath}

Content:
\`\`\`markdown
${documentContent}
\`\`\`

Identify:
1. Outdated information
2. Missing sections
3. Unclear or ambiguous statements
4. Inconsistencies
5. Grammar/spelling errors

Respond with JSON:
\`\`\`json
{
  "freshnessScore": 0.8,
  "completenessScore": 0.7,
  "clarityScore": 0.9,
  "issues": [
    {
      "type": "missing_section",
      "severity": "medium",
      "description": "Missing examples section",
      "suggestion": "Add practical examples"
    }
  ]
}
\`\`\`
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return {
      freshnessScore: 0.5,
      completenessScore: 0.5,
      clarityScore: 0.5,
      issues: [],
    };
  }
}

/**
 * Query across project documents (for project-level AI)
 */
export async function queryProject(
  query: string,
  projectContext: string,
  currentDocPath?: string
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',  // Highest capability for complex project-level queries
    systemInstruction: PROJECT_ASSISTANT_PROMPT,
  });

  const prompt = `
# Project Context

${projectContext}

${currentDocPath ? `\n**Current Document:** ${currentDocPath}\n` : ''}

# User Query

${query}

Instructions:
- Answer using the provided context
- Always cite sources (document paths)
- If suggesting changes, ONLY propose changes to the current document
- Highlight contradictions or inconsistencies
`;

  const result = await model.generateContent(prompt);
  const response = result.response;

  return {
    message: response.text(),
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      cost: calculateCost('gemini-3-pro-preview',
        response.usageMetadata?.promptTokenCount || 0,
        response.usageMetadata?.candidatesTokenCount || 0
      ),
    },
  };
}

/**
 * Process text to create structured document
 */
export async function processTextToDocument(
  rawText: string,
  hint?: string,
  projectId?: string
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',  // Stable Pro model for document structure extraction
    systemInstruction: QUICK_DOC_CREATOR_PROMPT,
  });

  const prompt = `
Convert this text into structured documentation:

${rawText}

${hint ? `Hint: This is ${hint}` : ''}

Return JSON with:
\`\`\`json
{
  "documentType": "meeting_notes | observation | opportunity | technical_doc",
  "suggestedPath": "path/to/document.md",
  "suggestedTitle": "Document Title",
  "formattedContent": "# Markdown formatted content...",
  "extractedMetadata": {
    "date": "2026-01-24",
    "participants": ["John", "Sarah"],
    "tags": ["api", "design"],
    "priority": "high"
  }
}
\`\`\`
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const responseText = response.text();

  try {
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse document creation response:', error);
    throw new Error('Failed to process text into document structure');
  }
}

/**
 * Improve text using AI (for editor)
 */
export async function improveText(
  text: string,
  action: string,
  documentContext: string,
  formatting?: {
    nodeType: string;
    isBlockquote: boolean;
    isHeading: boolean;
    headingLevel: number | null;
    isBulletList: boolean;
    isOrderedList: boolean;
    isCodeBlock: boolean;
    isBold: boolean;
    isItalic: boolean;
    isCode: boolean;
  }
): Promise<{ improvedText: string; explanation?: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',  // Cost-efficient for quick text improvements
    systemInstruction: `You are a professional technical writer helping improve documentation text.
Always preserve the original meaning and tone while making improvements.
Return only the improved text without explanations unless specifically asked.
IMPORTANT: Return PLAIN TEXT only, without any markdown syntax like >, #, *, etc. The formatting will be applied separately.`,
  });

  // Build formatting context message
  let formattingContext = '';
  if (formatting) {
    const formats = [];
    if (formatting.isBlockquote) formats.push('blockquote');
    if (formatting.isHeading) formats.push(`heading level ${formatting.headingLevel}`);
    if (formatting.isBulletList) formats.push('bullet list item');
    if (formatting.isOrderedList) formats.push('ordered list item');
    if (formatting.isCodeBlock) formats.push('code block');
    if (formatting.isBold) formats.push('bold');
    if (formatting.isItalic) formats.push('italic');
    if (formatting.isCode) formats.push('inline code');

    if (formats.length > 0) {
      formattingContext = `\nFormatting context: This text is currently formatted as ${formats.join(', ')}. Return ONLY the improved plain text without any markdown syntax. The formatting will be reapplied automatically.`;
    }
  }

  const actionPrompts: Record<string, string> = {
    refine: `Refine and polish this text to make it more professional and clear while preserving its meaning and length:

${text}
${formattingContext}

Return ONLY the refined plain text, no markdown syntax, no explanations.`,

    shorten: `Make this text more concise and to-the-point while preserving all key information:

${text}
${formattingContext}

Return ONLY the shortened plain text, no markdown syntax, no explanations.`,

    expand: `Expand this text with more detail, examples, and context to make it more comprehensive:

${text}

${documentContext ? `\nDocument context for reference:\n${documentContext.substring(0, 500)}` : ''}
${formattingContext}

Return ONLY the expanded plain text, no markdown syntax, no explanations.`,
  };

  // If it's a custom instruction, use it directly
  const prompt = actionPrompts[action] || `${action}

Text to improve:
${text}

${documentContext ? `\nDocument context:\n${documentContext.substring(0, 500)}` : ''}
${formattingContext}

Return ONLY the improved plain text, no markdown syntax, no explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let improvedText = response.text().trim();

    // Remove any markdown code blocks if present
    const codeBlockMatch = improvedText.match(/```(?:markdown|text|md)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      improvedText = codeBlockMatch[1].trim();
    }

    // Remove quotes if the entire response is quoted
    if (improvedText.startsWith('"') && improvedText.endsWith('"')) {
      improvedText = improvedText.slice(1, -1);
    }

    // Strip any remaining markdown syntax that AI might have added
    // Remove blockquote markers
    improvedText = improvedText.replace(/^>\s*/gm, '');

    // Remove heading markers (# symbols at start of lines)
    improvedText = improvedText.replace(/^#{1,6}\s+/gm, '');

    // Remove list markers at start of lines
    improvedText = improvedText.replace(/^[\*\-\+]\s+/gm, '');
    improvedText = improvedText.replace(/^\d+\.\s+/gm, '');

    return {
      improvedText,
    };
  } catch (error) {
    console.error('Error improving text:', error);
    throw new Error('Failed to improve text');
  }
}
