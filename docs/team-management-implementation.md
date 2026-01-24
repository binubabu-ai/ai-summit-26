# Team Management Implementation Plan

## Overview

Complete team collaboration system for projects with user search, role-based permissions, and member management.

---

## Features

### 1. Role-Based Access Control (RBAC)

**Permission Levels:**

| Role | Create Docs | Edit Docs | Delete Docs | View Docs | Manage Team | Manage Settings |
|------|-------------|-----------|-------------|-----------|-------------|-----------------|
| **OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **VIEWER** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**Auto-Assignment:**
- Project creator automatically gets **OWNER** role
- Only owners can manage team members
- Only owners can change project settings

### 2. User Search & Invitation

- Search existing users by email or name
- Fuzzy search with debouncing
- Show user avatar, name, and email
- Add users with specific role
- Prevent duplicate additions
- Show current team members

### 3. Team Management

- View all team members
- Change member roles (OWNER only)
- Remove team members (OWNER only)
- Cannot remove self if only owner
- Show member join date and last activity

---

## Database Schema

### Current Schema ✅

Already exists in `prisma/schema.prisma`:

```prisma
model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      String   @default("VIEWER") // OWNER, ADMIN, EDITOR, VIEWER
  createdAt DateTime @default(now())

  // Relations
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}
```

**Schema is complete!** ✅ No changes needed.

### Enhancements Needed

Add `invitedBy` field to track who added each member:

```prisma
model ProjectMember {
  // ... existing fields
  invitedBy  String?   // User ID who invited this member
  invitedAt  DateTime  @default(now())
  lastAccessAt DateTime? // Track when member last accessed project

  inviter    User?     @relation("InvitedBy", fields: [invitedBy], references: [id])
}
```

---

## API Endpoints

### 1. Search Users

**GET /api/users/search?q={query}**

Search for users to add to project.

```typescript
Request:
GET /api/users/search?q=john&limit=10

Response:
{
  users: [
    {
      id: "user_123",
      email: "john@example.com",
      name: "John Doe",
      avatar: "https://...",
      alreadyInProject: false
    },
    {
      id: "user_456",
      email: "johnny@example.com",
      name: "Johnny Smith",
      avatar: "https://...",
      alreadyInProject: true
    }
  ]
}
```

**Access:** Authenticated users only
**Permissions:** Can search all users in system

---

### 2. Get Team Members

**GET /api/projects/[slug]/team**

Get all team members for a project.

```typescript
Request:
GET /api/projects/vortex-ai/team

Response:
{
  members: [
    {
      id: "member_1",
      userId: "user_123",
      role: "OWNER",
      user: {
        id: "user_123",
        email: "owner@example.com",
        name: "Project Owner",
        avatar: "https://..."
      },
      createdAt: "2026-01-20T10:00:00Z",
      invitedBy: null,
      lastAccessAt: "2026-01-24T15:30:00Z"
    },
    {
      id: "member_2",
      userId: "user_456",
      role: "EDITOR",
      user: {
        id: "user_456",
        email: "editor@example.com",
        name: "Team Editor",
        avatar: "https://..."
      },
      createdAt: "2026-01-22T14:00:00Z",
      invitedBy: "user_123",
      inviter: {
        name: "Project Owner"
      },
      lastAccessAt: "2026-01-24T12:00:00Z"
    }
  ],
  currentUserRole: "OWNER"
}
```

**Access:** Team members only
**Permissions:** Any team member can view team list

---

### 3. Add Team Member

**POST /api/projects/[slug]/team**

Add a user to the project team.

```typescript
Request:
POST /api/projects/vortex-ai/team
{
  userId: "user_789",
  role: "EDITOR"
}

Response:
{
  success: true,
  member: {
    id: "member_3",
    userId: "user_789",
    role: "EDITOR",
    user: {
      id: "user_789",
      email: "newmember@example.com",
      name: "New Member",
      avatar: "https://..."
    },
    createdAt: "2026-01-24T16:00:00Z",
    invitedBy: "user_123"
  }
}

Error Cases:
400 - User already in project
403 - Not authorized (only OWNER can add members)
404 - User or project not found
```

