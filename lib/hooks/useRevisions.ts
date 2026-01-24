'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Revision {
  id: string;
  documentId: string;
  title: string;
  description: string | null;
  content: string;
  status: 'draft' | 'proposed' | 'approved' | 'rejected' | 'conflicted';
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  sourceClient: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateRevisionInput {
  documentId: string;
  content: string;
  title: string;
  description?: string;
  status?: 'draft' | 'proposed';
  sourceClient?: string;
}

// Fetch all revisions for a document
export function useRevisions(documentId: string, filter?: 'all' | 'mine') {
  return useQuery({
    queryKey: ['documents', documentId, 'revisions', filter],
    queryFn: async (): Promise<Revision[]> => {
      const params = new URLSearchParams();
      if (filter) params.set('filter', filter);

      const response = await fetch(
        `/api/documents/${documentId}/revisions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }

      return response.json();
    },
    enabled: !!documentId,
    staleTime: 15 * 1000, // 15 seconds - revisions change frequently
  });
}

// Fetch a single revision
export function useRevision(revisionId: string) {
  return useQuery({
    queryKey: ['revisions', revisionId],
    queryFn: async (): Promise<Revision> => {
      const response = await fetch(`/api/revisions/${revisionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch revision');
      }

      return response.json();
    },
    enabled: !!revisionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create a new revision
export function useCreateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRevisionInput): Promise<Revision> => {
      const response = await fetch('/api/revisions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sourceClient: data.sourceClient || 'web-ui',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create revision');
      }

      return response.json();
    },
    onSuccess: (newRevision) => {
      // Invalidate revisions list for this document
      queryClient.invalidateQueries({
        queryKey: ['documents', newRevision.documentId, 'revisions'],
      });
    },
  });
}

// Approve a revision
export function useApproveRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (revisionId: string): Promise<void> => {
      const response = await fetch(`/api/revisions/${revisionId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve revision');
      }
    },
    onSuccess: (_, revisionId) => {
      // Invalidate specific revision and its document's revisions
      queryClient.invalidateQueries({ queryKey: ['revisions', revisionId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Reject a revision
export function useRejectRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { revisionId: string; reason?: string }): Promise<void> => {
      const response = await fetch(`/api/revisions/${data.revisionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: data.reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject revision');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate specific revision and its document's revisions
      queryClient.invalidateQueries({ queryKey: ['revisions', variables.revisionId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
