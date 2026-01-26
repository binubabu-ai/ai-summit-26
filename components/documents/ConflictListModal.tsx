'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConflictCard } from '@/components/knowledge/ConflictCard';

interface Conflict {
  id: string;
  conflictType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detectedAt: string;
  module: {
    moduleKey: string;
    title: string;
    document: {
      path: string;
    };
  };
}

interface ConflictListModalProps {
  documentId: string;
  documentPath: string;
  projectSlug: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function ConflictListModal({
  documentId,
  documentPath,
  projectSlug,
  onClose,
  onUpdate,
}: ConflictListModalProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchConflicts();
  }, [documentId]);

  const fetchConflicts = async () => {
    try {
      const res = await fetch(
        `/api/projects/${projectSlug}/knowledge/conflicts?status=open&documentId=${documentId}`
      );
      if (res.ok) {
        const data = await res.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string) => {
    setResolving(conflictId);
    try {
      const res = await fetch(
        `/api/projects/${projectSlug}/knowledge/conflicts/${conflictId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resolve',
            resolution: 'manual',
          }),
        }
      );

      if (res.ok) {
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  const handleDismiss = async (conflictId: string) => {
    setResolving(conflictId);
    try {
      const res = await fetch(
        `/api/projects/${projectSlug}/knowledge/conflicts/${conflictId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'dismiss',
          }),
        }
      );

      if (res.ok) {
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to dismiss conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const highCount = conflicts.filter(c => c.severity === 'high').length;
  const mediumCount = conflicts.filter(c => c.severity === 'medium').length;
  const lowCount = conflicts.filter(c => c.severity === 'low').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-light text-black dark:text-white mb-2">
              Document Conflicts
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
              {documentPath}
            </p>
            <div className="flex gap-2 mt-3">
              {criticalCount > 0 && (
                <Badge variant="danger" size="sm">
                  {criticalCount} Critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="danger" size="sm">
                  {highCount} High
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge variant="warning" size="sm">
                  {mediumCount} Medium
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge variant="neutral" size="sm">
                  {lowCount} Low
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
              Loading conflicts...
            </div>
          ) : conflicts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">
                No open conflicts for this document
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={handleResolve}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {conflicts.length} open conflict{conflicts.length !== 1 ? 's' : ''}
          </div>
          <Button onClick={onClose} variant="ghost" size="md">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
