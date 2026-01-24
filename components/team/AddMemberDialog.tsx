'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  alreadyInProject?: boolean;
}

interface AddMemberDialogProps {
  projectSlug: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export function AddMemberDialog({
  projectSlug,
  projectId,
  isOpen,
  onClose,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, projectId]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        projectId,
        limit: '10',
      });
      const res = await fetch(`/api/users/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAdding(userId);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: selectedRole }),
      });

      if (res.ok) {
        onMemberAdded();
        setSearchQuery('');
        setSearchResults([]);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member');
    } finally {
      setAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-light text-black dark:text-white mb-2">
                Add Team Member
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Search for users by email or name
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent border-neutral-200 dark:border-neutral-800"
                placeholder="Search by email or name..."
                autoFocus
              />
            </div>
            {searching && (
              <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <label className="block text-sm font-normal text-black dark:text-white mb-3">
              Role
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRole('EDITOR')}
                className={`flex-1 px-4 py-3 rounded-lg border text-left transition-all ${
                  selectedRole === 'EDITOR'
                    ? 'border-black dark:border-white bg-white dark:bg-neutral-950 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="font-normal text-black dark:text-white mb-1">Editor</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  Can create and edit documents
                </div>
              </button>
              <button
                onClick={() => setSelectedRole('VIEWER')}
                className={`flex-1 px-4 py-3 rounded-lg border text-left transition-all ${
                  selectedRole === 'VIEWER'
                    ? 'border-black dark:border-white bg-white dark:bg-neutral-950 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="font-normal text-black dark:text-white mb-1">Viewer</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  Can only view documents
                </div>
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim().length < 2 && (
              <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
                Enter at least 2 characters to search
              </div>
            )}

            {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
                No users found matching "{searchQuery}"
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-normal text-black dark:text-white flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || user.email}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user.name || user.email)[0].toUpperCase()
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-normal text-black dark:text-white truncate">
                          {user.name || user.email}
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {user.email}
                        </div>
                      </div>

                      {/* Already in Project Badge */}
                      {user.alreadyInProject && (
                        <Badge variant="neutral" size="sm">
                          Already in project
                        </Badge>
                      )}
                    </div>

                    {/* Add Button */}
                    {!user.alreadyInProject && (
                      <Button
                        onClick={() => handleAddMember(user.id)}
                        variant="primary"
                        size="sm"
                        disabled={adding === user.id}
                        className="ml-3 flex-shrink-0"
                      >
                        {adding === user.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add as {selectedRole === 'EDITOR' ? 'Editor' : 'Viewer'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
