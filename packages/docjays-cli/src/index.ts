/**
 * Docjays CLI - Main Entry Point
 * Export public API for programmatic usage
 */

// CLI
export { DocjaysCLI } from './cli';

// Core modules
export { ConfigManager } from './core/config';
export { StructureManager } from './core/structure';
export { GitIgnoreManager } from './core/gitignore';
export { SourceCloner } from './core/cloner';

// Auth
export { KeyStore, KeyType } from './core/auth/keystore';
export { CryptoManager } from './core/auth/crypto';

// MCP Server
export { MCPServer } from './mcp/server';
export { ResourceProvider } from './mcp/resources';
export { ToolProvider } from './mcp/tools';

// Types
export * from './types';

// Utils
export { Logger } from './utils/logger';
