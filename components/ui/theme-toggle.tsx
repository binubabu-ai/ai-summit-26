'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Theme Toggle Component
 * Allows switching between system, light, and dark themes
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <button className="p-2 rounded-md w-9 h-9" disabled>
          <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </button>
      </div>
    );
  }

  const themes = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      {themes.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          onClick={() => setTheme(name)}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            'hover:bg-neutral-200 dark:hover:bg-neutral-700',
            theme === name && 'bg-white dark:bg-neutral-900 shadow-sm'
          )}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
        </button>
      ))}
    </div>
  );
}
