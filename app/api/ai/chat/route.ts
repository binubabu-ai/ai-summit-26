import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { chatWithDocument, generateQuickSuggestion } from '@/lib/ai/gemini';

/**
 * POST /api/ai/chat
 * Chat with AI about a document
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      documentId,
      message,
      quickAction, // Optional: "concise", "clarity", "examples", "grammar", "simplify"
      selectedText,
    } = body;

    if (!documentId || !message) {
      return NextResponse.json(
        { error: 'documentId and message are required' },
        { status: 400 }
      );
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify user has access to this project
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: document.projectId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: { userId: user.id },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this document' },
        { status: 403 }
      );
    }

    // Get conversation history
    const recentMessages = await prisma.chatMessage.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 messages for context
    });

    const conversationHistory = recentMessages.reverse().map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Call Gemini API
    let response;
    if (quickAction && selectedText) {
      response = await generateQuickSuggestion(
        selectedText,
        quickAction,
        document.content
      );
    } else {
      response = await chatWithDocument(
        message,
        {
          documentPath: document.path,
          documentContent: document.content,
          selectedText,
          projectName: document.project.name,
        },
        conversationHistory,
        quickAction
      );
    }

    // Store user message
    await prisma.chatMessage.create({
      data: {
        documentId,
        role: 'user',
        content: message,
      },
    });

    // Store AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        documentId,
        role: 'assistant',
        content: response.message,
        suggestions: response.suggestions || [],
      },
    });

    // Store suggestions if any
    if (response.suggestions && response.suggestions.length > 0) {
      await prisma.suggestion.createMany({
        data: response.suggestions.map((sug) => ({
          documentId,
          chatMessageId: aiMessage.id,
          type: sug.type,
          title: sug.title,
          description: sug.description,
          originalText: sug.originalText,
          suggestedText: sug.suggestedText,
          reasoning: sug.reasoning,
          confidence: sug.confidence,
        })),
      });
    }

    // Track AI usage
    await prisma.aiUsage.create({
      data: {
        userId: user.id,
        projectId: document.projectId,
        documentId,
        operation: quickAction ? 'quick_suggestion' : 'chat',
        model: 'claude-opus-4-5',
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cost: response.usage.cost,
      },
    });

    return NextResponse.json({
      message: response.message,
      suggestions: response.suggestions,
      messageId: aiMessage.id,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Track failed usage
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await prisma.aiUsage.create({
          data: {
            userId: user.id,
            operation: 'chat',
            model: 'claude-opus-4-5',
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            success: false,
            errorMessage: String(error),
          },
        });
      }
    } catch (trackError) {
      console.error('Failed to track error:', trackError);
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/chat?documentId=xxx
 * Get chat history for a document
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
