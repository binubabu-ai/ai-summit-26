/**
 * Revision Control System
 * Hybrid VVCS with grounding status and bidirectional MCP flow
 */

import { prisma } from '@/lib/prisma';
import { generateDiff, getDiffStats } from '@/lib/diff-engine';

export interface CreateRevisionInput {
  documentId: string;
  content: string;
  title: string;
  description?: string;
  status?: 'draft' | 'proposed';
  basedOn?: string; // Revision ID this is based on
  authorId?: string;
  authorType?: 'user' | 'ai' | 'system';
  sourceClient?: string; // 'claude-desktop', 'cursor', 'web-ui', etc.
  sourceSessionId?: string;
}

export interface RevisionStatus {
  id: string;
  status: 'draft' | 'proposed' | 'approved' | 'rejected' | 'conflicted';
  isMain: boolean;
  hasConflicts: boolean;
  conflictReason?: string;
  createdAt: Date;
  proposedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
}

/**
 * Create a new revision
 */
export async function createRevision(input: CreateRevisionInput) {
  const {
    documentId,
    content,
    title,
    description,
    status = 'draft',
    basedOn,
    authorId,
    authorType = 'ai',
    sourceClient,
    sourceSessionId,
  } = input;

  // Get document and current main revision
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      mainRevision: true,
    },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // If basedOn is not provided, use current main revision
  const baseRevisionId = basedOn || document.mainRevisionId || undefined;

  // Create the revision
  const revision = await prisma.revision.create({
    data: {
      documentId,
      content,
      title,
      description,
      status,
      basedOn: baseRevisionId,
      authorId,
      authorType,
      sourceClient,
      sourceSessionId,
      proposedAt: status === 'proposed' ? new Date() : null,
    },
  });

  // Generate diff if there's a base revision
  if (baseRevisionId) {
    const baseRevision = await prisma.revision.findUnique({
      where: { id: baseRevisionId },
    });

    if (baseRevision) {
      const diff = generateDiff(baseRevision.content, content);
      const stats = getDiffStats(diff);

      await prisma.revisionDiff.create({
        data: {
          revisionId: revision.id,
          diffType: 'line',
          diffData: diff as any,
          stats: stats as any,
        },
      });
    }
  }

  return revision;
}

/**
 * Propose a draft revision (change status to proposed)
 */
export async function proposeRevision(revisionId: string, userId?: string) {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    include: {
      document: {
        include: {
          mainRevision: true,
        },
      },
    },
  });

  if (!revision) {
    throw new Error('Revision not found');
  }

  if (revision.status !== 'draft') {
    throw new Error('Only draft revisions can be proposed');
  }

  // Check for conflicts with current main
  const conflicts = await detectConflicts(revisionId);

  const updatedRevision = await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: conflicts.hasConflicts ? 'conflicted' : 'proposed',
      hasConflicts: conflicts.hasConflicts,
      conflictReason: conflicts.reason,
      proposedAt: new Date(),
    },
  });

  return updatedRevision;
}

/**
 * Approve a revision and make it the main version
 */
export async function approveRevision(revisionId: string, userId: string) {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    include: {
      document: {
        include: {
          mainRevision: true,
        },
      },
    },
  });

  if (!revision) {
    throw new Error('Revision not found');
  }

  if (revision.status !== 'proposed') {
    throw new Error('Only proposed revisions can be approved');
  }

  // Check for conflicts one more time
  const conflicts = await detectConflicts(revisionId);
  if (conflicts.hasConflicts) {
    throw new Error(`Cannot approve revision with conflicts: ${conflicts.reason}`);
  }

  // Start transaction: archive old main, make this the new main
  const result = await prisma.$transaction(async (tx) => {
    // Archive the old main revision if it exists
    if (revision.document.mainRevisionId) {
      await tx.revision.update({
        where: { id: revision.document.mainRevisionId },
        data: {
          isMain: false,
        },
      });
    }

    // Update the revision to approved and main
    const approvedRevision = await tx.revision.update({
      where: { id: revisionId },
      data: {
        status: 'approved',
        isMain: true,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // Update the document to point to this revision and update content
    await tx.document.update({
      where: { id: revision.documentId },
      data: {
        mainRevisionId: revisionId,
        content: revision.content,
        updatedAt: new Date(),
      },
    });

    // Create a version entry for history
    await tx.version.create({
      data: {
        docId: revision.documentId,
        content: revision.content,
        authorId: userId,
        authorType: 'user',
        changeRationale: revision.description || revision.title,
        changeType: 'update',
        aiGenerated: revision.authorType === 'ai',
        reviewRequired: false,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return approvedRevision;
  });

  return result;
}

/**
 * Reject a revision
 */
export async function rejectRevision(revisionId: string, userId: string, reason?: string) {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });

  if (!revision) {
    throw new Error('Revision not found');
  }

  if (revision.status === 'approved') {
    throw new Error('Cannot reject an approved revision');
  }

  const rejectedRevision = await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: userId,
      conflictReason: reason,
    },
  });

  return rejectedRevision;
}

