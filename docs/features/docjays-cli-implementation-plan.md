# Docjays CLI - Complete Implementation Plan (FE/BE/Docs)

**Created**: 2026-01-27
**Status**: Implementation Ready
**Feature Branch**: `feature/docjays-cli-monorepo`

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend (CLI Interface & UX)](#frontend-cli-interface--ux)
3. [Backend (Core Logic & MCP)](#backend-core-logic--mcp)
4. [Documentation Structure](#documentation-structure)
5. [Implementation Phases](#implementation-phases)
6. [File Structure](#file-structure)
7. [API Reference](#api-reference)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       User Terminal                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND LAYER (CLI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CLI Framework (Commander.js)                         │  │
│  │  - Command Parser & Router                            │  │
│  │  - Interactive Prompts (Inquirer)                     │  │
│  │  - Progress Indicators (Ora)                          │  │
│  │  - Terminal UI (Chalk, Boxen)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Config     │  │   Source     │  │  Structure   │     │
│  │  Manager     │  │   Cloner     │  │  Manager     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Validator   │  │   GitIgnore  │  │   Watcher    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP SERVER LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MCP Protocol Handler (stdio/HTTP)                    │  │
│  │  - Resources (sources, features, context)             │  │
│  │  - Tools (search, list, read)                         │  │
│  │  - Lifecycle Management                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA/STORAGE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  .docjays/   │  │    Git       │  │    HTTP      │     │
│  │  Filesystem  │  │  Repositories│  │   Sources    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Claude    │  │    GitHub    │  │     HTTP     │     │
│  │   Desktop    │  │   API/Repos  │  │   Servers    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User runs: docjays init
    ↓
CLI Parser validates command & flags
    ↓
InitCommand collects user input (prompts)
    ↓
StructureManager creates .docjays/ folders
    ↓
ConfigManager generates config.json
    ↓
GitIgnoreManager adds .docjays to .gitignore
    ↓
TemplateManager copies template files
    ↓
Logger outputs success message & next steps
```

---

## Frontend (CLI Interface & UX)

### 1. CLI Framework Setup

**File**: `packages/docjays-cli/src/cli/index.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { InitCommand } from './commands/init';
import { SyncCommand } from './commands/sync';
import { ServeCommand } from './commands/serve';
// ... other imports

export class DocjaysCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram() {
    this.program
      .name('docjays')
      .description('Documentation management for AI-assisted development')
      .version(this.getVersion(), '-v, --version', 'Output the current version')
      .helpOption('-h, --help', 'Display help for command');

    this.registerCommands();
  }

  private registerCommands() {
    // Init command
    new InitCommand(this.program).register();

    // Sync command
    new SyncCommand(this.program).register();

    // Serve command
    new ServeCommand(this.program).register();

    // Additional commands...
  }

  public async run(argv: string[]) {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      this.handleError(error);
      process.exit(1);
    }
  }

  private handleError(error: any) {
    console.error(chalk.red('✗ Error:'), error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
  }

  private getVersion(): string {
    // Read from package.json
    return require('../../package.json').version;
  }
}
```

**Entry Point**: `packages/docjays-cli/bin/docjays.js`

```javascript
#!/usr/bin/env node

const { DocjaysCLI } = require('../dist/cli/index.js');

const cli = new DocjaysCLI();
cli.run(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### 2. Command Structure

Each command follows this pattern:

**Base Command Class**: `packages/docjays-cli/src/cli/commands/base.ts`

```typescript
import { Command } from 'commander';
import { Logger } from '../../utils/logger';

export abstract class BaseCommand {
  protected logger: Logger;

  constructor(protected program: Command) {
    this.logger = new Logger();
  }

  abstract register(): void;
  abstract execute(...args: any[]): Promise<void>;

  protected handleError(error: Error, context?: string) {
    this.logger.error(error.message, context);
    throw error;
  }
}
```

### 3. Interactive UI Components

**Init Command with Prompts**: `packages/docjays-cli/src/cli/commands/init.ts`

```typescript
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import { BaseCommand } from './base';
import { StructureManager } from '../../core/structure';
import { ConfigManager } from '../../core/config';

export class InitCommand extends BaseCommand {
  register() {
    this.program
      .command('init')
      .description('Initialize Docjays in the current project')
      .option('-y, --yes', 'Skip prompts and use defaults')
      .option('--no-gitignore', 'Skip updating .gitignore')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any) {
    this.logger.info('Initializing Docjays...');

    // Check if already initialized
    if (await this.isInitialized()) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '.docjays already exists. Overwrite?',
          default: false
        }
      ]);

      if (!overwrite) {
        this.logger.warn('Initialization cancelled.');
        return;
      }
    }

    // Interactive prompts (if not --yes)
    const config = options.yes
      ? this.getDefaultConfig()
      : await this.promptForConfig();

    // Create structure with spinner
    const spinner = ora('Creating .docjays structure...').start();
    try {
      const structureManager = new StructureManager();
      await structureManager.create();
      spinner.succeed('Created .docjays structure');
    } catch (error) {
      spinner.fail('Failed to create structure');
      throw error;
    }

    // Generate config
    const configSpinner = ora('Generating configuration...').start();
    try {
      const configManager = new ConfigManager();
      await configManager.initialize(config);
      configSpinner.succeed('Generated config.json');
    } catch (error) {
      configSpinner.fail('Failed to generate config');
      throw error;
    }

    // Update .gitignore
    if (options.gitignore !== false) {
      const gitignoreSpinner = ora('Updating .gitignore...').start();
      try {
        const { GitIgnoreManager } = await import('../../core/gitignore');
        await GitIgnoreManager.addDocjays();
        gitignoreSpinner.succeed('Updated .gitignore');
      } catch (error) {
        gitignoreSpinner.warn('.gitignore not updated');
      }
    }

    // Success message
    this.showSuccessMessage();
  }

  private showSuccessMessage() {
    const message = `
${chalk.green.bold('✓ Docjays initialized successfully!')}

Next steps:
  ${chalk.cyan('1.')} Add documentation sources:
     ${chalk.dim('docjays add-source --name docs --url <repo-url>')}

  ${chalk.cyan('2.')} Sync documentation:
     ${chalk.dim('docjays sync')}

  ${chalk.cyan('3.')} Start MCP server for Claude:
     ${chalk.dim('docjays serve')}

Learn more: ${chalk.underline('https://docjays.dev/getting-started')}
    `;

    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green'
    }));
  }

  private async promptForConfig() {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableMCP',
        message: 'Enable MCP server for Claude integration?',
        default: true
      },
      {
        type: 'confirm',
        name: 'autoSync',
        message: 'Enable automatic syncing of sources?',
        default: false
      },
      {
        type: 'input',
        name: 'syncInterval',
        message: 'Sync interval (e.g., 1h, 30m):',
        default: '1h',
        when: (answers) => answers.autoSync
      }
    ]);

    return answers;
  }

  private getDefaultConfig() {
    return {
      enableMCP: true,
      autoSync: false,
      syncInterval: '1h'
    };
  }

  private async isInitialized(): Promise<boolean> {
    const fs = await import('fs-extra');
    return fs.pathExists('.docjays');
  }
}
```

### 4. Progress Indicators & Status Display

**Sync Command with Progress**: `packages/docjays-cli/src/cli/commands/sync.ts`

```typescript
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { BaseCommand } from './base';
import { SourceCloner } from '../../core/cloner';
import { ConfigManager } from '../../core/config';

export class SyncCommand extends BaseCommand {
  register() {
    this.program
      .command('sync')
      .description('Sync documentation sources')
      .option('-s, --source <name>', 'Sync specific source')
      .option('-f, --force', 'Force re-clone')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any) {
    const configManager = new ConfigManager();
    const config = await configManager.load();

    const sources = options.source
      ? config.sources.filter(s => s.name === options.source)
      : config.sources.filter(s => s.enabled);

    if (sources.length === 0) {
      this.logger.warn('No sources to sync');
      return;
    }

    this.logger.info(`Syncing ${sources.length} source(s)...`);
    console.log(''); // Empty line

    const progressBar = new cliProgress.MultiBar({
      format: '{bar} | {source} | {status}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    const cloner = new SourceCloner();
    const results = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const bar = progressBar.create(100, 0, {
        source: source.name,
        status: 'Starting...'
      });

      try {
        await cloner.sync(source, {
          force: options.force,
          onProgress: (progress) => {
            bar.update(progress.percentage, {
              status: progress.message
            });
          }
        });

        bar.update(100, { status: chalk.green('✓ Synced') });
        results.push({ source: source.name, success: true });
      } catch (error) {
        bar.update(100, { status: chalk.red('✗ Failed') });
        results.push({ source: source.name, success: false, error });
      }
    }

    progressBar.stop();
    console.log(''); // Empty line

    this.showSyncResults(results);
  }

  private showSyncResults(results: any[]) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(chalk.bold('Sync Summary:'));
    console.log(`  ${chalk.green('✓')} Successful: ${successful}`);
    if (failed > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${failed}`);
      console.log('');
      console.log(chalk.yellow('Failed sources:'));
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.source}: ${r.error.message}`);
        });
    }
  }
}
```

### 5. Help System & Documentation

**Built-in Help**: Auto-generated by Commander.js

```bash
$ docjays --help

Usage: docjays [options] [command]

Documentation management for AI-assisted development

Options:
  -v, --version          Output the current version
  -h, --help             Display help for command

Commands:
  init [options]         Initialize Docjays in the current project
  sync [options]         Sync documentation sources
  add-source [options]   Add a documentation source
  remove-source <name>   Remove a documentation source
  list-sources           List all configured sources
  serve [options]        Start MCP server
  watch [options]        Watch and auto-sync sources
  status                 Show sync status
  clean [options]        Remove .docjays folder
  config <action> [key]  Manage configuration
  help [command]         Display help for command
```

**Command-specific Help**:

```bash
$ docjays sync --help

Usage: docjays sync [options]

Sync documentation sources

Options:
  -s, --source <name>  Sync specific source
  -f, --force          Force re-clone
  -h, --help           Display help for command

Examples:
  $ docjays sync
  $ docjays sync --source docs
  $ docjays sync --force
```

### 6. Error Handling & User Feedback

**Error Display with Context**: `packages/docjays-cli/src/utils/logger.ts`

```typescript
import chalk from 'chalk';
import figures from 'figures';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, context?: string) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`${figures.info} [DEBUG] ${this.formatMessage(message, context)}`));
    }
  }

  info(message: string, context?: string) {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`${figures.info} ${this.formatMessage(message, context)}`));
    }
  }

  success(message: string, context?: string) {
    console.log(chalk.green(`${figures.tick} ${this.formatMessage(message, context)}`));
  }

  warn(message: string, context?: string) {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow(`${figures.warning} ${this.formatMessage(message, context)}`));
    }
  }

  error(message: string, context?: string) {
    console.error(chalk.red(`${figures.cross} ${this.formatMessage(message, context)}`));
  }

  private formatMessage(message: string, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }

  table(data: any[]) {
    console.table(data);
  }

  json(data: any) {
    console.log(JSON.stringify(data, null, 2));
  }
}
```

---

## Backend (Core Logic & MCP)

### 1. Configuration Management

**File**: `packages/docjays-cli/src/core/config.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import Ajv from 'ajv';
import { DocjaysConfig, Source, MCPConfig, SyncConfig } from '../types';

export class ConfigManager {
  private configPath: string;
  private config: DocjaysConfig | null = null;
  private ajv: Ajv;

  constructor(basePath: string = process.cwd()) {
    this.configPath = path.join(basePath, '.docjays', 'config.json');
    this.ajv = new Ajv();
  }

  async initialize(options: any = {}): Promise<void> {
    const defaultConfig = this.getDefaultConfig();
    const config = { ...defaultConfig, ...options };

    await this.save(config);
  }

  async load(): Promise<DocjaysConfig> {
    if (this.config) {
      return this.config;
    }

    if (!await fs.pathExists(this.configPath)) {
      throw new Error('Docjays not initialized. Run "docjays init" first.');
    }

    const content = await fs.readFile(this.configPath, 'utf-8');
    const config = JSON.parse(content);

    this.validate(config);
    this.config = config;
    return config;
  }

  async save(config: DocjaysConfig): Promise<void> {
    this.validate(config);

    const dir = path.dirname(this.configPath);
    await fs.ensureDir(dir);
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));

    this.config = config;
  }

  async addSource(source: Source): Promise<void> {
    const config = await this.load();

    // Check for duplicate
    if (config.sources.find(s => s.name === source.name)) {
      throw new Error(`Source "${source.name}" already exists`);
    }

    config.sources.push(source);
    await this.save(config);
  }

  async removeSource(name: string): Promise<void> {
    const config = await this.load();
    config.sources = config.sources.filter(s => s.name !== name);
    await this.save(config);
  }

  async updateSource(name: string, updates: Partial<Source>): Promise<void> {
    const config = await this.load();
    const source = config.sources.find(s => s.name === name);

    if (!source) {
      throw new Error(`Source "${name}" not found`);
    }

    Object.assign(source, updates);
    await this.save(config);
  }

  async get(key: string): Promise<any> {
    const config = await this.load();
    return this.getNestedValue(config, key);
  }

  async set(key: string, value: any): Promise<void> {
    const config = await this.load();
    this.setNestedValue(config, key, value);
    await this.save(config);
  }

  private validate(config: any): void {
    const schema = this.getSchema();
    const valid = this.ajv.validate(schema, config);

    if (!valid) {
      throw new Error(`Invalid configuration: ${this.ajv.errorsText()}`);
    }
  }

  private getDefaultConfig(): DocjaysConfig {
    return {
      version: '1.0.0',
      sources: [],
      mcp: {
        enabled: true,
        transport: 'stdio',
        resources: ['sources', 'features', 'context']
      },
      sync: {
        auto: false,
        interval: '1h',
        onStart: false
      }
    };
  }

  private getSchema() {
    return {
      type: 'object',
      required: ['version', 'sources', 'mcp', 'sync'],
      properties: {
        version: { type: 'string' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'url', 'path', 'enabled'],
            properties: {
              name: { type: 'string' },
              type: { enum: ['git', 'http', 'local'] },
              url: { type: 'string' },
              branch: { type: 'string' },
              path: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        mcp: {
          type: 'object',
          required: ['enabled', 'transport', 'resources'],
          properties: {
            enabled: { type: 'boolean' },
            transport: { enum: ['stdio', 'http'] },
            port: { type: 'number' },
            resources: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        sync: {
          type: 'object',
          required: ['auto'],
          properties: {
            auto: { type: 'boolean' },
            interval: { type: 'string' },
            onStart: { type: 'boolean' }
          }
        }
      }
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
```

### 2. Source Cloning (Git & HTTP)

**File**: `packages/docjays-cli/src/core/cloner.ts`

```typescript
import simpleGit, { SimpleGit, SimpleGitProgressEvent } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import { Source } from '../types';
import { Logger } from '../utils/logger';

export interface CloneProgress {
  percentage: number;
  message: string;
}

export interface CloneOptions {
  force?: boolean;
  onProgress?: (progress: CloneProgress) => void;
}

export class SourceCloner {
  private git: SimpleGit;
  private logger: Logger;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.join(basePath, '.docjays');
    this.git = simpleGit();
    this.logger = new Logger();
  }

  async sync(source: Source, options: CloneOptions = {}): Promise<void> {
    const targetPath = path.join(this.basePath, source.path);

    switch (source.type) {
      case 'git':
        await this.syncGitSource(source, targetPath, options);
        break;
      case 'http':
        await this.syncHttpSource(source, targetPath, options);
        break;
      case 'local':
        await this.syncLocalSource(source, targetPath, options);
        break;
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }

  private async syncGitSource(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    const exists = await fs.pathExists(targetPath);

    if (exists && !options.force) {
      // Pull updates
      await this.pullGitRepo(source, targetPath, options);
    } else {
      // Clone fresh
      await this.cloneGitRepo(source, targetPath, options);
    }
  }

  private async cloneGitRepo(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
    }

    await fs.ensureDir(path.dirname(targetPath));

    const cloneOptions = {
      '--branch': source.branch || 'main',
      '--depth': 1 // Shallow clone
    };

    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Starting clone...' });
    }

    await this.git.clone(source.url, targetPath, cloneOptions, (progress) => {
      if (options.onProgress && progress) {
        const percentage = this.calculateGitProgress(progress);
        options.onProgress({
          percentage,
          message: `Cloning: ${progress.stage} ${progress.progress}/${progress.total || '?'}`
        });
      }
    });

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Clone complete' });
    }
  }

  private async pullGitRepo(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    const repo = simpleGit(targetPath);

    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Fetching updates...' });
    }

    await repo.fetch();

    if (options.onProgress) {
      options.onProgress({ percentage: 50, message: 'Pulling changes...' });
    }

    const branch = source.branch || 'main';
    await repo.pull('origin', branch);

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Update complete' });
    }
  }

  private async syncHttpSource(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Downloading...' });
    }

    const response = await fetch(source.url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    await fs.ensureDir(targetPath);

    const filename = path.basename(source.url);
    const filepath = path.join(targetPath, filename);

    const buffer = await response.buffer();
    await fs.writeFile(filepath, buffer);

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Download complete' });
    }
  }

  private async syncLocalSource(
    source: Source,
    targetPath: string,
    options: CloneOptions
  ): Promise<void> {
    if (options.onProgress) {
      options.onProgress({ percentage: 0, message: 'Copying files...' });
    }

    await fs.ensureDir(path.dirname(targetPath));
    await fs.copy(source.url, targetPath, {
      overwrite: true,
      errorOnExist: false
    });

    if (options.onProgress) {
      options.onProgress({ percentage: 100, message: 'Copy complete' });
    }
  }

  private calculateGitProgress(progress: SimpleGitProgressEvent): number {
    if (!progress.total) return 0;
    return Math.round((progress.progress / progress.total) * 100);
  }
}
```

### 3. MCP Server Implementation

**File**: `packages/docjays-cli/src/mcp/server.ts`

```typescript
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
import { ConfigManager } from '../core/config';
import { Logger } from '../utils/logger';

export class MCPServer {
  private server: Server;
  private resourceProvider: ResourceProvider;
  private toolProvider: ToolProvider;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: 'docjays',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.logger = new Logger();
    this.resourceProvider = new ResourceProvider();
    this.toolProvider = new ToolProvider();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List resources
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async () => {
        const resources = await this.resourceProvider.list();
        return { resources };
      }
    );

    // Read resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
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
      }
    );

    // List tools
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        const tools = await this.toolProvider.list();
        return { tools };
      }
    );

    // Call tool
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const result = await this.toolProvider.call(
          request.params.name,
          request.params.arguments || {}
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );
  }

  async start() {
    this.logger.info('Starting Docjays MCP server...');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.success('MCP server running on stdio transport');
    this.logger.info('Waiting for client connection...');
    this.logger.info('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop() {
    this.logger.info('Shutting down MCP server...');
    await this.server.close();
    this.logger.success('Server stopped');
    process.exit(0);
  }
}
```

**Resources Provider**: `packages/docjays-cli/src/mcp/resources.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../core/config';

export class ResourceProvider {
  private basePath: string;
  private configManager: ConfigManager;

  constructor(basePath: string = process.cwd()) {
    this.basePath = path.join(basePath, '.docjays');
    this.configManager = new ConfigManager(basePath);
  }

  async list(): Promise<Resource[]> {
    const config = await this.configManager.load();
    const resources: Resource[] = [];

    // List all sources
    for (const source of config.sources) {
      const sourcePath = path.join(this.basePath, source.path);
      if (await fs.pathExists(sourcePath)) {
        const files = await this.listFilesRecursive(sourcePath);
        for (const file of files) {
          const relativePath = path.relative(sourcePath, file);
          resources.push({
            uri: `docjays://sources/${source.name}/${relativePath}`,
            name: relativePath,
            description: `From ${source.name}`,
            mimeType: this.getMimeType(file),
          });
        }
      }
    }

    // List features
    const featuresPath = path.join(this.basePath, 'features');
    if (await fs.pathExists(featuresPath)) {
      const features = await this.listFilesRecursive(featuresPath);
      for (const feature of features) {
        const relativePath = path.relative(featuresPath, feature);
        resources.push({
          uri: `docjays://features/${relativePath}`,
          name: relativePath,
          description: 'Feature specification',
          mimeType: 'text/markdown',
        });
      }
    }

    // List context files
    const contextPath = path.join(this.basePath, 'context');
    if (await fs.pathExists(contextPath)) {
      const contextFiles = await this.listFilesRecursive(contextPath);
      for (const file of contextFiles) {
        const relativePath = path.relative(contextPath, file);
        resources.push({
          uri: `docjays://context/${relativePath}`,
          name: relativePath,
          description: 'AI context file',
          mimeType: 'text/markdown',
        });
      }
    }

    return resources;
  }

  async read(uri: string): Promise<string> {
    // Parse URI: docjays://type/path
    const match = uri.match(/^docjays:\/\/(sources|features|context)\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid URI: ${uri}`);
    }

    const [, type, relativePath] = match;

    let fullPath: string;
    if (type === 'sources') {
      // Extract source name from path
      const parts = relativePath.split('/');
      const sourceName = parts[0];
      const filePath = parts.slice(1).join('/');

      const config = await this.configManager.load();
      const source = config.sources.find(s => s.name === sourceName);
      if (!source) {
        throw new Error(`Source not found: ${sourceName}`);
      }

      fullPath = path.join(this.basePath, source.path, filePath);
    } else {
      fullPath = path.join(this.basePath, type, relativePath);
    }

    if (!await fs.pathExists(fullPath)) {
      throw new Error(`File not found: ${uri}`);
    }

    return fs.readFile(fullPath, 'utf-8');
  }

  private async listFilesRecursive(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.listFilesRecursive(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private getMimeType(filepath: string): string {
    const ext = path.extname(filepath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
    };
    return mimeTypes[ext] || 'text/plain';
  }
}
```

**Tools Provider**: `packages/docjays-cli/src/mcp/tools.ts`

```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ResourceProvider } from './resources';
import { ConfigManager } from '../core/config';

export class ToolProvider {
  private resourceProvider: ResourceProvider;
  private configManager: ConfigManager;

  constructor() {
    this.resourceProvider = new ResourceProvider();
    this.configManager = new ConfigManager();
  }

  async list(): Promise<Tool[]> {
    return [
      {
        name: 'search_docs',
        description: 'Search across all documentation sources',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            source: {
              type: 'string',
              description: 'Optional: specific source to search',
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
        description: 'Read a specific document by path',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Document path (relative to source)',
            },
            source: {
              type: 'string',
              description: 'Source name',
            },
          },
          required: ['path', 'source'],
        },
      },
      {
        name: 'list_features',
        description: 'List all feature specifications',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async call(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_docs':
        return this.searchDocs(args.query, args.source);
      case 'list_sources':
        return this.listSources();
      case 'read_doc':
        return this.readDoc(args.path, args.source);
      case 'list_features':
        return this.listFeatures();
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async searchDocs(query: string, source?: string): Promise<any> {
    const resources = await this.resourceProvider.list();
    const results = [];

    for (const resource of resources) {
      // Filter by source if specified
      if (source && !resource.uri.includes(`sources/${source}`)) {
        continue;
      }

      try {
        const content = await this.resourceProvider.read(resource.uri);
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            uri: resource.uri,
            name: resource.name,
            excerpt: this.getExcerpt(content, query),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return { results, total: results.length };
  }

  private async listSources(): Promise<any> {
    const config = await this.configManager.load();
    return {
      sources: config.sources.map(s => ({
        name: s.name,
        type: s.type,
        url: s.url,
        enabled: s.enabled,
      })),
    };
  }

  private async readDoc(docPath: string, source: string): Promise<any> {
    const uri = `docjays://sources/${source}/${docPath}`;
    const content = await this.resourceProvider.read(uri);
    return { content };
  }

  private async listFeatures(): Promise<any> {
    const resources = await this.resourceProvider.list();
    const features = resources.filter(r => r.uri.startsWith('docjays://features/'));
    return {
      features: features.map(f => ({
        name: f.name,
        uri: f.uri,
      })),
    };
  }

  private getExcerpt(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return '';

    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + query.length + 100);

    return '...' + content.substring(start, end) + '...';
  }
}
```

### 4. File Watching

**File**: `packages/docjays-cli/src/core/watcher.ts`

```typescript
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { ConfigManager } from './config';
import { SourceCloner } from './cloner';
import { Logger } from '../utils/logger';

