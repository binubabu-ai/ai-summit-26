/**
 * Audit Logging for Knowledge Operations
 * Integrates knowledge system with existing audit infrastructure
 */

import prisma from '@/lib/prisma';

export type KnowledgeOperation =
  | 'document_upload'
  | 'document_process'
  | 'module_ground'
  | 'module_unground'
  | 'conflict_detect'
  | 'conflict_resolve'
  | 'conflict_dismiss';

interface AuditMetadata {
  operation: KnowledgeOperation;
  projectId: string;
  userId?: string;
  documentId?: string;
  moduleId?: string;
  conflictId?: string;
  details?: Record<string, any>;
}

/**
 * Log a knowledge operation to audit trail
 */
export async function logKnowledgeOperation(metadata: AuditMetadata) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: 'knowledge',
        entityId: metadata.documentId || metadata.moduleId || metadata.conflictId || metadata.projectId,
        action: metadata.operation,
        actorId: metadata.userId,
        actorType: metadata.userId ? 'user' : 'system',
        changes: metadata.details || {},
        metadata: {
          projectId: metadata.projectId,
          documentId: metadata.documentId,
          moduleId: metadata.moduleId,
          conflictId: metadata.conflictId,
        },
      },
    });
  } catch (error) {
    console.error('Failed to log knowledge operation:', error);
    // Don't throw - audit logging should not break operations
  }
}

/**
 * Log document upload
 */
export async function logDocumentUpload(
  projectId: string,
  documentIds: string[],
  userId?: string
) {
  await logKnowledgeOperation({
    operation: 'document_upload',
    projectId,
    userId,
    details: {
      documentCount: documentIds.length,
      documentIds,
    },
  });
}

/**
 * Log document processing
 */
export async function logDocumentProcess(
  projectId: string,
  documentId: string,
  mode: 'as-is' | 'generate-specs',
  specsCreated: number,
  userId?: string
) {
  await logKnowledgeOperation({
    operation: 'document_process',
    projectId,
    userId,
    documentId,
    details: {
      mode,
      specsCreated,
    },
  });
}

/**
 * Log module grounding
 */
export async function logModuleGround(
  projectId: string,
  moduleId: string,
  isGrounded: boolean,
  reason: string,
  userId?: string
) {
  await logKnowledgeOperation({
    operation: isGrounded ? 'module_ground' : 'module_unground',
    projectId,
    userId,
    moduleId,
    details: {
      reason,
    },
  });
}

/**
 * Log conflict detection
 */
export async function logConflictDetect(
  projectId: string,
  conflictsDetected: number,
  conflictsStored: number,
  userId?: string
) {
  await logKnowledgeOperation({
    operation: 'conflict_detect',
    projectId,
    userId,
    details: {
      conflictsDetected,
      conflictsStored,
    },
  });
}

/**
 * Log conflict resolution
 */
export async function logConflictResolve(
  projectId: string,
  conflictId: string,
  strategy: string,
  userId?: string
) {
  await logKnowledgeOperation({
    operation: 'conflict_resolve',
    projectId,
    userId,
    conflictId,
    details: {
      strategy,
    },
  });
}

/**
 * Log conflict dismissal
 */
export async function logConflictDismiss(
  projectId: string,
  conflictId: string,
  userId?: string
) {
  await logKnowledgeOperation({
    operation: 'conflict_dismiss',
    projectId,
    userId,
    conflictId,
  });
}
