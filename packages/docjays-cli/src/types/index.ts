/**
 * DocJays Type Definitions
 */

export interface DocJaysConfig {
  version: string;
  sources: Source[];
  mcp: MCPConfig;
  sync: SyncConfig;
}

export interface Source {
  name: string;
  type: 'git' | 'http' | 'local';
  url: string;
  branch?: string;
  path: string;
  enabled: boolean;
  auth?: string; // Reference to key name in keystore (e.g., "github-token")
}

export interface SourceAuth {
  type: 'token' | 'ssh';
  token?: string;
}

export interface MCPConfig {
  enabled: boolean;
  transport: 'stdio' | 'http';
  port?: number;
  resources: string[];
}

export interface SyncConfig {
  auto: boolean;
  interval?: string;
  onStart?: boolean;
}

export interface CloneProgress {
  percentage: number;
  message: string;
  stage?: string;
}

export interface CloneOptions {
  force?: boolean;
  onProgress?: (progress: CloneProgress) => void;
}

export interface SyncResult {
  source: string;
  success: boolean;
  error?: Error;
  duration?: number;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface CommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  debug?: boolean;
}
