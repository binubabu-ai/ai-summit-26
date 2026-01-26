'use client';

import { AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConflictCardProps {
  conflict: {
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
  };
  onResolve?: (conflictId: string) => void;
  onDismiss?: (conflictId: string) => void;
}

export function ConflictCard({ conflict, onResolve, onDismiss }: ConflictCardProps) {
  const getSeverityVariant = (severity: string): 'danger' | 'warning' | 'neutral' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🔵';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'content':
        return 'Content Conflict';
      case 'scope':
        return 'Scope Overlap';
      case 'version':
        return 'Version Mismatch';
      case 'dependency':
        return 'Dependency Issue';
      default:
        return type;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Severity Indicator */}
          <div className={`
            p-2 rounded-md flex-shrink-0
            ${conflict.severity === 'critical' || conflict.severity === 'high'
              ? 'bg-danger/10'
              : conflict.severity === 'medium'
              ? 'bg-amber-500/10'
              : 'bg-neutral-100 dark:bg-neutral-900'
            }
          `}>
            <AlertTriangle className={`w-5 h-5 ${
              conflict.severity === 'critical' || conflict.severity === 'high'
                ? 'text-danger'
                : conflict.severity === 'medium'
                ? 'text-amber-500'
                : 'text-neutral-600 dark:text-neutral-400'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">
                  {getSeverityIcon(conflict.severity)}
                </span>

                <Badge variant={getSeverityVariant(conflict.severity)} size="sm">
                  {conflict.severity.toUpperCase()}
                </Badge>

                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getTypeLabel(conflict.conflictType)}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-black dark:text-white mb-3">
              {conflict.description}
            </p>

            {/* Module Info */}
            <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md mb-3">
              <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black dark:text-white truncate">
                  {conflict.module.title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                  {conflict.module.document.path}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                Detected {new Date(conflict.detectedAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(conflict.id)}
                  >
                    Dismiss
                  </Button>
                )}

                {onResolve && (
                  <Button
                    size="sm"
                    onClick={() => onResolve(conflict.id)}
                  >
                    Resolve
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
