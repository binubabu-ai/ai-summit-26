'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Module {
  id: string;
  moduleKey: string;
  title: string;
  content: string;
  isGrounded: boolean;
  confidenceScore: number;
}

interface ModuleListModalProps {
  documentId: string;
  documentPath: string;
  projectSlug: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ModuleListModal({
  documentId,
  documentPath,
  projectSlug,
  onClose,
  onUpdate,
}: ModuleListModalProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [documentId]);

  const fetchModules = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/knowledge/modules?documentId=${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGrounding = async (moduleId: string, currentState: boolean) => {
    setUpdating(moduleId);
    try {
      const res = await fetch(
        `/api/projects/${projectSlug}/knowledge/modules/${moduleId}/ground`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: currentState ? 'unground' : 'ground',
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setModules(prev =>
          prev.map(m => (m.id === moduleId ? { ...m, isGrounded: data.isGrounded } : m))
        );
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle grounding:', error);
    } finally {
      setUpdating(null);
    }
  };

  const groundedCount = modules.filter(m => m.isGrounded).length;
  const totalCount = modules.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-light text-black dark:text-white mb-2">
              Document Modules
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
              {documentPath}
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                {groundedCount} Grounded
              </Badge>
              <Badge variant="neutral" size="sm" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {totalCount - groundedCount} Ungrounded
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
              Loading modules...
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
              No modules found. Process this document to generate modules.
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, idx) => (
                <div
                  key={module.id}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 bg-neutral-50 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-black dark:text-white mb-1">
                          {module.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={module.isGrounded ? 'success' : 'neutral'}
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            {module.isGrounded ? (
                              <>
                                <Check className="w-3 h-3" />
                                Grounded
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3 h-3" />
                                Ungrounded
                              </>
                            )}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {Math.round(module.confidenceScore * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleToggleGrounding(module.id, module.isGrounded)}
                      variant={module.isGrounded ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={updating === module.id}
                    >
                      {updating === module.id
                        ? 'Updating...'
                        : module.isGrounded
                        ? 'Unground'
                        : 'Ground'}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed pl-10">
                    {module.content.slice(0, 300)}
                    {module.content.length > 300 && '...'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {groundedCount} of {totalCount} modules grounded
          </div>
          <Button onClick={onClose} variant="ghost" size="md">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