**Access:** OWNER only
**Permissions:** Only project owners can add members

---

### 4. Update Member Role

**PATCH /api/projects/[slug]/team/[memberId]**

Change a team member's role.

```typescript
Request:
PATCH /api/projects/vortex-ai/team/member_2
{
  role: "VIEWER"
}

Response:
{
  success: true,
  member: {
    id: "member_2",
    userId: "user_456",
    role: "VIEWER",
    updatedAt: "2026-01-24T16:30:00Z"
  }
}

Error Cases:
400 - Cannot change own role
400 - Invalid role
403 - Not authorized (only OWNER can change roles)
404 - Member not found
```

**Access:** OWNER only
**Permissions:** Only project owners can change roles

---

### 5. Remove Team Member

**DELETE /api/projects/[slug]/team/[memberId]**

Remove a user from the project team.

```typescript
Request:
DELETE /api/projects/vortex-ai/team/member_2

Response:
{
  success: true,
  message: "Member removed successfully"
}

Error Cases:
400 - Cannot remove self if only owner
403 - Not authorized (only OWNER can remove members)
404 - Member not found
```

**Access:** OWNER only
**Permissions:** Only project owners can remove members

---

### 6. Leave Project

**POST /api/projects/[slug]/team/leave**

Leave a project (member removes themselves).

```typescript
Request:
POST /api/projects/vortex-ai/team/leave

Response:
{
  success: true,
  message: "You have left the project"
}

Error Cases:
400 - Cannot leave if you're the only owner
```

**Access:** Any team member
**Permissions:** Anyone can leave (except last owner)

---

## Permission Middleware

### Check User Access

```typescript
// lib/permissions.ts

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export const PERMISSIONS = {
  OWNER: {
    canCreateDocs: true,
    canEditDocs: true,
    canDeleteDocs: true,
    canViewDocs: true,
    canManageTeam: true,
    canManageSettings: true,
    canDeleteProject: true,
  },
  EDITOR: {
    canCreateDocs: true,
    canEditDocs: true,
    canDeleteDocs: false,
    canViewDocs: true,
    canManageTeam: false,
    canManageSettings: false,
    canDeleteProject: false,
  },
  VIEWER: {
    canCreateDocs: false,
    canEditDocs: false,
    canDeleteDocs: false,
    canViewDocs: true,
    canManageTeam: false,
    canManageSettings: false,
    canDeleteProject: false,
  },
};

export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<Role | null> {
  // Check if user is owner
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (project) {
    return 'OWNER';
  }

  // Check if user is a member
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return member ? (member.role as Role) : null;
}

export async function checkPermission(
  userId: string,
  projectId: string,
  permission: keyof typeof PERMISSIONS.OWNER
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);

  if (!role) {
    return false;
  }

  return PERMISSIONS[role][permission];
}

export async function requirePermission(
  userId: string,
  projectId: string,
  permission: keyof typeof PERMISSIONS.OWNER
): Promise<void> {
  const hasPermission = await checkPermission(userId, projectId, permission);

  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}
```

---

## UI Components

### 1. Team Management Page

**Location:** `/app/projects/[slug]/settings/team/page.tsx`

```tsx
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { AddMemberDialog } from '@/components/team/AddMemberDialog';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default async function TeamPage({ params }) {
  const { slug } = await params;

  // Get current user and check permissions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
          inviter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.ownerId === user.id;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-light text-black dark:text-white mb-2">
            Team Members
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage who has access to this project
          </p>
        </div>

        {isOwner && (
          <AddMemberDialog projectSlug={slug} />
        )}
      </div>

      <TeamMembersList
        members={project.members}
        projectSlug={slug}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </div>
  );
}
```

---

