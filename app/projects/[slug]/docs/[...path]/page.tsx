'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { DocChat } from '@/components/editor/DocChat';
import { CreateRevisionDialog } from '@/components/revisions/CreateRevisionDialog';
import { RevisionSidebar } from '@/components/revisions/RevisionSidebar';
import { getFolderPath, getFileName } from '@/lib/utils/document-tree';
import { FileEdit } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';

interface Document {
  id: string;
  path: string;
  content: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  versions: Array<{
    id: string;
    authorId: string | null;
    authorType: string;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
}

export default function DocumentEditorPage({
  params,
}: {
  params: Promise<{ slug: string; path: string[] }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Build breadcrumb from path
  const breadcrumb = useMemo(() => {
    if (!document) return [];
    const parts = document.path.split('/');
    const crumbs: Array<{ name: string; path: string }> = [];

    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      crumbs.push({
        name: parts[i],
        path: currentPath,
      });
    }

    return crumbs;
  }, [document]);

  useEffect(() => {
    fetchDocument();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const user = await res.json();
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchDocument = async () => {
    try {
      const docPath = resolvedParams.path.join('/');

      // Get all projects to find the one by slug
      const projectsRes = await fetch('/api/projects');
      const projects = await projectsRes.json();
      const project = projects.find((p: any) => p.slug === resolvedParams.slug);

      if (!project) {
        setLoading(false);
        return;
      }

      // Get documents for the project
      const docsRes = await fetch(`/api/documents?projectId=${project.id}`);
      const docs = await docsRes.json();
      const doc = docs.find((d: any) => d.path === docPath);

      if (!doc) {
        setLoading(false);
        return;
      }

      // Get full document details
      const docRes = await fetch(`/api/documents/${doc.id}`);
      const fullDoc = await docRes.json();

      // Ensure project info is attached (fallback if API doesn't include it)
      if (!fullDoc.project) {
        fullDoc.project = {
          id: project.id,
          name: project.name,
          slug: project.slug,
        };
      }

      setDocument(fullDoc);
      setCurrentContent(fullDoc.content);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (content: string) => {
    if (!document) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDocument(updated);
        setCurrentContent(updated.content);
        alert('Document saved successfully!');
      } else {
        alert('Failed to save document');
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document');
    } finally {
      setSaving(false);
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

  if (!document || !document.project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
            <div className="text-center">
              <h1 className="text-4xl font-light mb-4 text-black dark:text-white">Document Not Found</h1>
              <Link href={`/projects/${resolvedParams.slug}`}>
                <Button variant="ghost">← Back to Project</Button>
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
      <div className="min-h-screen pt-24 bg-neutral-50 dark:bg-neutral-950">
        {/* Header/Breadcrumb */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Link
                  href={`/projects/${document.project.slug}`}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-3 inline-block text-sm"
                >
                  ← Back to {document.project.name}
                </Link>

                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  <Link
                    href={`/projects/${document.project.slug}`}
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {document.project.name}
                  </Link>
                  {breadcrumb.map((crumb) => (
                    <span key={crumb.path} className="flex items-center gap-2">
                      <span>/</span>
                      <span>📁 {crumb.name}</span>
                    </span>
                  ))}
                  {breadcrumb.length > 0 && <span>/</span>}
                  <span className="text-black dark:text-white">
                    📄 {getFileName(document.path)}
                  </span>
                </div>

                <h1 className="text-3xl font-light text-black dark:text-white">
                  {getFileName(document.path)}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {saving && (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 animate-pulse">
                    Saving...
                  </span>
                )}
                <Button
                  onClick={() => setShowRevisionDialog(true)}
                  variant="secondary"
                  size="sm"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Create Revision
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-180px)]">
          {/* Left: Metadata Sidebar */}
          <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 p-6 space-y-6 overflow-y-auto">
            {/* Revisions */}
            <RevisionSidebar documentId={document.id} currentUserId={currentUserId} />

            {/* Document Info */}
            <Card variant="default">
              <CardHeader>
                <h3 className="text-lg font-light text-black dark:text-white">Info</h3>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-neutral-600 dark:text-neutral-400 mb-1">Project</dt>
                    <dd className="font-normal text-black dark:text-white">{document.project.name}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-600 dark:text-neutral-400 mb-1">Path</dt>
                    <dd className="font-mono text-xs text-black dark:text-white">{document.path}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Center: Editor */}
          <div className="flex-1 p-6 overflow-y-auto">
            <TiptapEditor
              initialContent={currentContent}
              onChange={setCurrentContent}
              onSave={handleSave}
            />
          </div>

          {/* Right: AI Chat */}
          <div className="w-96">
            <DocChat
              documentId={document.id}
              documentContent={currentContent}
              onApplySuggestion={(newContent) => {
                setCurrentContent(newContent);
                handleSave(newContent);
              }}
            />
          </div>
        </div>

        {/* Create Revision Dialog */}
        <CreateRevisionDialog
          documentId={document.id}
          content={currentContent}
          isOpen={showRevisionDialog}
          onClose={() => setShowRevisionDialog(false)}
          onSuccess={(revisionId) => {
            setShowRevisionDialog(false);
            router.push(`/revisions/${revisionId}`);
          }}
        />
      </div>
    </>
  );
}
