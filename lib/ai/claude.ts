import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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

export interface ChatResponse {
  message: string;
  suggestions?: SuggestionData[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface SuggestionData {
  type: 'rewrite' | 'addition' | 'deletion' | 'style' | 'clarity';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  confidence: number;
}

// System prompt for document chat
const SYSTEM_PROMPT = `You are an AI documentation assistant for Docjays. Your role is to help users improve their technical documentation.

When helping users:
1. Be specific and actionable
2. Explain your reasoning clearly
3. Suggest concrete improvements
4. Maintain consistent style and tone
5. Consider the broader project context

When suggesting changes:
- Always provide the exact text to change (originalText)
- Show the improved version (suggestedText)
- Explain why the change improves the documentation
- Rate your confidence (0.0-1.0) in the suggestion

Output your suggestions in this JSON format:
{
  "message": "Your response to the user",
  "suggestions": [
    {
      "type": "rewrite|addition|deletion|style|clarity",
      "title": "Brief title",
      "description": "What this improves",
      "originalText": "Exact text from document",
      "suggestedText": "Your improved version",
      "reasoning": "Why this is better",
      "confidence": 0.8
    }
  ]
}

If you're just answering a question without suggesting changes, omit the "suggestions" array.`;

/**
 * Chat with Claude about a document
 */
export async function chatWithDocument(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  const startTime = Date.now();

  // Build context message
  const contextMessage = `
Document: ${context.documentPath}
${context.projectName ? `Project: ${context.projectName}` : ''}

Current content:
\`\`\`markdown
${context.documentContent}
\`\`\`

${context.selectedText ? `Selected text:\n"${context.selectedText}"\n` : ''}
${context.relatedDocs && context.relatedDocs.length > 0 ? `Related documents: ${context.relatedDocs.join(', ')}` : ''}
`;

  // Build messages array
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: contextMessage,
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    });

    const latency = Date.now() - startTime;

    // Extract response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const responseText = content.text;

    // Try to parse as JSON (if it contains suggestions)
    let parsedResponse: { message: string; suggestions?: SuggestionData[] };
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      // If not JSON, treat as plain text message
      parsedResponse = { message: responseText };
    }

    // Calculate cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateCost('claude-opus-4-5', inputTokens, outputTokens);

    return {
      message: parsedResponse.message,
      suggestions: parsedResponse.suggestions,
      usage: {
        inputTokens,
        outputTokens,
        cost,
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Failed to chat with Claude: ${error}`);
  }
}

/**
 * Generate quick suggestions for common improvements
 */
export async function generateQuickSuggestion(
  action: 'concise' | 'clarity' | 'examples' | 'grammar' | 'simplify',
  selectedText: string,
  documentContent: string,
  documentPath: string
): Promise<ChatResponse> {
  const prompts = {
    concise: `Make this text more concise while keeping all important information:\n\n"${selectedText}"`,
    clarity: `Improve the clarity of this text:\n\n"${selectedText}"`,
    examples: `Add concrete examples to this section:\n\n"${selectedText}"`,
    grammar: `Fix any grammar, spelling, or style issues:\n\n"${selectedText}"`,
    simplify: `Simplify this technical content for a broader audience:\n\n"${selectedText}"`,
  };

  return chatWithDocument(
    prompts[action],
    {
      documentPath,
      documentContent,
      selectedText,
    },
    []
  );
}

/**
 * Calculate cost based on model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4-5': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
    'claude-sonnet-4': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
    'claude-haiku': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  };

  const modelPricing = pricing[model] || pricing['claude-opus-4-5'];
  return inputTokens * modelPricing.input + outputTokens * modelPricing.output;
}

/**
 * Analyze document and generate real-time suggestions
 */
export async function analyzeDocument(
  documentContent: string,
  documentPath: string
): Promise<SuggestionData[]> {
  const prompt = `Analyze this document and suggest improvements. Focus on:
1. Missing information or incomplete sections
2. Clarity issues or ambiguous statements
3. Style improvements (passive voice, wordiness)
4. Structural issues

Document: ${documentPath}

Content:
\`\`\`markdown
${documentContent}
\`\`\`

Provide 3-5 specific, actionable suggestions.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-20250305', // Use Haiku for faster, cheaper analysis
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const parsed = JSON.parse(content.text);
    return parsed.suggestions || [];
  } catch {
    return [];
  }
}