### 2. Team Members List Component

**Location:** `/components/team/TeamMembersList.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Edit3,
  Eye,
  MoreVertical,
  Trash2,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMembersListProps {
  members: any[];
  projectSlug: string;
  currentUserId: string;
  isOwner: boolean;
}

export function TeamMembersList({
  members,
  projectSlug,
  currentUserId,
  isOwner,
}: TeamMembersListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'EDITOR':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'VIEWER':
        return <Eye className="w-4 h-4 text-neutral-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      OWNER: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      EDITOR: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      VIEWER: 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {getRoleIcon(role)}
        {role}
      </span>
    );
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!isOwner) return;

    setLoading(memberId);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change role');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isOwner) return;

    if (!confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    setLoading(memberId);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleLeaveProject = async () => {
    if (!confirm('Are you sure you want to leave this project?')) {
      return;
    }

    setLoading('leave');
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team/leave`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to leave project');
      }

      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const isOwnerRole = member.role === 'OWNER';

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-medium flex-shrink-0">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.name || member.user.email}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm">
                      {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {member.user.name || member.user.email}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-neutral-500">(You)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                    {member.user.email}
                  </p>
                  {member.inviter && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-1">
                      Invited by {member.inviter.name || member.inviter.email}
                    </p>
                  )}
                </div>

                {/* Role Badge */}
                <div className="flex-shrink-0">
                  {getRoleBadge(member.role)}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex-shrink-0">
                {isOwner && !isOwnerRole && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading === member.id}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member.id, 'EDITOR')}
                        disabled={member.role === 'EDITOR'}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Make Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member.id, 'VIEWER')}
                        disabled={member.role === 'VIEWER'}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Make Viewer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                        className="text-danger"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!isOwner && isCurrentUser && member.role !== 'OWNER' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveProject}
                    disabled={loading === 'leave'}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 3. Add Member Dialog Component

