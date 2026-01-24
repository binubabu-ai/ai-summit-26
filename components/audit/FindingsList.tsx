'use client';

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { AuditFinding } from '@/lib/ai/audit';

interface FindingsListProps {
  findings: AuditFinding[];
  maxDisplay?: number;
}

export function FindingsList({ findings, maxDisplay = 5 }: FindingsListProps) {
  const displayedFindings = findings.slice(0, maxDisplay);
  const remainingCount = findings.length - maxDisplay;

  const getSeverityIcon = (severity: AuditFinding['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getSeverityColor = (severity: AuditFinding['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
      case 'info':
        return 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800';
    }
  };

  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">No issues found</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedFindings.map((finding) => (
        <div
          key={finding.id}
          className={`p-3 border rounded-lg ${getSeverityColor(finding.severity)}`}
        >
          <div className="flex items-start gap-3">
            {getSeverityIcon(finding.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-black dark:text-white">{finding.title}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {finding.category}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {finding.description}
              </p>
              {finding.location && (
                <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                  {finding.location.documentPath && (
                    <span>{finding.location.documentPath}</span>
                  )}
                  {finding.location.lineNumber && (
                    <span>:line {finding.location.lineNumber}</span>
                  )}
                  {finding.location.section && (
                    <span> • Section: {finding.location.section}</span>
                  )}
                </div>
              )}
              {finding.suggestion && (
                <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium">Suggestion:</span> {finding.suggestion}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center pt-2">
          +{remainingCount} more {remainingCount === 1 ? 'finding' : 'findings'}
        </div>
      )}
    </div>
  );
}
