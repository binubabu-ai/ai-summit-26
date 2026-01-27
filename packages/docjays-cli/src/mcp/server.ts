import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ResourceProvider } from './resources';
import { ToolProvider } from './tools';
import { Logger } from '../utils/logger';

/**
 * MCP Server
 * Exposes Docjays documentation to Claude via Model Context Protocol
 */
export class MCPServer {
  private server: Server;
  private resourceProvider: ResourceProvider;
  private toolProvider: ToolProvider;
  private logger: Logger;

  constructor(basePath: string = process.cwd()) {
    this.logger = new Logger();

    // Get version from package.json
    const version = this.getVersion();

    this.server = new Server(
      {
        name: 'docjays',
        version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.resourceProvider = new ResourceProvider(basePath);
    this.toolProvider = new ToolProvider(basePath);

    this.setupHandlers();
    this.setupErrorHandlers();
  }

  /**
   * Set up MCP protocol handlers
   */
  private setupHandlers(): void {
    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.resourceProvider.list();
        return { resources };
      } catch (error: any) {
        this.logger.error(`Error listing resources: ${error.message}`);
        return { resources: [] };
      }
    });

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const content = await this.resourceProvider.read(request.params.uri);
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'text/plain',
              text: content,
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Failed to read resource: ${error.message}`);
      }
    });

    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = await this.toolProvider.list();
        return { tools };
      } catch (error: any) {
        this.logger.error(`Error listing tools: ${error.message}`);
        return { tools: [] };
      }
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.toolProvider.call(
          request.params.name,
          request.params.arguments || {}
        );

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Tool execution failed: ${error.message}`);
      }
    });
  }

  /**
   * Set up error handlers
   */
  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      this.logger.error(`MCP Server error: ${error.message}`);
    };

    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      // Server is now running, but we don't log to stdout
      // because it interferes with stdio communication
      // Logging goes to stderr or to a file
    } catch (error: any) {
      this.logger.error(`Failed to start MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      process.exit(0);
    } catch (error: any) {
      this.logger.error(`Error stopping server: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Get package version
   */
  private getVersion(): string {
    try {
      const packagePath = require.resolve('../../package.json');
      const packageJson = require(packagePath);
      return packageJson.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }
}
