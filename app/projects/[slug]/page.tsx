'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import DocumentTree from '@/components/documents/DocumentTree';
import { buildDocumentTree, extractFolders, validateDocumentPath } from '@/lib/utils/document-tree';

interface Document {
  id: string;
  path: string;
  updatedAt: string;
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

  // Build tree structure from documents
  const documentTree = useMemo(() => {
    if (!project) return [];
    return buildDocumentTree(project.docs);
  }, [project]);

  // Extract existing folders for suggestions
  const existingFolders = useMemo(() => {
    if (!project) return [];
    return extractFolders(project.docs);
  }, [project]);

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      // First get projects to find the one by slug
      const projectsRes = await fetch('/api/projects');
      const projects = await projectsRes.json();
      const found = projects.find((p: Project) => p.slug === resolvedParams.slug);

      if (found) {
        const res = await fetch(`/api/projects/${found.id}`);
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 px-6 lg:px-16 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-xl font-light text-black dark:text-white">Loading...</div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 px-6 lg:px-16 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-center">
            <h1 className="text-4xl font-light mb-4 text-black dark:text-white">Project Not Found</h1>
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen pt-32 px-6 lg:px-16 pb-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white text-sm">
                ← Back to Projects
              </Link>
              <Link href={`/projects/${project.slug}/settings`}>
                <Button variant="ghost" size="sm">Settings</Button>
              </Link>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-2">
              {project.name}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 font-mono">
              /{project.slug}
            </p>
          </div>

          {/* Documents Section */}
          <Card className="mb-8" variant="default">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-light text-black dark:text-white">Documents</h2>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'secondary' : 'primary'}
                  size="md"
                >
                  {showCreateForm ? 'Cancel' : 'New Document'}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
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
                              className="text-xs px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white rounded hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                            >
                              📁 {folder}/
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

              <DocumentTree nodes={documentTree} projectSlug={project.slug} />
            </CardContent>
          </Card>

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
