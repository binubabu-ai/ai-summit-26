'use client';

import { ReactNode } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  badge?: boolean;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  badge = false,
  className = '',
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group fixed bottom-6 right-6 z-30
        flex items-center gap-3
        bg-black dark:bg-white text-white dark:text-black
        rounded-full shadow-lg
        transition-all duration-200
        hover:shadow-xl hover:scale-105
        active:scale-95
        ${className}
      `}
      title={label}
    >
      <div className="relative flex items-center justify-center w-14 h-14">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
        )}
      </div>

      {label && (
        <span className="pr-4 font-medium text-sm whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs transition-all duration-200 overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}
