'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  isActive: boolean;
}

interface ApiKeyManagerProps {
  projectSlug: string;
  onKeyCreated?: (key: ApiKey) => void;
}

export function ApiKeyManager({ projectSlug, onKeyCreated }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiKeys();
  }, [projectSlug]);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/api-keys`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectSlug}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key); // Show the key once
        setNewKeyName('');
        setShowCreateForm(false);
        await fetchApiKeys();

        // Notify parent component
        if (onKeyCreated && apiKeys.length === 0) {
          // Find the newly created key
          const updatedKeys = await fetch(`/api/projects/${projectSlug}/api-keys`).then(r => r.json());
          const createdKey = updatedKeys[updatedKeys.length - 1];
          if (createdKey) {
            onKeyCreated(createdKey);
          }
        }
      } else {
        alert('Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectSlug}/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchApiKeys();
      } else {
        alert('Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleToggleActive = async (keyId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchApiKeys();
      } else {
        alert('Failed to update API key');
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      alert('Failed to update API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* New Key Success Card */}
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
              This key is ready to use in your IDE configuration.
            </p>
            <div className="mt-4">
              <Button onClick={() => setNewKey(null)} variant="secondary" size="sm">
                I've Saved My Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys Card */}
      <Card variant="default">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                API Keys
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Manage API keys for connecting AI assistants to this project
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
        </CardContent>
      </Card>
    </div>
  );
}
