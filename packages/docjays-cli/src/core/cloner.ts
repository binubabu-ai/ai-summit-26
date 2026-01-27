import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import { Source, CloneOptions, SyncResult } from '../types';
import { Logger } from '../utils/logger';
import { KeyStore } from './auth/keystore';
import { isValidGitUrl, normalizeGitUrl } from '../utils/git';

/**
 * Source Cloner
 * Handles cloning and syncing of documentation sources with authentication
 */
export class SourceCloner {
  private git: SimpleGit;
  private logger: Logger;
  private basePath: string;
  private keyStore: KeyStore;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.join(basePath, '.docjays');
    this.git = simpleGit();
    this.logger = new Logger();
    this.keyStore = new KeyStore(basePath);
  }

  /**
   * Sync a source (clone or update)
   */
  async sync(
    source: Source,
    options: CloneOptions = {},
    masterPassword?: string
  ): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      const targetPath = path.join(this.basePath, source.path);

      switch (source.type) {
        case 'git':
          await this.syncGitSource(source, targetPath, options, masterPassword);
          break;
        case 'http':
          await this.syncHttpSource(source, targetPath, options, masterPassword);
          break;
        case 'local':
          await this.syncLocalSource(source, targetPath, options);
          break;
        default:
          throw new Error(`Unknown source type: ${source.type}`);
      }

      const duration = Date.now() - startTime;
      return { source: source.name, success: true, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return { source: source.name, success: false, error, duration };
    }
  }

  /**
   * Sync a git source
   */
  private async syncGitSource(
    source: Source,
    targetPath: string,
    options: CloneOptions,
    masterPassword?: string
  ): Promise<void> {
    // Get authenticated URL if auth is configured
    const url = await this.getAuthenticatedUrl(source, masterPassword);

    const exists = await fs.pathExists(targetPath);

    if (exists && !options.force) {
      // Pull updates
      await this.pullGitRepo(source, targetPath, options);
    } else {
      // Clone fresh
      await this.cloneGitRepo(source, targetPath, url, options);
    }
  }

  /**
   * Clone a git repository
   */
  private async cloneGitRepo(
    source: Source,
    targetPath: string,
    url: string,
    options: CloneOptions
  ): Promise<void> {
    // Remove existing directory if force option is set
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    await fs.ensureDir(path.dirname(targetPath));

    const cloneOptions: string[] = [];

    // Add branch if specified
    if (source.branch) {
      cloneOptions.push('--branch', source.branch);
    }

    // Shallow clone for faster performance
    cloneOptions.push('--depth', '1');

    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Starting clone...' });
    }

    // Clone with progress tracking
    await new Promise<void>((resolve, reject) => {
      this.git.clone(url, targetPath, cloneOptions, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      // Note: simple-git progress events don't work reliably
      // We'll simulate progress for now
      if (options.onProgress) {
        const progressInterval = setInterval(() => {
          // Simple progress simulation
        }, 100);

        // Clear interval when done
        setTimeout(() => clearInterval(progressInterval), 5000);
      }
    });

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Clone complete' });
    }
  }

  /**
   * Pull updates for an existing git repository
   */
  private async pullGitRepo(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    const repo = simpleGit(targetPath);

    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Fetching updates...' });
    }

    // Fetch latest changes
    await repo.fetch();

    if (options.onProgress) {
      options.onProgress({ percentage: 50, message: 'Pulling changes...' });
    }

    // Pull changes
    const branch = source.branch || 'main';
    try {
      await repo.pull('origin', branch, { '--rebase': 'false' });
    } catch (error: any) {
      // If pull fails, try with master branch as fallback
      if (branch === 'main') {
        try {
          await repo.pull('origin', 'master', { '--rebase': 'false' });
        } catch {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Update complete' });
    }
  }

  /**
   * Sync an HTTP source
   */
  private async syncHttpSource(
    source: Source,
    targetPath: string,
    options: CloneOptions,
    masterPassword?: string
  ): Promise<void> {
    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Downloading...' });
    }

    // Get auth token if configured
    const headers: any = {};
    if (source.auth && masterPassword) {
      const token = await this.keyStore.get(source.auth, masterPassword);
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(source.url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    await fs.ensureDir(targetPath);

    // Determine filename from URL or Content-Disposition header
    const filename = this.getFilenameFromResponse(source.url, response);
    const filepath = path.join(targetPath, filename);

    // Download and save
    const buffer = await response.buffer();
    await fs.writeFile(filepath, buffer);

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Download complete' });
    }
  }

  /**
   * Sync a local source
   */
  private async syncLocalSource(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Copying files...' });
    }

    // Check if source exists
    if (!(await fs.pathExists(source.url))) {
      throw new Error(`Source path does not exist: ${source.url}`);
    }

    // Ensure parent directory exists
    await fs.ensureDir(path.dirname(targetPath));

    // Copy files
    await fs.copy(source.url, targetPath, {
      overwrite: true,
      errorOnExist: false,
    });

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Copy complete' });
    }
  }

  /**
   * Get authenticated URL for git source
   */
  private async getAuthenticatedUrl(
    source: Source,
    masterPassword?: string
  ): Promise<string> {
    let url = source.url;

    // Normalize git URL
    if (source.type === 'git') {
      url = normalizeGitUrl(url);
    }

    // If auth is configured, inject token into URL
    if (source.auth && masterPassword) {
      try {
        const token = await this.keyStore.get(source.auth, masterPassword);

        // For HTTPS URLs, inject token
        if (url.startsWith('https://')) {
          // Remove any existing auth from URL
          url = url.replace(/https:\/\/[^@]*@/, 'https://');
          // Inject token
          url = url.replace('https://', `https://${token}@`);
        }

        // For SSH URLs, token is not used (uses SSH keys from system)
        // Token auth only works for HTTPS
      } catch (error: any) {
        this.logger.warn(`Could not retrieve auth token '${source.auth}': ${error.message}`);
        // Continue without auth
      }
    }

    return url;
  }

  /**
   * Get filename from URL or response headers
   */
  private getFilenameFromResponse(url: string, response: any): string {
    // Try to get from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) {
        return match[1];
      }
    }

    // Fallback to URL basename
    const urlPath = new URL(url).pathname;
    const basename = path.basename(urlPath);

    return basename || 'download';
  }

  /**
   * Validate source before syncing
   */
  async validate(source: Source): Promise<{ valid: boolean; error?: string }> {
    // Validate git URL
    if (source.type === 'git') {
      if (!isValidGitUrl(source.url)) {
        return { valid: false, error: 'Invalid git URL format' };
      }
    }

    // Validate HTTP URL
    if (source.type === 'http') {
      try {
        new URL(source.url);
      } catch {
        return { valid: false, error: 'Invalid HTTP URL format' };
      }
    }

    // Validate local path
    if (source.type === 'local') {
      if (!(await fs.pathExists(source.url))) {
        return { valid: false, error: 'Local path does not exist' };
      }
    }

    // Validate path format
    if (!source.path || source.path.includes('..')) {
      return { valid: false, error: 'Invalid destination path' };
    }

    return { valid: true };
  }
}
