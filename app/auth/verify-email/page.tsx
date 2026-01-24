'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState<string>(emailParam || '');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-check if email is verified every 10 seconds
  useEffect(() => {
    const checkVerification = async () => {
      if (success) return; // Already verified

      setChecking(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.email_confirmed_at) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking verification:', err);
      } finally {
        setChecking(false);
      }
    };

    // Check immediately on mount
    checkVerification();

    // Then check every 10 seconds
    const interval = setInterval(checkVerification, 10000);
    return () => clearInterval(interval);
  }, [success, router]);

  // Get email from current user if not provided via query param
  useEffect(() => {
    if (!email) {
      const getEmail = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      };
      getEmail();
    }
  }, [email]);

  const handleResend = async () => {
    if (!canResend || !email) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email');
      }

      // Reset countdown
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-12">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-20 h-20 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-light text-black dark:text-white mb-3">
              Email Verified!
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
            <Loader size="lg" className="mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Mail className="w-8 h-8 text-white dark:text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-black dark:text-white mb-2">
            Check Your Inbox
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            We've sent a verification email to
          </p>
          {email && (
            <p className="text-black dark:text-white font-medium mt-2">
              {email}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-8">
          <div className="space-y-6">
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-black dark:text-white mb-2">
                Next Steps:
              </h3>
              <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="font-medium text-black dark:text-white">1.</span>
                  Check your email inbox (and spam folder)
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-black dark:text-white">2.</span>
                  Click the verification link in the email
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-black dark:text-white">3.</span>
                  You'll be automatically redirected to your dashboard
                </li>
              </ol>
            </div>

            {checking && (
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Loader size="sm" />
                <span>Checking verification status...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                Didn't receive the email?
              </p>
              <button
                onClick={handleResend}
                disabled={!canResend || sending || !email}
                className="w-full bg-black text-white dark:bg-white dark:text-black px-4 py-3 rounded-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader size="sm" />
                    Sending...
                  </>
                ) : canResend ? (
                  'Resend Verification Email'
                ) : (
                  `Resend in ${countdown}s`
                )}
              </button>
            </div>

            <div className="text-center text-sm text-neutral-500 dark:text-neutral-500">
              <p>Still having trouble?</p>
              <p className="mt-1">
                Make sure to check your spam folder or{' '}
                <a href="mailto:support@docjays.com" className="text-black dark:text-white hover:underline">
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader size="lg" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
