'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type AuthStatus = 'checking' | 'unauthenticated' | 'authenticated' | 'success' | 'error';

function Countdown({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s > 0 ? s - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className={seconds < 60 ? 'text-danger' : ''}>
      {minutes}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function CLIAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = searchParams.get('session');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAuth() {
      if (!session) {
        setError('No session ID provided');
        setAuthStatus('error');
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();

        if (supabaseSession) {
          // User is authenticated, send token to API
          setAuthStatus('authenticated');
          await sendTokenToCLI(session, supabaseSession);
        } else {
          // User not authenticated
          setAuthStatus('unauthenticated');
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        setError(err.message || 'Failed to check authentication');
        setAuthStatus('error');
      }
    }

    checkAuth();
  }, [session]);

  async function sendTokenToCLI(sessionId: string, supabaseSession: any) {
    try {
      // Send both access and refresh tokens
      // Access token expires in ~1hr, refresh token lasts much longer
      const response = await fetch('/api/cli/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionId,
          token: supabaseSession.access_token,
          refreshToken: supabaseSession.refresh_token,
          email: supabaseSession.user.email,
          userId: supabaseSession.user.id,
          expiresAt: new Date(supabaseSession.expires_at * 1000).toISOString()
        })
      });

      if (response.ok) {
        setAuthStatus('success');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send token');
        setAuthStatus('error');
      }
    } catch (err: any) {
      console.error('Token send error:', err);
      setError(err.message || 'Failed to send token');
      setAuthStatus('error');
    }
  }

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-light mb-2 text-black dark:text-white">Authentication Error</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Link
            href="/cli/auth"
            className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-light mb-4 text-black dark:text-white">Docjays CLI Authentication</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Sign in to connect your CLI to your Docjays account
          </p>

          <div className="space-y-4">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(`/cli/auth?session=${session}`)}`}
              className="block w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200"
            >
              Sign In
            </Link>

            <Link
              href={`/auth/signup?redirect=${encodeURIComponent(`/cli/auth?session=${session}`)}`}
              className="block w-full px-6 py-3 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Session ID: {session?.substring(0, 8)}...
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Expires in: <Countdown initialSeconds={300} />
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-light mb-2 text-black dark:text-white">Authentication Complete!</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Your CLI is now connected to your Docjays account
            </p>
          </div>

          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6 mb-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              You can safely close this window and return to your terminal.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your CLI session will activate automatically.
            </p>
          </div>

          <button
            onClick={() => window.close()}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function CLIAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-xl font-light text-black dark:text-white">Loading...</div>
      </div>
    }>
      <CLIAuthContent />
    </Suspense>
  );
}
