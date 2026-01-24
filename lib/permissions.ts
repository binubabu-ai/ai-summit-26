/**
 * Permission System
 * Role-based access control for projects
 */

import { prisma } from '@/lib/prisma';

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export type Permission =
  | 'canCreateDocs'
  | 'canEditDocs'
  | 'canDeleteDocs'
  | 'canViewDocs'
  | 'canManageTeam'
  | 'canManageSettings'
  | 'canDeleteProject'
  | 'canManageAPIKeys';

export const PERMISSIONS: Record<Role, Record<Permission, boolean>> = {
  OWNER: {
    canCreateDocs: true,
    canEditDocs: true,
    canDeleteDocs: true,
    canViewDocs: true,
    canManageTeam: true,
    canManageSettings: true,
    canDeleteProject: true,
    canManageAPIKeys: true,
  },
  EDITOR: {
    canCreateDocs: true,
    canEditDocs: true,
    canDeleteDocs: false,
    canViewDocs: true,
    canManageTeam: false,
    canManageSettings: false,
    canDeleteProject: false,
    canManageAPIKeys: false,
  },
  VIEWER: {
    canCreateDocs: false,
    canEditDocs: false,
    canDeleteDocs: false,
    canViewDocs: true,
    canManageTeam: false,
    canManageSettings: false,
    canDeleteProject: false,
    canManageAPIKeys: false,
  },
};

/**
 * Get user's role in a project
 */
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

/**
 * Get user's role in a project by slug
 */
export async function getUserProjectRoleBySlug(
  userId: string,
  projectSlug: string
): Promise<Role | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });

  if (!project) {
    return null;
  }

  return getUserProjectRole(userId, project.id);
}

/**
 * Check if user has a specific permission
 */
export async function checkPermission(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);

  if (!role) {
    return false;
  }

  return PERMISSIONS[role][permission];
}

/**
 * Check if user has a specific permission by project slug
 */
export async function checkPermissionBySlug(
  userId: string,
  projectSlug: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserProjectRoleBySlug(userId, projectSlug);

  if (!role) {
    return false;
  }

  return PERMISSIONS[role][permission];
}

/**
 * Require a specific permission or throw error
 */
export async function requirePermission(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<void> {
  const hasPermission = await checkPermission(userId, projectId, permission);

  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

/**
 * Require a specific permission by slug or throw error
 */
export async function requirePermissionBySlug(
  userId: string,
  projectSlug: string,
  permission: Permission
): Promise<void> {
  const hasPermission = await checkPermissionBySlug(userId, projectSlug, permission);

  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

/**
 * Check if user has access to project
 */
export async function hasProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role !== null;
}

/**
 * Check if user has access to project by slug
 */
export async function hasProjectAccessBySlug(
  userId: string,
  projectSlug: string
): Promise<boolean> {
  const role = await getUserProjectRoleBySlug(userId, projectSlug);
  return role !== null;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Record<Permission, boolean> {
  return PERMISSIONS[role];
}

/**
 * Check if role can perform action
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role][permission];
}
