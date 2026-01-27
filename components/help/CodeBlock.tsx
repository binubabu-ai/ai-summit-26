'use client';

import { Copy } from 'lucide-react';

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b">
        <span className="text-xs font-medium text-muted-foreground">{language}</span>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <pre className="bg-muted p-4 rounded-b-lg overflow-x-auto">
        <code className="text-xs">{code}</code>
      </pre>
    </div>
  );
}
