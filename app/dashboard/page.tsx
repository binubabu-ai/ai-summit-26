'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, GitBranch, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loader';
import { AuditCard } from '@/components/audit/AuditCard';
import { AuditResult } from '@/lib/ai/audit';

interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: {
    docs: number;
    proposals: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [creating, setCreating] = useState(false);
  const [auditData, setAuditData] = useState<(AuditResult & { id: string; createdAt: Date }) | undefined>();
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProjects();
  }, []);

  // Fetch latest audit on mount and auto-refresh if stale
  useEffect(() => {
    if (user && projects.length > 0) {
      fetchLatestAudit();
    }
  }, [user, projects.length]);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setLoadingAuth(false);
    }
  };

  const isAuditStale = (auditDate: Date): boolean => {
    const now = new Date();
    const diffInHours = (now.getTime() - auditDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > 24;
  };

  const fetchLatestAudit = async () => {
    try {
      const response = await fetch('/api/audit/latest?level=dashboard');
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
    if (!user) return;

    try {
      const response = await fetch('/api/audit/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newProject = await res.json();
        setFormData({ name: '', slug: '' });
        setShowCreateForm(false);
        // Redirect to the new project
        router.push(`/projects/${newProject.slug}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleRunAudit = async () => {
    if (!user) return;

    setAuditLoading(true);
    try {
      const response = await fetch('/api/audit/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-2xl font-light tracking-tight text-black dark:text-white">
                Docjays
              </div>
              <Badge size="sm" variant="neutral">Beta</Badge>
            </Link>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              {loadingAuth ? (
                <div className="w-20 h-10 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium text-black dark:text-white">
                      {user.user_metadata?.name || user.email}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500">
                      {user.email}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-16 pt-32 pb-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-4">
            Projects
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light max-w-2xl">
            AI-Native documentation with conflict detection, freshness tracking, and version control
          </p>
        </div>

        {/* Audit Card */}
        {user && projects.length > 0 && (
          <div className="mb-8">
            <AuditCard
              level="dashboard"
              auditData={auditData}
              onRefresh={handleRunAudit}
              loading={auditLoading}
            />
          </div>
        )}

        {/* Create Project Button */}
        {user && (
          <div className="mb-8">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              icon={!showCreateForm ? <Plus className="w-4 h-4" /> : undefined}
            >
              {showCreateForm ? 'Cancel' : 'New Project'}
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6">
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  placeholder="My Documentation Project"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  placeholder="my-documentation-project"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
                <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={creating || !formData.name || !formData.slug}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <PageLoader />
          </div>
        ) : !user ? (
          <Card className="p-12 text-center">
            <h3 className="text-2xl font-light text-black dark:text-white mb-4">
              Sign in to manage projects
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6">
              Create an account to start building your AI-native documentation
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
              </div>
              <h3 className="text-2xl font-light text-black dark:text-white mb-4">
                No projects yet
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6">
                Create your first project to start managing documentation with AI-powered governance
              </p>
              <Button onClick={() => setShowCreateForm(true)} icon={<Plus className="w-4 h-4" />}>
                Create Project
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card interactive className="p-6 h-full">
                  <h3 className="text-xl font-normal text-black dark:text-white mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                    /{project.slug}
                  </p>
                  {project._count && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <FileText className="w-4 h-4" />
                        <span>{project._count.docs} docs</span>
                      </div>
                      {project._count.proposals > 0 && (
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <GitBranch className="w-4 h-4" />
                          <span>{project._count.proposals} proposals</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
