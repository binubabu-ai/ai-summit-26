import simpleGit, { SimpleGit } from 'simple-git';

/**
 * Git utility functions
 */

/**
 * Check if a directory is a git repository
 */
export async function isGitRepo(dirpath: string): Promise<boolean> {
  try {
    const git = simpleGit(dirpath);
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current git branch
 */
export async function getCurrentBranch(dirpath: string): Promise<string | null> {
  try {
    const git = simpleGit(dirpath);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  } catch {
    return null;
  }
}

/**
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(dirpath: string): Promise<boolean> {
  try {
    const git = simpleGit(dirpath);
    const status = await git.status();
    return !status.isClean();
  } catch {
    return false;
  }
}

/**
 * Get the remote URL
 */
export async function getRemoteUrl(
  dirpath: string,
  remote: string = 'origin'
): Promise<string | null> {
  try {
    const git = simpleGit(dirpath);
    const remotes = await git.getRemotes(true);
    const remoteObj = remotes.find((r) => r.name === remote);
    return remoteObj?.refs.fetch || null;
  } catch {
    return null;
  }
}

/**
 * Get the last commit hash
 */
export async function getLastCommitHash(dirpath: string): Promise<string | null> {
  try {
    const git = simpleGit(dirpath);
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash || null;
  } catch {
    return null;
  }
}

/**
 * Check if a git URL is valid
 */
export function isValidGitUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/.+\.git$/,
    /^https?:\/\/(github|gitlab|bitbucket)\.com\/.+\/.+$/,
    /^git@.+:.+\.git$/,
    /^git@(github|gitlab|bitbucket)\.com:.+\/.+$/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}

/**
 * Normalize git URL (ensure it works with git clone)
 */
export function normalizeGitUrl(url: string): string {
  // Remove trailing slash
  url = url.replace(/\/$/, '');

  // Add .git if it's a GitHub/GitLab/Bitbucket URL without it
  if (
    (url.includes('github.com') ||
      url.includes('gitlab.com') ||
      url.includes('bitbucket.com')) &&
    !url.endsWith('.git')
  ) {
    url = `${url}.git`;
  }

  return url;
}

/**
 * Create a SimpleGit instance
 */
export function createGit(baseDir?: string): SimpleGit {
  return simpleGit(baseDir);
}
