import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ResourceProvider } from './resources';
import { ConfigManager } from '../core/config';

/**
 * Tool Provider
 * Provides tools for Claude to interact with DocJays documentation
 */
export class ToolProvider {
  private resourceProvider: ResourceProvider;
  private configManager: ConfigManager;

  constructor(basePath: string = process.cwd()) {
    this.resourceProvider = new ResourceProvider(basePath);
    this.configManager = new ConfigManager(basePath);
  }

  /**
   * List all available tools
   */
  async list(): Promise<Tool[]> {
    return [
      {
        name: 'search_docs',
        description: 'Search across all documentation sources for a query string',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string',
            },
            source: {
              type: 'string',
              description: 'Optional: specific source name to search within',
            },
            caseSensitive: {
              type: 'boolean',
              description: 'Whether to perform case-sensitive search (default: false)',
              default: false,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_sources',
        description: 'List all configured documentation sources',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'read_doc',
        description: 'Read the contents of a specific document',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Document path relative to source (e.g., "README.md")',
            },
            source: {
              type: 'string',
              description: 'Source name where the document is located',
            },
          },
          required: ['path', 'source'],
        },
      },
      {
        name: 'list_features',
        description: 'List all feature specifications in this project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_resources',
        description: 'List all available documentation resources',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['sources', 'features', 'context', 'all'],
              description: 'Type of resources to list (default: all)',
              default: 'all',
            },
          },
        },
      },
    ];
  }

  /**
   * Execute a tool
   */
  async call(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_docs':
        return this.searchDocs(args.query, args.source, args.caseSensitive);
      case 'list_sources':
        return this.listSources();
      case 'read_doc':
        return this.readDoc(args.path, args.source);
      case 'list_features':
        return this.listFeatures();
      case 'list_resources':
        return this.listResources(args.type || 'all');
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Search across documentation
   */
  private async searchDocs(
    query: string,
    sourceName?: string,
    caseSensitive: boolean = false
  ): Promise<any> {
    const resources = await this.resourceProvider.list();
    const results = [];

    const searchQuery = caseSensitive ? query : query.toLowerCase();

    for (const resource of resources) {
      // Filter by source if specified
      if (sourceName) {
        if (resource.uri.includes('sources/')) {
          const sourceMatch = resource.uri.match(/sources\/([^/]+)/);
          if (!sourceMatch || sourceMatch[1] !== sourceName) {
            continue;
          }
        } else {
          continue; // Skip non-source resources when source is specified
        }
      }

      try {
        const content = await this.resourceProvider.read(resource.uri);
        const searchContent = caseSensitive ? content : content.toLowerCase();

        if (searchContent.includes(searchQuery)) {
          results.push({
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            excerpt: this.getExcerpt(content, query, caseSensitive),
            matches: this.countMatches(searchContent, searchQuery),
          });
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`Error reading ${resource.uri}:`, error);
      }
    }

    // Sort by number of matches (descending)
    results.sort((a, b) => b.matches - a.matches);

    return {
      query,
      totalResults: results.length,
      results: results.slice(0, 50), // Limit to top 50 results
    };
  }

  /**
   * List all sources
   */
  private async listSources(): Promise<any> {
    try {
      const config = await this.configManager.load();
      return {
        sources: config.sources.map((s) => ({
          name: s.name,
          type: s.type,
          url: s.url,
          enabled: s.enabled,
          hasAuth: !!s.auth,
        })),
        total: config.sources.length,
      };
    } catch (error: any) {
      return {
        sources: [],
        total: 0,
        error: error.message,
      };
    }
  }

  /**
   * Read a specific document
   */
  private async readDoc(docPath: string, sourceName: string): Promise<any> {
    const uri = `docjays://sources/${sourceName}/${docPath}`;

    try {
      const content = await this.resourceProvider.read(uri);
      return {
        source: sourceName,
        path: docPath,
        content,
        length: content.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
  }

  /**
   * List all features
   */
  private async listFeatures(): Promise<any> {
    const resources = await this.resourceProvider.list();
    const features = resources.filter((r) => r.uri.startsWith('docjays://features/'));

    return {
      features: features.map((f) => ({
        name: f.name,
        uri: f.uri,
        description: f.description,
      })),
      total: features.length,
    };
  }

  /**
   * List resources by type
   */
  private async listResources(type: string): Promise<any> {
    const resources = await this.resourceProvider.list();

    let filtered = resources;

    if (type !== 'all') {
      filtered = resources.filter((r) => r.uri.startsWith(`docjays://${type}/`));
    }

    return {
      type,
      resources: filtered.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
      total: filtered.length,
    };
  }

  /**
   * Get excerpt around the search query
   */
  private getExcerpt(
    content: string,
    query: string,
    caseSensitive: boolean = false
  ): string {
    const searchContent = caseSensitive ? content : content.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    const index = searchContent.indexOf(searchQuery);
    if (index === -1) return '';

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + query.length + 100);

    let excerpt = content.substring(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Count number of matches
   */
  private countMatches(content: string, query: string): number {
    let count = 0;
    let pos = 0;

    while ((pos = content.indexOf(query, pos)) !== -1) {
      count++;
      pos += query.length;
    }

    return count;
  }
}
