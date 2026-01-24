import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { improveText } from '@/lib/ai/gemini';

/**
 * POST /api/ai/improve-text
 * Improve selected text using AI
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
    const { text, action, documentContext, formatting } = body;

    if (!text || !action) {
      return NextResponse.json(
        { error: 'text and action are required' },
        { status: 400 }
      );
    }

    // Improve the text using AI
    const result = await improveText(text, action, documentContext || '', formatting);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error improving text:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to improve text' },
      { status: 500 }
    );
  }
}
