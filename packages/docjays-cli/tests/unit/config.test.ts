import { ConfigManager } from '../../src/core/config';
import { DocJaysConfig, Source } from '../../src/types';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  let testDir: string;
  let configManager: ConfigManager;

  const testSource: Source = {
    name: 'test-source',
    type: 'git',
    url: 'https://github.com/test/repo',
    branch: 'main',
    path: 'sources/test-source',
    enabled: true,
  };

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `docjays-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    configManager = new ConfigManager(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('initialize', () => {
    it('should initialize configuration successfully', async () => {
      await configManager.initialize();

      const configPath = path.join(testDir, '.docjays', 'config.json');
      const exists = await fs.pathExists(configPath);

      expect(exists).toBe(true);
    });

    it('should create config with default values', async () => {
      await configManager.initialize();

      const config = await configManager.load();

      expect(config.version).toBe('1.0.0');
      expect(config.sources).toEqual([]);
      expect(config.mcp.enabled).toBe(true);
      expect(config.mcp.transport).toBe('stdio');
      expect(config.sync.auto).toBe(false);
    });

    it('should accept custom options', async () => {
      await configManager.initialize({
        mcp: {
          enabled: false,
          transport: 'stdio',
          resources: ['sources'],
        },
        sync: {
          auto: true,
          interval: '30m',
          onStart: true,
        },
      });

      const config = await configManager.load();

      expect(config.mcp.enabled).toBe(false);
      expect(config.sync.auto).toBe(true);
      expect(config.sync.interval).toBe('30m');
    });

    it('should create .docjays directory if it doesn\'t exist', async () => {
      await configManager.initialize();

      const docjaysDir = path.join(testDir, '.docjays');
      const exists = await fs.pathExists(docjaysDir);

      expect(exists).toBe(true);
    });

    it('should fail if config already exists', async () => {
      await configManager.initialize();

      await expect(configManager.initialize()).rejects.toThrow(
        'Configuration already exists'
      );
    });
  });

  describe('load', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should load configuration successfully', async () => {
      const config = await configManager.load();

      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
      expect(config.sources).toBeInstanceOf(Array);
    });

    it('should use cache on second load', async () => {
      const config1 = await configManager.load();
      const config2 = await configManager.load();

      expect(config1).toBe(config2); // Same object reference
    });

    it('should bypass cache when useCache is false', async () => {
      const config1 = await configManager.load();
      const config2 = await configManager.load(false);

      expect(config1).not.toBe(config2); // Different object references
      expect(config1).toEqual(config2); // But same content
    });

    it('should fail if config doesn\'t exist', async () => {
      await fs.remove(path.join(testDir, '.docjays', 'config.json'));

      await expect(configManager.load()).rejects.toThrow();
    });

    it('should fail if config is invalid JSON', async () => {
      const configPath = path.join(testDir, '.docjays', 'config.json');
      await fs.writeFile(configPath, 'invalid json');

      await expect(configManager.load()).rejects.toThrow();
    });
  });

  describe('save', () => {
    let config: DocJaysConfig;

    beforeEach(async () => {
      await configManager.initialize();
      config = await configManager.load();
    });

    it('should save configuration successfully', async () => {
      config.sync.auto = true;
      config.sync.interval = '30m';

      await configManager.save(config);

      const reloaded = await configManager.load(false);
      expect(reloaded.sync.auto).toBe(true);
      expect(reloaded.sync.interval).toBe('30m');
    });

    it('should update cache after save', async () => {
      config.sync.auto = true;

      await configManager.save(config);

      const cached = await configManager.load();
      expect(cached.sync.auto).toBe(true);
    });

    it('should fail with invalid configuration', async () => {
      const invalid = { ...config, version: 123 } as any;

      await expect(configManager.save(invalid)).rejects.toThrow();
    });
  });

  describe('addSource', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should add source successfully', async () => {
      await configManager.addSource(testSource);

      const config = await configManager.load();
      expect(config.sources).toHaveLength(1);
      expect(config.sources[0].name).toBe(testSource.name);
    });

    it('should fail if source already exists', async () => {
      await configManager.addSource(testSource);

      await expect(configManager.addSource(testSource)).rejects.toThrow(
        'Source already exists'
      );
    });

    it('should add multiple sources', async () => {
      const source2: Source = { ...testSource, name: 'source2' };
      const source3: Source = { ...testSource, name: 'source3' };

      await configManager.addSource(testSource);
      await configManager.addSource(source2);
      await configManager.addSource(source3);

      const config = await configManager.load();
      expect(config.sources).toHaveLength(3);
    });

    it('should validate source before adding', async () => {
      const invalidSource = { ...testSource, name: '' } as Source;

      await expect(configManager.addSource(invalidSource)).rejects.toThrow();
    });
  });

  describe('removeSource', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.addSource(testSource);
    });

    it('should remove source successfully', async () => {
      await configManager.removeSource(testSource.name);

      const config = await configManager.load();
      expect(config.sources).toHaveLength(0);
    });

    it('should fail if source doesn\'t exist', async () => {
      await expect(configManager.removeSource('non-existent')).rejects.toThrow(
        'Source not found'
      );
    });
  });

  describe('updateSource', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.addSource(testSource);
    });

    it('should update source successfully', async () => {
      await configManager.updateSource(testSource.name, {
        enabled: false,
        branch: 'develop',
      });

      const config = await configManager.load();
      expect(config.sources[0].enabled).toBe(false);
      expect(config.sources[0].branch).toBe('develop');
    });

    it('should fail if source doesn\'t exist', async () => {
      await expect(
        configManager.updateSource('non-existent', { enabled: false })
      ).rejects.toThrow('Source not found');
    });

    it('should preserve other properties', async () => {
      await configManager.updateSource(testSource.name, { enabled: false });

      const config = await configManager.load();
      expect(config.sources[0].url).toBe(testSource.url);
      expect(config.sources[0].type).toBe(testSource.type);
    });

    it('should not allow name changes', async () => {
      await configManager.updateSource(testSource.name, {
        name: 'new-name',
      } as any);

      const config = await configManager.load();
      expect(config.sources[0].name).toBe(testSource.name);
    });
  });


  describe('validation', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should validate source type', async () => {
      const invalidSource = { ...testSource, type: 'invalid' as any };

      await expect(configManager.addSource(invalidSource)).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const invalidSource = { ...testSource, url: '' };

      await expect(configManager.addSource(invalidSource)).rejects.toThrow();
    });

    it('should validate MCP transport', async () => {
      const config = await configManager.load();
      config.mcp.transport = 'invalid' as any;

      await expect(configManager.save(config)).rejects.toThrow();
    });
  });

  describe('concurrent access', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should handle multiple concurrent adds', async () => {
      const sources = Array.from({ length: 5 }, (_, i) => ({
        ...testSource,
        name: `source-${i}`,
      }));

      await Promise.all(sources.map((s) => configManager.addSource(s)));

      const config = await configManager.load();
      expect(config.sources).toHaveLength(5);
    });
  });
});
