'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  requestCount: number;
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchProjectAndKeys();
  }, []);

  const fetchProjectAndKeys = async () => {
    try {
      // Get project
      const projectsRes = await fetch('/api/projects');
      const projects = await projectsRes.json();
      const found = projects.find((p: Project) => p.slug === resolvedParams.slug);

      if (found) {
        const projectRes = await fetch(`/api/projects/${found.id}`);
        const projectData = await projectRes.json();
        setProject(projectData);

        // Get API keys
        const keysRes = await fetch(`/api/projects/${found.id}/api-keys`);
        const keysData = await keysRes.json();
        setApiKeys(keysData);
      }
    } catch (error) {
      console.error('Failed to fetch project and keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newKeyName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key); // Show the key once
        setNewKeyName('');
        setShowCreateForm(false);
        fetchProjectAndKeys();
      } else {
        alert('Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!project) return;
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProjectAndKeys();
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchProjectAndKeys();
      } else {
        alert('Failed to update API key');
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 px-6 lg:px-12 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-xl font-light text-black dark:text-white">Loading...</div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 px-6 lg:px-12 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
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
      <div className="min-h-screen pt-32 px-6 lg:px-12 pb-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto">
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

          {/* New Key Success Modal */}
          {newKey && (
            <Card className="mb-8 border-2 border-black dark:border-white" variant="default">
              <CardHeader>
                <h2 className="text-2xl font-light text-black dark:text-white">API Key Created!</h2>
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg font-mono text-sm mb-4 break-all">
                  {showKey ? newKey : '••••••••••••••••••••••••••••••••••••••••'}
                </div>
                <div className="flex gap-3 mb-4">
                  <Button onClick={() => copyToClipboard(newKey)} size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Key
                  </Button>
                  <Button onClick={() => setShowKey(!showKey)} variant="ghost" size="sm">
                    {showKey ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <p className="text-sm text-danger mb-2">
                  ⚠️ Save this key now! You won't be able to see it again.
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Add this key to your IDE configuration. See{' '}
                  <Link href="/docs/mcp-integration" className="underline">
                    integration guide
                  </Link>
                  .
                </p>
                <div className="mt-4">
                  <Button onClick={() => setNewKey(null)} variant="secondary" size="sm">
                    I've Saved My Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys Section */}
          <Card className="mb-8" variant="default">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                    MCP API Keys
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Connect AI assistants (Claude Desktop, Cursor, Windsurf) to this project
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant={showCreateForm ? 'secondary' : 'primary'}
                  size="md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showCreateForm ? 'Cancel' : 'Generate New Key'}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Create Form */}
              {showCreateForm && (
                <form onSubmit={handleCreateKey} className="mb-6 p-6 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-light text-black dark:text-white mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent border-neutral-200 dark:border-neutral-800"
                      placeholder="Claude Desktop, Cursor, Production Server, etc."
                      required
                    />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                      Give this key a descriptive name to remember where it's used
                    </p>
                  </div>
                  <Button type="submit" variant="primary" size="md">
                    Generate Key
                  </Button>
                </form>
              )}

              {/* Keys List */}
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    No API keys yet. Generate one to connect your AI assistant.
                  </p>
                  <Link
                    href="/docs/mcp-integration"
                    className="text-sm text-black dark:text-white underline"
                  >
                    View integration guide →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-normal text-black dark:text-white">
                              {key.name}
                            </h3>
                            <Badge variant={key.isActive ? 'success' : 'neutral'} size="sm">
                              {key.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400 mb-3">
                            {key.keyPrefix}
                          </p>
                          <div className="grid grid-cols-3 gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                            <div>
                              <span className="block text-neutral-400 dark:text-neutral-600 mb-1">
                                Created
                              </span>
                              {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="block text-neutral-400 dark:text-neutral-600 mb-1">
                                Last Used
                              </span>
                              {key.lastUsedAt
                                ? new Date(key.lastUsedAt).toLocaleDateString()
                                : 'Never'}
                            </div>
                            <div>
                              <span className="block text-neutral-400 dark:text-neutral-600 mb-1">
                                Requests
                              </span>
                              {key.requestCount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => handleToggleActive(key.id, key.isActive)}
                            variant="ghost"
                            size="sm"
                          >
                            {key.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            onClick={() => handleDeleteKey(key.id)}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Integration Guide Link */}
              {apiKeys.length > 0 && (
                <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Need help setting up? Check out the{' '}
                    <Link
                      href="/docs/mcp-integration"
                      className="text-black dark:text-white underline font-normal"
                    >
                      MCP Integration Guide
                    </Link>
                    {' '}for step-by-step instructions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
