'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, FileEdit, Loader2, AlertCircle } from 'lucide-react';

interface CreateRevisionDialogProps {
  documentId: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (revisionId: string) => void;
}

export function CreateRevisionDialog({
  documentId,
  content,
  isOpen,
  onClose,
  onSuccess,
}: CreateRevisionDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'proposed'>('proposed');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/revisions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          content,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          sourceClient: 'web-ui',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.revision.id);
        // Reset form
        setTitle('');
        setDescription('');
        setStatus('proposed');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create revision');
      }
    } catch (err) {
      console.error('Failed to create revision:', err);
      setError('Failed to create revision');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileEdit className="w-6 h-6 text-black dark:text-white" />
              <div>
                <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                  Create Revision
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Save current changes as a revision for review
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" disabled={creating}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-danger font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-normal text-black dark:text-white mb-2">
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent border-neutral-200 dark:border-neutral-800"
                placeholder="Fix authentication section"
                autoFocus
                disabled={creating}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                Brief summary of what changed
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-normal text-black dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent border-neutral-200 dark:border-neutral-800 resize-none"
                placeholder="Why are these changes needed? What problem does this solve?"
                disabled={creating}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                Optional: Explain the rationale for this change
              </p>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-normal text-black dark:text-white mb-3">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('proposed')}
                  disabled={creating}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    status === 'proposed'
                      ? 'border-black dark:border-white bg-white dark:bg-neutral-950 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-normal text-black dark:text-white">Proposed</span>
                    <Badge variant="success" size="sm">Recommended</Badge>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Ready for review and approval by team
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  disabled={creating}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    status === 'draft'
                      ? 'border-black dark:border-white bg-white dark:bg-neutral-950 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-normal text-black dark:text-white">Draft</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Save for later, not ready for review yet
                  </p>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                💡 <strong>Tip:</strong> {status === 'proposed'
                  ? 'Proposed revisions can be reviewed and approved by team members with appropriate permissions.'
                  : 'Draft revisions are only visible to you. You can propose them later when ready.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="secondary"
                size="md"
                disabled={creating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                variant="primary"
                size="md"
                disabled={creating || !title.trim()}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileEdit className="w-4 h-4 mr-2" />
                    Create Revision
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
