'use client';

import { FileText, Layers, Info, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type ProcessingMode = 'as-is' | 'generate-specs';

interface ProcessingModeSelectorProps {
  selectedMode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

export function ProcessingModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: ProcessingModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        <h3 className="text-lg font-normal text-black dark:text-white">
          How should we process these documents?
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* As-Is Mode */}
        <Card
          className={`
            cursor-pointer transition-all
            ${selectedMode === 'as-is'
              ? 'ring-2 ring-black dark:ring-white shadow-lg'
              : 'hover:shadow-md'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && onModeChange('as-is')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`
                p-3 rounded-lg
                ${selectedMode === 'as-is'
                  ? 'bg-black dark:bg-white'
                  : 'bg-neutral-100 dark:bg-neutral-900'
                }
              `}>
                <FileText className={`w-6 h-6 ${
                  selectedMode === 'as-is'
                    ? 'text-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-black dark:text-white">
                    Add As-Is
                  </h4>
                  {selectedMode === 'as-is' && (
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full" />
                  )}
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Keep documents whole. Faster processing, simpler structure.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Quick to process
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Preserves original structure
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Less granular grounding control
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    Best for: Small docs, reference materials
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Specs Mode */}
        <Card
          className={`
            cursor-pointer transition-all
            ${selectedMode === 'generate-specs'
              ? 'ring-2 ring-black dark:ring-white shadow-lg'
              : 'hover:shadow-md'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && onModeChange('generate-specs')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`
                p-3 rounded-lg
                ${selectedMode === 'generate-specs'
                  ? 'bg-black dark:bg-white'
                  : 'bg-neutral-100 dark:bg-neutral-900'
                }
              `}>
                <Layers className={`w-6 h-6 ${
                  selectedMode === 'generate-specs'
                    ? 'text-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-black dark:text-white">
                    Generate Implementation Specs
                  </h4>
                  {selectedMode === 'generate-specs' && (
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full" />
                  )}
                  <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">
                    Recommended
                  </span>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  AI analyzes source docs and generates tech-specific implementation specs ready for Claude Code/Cursor.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Multiple spec files per source
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Tech stack-specific (Next.js, Prisma, etc.)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Implementation-ready for AI IDEs
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      ~$0.05-0.15 per document (AI analysis + generation)
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    Best for: Product plans, scope docs, requirements
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Mode Info */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {selectedMode === 'as-is' ? (
            <>
              <strong>As-Is mode:</strong> Documents will be uploaded and indexed as complete files.
              Quick processing with no AI generation.
            </>
          ) : (
            <>
              <strong>Generate Specs mode:</strong> AI analyzes your source documents (product plans, scope docs) and generates
              multiple implementation-ready specification files (Next.js specs, Prisma schemas, security constraints, etc.)
              that can be directly used by Claude Code or other AI coding assistants.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
