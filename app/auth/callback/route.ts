import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'email' | 'recovery'
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful verification/reset
      if (type === 'recovery') {
        // Password reset - redirect to reset password page
        return NextResponse.redirect(`${origin}/auth/reset-password?verified=true`);
      }

      // Email verification - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Handle specific errors
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
}
