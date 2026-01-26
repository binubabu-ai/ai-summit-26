'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, AlertTriangle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { AddMemberDialog } from '@/components/team/AddMemberDialog';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface TeamMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  lastAccessAt?: string;
  user: User;
  inviter?: {
    id: string;
    name?: string;
    email: string;
  } | null;
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Team management state
  const [activeTab, setActiveTab] = useState<'team' | 'danger'>('team');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  // Delete confirmation state
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjectAndKeys();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchProjectAndKeys = async () => {
    try {
      // Get project
      const projectsRes = await fetch('/api/projects');
      const projects = await projectsRes.json();
      const found = projects.find((p: Project) => p.slug === resolvedParams.slug);

      if (found) {
        setProject(found);

        // Get team members
        await fetchTeamMembers();
      }
    } catch (error) {
      console.error('Failed to fetch project and keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.slug}/team`);
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
        setCurrentUserRole(data.currentUserRole || null);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project?.name) {
      alert('Project name does not match');
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/projects/${project.slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setDeleting(false);
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
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-4 text-sm"
            >
              ← Back to Project
            </Link>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-2">
              Project Settings
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {project.name}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-4 px-2 text-lg font-light transition-colors relative ${
                activeTab === 'team'
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 inline-block mr-2 mb-1" />
              Team
              {activeTab === 'team' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
            {currentUserRole === 'OWNER' && (
              <button
                onClick={() => setActiveTab('danger')}
                className={`pb-4 px-2 text-lg font-light transition-colors relative ${
                  activeTab === 'danger'
                    ? 'text-danger'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-danger'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2 mb-1" />
                Danger Zone
                {activeTab === 'danger' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-danger" />
                )}
              </button>
            )}
          </div>

          {/* Team Tab */}
          {activeTab === 'team' && (
            <>
              <Card variant="default">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                        Team Members
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Manage who has access to this project
                      </p>
                    </div>
                    {currentUserRole === 'OWNER' && (
                      <Button
                        onClick={() => setShowAddMemberDialog(true)}
                        variant="primary"
                        size="md"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <TeamMembersList
                    members={teamMembers}
                    currentUserId={currentUserId || ''}
                    currentUserRole={currentUserRole || 'VIEWER'}
                    projectSlug={project.slug}
                    onMemberUpdated={fetchTeamMembers}
                  />
                </CardContent>
              </Card>

              {/* Role Descriptions */}
              <Card variant="default" className="mt-6">
                <CardHeader>
                  <h3 className="text-xl font-light text-black dark:text-white">
                    Role Permissions
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" size="sm">OWNER</Badge>
                        <span className="text-sm font-normal text-black dark:text-white">Full access</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        Can manage team, create/edit/delete documents, manage API keys, and delete project
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success" size="sm">EDITOR</Badge>
                        <span className="text-sm font-normal text-black dark:text-white">Can edit</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        Can create and edit documents, but cannot manage team or settings
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="neutral" size="sm">VIEWER</Badge>
                        <span className="text-sm font-normal text-black dark:text-white">Read-only</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                        Can only view documents, cannot make any changes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && currentUserRole === 'OWNER' && (
            <>
              <Card variant="default" className="border-2 border-danger">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-danger" />
                    <div>
                      <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                        Danger Zone
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Irreversible and destructive actions
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="p-6 bg-danger/5 border border-danger/20 rounded-lg">
                    <h3 className="text-xl font-normal text-black dark:text-white mb-2">
                      Delete this project
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      Once you delete a project, there is no going back. This will permanently delete:
                    </p>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 space-y-2 ml-5 list-disc">
                      <li>All documents and their content</li>
                      <li>All revisions and version history</li>
                      <li>All proposals and changes</li>
                      <li>All team members and permissions</li>
                      <li>All API keys</li>
                      <li>All audit logs</li>
                    </ul>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="danger"
                      size="md"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4" variant="default">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-danger" />
                <h2 className="text-2xl font-light text-black dark:text-white">
                  Delete Project
                </h2>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This action cannot be undone. This will permanently delete the project and all its data.
              </p>
            </CardHeader>

            <CardContent>
              <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-sm text-danger font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warning: This action is irreversible
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-normal text-black dark:text-white mb-2">
                  Type <span className="font-mono font-bold">{project.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-danger focus:border-transparent border-neutral-200 dark:border-neutral-800"
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText('');
                  }}
                  variant="secondary"
                  size="md"
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  variant="danger"
                  size="md"
                  disabled={deleting || deleteConfirmText !== project.name}
                  className="flex-1"
                >
                  {deleting ? 'Deleting...' : 'Delete Project'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Dialog */}
      {project && (
        <AddMemberDialog
          projectSlug={project.slug}
          projectId={project.id}
          isOpen={showAddMemberDialog}
          onClose={() => setShowAddMemberDialog(false)}
          onMemberAdded={fetchTeamMembers}
        />
      )}
    </>
  );
}
