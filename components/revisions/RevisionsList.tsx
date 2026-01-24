'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Revision {
  id: string;
  title: string;
  description?: string;
  status: string;
  isMain: boolean;
  hasConflicts: boolean;
  author: {
    name?: string;
    email?: string;
  } | null;
  createdAt: string;
  proposedAt?: string;
  approvedAt?: string;
}

interface RevisionsListProps {
  documentId: string;
}

export function RevisionsList({ documentId }: RevisionsListProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRevisions();
  }, [documentId]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/revisions`);

      if (!res.ok) {
        throw new Error('Failed to load revisions');
      }

      const data = await res.json();
      setRevisions(data.revisions);
    } catch (err: any) {
      setError(err.message);
      console.error('Load revisions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-neutral-400" />;
      case 'proposed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-danger" />;
      case 'conflicted':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'proposed':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'conflicted':
        return 'Conflicted';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-danger p-4">
        Error loading revisions: {error}
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-600 p-4 text-center">
        No revisions yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 px-3 mb-3">
        Revisions ({revisions.length})
      </h3>
      <div className="space-y-1">
        {revisions.map((revision) => (
          <Link
            key={revision.id}
            href={`/revisions/${revision.id}`}
            className="block p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(revision.status)}
                <span className="text-sm text-black dark:text-white font-medium truncate">
                  {revision.title}
                </span>
                {revision.isMain && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black font-medium">
                    MAIN
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-600">
              <span className="capitalize">{getStatusLabel(revision.status)}</span>
              <span>•</span>
              <span>{revision.author?.name || revision.author?.email || 'AI'}</span>
              <span>•</span>
              <span>{new Date(revision.createdAt).toLocaleDateString()}</span>
            </div>

            {revision.hasConflicts && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                <span>Has conflicts</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
