import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    // Refresh the session using the refresh token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      console.error('Token refresh failed:', error?.message);
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      );
    }

    // Return new tokens
    return NextResponse.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString()
    });
  } catch (error) {
    console.error('CLI auth refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
