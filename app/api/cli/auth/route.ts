import { NextRequest, NextResponse } from 'next/server';
import { sessions } from './shared-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, token, refreshToken, email, userId, expiresAt } = body;

    if (!session || !token) {
      return NextResponse.json(
        { error: 'Missing session or token' },
        { status: 400 }
      );
    }

    // Store session data (including refresh token for long-lived CLI sessions)
    sessions.set(session, {
      status: 'success',
      token,
      refreshToken,
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