**Location:** `/components/team/AddMemberDialog.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddMemberDialogProps {
  projectSlug: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  alreadyInProject: boolean;
}

export function AddMemberDialog({ projectSlug }: AddMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('EDITOR');
  const [adding, setAdding] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }

      // Success!
      setOpen(false);
      setSearchQuery('');
      setUsers([]);
      setSelectedUser(null);
      setSelectedRole('EDITOR');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search for users and add them to your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-500" />
            )}
          </div>

          {/* Search Results */}
          {users.length > 0 && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  disabled={user.alreadyInProject}
                  className={`w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${user.alreadyInProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 text-sm font-medium flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || user.email}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span>{(user.name || user.email).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {user.alreadyInProject && (
                    <span className="text-xs text-neutral-500">Already in project</span>
                  )}
                  {selectedUser?.id === user.id && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected User + Role */}
          {selectedUser && !selectedUser.alreadyInProject && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-medium">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name || selectedUser.email}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm">
                      {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white">
                    {selectedUser.name || selectedUser.email}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                  Role
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Editor</span>
                        <span className="text-xs text-neutral-500">Can create and edit documents</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Viewer</span>
                        <span className="text-xs text-neutral-500">Can only view documents</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddMember}
                disabled={adding}
                className="w-full"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Project
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {searchQuery.length >= 2 && !searching && users.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              No users found matching "{searchQuery}"
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="text-center py-8 text-neutral-500 text-sm">
              Type at least 2 characters to search for users
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation Steps

### Phase 1: Database & Backend (2-3 hours)

1. **Update Prisma Schema** ✅
   - Schema already complete
   - Optional: Add `invitedBy` and `lastAccessAt` fields
   - Run migration: `npx prisma db push`

2. **Create Permission System**
   - File: `lib/permissions.ts`
   - Role definitions
   - Permission checks
   - Middleware functions

3. **Build API Endpoints**
   - `/api/users/search` - User search
   - `/api/projects/[slug]/team` - GET, POST
   - `/api/projects/[slug]/team/[id]` - PATCH, DELETE
   - `/api/projects/[slug]/team/leave` - POST

### Phase 2: UI Components (3-4 hours)

4. **Team Settings Page**
   - `/app/projects/[slug]/settings/team/page.tsx`
   - Add to settings navigation

5. **Team Members List**
   - `components/team/TeamMembersList.tsx`
   - Member cards with role badges
   - Action menus (OWNER only)

6. **Add Member Dialog**
   - `components/team/AddMemberDialog.tsx`
   - User search with debouncing
   - Role selection
   - Add confirmation

### Phase 3: Permission Guards (1-2 hours)

7. **Update Existing Pages**
   - Add permission checks to document editor
   - Add permission checks to settings pages
   - Add permission checks to delete actions

8. **Auto-Add Owner**
   - Update project creation to add owner as member
   - File: `app/api/projects/route.ts`

### Phase 4: Testing (1 hour)

9. **Test Scenarios**
   - Create project (owner auto-added)
   - Search and add members
   - Change member roles
   - Remove members
   - Leave project
   - Permission restrictions

---

## Auto-Add Owner on Project Creation

Update `/app/api/projects/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // ... authentication check

  const body = await request.json();
  const { name, slug } = body;

  // Create project with transaction
  const project = await prisma.$transaction(async (tx) => {
    // 1. Create project
    const newProject = await tx.project.create({
      data: {
        name,
        slug,
        ownerId: user.id,
      },
    });

    // 2. Auto-add owner as OWNER member
    await tx.projectMember.create({
      data: {
        projectId: newProject.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    return newProject;
  });

  return NextResponse.json({ project });
}
```

---

## Testing Checklist

### Functional Tests

- [ ] Create project → Owner auto-added with OWNER role
- [ ] Search users by email → Results appear
- [ ] Search users by name → Results appear
- [ ] Add member as EDITOR → Success
- [ ] Add member as VIEWER → Success
- [ ] Try to add same user twice → Error
- [ ] Change member role EDITOR → VIEWER → Success
- [ ] Change member role VIEWER → EDITOR → Success
- [ ] Remove member as OWNER → Success
- [ ] Try to remove member as EDITOR → Error (403)
- [ ] Leave project as EDITOR → Success
- [ ] Try to leave as only OWNER → Error (400)
- [ ] VIEWER cannot edit document → Blocked
- [ ] EDITOR can edit document → Success
- [ ] OWNER can delete document → Success
- [ ] Non-member cannot access project → 403

### UI Tests

- [ ] Team page shows all members correctly
- [ ] Role badges display correctly
- [ ] Search dialog opens and closes
- [ ] Search debouncing works (no spam)
- [ ] Selected user highlights in search results
- [ ] Role select shows descriptions
- [ ] Action menu shows for non-owners (OWNER only)
- [ ] Loading states display correctly
- [ ] Error messages shown appropriately
- [ ] Success confirmations work

---

## Security Considerations

### 1. Permission Checks

Every API endpoint must check:
- User is authenticated
- User has required permission
- User belongs to the project

### 2. Input Validation

- Validate role values (OWNER, EDITOR, VIEWER only)
- Validate user IDs exist
- Validate project slugs exist
- Sanitize search queries

### 3. Rate Limiting

Add rate limiting to:
- User search endpoint (10 req/min per user)
- Add member endpoint (20 req/min per user)

### 4. Audit Logging

Track all team changes:
```typescript
await prisma.auditLog.create({
  data: {
    entityType: 'project',
    entityId: projectId,
    action: 'member_added',
    actorId: currentUserId,
    actorType: 'user',
    changes: {
      memberId,
      userId,
      role,
    },
  },
});
```

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database & Backend)
3. Build Phase 2 (UI Components)
4. Implement Phase 3 (Permission Guards)
5. Complete Phase 4 (Testing)

**Estimated Total Time: 7-10 hours**

**Should we start implementing?**