export class SourceWatcher {
  private watcher: FSWatcher | null = null;
  private configManager: ConfigManager;
  private cloner: SourceCloner;
  private logger: Logger;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    this.configManager = new ConfigManager(basePath);
    this.cloner = new SourceCloner(basePath);
    this.logger = new Logger();
  }

  async start() {
    const config = await this.configManager.load();

    if (!config.sync.auto) {
      throw new Error('Auto-sync is not enabled in configuration');
    }

    this.logger.info('Starting watch mode...');

    // Watch config file for changes
    const configPath = path.join(this.basePath, '.docjays', 'config.json');

    this.watcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', async () => {
      this.logger.info('Config changed, resyncing...');
      await this.syncAll();
    });

    // Start periodic sync
    this.startPeriodicSync(config.sync.interval || '1h');

    // Initial sync
    await this.syncAll();

    this.logger.success('Watch mode active');
    this.logger.info('Press Ctrl+C to stop');
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.logger.success('Watch mode stopped');
  }

  private startPeriodicSync(interval: string) {
    const ms = this.parseInterval(interval);
    setInterval(async () => {
      this.logger.info('Periodic sync triggered');
      await this.syncAll();
    }, ms);
  }

  private async syncAll() {
    try {
      const config = await this.configManager.load();
      const sources = config.sources.filter(s => s.enabled);

      for (const source of sources) {
        await this.cloner.sync(source);
      }

      this.logger.success(`Synced ${sources.length} source(s)`);
    } catch (error: any) {
      this.logger.error(`Sync failed: ${error.message}`);
    }
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(h|m|s)$/);
    if (!match) {
      throw new Error(`Invalid interval format: ${interval}`);
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'h':
        return num * 60 * 60 * 1000;
      case 'm':
        return num * 60 * 1000;
      case 's':
        return num * 1000;
      default:
        return 60 * 60 * 1000; // Default 1 hour
    }
  }
}
```

---

## Documentation Structure

### 1. In-App Documentation

**Auto-generated README**: `templates/README.md`

```markdown
# Docjays - Documentation Manager