/**
 * Get revision status (for MCP bidirectional flow)
 */
export async function getRevisionStatus(revisionId: string): Promise<RevisionStatus> {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });

  if (!revision) {
    throw new Error('Revision not found');
  }

  return {
    id: revision.id,
    status: revision.status as any,
    isMain: revision.isMain,
    hasConflicts: revision.hasConflicts,
    conflictReason: revision.conflictReason || undefined,
    createdAt: revision.createdAt,
    proposedAt: revision.proposedAt || undefined,
    approvedAt: revision.approvedAt || undefined,
    approvedBy: revision.approvedBy || undefined,
    rejectedAt: revision.rejectedAt || undefined,
    rejectedBy: revision.rejectedBy || undefined,
  };
}

/**
 * List all revisions for a document
 */
export async function listRevisions(documentId: string) {
  const revisions = await prisma.revision.findMany({
    where: { documentId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      diffs: {
        where: {
          diffType: 'line',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return revisions;
}

/**
 * Detect conflicts between a revision and the current main
 */
export async function detectConflicts(revisionId: string) {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    include: {
      document: {
        include: {
          mainRevision: true,
        },
      },
    },
  });

  if (!revision) {
    throw new Error('Revision not found');
  }

  // If there's no main revision yet, no conflicts
  if (!revision.document.mainRevision) {
    return {
      hasConflicts: false,
    };
  }

  // If this revision is based on the current main, no conflicts
  if (revision.basedOn === revision.document.mainRevisionId) {
    return {
      hasConflicts: false,
    };
  }

  // If this revision is based on an older version, there might be conflicts
  if (revision.basedOn && revision.basedOn !== revision.document.mainRevisionId) {
    return {
      hasConflicts: true,
      reason: `Based on revision ${revision.basedOn} but current main is ${revision.document.mainRevisionId}`,
    };
  }

  return {
    hasConflicts: false,
  };
}

/**
 * Rebase a revision on the current main
 */
export async function rebaseRevision(
  revisionId: string,
  newContent: string,
  userId?: string
) {
  const oldRevision = await prisma.revision.findUnique({
    where: { id: revisionId },
    include: {
      document: {
        include: {
          mainRevision: true,
        },
      },
    },
  });

  if (!oldRevision) {
    throw new Error('Revision not found');
  }

  // Create a new revision based on current main
  const newRevision = await createRevision({
    documentId: oldRevision.documentId,
    content: newContent,
    title: `${oldRevision.title} (rebased)`,
    description: oldRevision.description || undefined,
    status: oldRevision.status as 'draft' | 'proposed',
    basedOn: oldRevision.document.mainRevisionId || undefined,
    authorId: userId || oldRevision.authorId || undefined,
    authorType: oldRevision.authorType as 'user' | 'ai' | 'system',
    sourceClient: oldRevision.sourceClient || undefined,
    sourceSessionId: oldRevision.sourceSessionId || undefined,
  });

  // Update the new revision to mark what it replaced
  await prisma.revision.update({
    where: { id: newRevision.id },
    data: {
      replacedRevisionId: revisionId,
    },
  });

  // Mark old revision as rejected
  await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: 'rejected',
      conflictReason: 'Replaced by rebased revision',
    },
  });

  return newRevision;
}
