import { NextRequest, NextResponse } from 'next/server';

// Import sessions from parent route (shared storage)
// In production, use Redis/Vercel KV
import { sessions } from '../shared-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  try {
    const { session } = await params;

    // Get session data
    const data = sessions.get(session);

    if (!data) {
      // Session not found - still waiting
      return NextResponse.json({ status: 'waiting' });
    }

    // Delete session after retrieval (one-time use)
    sessions.delete(session);

    return NextResponse.json(data);
  } catch (error) {
    console.error('CLI auth GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel authentication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  try {
    const { session } = await params;

    sessions.set(session, {
      status: 'cancelled',
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
