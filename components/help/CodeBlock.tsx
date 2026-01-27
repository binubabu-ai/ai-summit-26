'use client';

import { Copy } from 'lucide-react';

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 px-4 py-2 rounded-t-lg border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{language}</span>
        <button
          className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <pre className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-b-lg overflow-x-auto">
        <code className="text-xs text-neutral-700 dark:text-neutral-300">{code}</code>
      </pre>
    </div>
  );
}
