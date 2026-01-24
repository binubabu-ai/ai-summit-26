// Utilities for parsing document paths into a tree structure

export interface DocumentNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: DocumentNode[];
  docId?: string;
  updatedAt?: string;
}

/**
 * Parse document paths into a tree structure
 * Example: ["api/auth.md", "api/users.md", "README.md"]
 * Returns a tree with folders and files
 */
export function buildDocumentTree(
  docs: Array<{ id: string; path: string; updatedAt: string }>
): DocumentNode[] {
  const root: DocumentNode[] = [];
  const folderMap = new Map<string, DocumentNode>();

  // Sort paths for consistent ordering
  const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));

  for (const doc of sortedDocs) {
    const parts = doc.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    // Build folder structure
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      let folder = folderMap.get(currentPath);

      if (!folder) {
        folder = {
          name: folderName,
          path: currentPath,
          type: 'folder',
          children: [],
        };
        folderMap.set(currentPath, folder);
        currentLevel.push(folder);
      }

      currentLevel = folder.children!;
    }

    // Add the file
    const fileName = parts[parts.length - 1];
    currentLevel.push({
      name: fileName,
      path: doc.path,
      type: 'file',
      docId: doc.id,
      updatedAt: doc.updatedAt,
    });
  }

  return root;
}

/**
 * Extract unique folder paths from documents
 * Example: ["api/auth.md", "api/users.md", "guides/setup.md"]
 * Returns: ["api", "guides"]
 */
export function extractFolders(docs: Array<{ path: string }>): string[] {
  const folders = new Set<string>();

  for (const doc of docs) {
    const parts = doc.path.split('/');
    if (parts.length > 1) {
      // Build all parent folder paths
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        folders.add(currentPath);
      }
    }
  }

  return Array.from(folders).sort();
}

/**
 * Get the folder path from a document path
 * Example: "api/auth.md" -> "api"
 *          "README.md" -> ""
 */
export function getFolderPath(docPath: string): string {
  const parts = docPath.split('/');
  if (parts.length === 1) return '';
  return parts.slice(0, -1).join('/');
}

/**
 * Get the file name from a document path
 * Example: "api/auth.md" -> "auth.md"
 */
export function getFileName(docPath: string): string {
  const parts = docPath.split('/');
  return parts[parts.length - 1];
}

/**
 * Validate a document path
 */
export function validateDocumentPath(path: string): {
  valid: boolean;
  error?: string;
} {
  if (!path) {
    return { valid: false, error: 'Path is required' };
  }

  if (path.includes('\\')) {
    return { valid: false, error: 'Use forward slashes (/) not backslashes (\\)' };
  }

  if (path.startsWith('/') || path.endsWith('/')) {
    return { valid: false, error: 'Path should not start or end with /' };
  }

  if (path.includes('//')) {
    return { valid: false, error: 'Path should not contain double slashes' };
  }

  if (!/^[a-zA-Z0-9_\-./]+$/.test(path)) {
    return {
      valid: false,
      error: 'Path can only contain letters, numbers, hyphens, underscores, dots, and forward slashes',
    };
  }

  if (!path.endsWith('.md')) {
    return { valid: false, error: 'Document path must end with .md' };
  }

  return { valid: true };
}
