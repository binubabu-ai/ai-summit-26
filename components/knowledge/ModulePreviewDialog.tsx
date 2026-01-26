'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Edit2, Trash2, Merge, Split } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Module {
  moduleKey: string;
  title: string;
  description: string;
  content: string;
  startLine: number;
  endLine: number;
  order: number;
  tags: string[];
  estimatedTokens: number;
}

interface ModulePreviewDialogProps {
  documentPath: string;
  modules: Module[];
  onApprove: (modules: Module[]) => void;
  onCancel: () => void;
}

export function ModulePreviewDialog({
  documentPath,
  modules: initialModules,
  onApprove,
  onCancel,
}: ModulePreviewDialogProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  const toggleExpanded = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSelected = (moduleKey: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleKey)) {
      newSelected.delete(moduleKey);
    } else {
      newSelected.add(moduleKey);
    }
    setSelectedModules(newSelected);
  };

  const handleMergeSelected = () => {
    if (selectedModules.size < 2) return;

    const toMerge = modules
      .filter(m => selectedModules.has(m.moduleKey))
      .sort((a, b) => a.order - b.order);

    const mergedModule: Module = {
      ...toMerge[0],
      title: `${toMerge[0].title} (merged)`,
      description: `Merged module containing: ${toMerge.map(m => m.title).join(', ')}`,
      content: toMerge.map(m => m.content).join('\n\n'),
      endLine: toMerge[toMerge.length - 1].endLine,
      tags: Array.from(new Set(toMerge.flatMap(m => m.tags))),
      estimatedTokens: toMerge.reduce((sum, m) => sum + m.estimatedTokens, 0),
    };

    const newModules = modules
      .filter(m => !selectedModules.has(m.moduleKey))
      .concat(mergedModule)
      .sort((a, b) => a.order - b.order)
      .map((m, idx) => ({ ...m, order: idx }));

    setModules(newModules);
    setSelectedModules(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedModules.size === 0) return;

    const newModules = modules
      .filter(m => !selectedModules.has(m.moduleKey))
      .sort((a, b) => a.order - b.order)
      .map((m, idx) => ({ ...m, order: idx }));

    setModules(newModules);
    setSelectedModules(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-light text-black dark:text-white mb-2">
                Review Module Breakdown
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {documentPath}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                AI detected {modules.length} semantic modules. Review and adjust as needed.
              </p>
            </div>

            <button
              onClick={onCancel}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Actions Bar */}
          {selectedModules.size > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-md">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedModules.size} selected
              </span>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMergeSelected}
                disabled={selectedModules.size < 2}
              >
                <Merge className="w-4 h-4 mr-2" />
                Merge
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModules(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {modules.map((module, idx) => (
              <Card
                key={module.moduleKey}
                className={`transition-all ${
                  selectedModules.has(module.moduleKey)
                    ? 'ring-2 ring-black dark:ring-white'
                    : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedModules.has(module.moduleKey)}
                      onChange={() => toggleSelected(module.moduleKey)}
                      className="mt-1 w-4 h-4 rounded border-neutral-300 dark:border-neutral-700"
                    />

                    {/* Module Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Module Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-black dark:text-white truncate">
                            {module.title}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            Lines {module.startLine}-{module.endLine} • {module.estimatedTokens} tokens
                          </p>
                        </div>

                        <button
                          onClick={() => toggleExpanded(module.moduleKey)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-md transition-colors"
                        >
                          {expandedModules.has(module.moduleKey) ? (
                            <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {module.description}
                      </p>

                      {/* Tags */}
                      {module.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {module.tags.map((tag, tagIdx) => (
                            <Badge key={tagIdx} variant="neutral" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Expanded Content */}
                      {expandedModules.has(module.moduleKey) && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
                              {module.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'} •
              Total: {modules.reduce((sum, m) => sum + m.estimatedTokens, 0)} tokens
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>

              <Button onClick={() => onApprove(modules)}>
                Approve & Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
