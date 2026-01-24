'use client';

import { useMemo } from 'react';
import { generateDiff, getDiffStats } from '@/lib/diff-engine';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface DiffPreviewProps {
  original: string;
  suggested: string;
  title: string;
  reasoning: string;
  confidence: number;
  onApply: () => void;
  onReject: () => void;
  isApplying?: boolean;
}

export function DiffPreview({
  original,
  suggested,
  title,
  reasoning,
  confidence,
  onApply,
  onReject,
  isApplying = false,
}: DiffPreviewProps) {
  const diff = useMemo(() => generateDiff(original, suggested), [original, suggested]);
  const stats = useMemo(() => getDiffStats(diff), [diff]);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-lg font-normal text-black dark:text-white">{title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Confidence: {Math.round(confidence * 100)}%
            </span>
            <div className="h-2 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          {reasoning}
        </p>
        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-success/20 rounded"></span>
            {stats.linesAdded} added
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-danger/20 rounded"></span>
            {stats.linesRemoved} removed
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-neutral-200 dark:bg-neutral-800 rounded"></span>
            {stats.linesUnchanged} unchanged
          </span>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
        {/* Original */}
        <div className="p-4">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-600 mb-3 uppercase tracking-wider">
            Original
          </div>
          <div className="space-y-1">
            {diff.original.map((line, index) => (
              <div
                key={index}
                className={`font-mono text-xs p-2 rounded ${
                  line.type === 'removed'
                    ? 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger'
                    : line.type === 'added'
                    ? 'opacity-0'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {line.content || '\u00A0'}
              </div>
            ))}
          </div>
        </div>

        {/* Suggested */}
        <div className="p-4">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-600 mb-3 uppercase tracking-wider">
            Suggested
          </div>
          <div className="space-y-1">
            {diff.modified.map((line, index) => (
              <div
                key={index}
                className={`font-mono text-xs p-2 rounded ${
                  line.type === 'added'
                    ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success'
                    : line.type === 'removed'
                    ? 'opacity-0'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {line.content || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Review the changes and apply or reject this suggestion
        </p>
        <div className="flex items-center gap-2">
          <Button
            onClick={onReject}
            variant="ghost"
            size="sm"
            disabled={isApplying}
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={onApply}
            variant="primary"
            size="sm"
            disabled={isApplying}
            loading={isApplying}
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
