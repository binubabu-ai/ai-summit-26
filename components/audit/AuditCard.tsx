'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { HealthScore } from './HealthScore';
import { FindingsList } from './FindingsList';
import { Loader } from '@/components/ui/loader';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditResult } from '@/lib/ai/audit';
import Link from 'next/link';

interface AuditCardProps {
  level: 'dashboard' | 'project' | 'document';
  auditData?: AuditResult & { id: string; createdAt: Date };
  onRefresh: () => Promise<void>;
  loading?: boolean;
  initialLoading?: boolean;
}

export function AuditCard({ level, auditData, onRefresh, loading, initialLoading }: AuditCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const levelNames = {
    dashboard: 'Strategic Portfolio Audit',
    project: 'Strategic Project Audit',
    document: 'Strategic Document Audit',
  };

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {levelNames[level]}
          </h3>
          {auditData && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Last audited: {formatTimeAgo(auditData.createdAt)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-2 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh audit"
        >
          {refreshing || loading ? (
            <Loader size="sm" />
          ) : (
            <RefreshCw className="w-5 h-5 text-black dark:text-white" />
          )}
        </button>
      </div>

      {(initialLoading || (loading && !auditData)) ? (
        <div className="space-y-6">
          {/* Health Score Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>

          {/* Findings Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>

          {/* Footer Skeleton */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : auditData ? (
        <div className="space-y-6">
          <HealthScore score={auditData.healthScore} />

          {auditData.consistencyScore !== undefined && (
            <div className="grid grid-cols-2 gap-4">
              {auditData.consistencyScore !== undefined && (
                <div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Consistency</div>
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {auditData.consistencyScore}%
                  </div>
                </div>
              )}
              {auditData.freshnessScore !== undefined && (
                <div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Freshness</div>
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {auditData.freshnessScore}%
                  </div>
                </div>
              )}
            </div>
          )}

          {auditData.findings && auditData.findings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white mb-3">
                Top Issues ({auditData.findings.length})
              </h4>
              <FindingsList findings={auditData.findings} maxDisplay={3} />
            </div>
          )}

          {auditData.id && (
            <Link
              href={`/audit/${auditData.id}`}
              className="block text-sm text-black dark:text-white hover:underline font-medium"
            >
              View Full Report →
            </Link>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-500">
            <span>Duration: {(auditData.duration / 1000).toFixed(1)}s</span>
            <span>Cost: ${auditData.cost.toFixed(4)}</span>
            <span>Model: {auditData.aiModel}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            No audit data available
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Run Audit
          </button>
        </div>
      )}
    </div>
  );
}
