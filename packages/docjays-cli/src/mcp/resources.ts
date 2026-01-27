import fs from 'fs-extra';
import path from 'path';
import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../core/config';
import { listFilesRecursive } from '../utils/fs';

/**
 * Resource Provider
 * Exposes .docjays contents as MCP resources
 */
export class ResourceProvider {
  private basePath: string;
  private configManager: ConfigManager;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.join(basePath, '.docjays');
    this.configManager = new ConfigManager(basePath);
  }

  /**
   * List all available resources
   */
  async list(): Promise<Resource[]> {
    const resources: Resource[] = [];

    try {
      const config = await this.configManager.load();

      // List all sources
      for (const source of config.sources) {
        if (!source.enabled) continue;

        const sourcePath = path.join(this.basePath, source.path);
        if (await fs.pathExists(sourcePath)) {
          const files = await listFilesRecursive(sourcePath, (file) => {
            // Filter out certain files
            const basename = path.basename(file);
            return !basename.startsWith('.') && !basename.endsWith('.lock');
          });

          for (const file of files) {
            const relativePath = path.relative(sourcePath, file);
            resources.push({
              uri: `docjays://sources/${source.name}/${relativePath}`,
              name: `${source.name}/${relativePath}`,
              description: `Documentation from ${source.name}`,
              mimeType: this.getMimeType(file),
            });
          }
        }
      }

      // List features
      const featuresPath = path.join(this.basePath, 'features');
      if (await fs.pathExists(featuresPath)) {
        const features = await listFilesRecursive(featuresPath, (file) => {
          return !path.basename(file).startsWith('_');
        });

        for (const feature of features) {
          const relativePath = path.relative(featuresPath, feature);
          resources.push({
            uri: `docjays://features/${relativePath}`,
            name: `features/${relativePath}`,
            description: 'Feature specification',
            mimeType: 'text/markdown',
          });
        }
      }

      // List context files
      const contextPath = path.join(this.basePath, 'context');
      if (await fs.pathExists(contextPath)) {
        const contextFiles = await listFilesRecursive(contextPath);

        for (const file of contextFiles) {
          const relativePath = path.relative(contextPath, file);
          resources.push({
            uri: `docjays://context/${relativePath}`,
            name: `context/${relativePath}`,
            description: 'AI context file',
            mimeType: this.getMimeType(file),
          });
        }
      }
    } catch (error: any) {
      // If config not found or error, return empty list
      console.error('Error listing resources:', error.message);
    }

    return resources;
  }

  /**
   * Read a specific resource
   */
  async read(uri: string): Promise<string> {
    // Parse URI: docjays://type/path
    const match = uri.match(/^docjays:\/\/(sources|features|context)\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    const [, type, relativePath] = match;

    let fullPath: string;

    if (type === 'sources') {
      // Extract source name from path
      const parts = relativePath.split('/');
      const sourceName = parts[0];
      const filePath = parts.slice(1).join('/');

      const config = await this.configManager.load();
      const source = config.sources.find((s) => s.name === sourceName);

      if (!source) {
        throw new Error(`Source not found: ${sourceName}`);
      }

      fullPath = path.join(this.basePath, source.path, filePath);
    } else {
      fullPath = path.join(this.basePath, type, relativePath);
    }

    if (!(await fs.pathExists(fullPath))) {
      throw new Error(`Resource not found: ${uri}`);
    }

    // Read file content
    return fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filepath: string): string {
    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'text/xml',
    };

    return mimeTypes[ext] || 'text/plain';
  }
}
