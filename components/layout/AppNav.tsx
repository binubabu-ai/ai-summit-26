'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export function AppNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-light tracking-tight text-black dark:text-white">
              Docsjays
            </div>
            <Badge size="sm" variant="neutral">Beta</Badge>
          </Link>

          <div className="flex items-center gap-6">
            <ThemeToggle />

            {loading ? (
              <div className="w-20 h-10 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </span>
                <Button onClick={handleSignOut} variant="ghost" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
