import fs from 'fs-extra';
import path from 'path';

/**
 * File system utility functions
 */

/**
 * Check if a path exists
 */
export async function pathExists(filepath: string): Promise<boolean> {
  return fs.pathExists(filepath);
}

/**
 * Ensure a directory exists
 */
export async function ensureDir(dirpath: string): Promise<void> {
  await fs.ensureDir(dirpath);
}

/**
 * Read a file as string
 */
export async function readFile(filepath: string): Promise<string> {
  return fs.readFile(filepath, 'utf-8');
}

/**
 * Write a file
 */
export async function writeFile(filepath: string, content: string): Promise<void> {
  await fs.writeFile(filepath, content, 'utf-8');
}

/**
 * Copy a file or directory
 */
export async function copy(
  src: string,
  dest: string,
  options?: fs.CopyOptions
): Promise<void> {
  await fs.copy(src, dest, options);
}

/**
 * Remove a file or directory
 */
export async function remove(filepath: string): Promise<void> {
  await fs.remove(filepath);
}

/**
 * Read directory contents
 */
export async function readdir(
  dirpath: string,
  options?: { withFileTypes?: boolean }
): Promise<any[]> {
  return fs.readdir(dirpath, options as any) as Promise<any[]>;
}

/**
 * Get file stats
 */
export async function stat(filepath: string): Promise<fs.Stats> {
  return fs.stat(filepath);
}

/**
 * Check if path is a directory
 */
export async function isDirectory(filepath: string): Promise<boolean> {
  try {
    const stats = await stat(filepath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if path is a file
 */
export async function isFile(filepath: string): Promise<boolean> {
  try {
    const stats = await stat(filepath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Recursively list all files in a directory
 */
export async function listFilesRecursive(
  dirpath: string,
  filter?: (filepath: string) => boolean
): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dirpath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirpath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await listFilesRecursive(fullPath, filter);
      files.push(...subFiles);
    } else {
      if (!filter || filter(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Create a temporary directory
 */
export async function createTempDir(prefix: string = 'docjays-'): Promise<string> {
  const tmpDir = path.join(process.cwd(), '.tmp');
  await ensureDir(tmpDir);

  const tempPath = path.join(tmpDir, `${prefix}${Date.now()}`);
  await ensureDir(tempPath);

  return tempPath;
}

/**
 * Clean up old temporary directories
 */
export async function cleanupTempDirs(): Promise<void> {
  const tmpDir = path.join(process.cwd(), '.tmp');

  if (await pathExists(tmpDir)) {
    const entries = await readdir(tmpDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(tmpDir, entry.name);
        const stats = await stat(dirPath);
        const age = Date.now() - stats.mtimeMs;

        // Remove directories older than 1 hour
        if (age > 3600000) {
          await remove(dirPath);
        }
      }
    }
  }
}
