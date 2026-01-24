import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'minimal';
  interactive?: boolean;
}

/**
 * Card Component
 * Minimal, clean card design with subtle styling
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', interactive = false, className, children, ...props }, ref) => {
    const baseStyles = 'rounded-lg transition-all duration-200';

    const variants = {
      default:
        'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800',
      elevated:
        'bg-white dark:bg-neutral-950 shadow-md',
      bordered:
        'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800',
      minimal:
        'bg-neutral-50 dark:bg-neutral-900',
    };

    const interactiveStyles = interactive
      ? 'cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], interactiveStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pb-4', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';
