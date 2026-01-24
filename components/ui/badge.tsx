import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge Component
 * Minimal badge design for status indicators and labels
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full transition-colors';

    const variants = {
      default:
        'bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100',
      success:
        'bg-success/10 text-success dark:bg-success/10 dark:text-success',
      warning:
        'bg-warning/10 text-warning dark:bg-warning/10 dark:text-warning',
      danger:
        'bg-danger/10 text-danger dark:bg-danger/10 dark:text-danger',
      neutral:
        'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
