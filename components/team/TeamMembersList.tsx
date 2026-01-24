'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserMinus, ChevronDown } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface Member {
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

interface TeamMembersListProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER';
  projectSlug: string;
  onMemberUpdated: () => void;
}

export function TeamMembersList({
  members,
  currentUserId,
  currentUserRole,
  projectSlug,
  onMemberUpdated,
}: TeamMembersListProps) {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        onMemberUpdated();
        setChangingRole(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onMemberUpdated();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const handleLeaveProject = async () => {
    if (!confirm('Are you sure you want to leave this project? You will lose access immediately.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/leave`, {
        method: 'POST',
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave project');
      }
    } catch (error) {
      console.error('Failed to leave project:', error);
      alert('Failed to leave project');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'EDITOR':
        return 'success';
      case 'VIEWER':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const canManage = currentUserRole === 'OWNER';

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const isOwner = member.role === 'OWNER';
        const canChangeRole = canManage && !isCurrentUser && !isOwner;
        const canRemove = canManage && !isCurrentUser && !isOwner;

        return (
          <div
            key={member.id}
            className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-lg font-normal text-black dark:text-white">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.name || member.user.email}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (member.user.name || member.user.email)[0].toUpperCase()
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-normal text-black dark:text-white truncate">
                      {member.user.name || member.user.email}
                      {isCurrentUser && (
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-2">
                          (You)
                        </span>
                      )}
                    </h3>
                    <Badge variant={getRoleBadgeVariant(member.role)} size="sm">
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 truncate">
                    {member.user.email}
                  </p>
                  <div className="text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
                    <div>
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                    {member.inviter && (
                      <div>
                        Invited by {member.inviter.name || member.inviter.email}
                      </div>
                    )}
                    {member.lastAccessAt && (
                      <div>
                        Last active {new Date(member.lastAccessAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Role Change Dropdown */}
                {canChangeRole && (
                  <div className="relative">
                    <Button
                      onClick={() => setChangingRole(changingRole === member.id ? null : member.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Change Role
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {changingRole === member.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleRoleChange(member.id, 'EDITOR')}
                          className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-t-lg"
                          disabled={member.role === 'EDITOR'}
                        >
                          Editor
                        </button>
                        <button
                          onClick={() => handleRoleChange(member.id, 'VIEWER')}
                          className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-b-lg"
                          disabled={member.role === 'VIEWER'}
                        >
                          Viewer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Remove Button */}
                {canRemove && (
                  <Button
                    onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                    variant="danger"
                    size="sm"
                    title="Remove from project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

                {/* Leave Button */}
                {isCurrentUser && !isOwner && (
                  <Button
                    onClick={handleLeaveProject}
                    variant="danger"
                    size="sm"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Leave Project
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">
            No team members yet. Add collaborators to get started.
          </p>
        </div>
      )}
    </div>
  );
}
