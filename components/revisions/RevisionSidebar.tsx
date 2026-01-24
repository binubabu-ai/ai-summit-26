'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Revision {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  sourceClient: string | null;
}

interface RevisionSidebarProps {
  documentId: string;
  currentUserId?: string;
}

export function RevisionSidebar({ documentId, currentUserId }: RevisionSidebarProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    fetchRevisions();
  }, [documentId]);

  const fetchRevisions = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileEdit className="w-4 h-4" />;
      case 'proposed':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'conflicted':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileEdit className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'draft':
        return 'neutral';
      case 'proposed':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'conflicted':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const filteredRevisions = revisions.filter(rev => {
    if (filter === 'mine' && currentUserId) {
      return rev.author?.id === currentUserId;
    }
    return true;
  });

  const pendingCount = revisions.filter(r => r.status === 'proposed' || r.status === 'draft').length;

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400 dark:text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-black dark:text-white">Revisions</h3>
          {pendingCount > 0 && (
            <Badge variant="warning" size="sm">
              {pendingCount}
            </Badge>
          )}
        </div>
        {currentUserId && revisions.length > 0 && (
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 rounded p-1">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-neutral-950 text-black dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                filter === 'mine'
                  ? 'bg-white dark:bg-neutral-950 text-black dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Mine
            </button>
          </div>
        )}
      </div>

      {/* Revisions List */}
      {filteredRevisions.length === 0 ? (
        <div className="text-center py-8 px-4">
          <FileEdit className="w-8 h-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            {filter === 'mine' ? 'You have no revisions' : 'No revisions yet'}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
            Create a revision to propose changes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRevisions.map((revision) => (
            <Link
              key={revision.id}
              href={`/revisions/${revision.id}`}
              className="block"
            >
              <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-normal text-black dark:text-white group-hover:underline line-clamp-2 flex-1">
                    {revision.title}
                  </h4>
                  <Badge variant={getStatusVariant(revision.status)} size="sm" className="flex-shrink-0">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(revision.status)}
                      <span className="capitalize">{revision.status}</span>
                    </span>
                  </Badge>
                </div>

                {revision.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                    {revision.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
                  <span>
                    {revision.author?.name || revision.author?.email || 'Unknown'}
                  </span>
                  <span>
                    {new Date(revision.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {revision.sourceClient && revision.sourceClient !== 'web-ui' && (
                  <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-900">
                    <span className="text-xs text-neutral-400 dark:text-neutral-600">
                      via {revision.sourceClient}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {revisions.length > 0 && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
              <div className="text-neutral-500 dark:text-neutral-500">Proposed</div>
              <div className="text-lg font-light text-black dark:text-white">
                {revisions.filter(r => r.status === 'proposed').length}
              </div>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
              <div className="text-neutral-500 dark:text-neutral-500">Approved</div>
              <div className="text-lg font-light text-black dark:text-white">
                {revisions.filter(r => r.status === 'approved').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
