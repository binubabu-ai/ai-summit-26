'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DiffPreview } from '@/components/editor/DiffPreview';
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';

interface RevisionViewProps {
  revision: any;
  userId: string;
}

export function RevisionView({ revision, userId }: RevisionViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this revision? It will become the main version.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/revisions/${revision.id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve revision');
      }

      alert('✅ Revision approved and is now the main version!');
      router.push(`/projects/${revision.document.project.slug}/docs/${revision.document.path}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      console.error('Approve error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Why are you rejecting this revision? (optional)');

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/revisions/${revision.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject revision');
      }

      alert('Revision rejected');
      router.push(`/projects/${revision.document.project.slug}/docs/${revision.document.path}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      console.error('Reject error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (revision.status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm">
            <FileText className="w-4 h-4" />
            Draft
          </span>
        );
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/20 text-success text-sm">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/20 text-danger text-sm">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      case 'conflicted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Conflicted
          </span>
        );
      default:
        return null;
    }
  };

  const canApprove = revision.status === 'proposed' && !revision.hasConflicts;
  const canReject = revision.status === 'proposed' || revision.status === 'draft';

  // Get base content for diff
  const baseContent = revision.document.mainRevision?.content || revision.document.content;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-light text-black dark:text-white">
                {revision.title}
              </h1>
              {getStatusBadge()}
            </div>
            {revision.isMain && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                MAIN VERSION
              </div>
            )}
          </div>
        </div>

        {revision.description && (
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {revision.description}
          </p>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-neutral-500 dark:text-neutral-600 mb-1">Document</div>
            <div className="text-black dark:text-white font-mono">
              {revision.document.path}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 dark:text-neutral-600 mb-1">Author</div>
            <div className="text-black dark:text-white flex items-center gap-2">
              <User className="w-4 h-4" />
              {revision.author?.name || revision.author?.email || 'AI Assistant'}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 dark:text-neutral-600 mb-1">Created</div>
            <div className="text-black dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(revision.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 dark:text-neutral-600 mb-1">Source</div>
            <div className="text-black dark:text-white capitalize">
              {revision.sourceClient || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Warning */}
      {revision.hasConflicts && (
        <div className="border border-yellow-500 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                Conflicts Detected
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {revision.conflictReason || 'This revision has conflicts with the current main version and cannot be approved until rebased.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border border-danger bg-danger/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-danger mb-1">Error</h3>
              <p className="text-sm text-danger">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Diff Preview */}
      {revision.status !== 'approved' && (
        <div>
          <h2 className="text-xl font-light text-black dark:text-white mb-4">
            Proposed Changes
          </h2>
          <DiffPreview
            original={baseContent}
            suggested={revision.content}
            title="Content Changes"
            reasoning={revision.description || revision.title}
            confidence={1.0}
            onApply={canApprove ? handleApprove : () => {}}
            onReject={canReject ? handleReject : () => {}}
            isApplying={loading}
          />
        </div>
      )}

      {/* Action Buttons (if not using diff preview buttons) */}
      {revision.status === 'approved' && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <h3 className="text-lg font-medium text-success mb-2">
            This revision has been approved
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            It is now the main version of the document.
          </p>
          <Button
            onClick={() => router.push(`/projects/${revision.document.project.slug}/docs/${revision.document.path}`)}
            variant="secondary"
          >
            View Document
          </Button>
        </div>
      )}

      {revision.status === 'rejected' && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <h3 className="text-lg font-medium text-danger mb-2">
            This revision has been rejected
          </h3>
          {revision.conflictReason && (
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Reason: {revision.conflictReason}
            </p>
          )}
          <Button
            onClick={() => router.push(`/projects/${revision.document.project.slug}/docs/${revision.document.path}`)}
            variant="ghost"
          >
            Back to Document
          </Button>
        </div>
      )}
    </div>
  );
}
