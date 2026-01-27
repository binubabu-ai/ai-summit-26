import { NextRequest, NextResponse } from 'next/server';
import { sessions } from './shared-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, token, email, userId, expiresAt } = body;

    if (!session || !token) {
      return NextResponse.json(
        { error: 'Missing session or token' },
        { status: 400 }
      );
    }

    // Store session data
    sessions.set(session, {
      status: 'success',
      token,
      email,
      userId,
      expiresAt,
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CLI auth POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
