'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import DocumentTree from '@/components/documents/DocumentTree';
import { buildDocumentTree, extractFolders, validateDocumentPath } from '@/lib/utils/document-tree';
import { PageLoader } from '@/components/ui/loader';
import { AuditCard } from '@/components/audit/AuditCard';
import { AuditResult } from '@/lib/ai/audit';
import { Plug, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { UploadWorkflow } from '@/components/knowledge/UploadWorkflow';

interface Document {
  id: string;
  path: string;
  updatedAt: string;
  groundingState: 'ungrounded' | 'grounded' | 'deprecated';
  editorialState: 'draft' | 'review' | 'active' | 'archived';
  _count?: {
    modules: number;
  };
}

interface Project {
  id: string;
  name: string;
  slug: string;
  docs: Document[];
  proposals: any[];
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [docPath, setDocPath] = useState('');
  const [pathError, setPathError] = useState('');
  const [auditData, setAuditData] = useState<(AuditResult & { id: string; createdAt: Date }) | undefined>();
  const [auditLoading, setAuditLoading] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'grounded' | 'ungrounded' | 'conflicts'>('all');
  const [conflictCounts, setConflictCounts] = useState<Record<string, number>>({});
  const [showNewDocMenu, setShowNewDocMenu] = useState(false);
  const [showUploadWorkflow, setShowUploadWorkflow] = useState(false);
  const newDocMenuRef = useRef<HTMLDivElement>(null);

  // Filter documents based on selected filter
  const filteredDocs = useMemo(() => {
    if (!project) return [];

    switch (documentFilter) {
      case 'grounded':
        return project.docs.filter(doc => doc.groundingState === 'grounded');
      case 'ungrounded':
        return project.docs.filter(doc => doc.groundingState === 'ungrounded');
      case 'conflicts':
        return project.docs.filter(doc => conflictCounts[doc.id] > 0);
      default:
        return project.docs;
    }
  }, [project, documentFilter, conflictCounts]);

  // Build tree structure from filtered documents
  const documentTree = useMemo(() => {
    if (!project) return [];
    return buildDocumentTree(filteredDocs, conflictCounts);
  }, [filteredDocs, conflictCounts]);

  // Extract existing folders for suggestions
  const existingFolders = useMemo(() => {
    if (!project) return [];
    return extractFolders(project.docs);
  }, [project]);

  useEffect(() => {
    fetchProject();
    fetchConflictCounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newDocMenuRef.current && !newDocMenuRef.current.contains(event.target as Node)) {
        setShowNewDocMenu(false);
      }
    };

    if (showNewDocMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNewDocMenu]);

  // Fetch latest audit on mount and auto-refresh if stale
  useEffect(() => {
    if (project) {
      fetchLatestAudit();
    }
  }, [project?.id]);

  const isAuditStale = (auditDate: Date): boolean => {
    const now = new Date();
    const diffInHours = (now.getTime() - auditDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > 24;
  };

  const fetchLatestAudit = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/audit/latest?level=project&targetId=${project.id}`);
      if (!response.ok) return;

      const { audit } = await response.json();

      if (audit) {
        const auditWithDate = {
          ...audit,
          createdAt: new Date(audit.createdAt),
        };
        setAuditData(auditWithDate);

        // Auto-run new audit if stale (>24 hours)
        if (isAuditStale(auditWithDate.createdAt)) {
          // Run in background without showing loading state
          runAuditInBackground();
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest audit:', error);
    }
  };

  const runAuditInBackground = async () => {
    if (!project) return;

    try {
      const response = await fetch('/api/audit/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to run audit');
      }

      const result = await response.json();
      setAuditData({
        ...result,
        createdAt: new Date(result.createdAt || Date.now()),
      });
    } catch (error) {
      console.error('Failed to run background audit:', error);
    }
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.slug}?includeGrounding=true`);

      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        console.error('Failed to fetch project:', await res.text());
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConflictCounts = async () => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.slug}/knowledge/conflicts?status=open`);
      if (res.ok) {
        const { conflicts } = await res.json();

        // Build a map of document ID to conflict count
        const counts: Record<string, number> = {};
        for (const conflict of conflicts) {
          const docId = conflict.module?.document?.id;
          if (docId) {
            counts[docId] = (counts[docId] || 0) + 1;
          }
        }
        setConflictCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch conflict counts:', error);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    // Validate path
    const validation = validateDocumentPath(docPath);
    if (!validation.valid) {
      setPathError(validation.error || 'Invalid path');
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: docPath,
          projectId: project.id,
          content: `# ${docPath}\n\nStart writing your documentation here...`,
        }),
      });

      if (res.ok) {
        setDocPath('');
        setPathError('');
        setShowCreateForm(false);
        fetchProject();
      } else {
        const error = await res.json();
        setPathError(error.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      setPathError('Failed to create document');
    }
  };

  const handleRunAudit = async () => {
    if (!project) return;

    setAuditLoading(true);
    try {
      const response = await fetch('/api/audit/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to run audit');
      }

      const result = await response.json();
      setAuditData({
        ...result,
        createdAt: new Date(result.createdAt || Date.now()),
      });
    } catch (error) {
      console.error('Failed to run audit:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
            <PageLoader />
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
            <div className="text-center">
              <h1 className="text-4xl font-light mb-4 text-black dark:text-white">Project Not Found</h1>
              <Link href="/dashboard">
                <Button variant="ghost">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen pt-32 pb-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white text-sm">
                ← Back to Projects
              </Link>
              <div className="flex gap-2">
                <Link href={`/projects/${project.slug}/connect`}>
                  <Button variant="ghost" size="sm">
                    <Plug className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </Link>
                <Link href={`/projects/${project.slug}/settings`}>
                  <Button variant="ghost" size="sm">Settings</Button>
                </Link>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-2">
              {project.name}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 font-mono">
              /{project.slug}
            </p>
          </div>

          {/* Main Layout: Content Left, Audit Right */}
          <div className="flex gap-6 items-start mb-8">
            {/* Left: Documents Section (Larger) */}
            <div className="flex-1 min-w-0">
              <Card variant="default">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-light text-black dark:text-white">Documents</h2>
                <div ref={newDocMenuRef} className="relative">
                  <Button
                    onClick={() => setShowNewDocMenu(!showNewDocMenu)}
                    variant="primary"
                    size="md"
                  >
                    New Document ▾
                  </Button>
                  {showNewDocMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setShowCreateForm(true);
                          setShowNewDocMenu(false);
                          setShowUploadWorkflow(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors first:rounded-t-lg"
                      >
                        <div className="font-medium text-black dark:text-white">Create Empty</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Start with a blank document</div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUploadWorkflow(true);
                          setShowNewDocMenu(false);
                          setShowCreateForm(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors last:rounded-b-lg border-t border-neutral-200 dark:border-neutral-800"
                      >
                        <div className="font-medium text-black dark:text-white">Upload Files</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Import existing documents</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filter Bar */}
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">Filter:</span>
                <button
                  onClick={() => setDocumentFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    documentFilter === 'all'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDocumentFilter('grounded')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    documentFilter === 'grounded'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Grounded
                </button>
                <button
                  onClick={() => setDocumentFilter('ungrounded')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    documentFilter === 'ungrounded'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ungrounded
                </button>
                <button
                  onClick={() => setDocumentFilter('conflicts')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    documentFilter === 'conflicts'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Conflicts
                </button>
              </div>

              {/* Upload Workflow */}
              {showUploadWorkflow && (
                <div className="mb-6">
                  <UploadWorkflow
                    projectSlug={project.slug}
                    onComplete={() => {
                      setShowUploadWorkflow(false);
                      fetchProject();
                      fetchConflictCounts();
                    }}
                  />
                </div>
              )}

              {showCreateForm && (
                <form onSubmit={handleCreateDoc} className="mb-6 p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-light text-black dark:text-white mb-2">
                      Document Path
                    </label>
                    <input
                      type="text"
                      value={docPath}
                      onChange={(e) => {
                        setDocPath(e.target.value);
                        setPathError('');
                      }}
                      className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent ${
                        pathError
                          ? 'border-danger'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                      placeholder="architecture.md or api/auth.md"
                      required
                    />
                    {pathError && (
                      <p className="text-sm text-danger mt-2">{pathError}</p>
                    )}
                    {!pathError && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                        Use .md extension and forward slashes for folders
                      </p>
                    )}
                    {existingFolders.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                          Existing folders:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {existingFolders.map((folder) => (
                            <button
                              key={folder}
                              type="button"
                              onClick={() => setDocPath(`${folder}/`)}
                              className="text-xs px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                            >
                              {folder}/
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button type="submit" variant="primary" size="md">
                    Create Document
                  </Button>
                </form>
              )}

              <DocumentTree
                nodes={documentTree}
                projectSlug={project.slug}
                onUpdate={() => {
                  fetchProject();
                  fetchConflictCounts();
                }}
              />
            </CardContent>
          </Card>
            </div>

            {/* Right: Strategic Audit Sidebar (Smaller) */}
            <div className="w-96 flex-shrink-0 sticky top-32">
              <AuditCard
                level="project"
                auditData={auditData}
                onRefresh={handleRunAudit}
                loading={auditLoading}
              />
            </div>
          </div>

          {/* Proposals Section */}
          {project.proposals.length > 0 && (
            <Card variant="default">
              <CardHeader>
                <h2 className="text-3xl font-light text-black dark:text-white">Open Proposals</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                      <h3 className="font-normal text-black dark:text-white">{proposal.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {proposal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
