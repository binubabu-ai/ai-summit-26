'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HealthScore } from '@/components/audit/HealthScore';
import { FindingsList } from '@/components/audit/FindingsList';
import { PageLoader } from '@/components/ui/loader';
import { AuditResult, AuditFinding } from '@/lib/ai/audit';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AuditData extends AuditResult {
  id: string;
  createdAt: Date;
  auditType: string;
}

export default function AuditReportPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const resolvedParams = use(params);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudit();
  }, []);

  const fetchAudit = async () => {
    try {
      const res = await fetch(`/api/audit/${resolvedParams.auditId}`);

      if (res.ok) {
        const data = await res.json();
        setAudit({
          ...data,
          createdAt: new Date(data.createdAt),
          findings: data.findings || [],
        });
      } else {
        console.error('Failed to fetch audit:', await res.text());
      }
    } catch (error) {
      console.error('Failed to fetch audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupFindingsBySeverity = (findings: AuditFinding[]) => {
    return {
      critical: findings.filter(f => f.severity === 'critical'),
      high: findings.filter(f => f.severity === 'high'),
      medium: findings.filter(f => f.severity === 'medium'),
      low: findings.filter(f => f.severity === 'low'),
      info: findings.filter(f => f.severity === 'info'),
    };
  };

  const groupFindingsByCategory = (findings: AuditFinding[]) => {
    const grouped: Record<string, AuditFinding[]> = {};
    findings.forEach(finding => {
      if (!grouped[finding.category]) {
        grouped[finding.category] = [];
      }
      grouped[finding.category].push(finding);
    });
    return grouped;
  };

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <PageLoader />
        </div>
      </>
    );
  }

  if (!audit) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-center">
            <h1 className="text-4xl font-light mb-4 text-black dark:text-white">Audit Not Found</h1>
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const severityGroups = groupFindingsBySeverity(audit.findings);
  const categoryGroups = groupFindingsByCategory(audit.findings);

  return (
    <>
      <AppNav />
      <div className="min-h-screen pt-32 pb-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
          {/* Header */}
          <div className="mb-12">
            <Link href="/dashboard" className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white text-sm mb-4">
              ← Back to Dashboard
            </Link>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-4">
              Audit Report
            </h1>
            <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
              <span>
                <span className="font-medium">Type:</span> {audit.auditType.charAt(0).toUpperCase() + audit.auditType.slice(1)}
              </span>
              <span>
                <span className="font-medium">Date:</span> {audit.createdAt.toLocaleString()}
              </span>
              <span>
                <span className="font-medium">Duration:</span> {(audit.duration / 1000).toFixed(1)}s
              </span>
              <span>
                <span className="font-medium">Model:</span> {audit.aiModel}
              </span>
              <span>
                <span className="font-medium">Cost:</span> ${audit.cost.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <Card className="mb-8 p-8">
            <h2 className="text-3xl font-light text-black dark:text-white mb-6">Executive Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <HealthScore score={audit.healthScore} size="lg" />
              </div>

              <div className="space-y-4">
                {audit.consistencyScore !== undefined && (
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Consistency</div>
                    <div className="text-3xl font-bold text-black dark:text-white">{audit.consistencyScore}%</div>
                  </div>
                )}
                {audit.freshnessScore !== undefined && (
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Freshness</div>
                    <div className="text-3xl font-bold text-black dark:text-white">{audit.freshnessScore}%</div>
                  </div>
                )}
                {audit.qualityScore !== undefined && (
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Quality</div>
                    <div className="text-3xl font-bold text-black dark:text-white">{audit.qualityScore}%</div>
                  </div>
                )}
              </div>
            </div>

            {/* Findings Count */}
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{severityGroups.critical.length}</div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">Critical</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{severityGroups.high.length}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">High</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{severityGroups.medium.length}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Medium</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{severityGroups.low.length}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">Low</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                <div className="text-3xl font-bold text-neutral-600 dark:text-neutral-400">{severityGroups.info.length}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Info</div>
              </div>
            </div>
          </Card>

          {/* Findings by Severity */}
          <Card className="mb-8 p-8">
            <h2 className="text-3xl font-light text-black dark:text-white mb-6">Findings by Severity</h2>

            {severityGroups.critical.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-medium text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Critical ({severityGroups.critical.length})
                </h3>
                <FindingsList findings={severityGroups.critical} maxDisplay={999} />
              </div>
            )}

            {severityGroups.high.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-medium text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  High Priority ({severityGroups.high.length})
                </h3>
                <FindingsList findings={severityGroups.high} maxDisplay={999} />
              </div>
            )}

            {severityGroups.medium.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-medium text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Medium Priority ({severityGroups.medium.length})
                </h3>
                <FindingsList findings={severityGroups.medium} maxDisplay={999} />
              </div>
            )}

            {severityGroups.low.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-medium text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Low Priority ({severityGroups.low.length})
                </h3>
                <FindingsList findings={severityGroups.low} maxDisplay={999} />
              </div>
            )}

            {severityGroups.info.length > 0 && (
              <div>
                <h3 className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Informational ({severityGroups.info.length})
                </h3>
                <FindingsList findings={severityGroups.info} maxDisplay={999} />
              </div>
            )}
          </Card>

          {/* Findings by Category */}
          <Card className="p-8">
            <h2 className="text-3xl font-light text-black dark:text-white mb-6">Findings by Category</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categoryGroups).map(([category, findings]) => (
                <div key={category} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <h3 className="text-lg font-medium text-black dark:text-white mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="text-3xl font-bold text-black dark:text-white">{findings.length}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {findings.filter(f => f.severity === 'critical' || f.severity === 'high').length} high priority
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
