import fs from 'fs-extra';
import path from 'path';
import Ajv from 'ajv';
import { DocjaysConfig, Source, MCPConfig, SyncConfig } from '../types';
import { Logger } from '../utils/logger';

/**
 * Configuration Manager
 * Manages Docjays configuration file (.docjays/config.json)
 */
export class ConfigManager {
  private configPath: string;
  private config: DocjaysConfig | null = null;
  private ajv: Ajv;
  private logger: Logger;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    this.configPath = path.join(basePath, '.docjays', 'config.json');
    this.ajv = new Ajv();
    this.logger = new Logger();
  }

  /**
   * Check if Docjays is initialized
   */
  async isInitialized(): Promise<boolean> {
    return fs.pathExists(this.configPath);
  }

  /**
   * Initialize configuration with defaults
   */
  async initialize(options: Partial<DocjaysConfig> = {}): Promise<void> {
    if (await this.isInitialized()) {
      throw new Error('Docjays already initialized');
    }

    const defaultConfig = this.getDefaultConfig();
    const config = { ...defaultConfig, ...options };

    await this.save(config);
    this.logger.success('Configuration initialized');
  }

  /**
   * Load configuration
   */
  async load(useCache: boolean = true): Promise<DocjaysConfig> {
    if (useCache && this.config) {
      return this.config;
    }

    if (!(await this.isInitialized())) {
      throw new Error(
        'Docjays not initialized. Run: docjays init'
      );
    }

    const content = await fs.readFile(this.configPath, 'utf-8');
    const config = JSON.parse(content);

    this.validate(config);
    this.config = config;
    return config;
  }

  /**
   * Save configuration
   */
  async save(config: DocjaysConfig): Promise<void> {
    this.validate(config);

    const dir = path.dirname(this.configPath);
    await fs.ensureDir(dir);

    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');

    this.config = config;
  }

  /**
   * Reload configuration from disk
   */
  async reload(): Promise<DocjaysConfig> {
    this.config = null;
    return this.load(false);
  }

  /**
   * Add a source
   */
  async addSource(source: Source): Promise<void> {
    const config = await this.load();

    // Check for duplicate name
    if (config.sources.find((s) => s.name === source.name)) {
      throw new Error(`Source '${source.name}' already exists`);
    }

    // Check for duplicate path
    if (config.sources.find((s) => s.path === source.path)) {
      throw new Error(`Path '${source.path}' is already used by another source`);
    }

    config.sources.push(source);
    await this.save(config);

    this.logger.success(`Source '${source.name}' added`);
  }

  /**
   * Remove a source
   */
  async removeSource(name: string): Promise<void> {
    const config = await this.load();

    const initialLength = config.sources.length;
    config.sources = config.sources.filter((s) => s.name !== name);

    if (config.sources.length === initialLength) {
      throw new Error(`Source '${name}' not found`);
    }

    await this.save(config);
    this.logger.success(`Source '${name}' removed`);
  }

  /**
   * Update a source
   */
  async updateSource(name: string, updates: Partial<Source>): Promise<void> {
    const config = await this.load();

    const source = config.sources.find((s) => s.name === name);
    if (!source) {
      throw new Error(`Source '${name}' not found`);
    }

    // Apply updates
    Object.assign(source, updates);

    await this.save(config);
    this.logger.success(`Source '${name}' updated`);
  }

  /**
   * Get a source by name
   */
  async getSource(name: string): Promise<Source | null> {
    const config = await this.load();
    return config.sources.find((s) => s.name === name) || null;
  }

  /**
   * Get all sources
   */
  async getSources(): Promise<Source[]> {
    const config = await this.load();
    return config.sources;
  }

  /**
   * Get enabled sources
   */
  async getEnabledSources(): Promise<Source[]> {
    const config = await this.load();
    return config.sources.filter((s) => s.enabled);
  }

  /**
   * Enable/disable a source
   */
  async toggleSource(name: string, enabled: boolean): Promise<void> {
    await this.updateSource(name, { enabled });
  }

  /**
   * Get a configuration value by path (dot notation)
   */
  async get(path: string): Promise<any> {
    const config = await this.load();
    return this.getNestedValue(config, path);
  }

  /**
   * Set a configuration value by path (dot notation)
   */
  async set(path: string, value: any): Promise<void> {
    const config = await this.load();
    this.setNestedValue(config, path, value);
    await this.save(config);
  }

  /**
   * Update MCP configuration
   */
  async updateMCP(updates: Partial<MCPConfig>): Promise<void> {
    const config = await this.load();
    config.mcp = { ...config.mcp, ...updates };
    await this.save(config);
  }

  /**
   * Update sync configuration
   */
  async updateSync(updates: Partial<SyncConfig>): Promise<void> {
    const config = await this.load();
    config.sync = { ...config.sync, ...updates };
    await this.save(config);
  }

  /**
   * Check if project is linked to cloud
   */
  async isCloudLinked(): Promise<boolean> {
    const config = await this.load();
    return config.mode === 'cloud' && !!config.cloud?.projectId;
  }

  /**
   * Link to cloud project
   */
  async linkCloud(cloudConfig: { projectId: string; projectName: string; apiKey: string }): Promise<void> {
    const config = await this.load();
    config.mode = 'cloud';
    config.cloud = {
      projectId: cloudConfig.projectId,
      projectName: cloudConfig.projectName,
      apiKey: cloudConfig.apiKey,
      lastSync: new Date().toISOString(),
    };
    await this.save(config);
    this.logger.success(`Linked to cloud project: ${cloudConfig.projectName}`);
  }

  /**
   * Unlink from cloud (switch to local mode)
   */
  async unlinkCloud(): Promise<void> {
    const config = await this.load();
    config.mode = 'local';
    config.cloud = {
      projectId: null,
      projectName: null,
      apiKey: null,
    };
    await this.save(config);
    this.logger.success('Switched to local mode');
  }

  /**
   * Get cloud configuration
   */
  async getCloudConfig(): Promise<{ projectId: string; projectName: string; apiKey: string } | null> {
    const config = await this.load();
    if (config.mode === 'cloud' && config.cloud?.projectId && config.cloud?.apiKey) {
      return {
        projectId: config.cloud.projectId,
        projectName: config.cloud.projectName || 'Unknown',
        apiKey: config.cloud.apiKey,
      };
    }
    return null;
  }

  /**
   * Update cloud sync timestamp
   */
  async updateCloudSync(): Promise<void> {
    const config = await this.load();
    if (config.cloud) {
      config.cloud.lastSync = new Date().toISOString();
      await this.save(config);
    }
  }

  /**
   * Validate configuration against schema
   */
  private validate(config: any): void {
    const schema = this.getSchema();
    const valid = this.ajv.validate(schema, config);

    if (!valid) {
      const errors = this.ajv.errorsText(this.ajv.errors);
      throw new Error(`Invalid configuration: ${errors}`);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): DocjaysConfig {
    return {
      version: '1.0.0',
      mode: 'local',
      cloud: {
        projectId: null,
        projectName: null,
        apiKey: null,
      },
      sources: [],
      mcp: {
        enabled: true,
        transport: 'stdio',
        resources: ['sources', 'features', 'context'],
      },
      sync: {
        auto: false,
        interval: '1h',
        onStart: false,
      },
    };
  }

  /**
   * Get JSON schema for validation
   */
  private getSchema() {
    return {
      type: 'object',
      required: ['version', 'mode', 'sources', 'mcp', 'sync'],
      properties: {
        version: { type: 'string' },
        mode: { enum: ['local', 'cloud'] },
        cloud: {
          type: 'object',
          properties: {
            projectId: { type: ['string', 'null'] },
            projectName: { type: ['string', 'null'] },
            apiKey: { type: ['string', 'null'] },
            lastSync: { type: 'string' },
          },
        },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'url', 'path', 'enabled'],
            properties: {
              name: { type: 'string', minLength: 1 },
              type: { enum: ['git', 'http', 'local'] },
              url: { type: 'string', minLength: 1 },
              branch: { type: 'string' },
              path: { type: 'string', minLength: 1 },
              enabled: { type: 'boolean' },
              auth: { type: 'string' }, // Reference to key name in keystore
            },
          },
        },
        mcp: {
          type: 'object',
          required: ['enabled', 'transport', 'resources'],
          properties: {
            enabled: { type: 'boolean' },
            transport: { enum: ['stdio', 'http'] },
            port: { type: 'number', minimum: 1, maximum: 65535 },
            resources: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        sync: {
          type: 'object',
          required: ['auto'],
          properties: {
            auto: { type: 'boolean' },
            interval: { type: 'string', pattern: '^\\d+[hms]$' },
            onStart: { type: 'boolean' },
          },
        },
      },
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get base path
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}