This `.docjays/` folder contains all documentation, feature specifications, and AI context for this project. It's automatically managed by the Docjays CLI and is git-ignored by default.

## 📁 Folder Structure

- **sources/** - Cloned documentation from configured sources
- **features/** - Feature specifications for this project
- **context/** - AI context files (architecture, conventions, etc.)
- **cache/** - Cached data and embeddings
- **logs/** - Operation logs

## 🔧 Configuration

Edit `config.json` to manage documentation sources and settings.

### Adding Sources

```bash
docjays add-source --name my-docs --type git --url https://github.com/org/docs
```

### Syncing Documentation

```bash
docjays sync
```

### Starting MCP Server for Claude

```bash
docjays serve
```

## 📚 Learn More

- [Docjays Documentation](https://docjays.dev)
- [Getting Started Guide](https://docjays.dev/getting-started)
- [Configuration Reference](https://docjays.dev/configuration)

## ⚠️ Important

**Do not manually edit files in `sources/`** - they will be overwritten on sync.
Use `features/` and `context/` for project-specific documentation.
```

### 2. CLI Help System

Built into each command using Commander.js:

```typescript
// Example: packages/docjays-cli/src/cli/commands/init.ts
register() {
  this.program
    .command('init')
    .description('Initialize Docjays in the current project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--no-gitignore', 'Skip updating .gitignore')
    .addHelpText('after', `
Examples:
  $ docjays init
  $ docjays init --yes
  $ docjays init --no-gitignore

Learn more: https://docjays.dev/cli/init
    `)
    .action(async (options) => {
      await this.execute(options);
    });
}
```

### 3. Package README

**File**: `packages/docjays-cli/README.md`

```markdown
# Docjays CLI

Documentation management for AI-assisted development.

## Installation

```bash
npm install -g docjays
```

## Quick Start

```bash
# Initialize in your project
docjays init

# Add documentation sources
docjays add-source --name docs --type git --url https://github.com/myorg/docs

# Sync documentation
docjays sync

# Start MCP server for Claude
docjays serve
```

## Commands

- `docjays init` - Initialize Docjays
- `docjays sync` - Sync documentation sources
- `docjays add-source` - Add a documentation source
- `docjays serve` - Start MCP server
- `docjays watch` - Watch and auto-sync
- `docjays status` - Show sync status
- `docjays clean` - Remove .docjays folder

## Documentation

Full documentation: https://docjays.dev

## License

MIT
```

### 4. API Documentation

**File**: `packages/docjays-cli/docs/api.md`

Auto-generated using TypeDoc or manual documentation for all public APIs.

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up monorepo structure
- Configure npm workspaces
- Initialize TypeScript
- Create basic CLI framework
- Implement logger and utilities

### Phase 2: Core Features (Week 2)
- Implement configuration management
- Build source cloning (git + HTTP)
- Create folder structure manager
- Add init and sync commands

### Phase 3: MCP Integration (Week 3)
- Implement MCP server
- Create resource providers
- Build tool providers
- Add serve command

### Phase 4: Advanced Features (Week 4)
- Add watch mode
- Implement additional commands
- Build status and list commands
- Add configuration CLI

### Phase 5: Testing (Week 5)
- Write unit tests
- Create integration tests
- Build E2E tests
- Set up CI/CD

### Phase 6: Documentation & Polish (Week 6)
- Write comprehensive docs
- Create usage examples
- Polish CLI UX
- Prepare for npm publishing

---

## File Structure Summary

```
packages/docjays-cli/
├── package.json
├── tsconfig.json
├── README.md
├── bin/
│   └── docjays.js                     # CLI entry point
├── src/
│   ├── cli/
│   │   ├── index.ts                   # CLI main class
│   │   └── commands/
│   │       ├── base.ts                # Base command class
│   │       ├── init.ts                # Init command
│   │       ├── sync.ts                # Sync command
│   │       ├── add-source.ts          # Add source command
│   │       ├── serve.ts               # MCP serve command
│   │       ├── watch.ts               # Watch command
│   │       ├── status.ts              # Status command
│   │       ├── list-sources.ts        # List sources command
│   │       └── clean.ts               # Clean command
│   ├── core/
│   │   ├── config.ts                  # Configuration manager
│   │   ├── cloner.ts                  # Source cloning logic
│   │   ├── structure.ts               # Folder structure manager
│   │   ├── gitignore.ts               # .gitignore manager
│   │   ├── validator.ts               # Config validator
│   │   └── watcher.ts                 # File watcher
│   ├── mcp/
│   │   ├── server.ts                  # MCP server
│   │   ├── resources.ts               # Resource provider
│   │   └── tools.ts                   # Tool provider
│   ├── utils/
│   │   ├── logger.ts                  # Logger utility
│   │   ├── fs.ts                      # File system helpers
│   │   └── git.ts                     # Git helpers
│   └── types/
│       └── index.ts                   # TypeScript types
├── templates/
│   ├── config.json                    # Config template
│   ├── README.md                      # README template
│   └── feature-template.md            # Feature spec template
├── tests/
│   ├── unit/
│   │   ├── cli/
│   │   ├── core/
│   │   └── mcp/
│   ├── integration/
│   │   ├── init.test.ts
│   │   ├── sync.test.ts
│   │   └── serve.test.ts
│   └── fixtures/
└── docs/
    ├── api.md                         # API documentation
    ├── usage.md                       # Usage guide
    └── mcp-integration.md             # MCP setup guide
```

---

## API Reference

### ConfigManager

```typescript
class ConfigManager {
  constructor(basePath?: string)
  async load(): Promise<DocjaysConfig>
  async save(config: DocjaysConfig): Promise<void>
  async addSource(source: Source): Promise<void>
  async removeSource(name: string): Promise<void>
  async updateSource(name: string, updates: Partial<Source>): Promise<void>
  async get(key: string): Promise<any>
  async set(key: string, value: any): Promise<void>
}
```

### SourceCloner

```typescript
class SourceCloner {
  constructor(basePath?: string)
  async sync(source: Source, options?: CloneOptions): Promise<void>
}

interface CloneOptions {
  force?: boolean
  onProgress?: (progress: CloneProgress) => void
}
```

### MCPServer

```typescript
class MCPServer {
  constructor()
  async start(): Promise<void>
  async stop(): Promise<void>
}
```

### Logger

```typescript
class Logger {
  debug(message: string, context?: string): void
  info(message: string, context?: string): void
  success(message: string, context?: string): void
  warn(message: string, context?: string): void
  error(message: string, context?: string): void
}
```

---

## Next Steps

1. ✅ Create this implementation plan
2. ⏳ Set up monorepo structure
3. ⏳ Build Phase 1: Foundation
4. ⏳ Build Phase 2: Core Features
5. ⏳ Continue with remaining phases

Ready to start implementation!
