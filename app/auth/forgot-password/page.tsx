'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (sent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sent && countdown === 0) {
      setCanResend(true);
    }
  }, [sent, countdown]);

  const handleSendReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSending(true);
    setError(null);

    try {
      const supabase = createClient();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSent(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setSending(false);
    }
  };

  const handleResend = () => {
    if (canResend) {
      handleSendReset();
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-black dark:text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              We've sent password reset instructions to
            </p>
            <p className="text-black dark:text-white font-medium mt-2">
              {email}
            </p>
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
                    Click the password reset link in the email
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-black dark:text-white">3.</span>
                    Enter your new password
                  </li>
                </ol>
              </div>

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
                  disabled={!canResend || sending}
                  className="w-full bg-black text-white dark:bg-white dark:text-black px-4 py-3 rounded-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader size="sm" />
                      Sending...
                    </>
                  ) : canResend ? (
                    'Resend Reset Email'
                  ) : (
                    `Resend in ${countdown}s`
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-neutral-500 dark:text-neutral-500">
                <p>
                  Remember your password?{' '}
                  <Link href="/auth/login" className="text-black dark:text-white hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
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
            Forgot Password?
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            No worries, we'll send you reset instructions
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-8">
          <form onSubmit={handleSendReset} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black dark:text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="you@example.com"
                required
                disabled={sending}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                Enter the email address associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={sending || !email}
              className="w-full bg-black text-white dark:bg-white dark:text-black px-4 py-3 rounded-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader size="sm" />
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                className="text-black dark:text-white hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
