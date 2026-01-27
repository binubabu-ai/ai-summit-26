import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * Structure Manager
 * Creates and manages the .docjays folder structure
 */
export class StructureManager {
  private docjaysPath: string;
  private logger: Logger;

  constructor(basePath: string = process.cwd()) {
    this.docjaysPath = path.join(basePath, '.docjays');
    this.logger = new Logger();
  }

  /**
   * Check if .docjays folder exists
   */
  async exists(): Promise<boolean> {
    return fs.pathExists(this.docjaysPath);
  }

  /**
   * Create the complete .docjays folder structure
   */
  async create(overwrite: boolean = false): Promise<void> {
    if ((await this.exists()) && !overwrite) {
      throw new Error('.docjays folder already exists');
    }

    // Create main directory
    await fs.ensureDir(this.docjaysPath);

    // Create subdirectories
    await this.createSubdirectories();

    // Copy templates
    await this.copyTemplates();

    this.logger.success('.docjays structure created');
  }

  /**
   * Create all subdirectories
   */
  private async createSubdirectories(): Promise<void> {
    const directories = [
      'sources',      // Cloned documentation sources
      'features',     // Feature specifications
      'context',      // AI context files
      'cache',        // Cached data
      'logs',         // Operation logs
      '.keys',        // Encrypted credentials (hidden)
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.docjaysPath, dir);
      await fs.ensureDir(dirPath);

      // Add .gitkeep to empty directories (except .keys)
      if (dir !== '.keys') {
        const gitkeepPath = path.join(dirPath, '.gitkeep');
        await fs.writeFile(gitkeepPath, '');
      }
    }
  }

  /**
   * Copy template files
   */
  private async copyTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, '..', '..', 'templates');

    // Copy README.md
    const readmeSrc = path.join(templatesDir, 'README.md');
    const readmeDest = path.join(this.docjaysPath, 'README.md');
    if (await fs.pathExists(readmeSrc)) {
      await fs.copy(readmeSrc, readmeDest);
    }

    // Copy config.json
    const configSrc = path.join(templatesDir, 'config.json');
    const configDest = path.join(this.docjaysPath, 'config.json');
    if (await fs.pathExists(configSrc)) {
      await fs.copy(configSrc, configDest);
    }

    // Copy feature template
    const featureTemplateSrc = path.join(templatesDir, 'feature-template.md');
    const featureTemplateDest = path.join(
      this.docjaysPath,
      'features',
      '_TEMPLATE.md'
    );
    if (await fs.pathExists(featureTemplateSrc)) {
      await fs.copy(featureTemplateSrc, featureTemplateDest);
    }
  }

  /**
   * Remove the .docjays folder
   */
  async remove(): Promise<void> {
    if (!(await this.exists())) {
      throw new Error('.docjays folder does not exist');
    }

    await fs.remove(this.docjaysPath);
    this.logger.success('.docjays folder removed');
  }

  /**
   * Clean cache and logs
   */
  async clean(): Promise<void> {
    if (!(await this.exists())) {
      throw new Error('.docjays folder does not exist');
    }

    // Clean cache
    const cachePath = path.join(this.docjaysPath, 'cache');
    if (await fs.pathExists(cachePath)) {
      await fs.emptyDir(cachePath);
      await fs.writeFile(path.join(cachePath, '.gitkeep'), '');
    }

    // Clean logs
    const logsPath = path.join(this.docjaysPath, 'logs');
    if (await fs.pathExists(logsPath)) {
      await fs.emptyDir(logsPath);
      await fs.writeFile(path.join(logsPath, '.gitkeep'), '');
    }

    this.logger.success('Cache and logs cleaned');
  }

  /**
   * Get path to a specific directory
   */
  getPath(subdir?: string): string {
    if (!subdir) {
      return this.docjaysPath;
    }
    return path.join(this.docjaysPath, subdir);
  }

  /**
   * Get path to sources directory
   */
  getSourcesPath(): string {
    return this.getPath('sources');
  }

  /**
   * Get path to features directory
   */
  getFeaturesPath(): string {
    return this.getPath('features');
  }

  /**
   * Get path to context directory
   */
  getContextPath(): string {
    return this.getPath('context');
  }

  /**
   * Get path to cache directory
   */
  getCachePath(): string {
    return this.getPath('cache');
  }

  /**
   * Get path to logs directory
   */
  getLogsPath(): string {
    return this.getPath('logs');
  }

  /**
   * Get path to keys directory
   */
  getKeysPath(): string {
    return this.getPath('.keys');
  }

  /**
   * Ensure a directory exists within .docjays
   */
  async ensureDir(subdir: string): Promise<void> {
    const dirPath = this.getPath(subdir);
    await fs.ensureDir(dirPath);
  }

  /**
   * Get folder structure info
   */
  async getInfo(): Promise<{
    exists: boolean;
    size?: number;
    sourceCount?: number;
    featureCount?: number;
    contextCount?: number;
  }> {
    if (!(await this.exists())) {
      return { exists: false };
    }

    const [size, sourceCount, featureCount, contextCount] = await Promise.all([
      this.calculateSize(),
      this.countFiles('sources'),
      this.countFiles('features'),
      this.countFiles('context'),
    ]);

    return {
      exists: true,
      size,
      sourceCount,
      featureCount,
      contextCount,
    };
  }

  /**
   * Calculate total size of .docjays folder
   */
  private async calculateSize(dirPath: string = this.docjaysPath): Promise<number> {
    let size = 0;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await this.calculateSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }

    return size;
  }

  /**
   * Count files in a subdirectory
   */
  private async countFiles(subdir: string): Promise<number> {
    const dirPath = this.getPath(subdir);

    if (!(await fs.pathExists(dirPath))) {
      return 0;
    }

    let count = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name !== '.gitkeep') {
        count++;
      } else if (entry.isDirectory()) {
        const subPath = path.join(dirPath, entry.name);
        count += await this.countFilesRecursive(subPath);
      }
    }

    return count;
  }

  /**
   * Count files recursively
   */
  private async countFilesRecursive(dirPath: string): Promise<number> {
    let count = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        count += await this.countFilesRecursive(fullPath);
      } else if (entry.name !== '.gitkeep') {
        count++;
      }
    }

    return count;
  }
}
