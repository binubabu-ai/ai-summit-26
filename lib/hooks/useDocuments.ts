'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Document {
  id: string;
  title: string;
  path: string;
  content: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  isFolder: boolean;
  children?: Document[];
}

export interface CreateDocumentInput {
  title: string;
  path: string;
  content?: string;
  projectId: string;
  parentId?: string;
  isFolder?: boolean;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  path?: string;
}

// Fetch all documents for a project
export function useDocuments(projectSlug: string) {
  return useQuery({
    queryKey: ['projects', projectSlug, 'documents'],
    queryFn: async (): Promise<Document[]> => {
      const response = await fetch(`/api/projects/${projectSlug}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    },
    enabled: !!projectSlug,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch a single document by path
export function useDocument(projectSlug: string, path: string[]) {
  const fullPath = path.join('/');

  return useQuery({
    queryKey: ['projects', projectSlug, 'documents', fullPath],
    queryFn: async (): Promise<Document> => {
      const response = await fetch(
        `/api/projects/${projectSlug}/documents/${encodeURIComponent(fullPath)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      return response.json();
    },
    enabled: !!projectSlug && path.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create a new document
export function useCreateDocument(projectSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentInput): Promise<Document> => {
      const response = await fetch(`/api/projects/${projectSlug}/documents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create document');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate documents list
      queryClient.invalidateQueries({
        queryKey: ['projects', projectSlug, 'documents']
      });
    },
  });
}

// Update a document
export function useUpdateDocument(projectSlug: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDocumentInput): Promise<Document> => {
      const response = await fetch(
        `/api/projects/${projectSlug}/documents/${documentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update document');
      }

      return response.json();
    },
    onSuccess: (updatedDoc) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ['projects', projectSlug, 'documents', updatedDoc.path],
        updatedDoc
      );
      // Invalidate list to refetch
      queryClient.invalidateQueries({
        queryKey: ['projects', projectSlug, 'documents'],
      });
    },
  });
}

// Delete a document
export function useDeleteDocument(projectSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      const response = await fetch(
        `/api/projects/${projectSlug}/documents/${documentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }
    },
    onSuccess: () => {
      // Invalidate documents list
      queryClient.invalidateQueries({
        queryKey: ['projects', projectSlug, 'documents'],
      });
    },
  });
}
