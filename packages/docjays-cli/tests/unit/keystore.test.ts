import { KeyStore, KeyType } from '../../src/core/auth/keystore';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('KeyStore', () => {
  let testDir: string;
  let keyStore: KeyStore;
  const masterPassword = 'test-master-password-123';
  const testKey = {
    name: 'test-key',
    value: 'test-value-secret',
    type: KeyType.TOKEN,
    description: 'Test key description',
  };

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `docjays-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    keyStore = new KeyStore(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('init', () => {
    it('should initialize keystore successfully', async () => {
      await keyStore.init(masterPassword);

      const keystorePath = path.join(testDir, '.docjays', 'keystore.json');
      const exists = await fs.pathExists(keystorePath);

      expect(exists).toBe(true);
    });

    it('should create keystore directory if it doesn\'t exist', async () => {
      await keyStore.init(masterPassword);

      const docjaysDir = path.join(testDir, '.docjays');
      const exists = await fs.pathExists(docjaysDir);

      expect(exists).toBe(true);
    });

    it('should fail if keystore already exists', async () => {
      await keyStore.init(masterPassword);

      await expect(keyStore.init(masterPassword)).rejects.toThrow(
        'Keystore already exists'
      );
    });
  });

  describe('add', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
    });

    it('should add key successfully', async () => {
      await keyStore.add(
        testKey.name,
        testKey.value,
        testKey.type,
        masterPassword,
        testKey.description
      );

      const keys = await keyStore.list(masterPassword);
      expect(keys).toHaveLength(1);
      expect(keys[0].name).toBe(testKey.name);
      expect(keys[0].type).toBe(testKey.type);
      expect(keys[0].description).toBe(testKey.description);
    });

    it('should fail with wrong password', async () => {
      await expect(
        keyStore.add(testKey.name, testKey.value, testKey.type, 'wrong-password')
      ).rejects.toThrow();
    });

    it('should fail if key already exists', async () => {
      await keyStore.add(
        testKey.name,
        testKey.value,
        testKey.type,
        masterPassword
      );

      await expect(
        keyStore.add(testKey.name, testKey.value, testKey.type, masterPassword)
      ).rejects.toThrow('Key already exists');
    });

    it('should handle different key types', async () => {
      const types: KeyType[] = [KeyType.TOKEN, KeyType.PASSWORD, KeyType.API_KEY, KeyType.SSH];

      for (const type of types) {
        await keyStore.add(`key-${type}`, 'value', type, masterPassword);
      }

      const keys = await keyStore.list(masterPassword);
      expect(keys).toHaveLength(types.length);
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add(
        testKey.name,
        testKey.value,
        testKey.type,
        masterPassword,
        testKey.description
      );
    });

    it('should retrieve key value', async () => {
      const value = await keyStore.get(testKey.name, masterPassword);

      expect(value).toBe(testKey.value);
    });

    it('should fail with wrong password', async () => {
      await expect(keyStore.get(testKey.name, 'wrong-password')).rejects.toThrow();
    });

    it('should fail if key doesn\'t exist', async () => {
      await expect(
        keyStore.get('non-existent-key', masterPassword)
      ).rejects.toThrow('Key not found');
    });

    it('should update updatedAt timestamp', async () => {
      const keysBefore = await keyStore.list(masterPassword);
      const updatedAtBefore = keysBefore[0].updatedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await keyStore.get(testKey.name, masterPassword);

      const keysAfter = await keyStore.list(masterPassword);
      const updatedAtAfter = keysAfter[0].updatedAt;

      expect(updatedAtAfter).not.toBe(updatedAtBefore);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
    });

    it('should list all keys', async () => {
      await keyStore.add('key1', 'value1', KeyType.TOKEN, masterPassword);
      await keyStore.add('key2', 'value2', KeyType.PASSWORD, masterPassword);
      await keyStore.add('key3', 'value3', KeyType.API_KEY, masterPassword);

      const keys = await keyStore.list(masterPassword);

      expect(keys).toHaveLength(3);
      expect(keys.map((k) => k.name)).toEqual(['key1', 'key2', 'key3']);
    });

    it('should not expose key values', async () => {
      await keyStore.add(testKey.name, testKey.value, testKey.type, masterPassword);

      const keys = await keyStore.list(masterPassword);

      expect(keys[0]).not.toHaveProperty('value');
    });

    it('should return empty array if no keys', async () => {
      const keys = await keyStore.list(masterPassword);

      expect(keys).toEqual([]);
    });

    it('should fail with wrong password', async () => {
      await expect(keyStore.list('wrong-password')).rejects.toThrow();
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add(testKey.name, testKey.value, testKey.type, masterPassword);
    });

    it('should remove key successfully', async () => {
      await keyStore.remove(testKey.name, masterPassword);

      const keys = await keyStore.list(masterPassword);
      expect(keys).toHaveLength(0);
    });

    it('should fail with wrong password', async () => {
      await expect(
        keyStore.remove(testKey.name, 'wrong-password')
      ).rejects.toThrow();
    });

    it('should fail if key doesn\'t exist', async () => {
      await expect(
        keyStore.remove('non-existent-key', masterPassword)
      ).rejects.toThrow('Key not found');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add(testKey.name, testKey.value, testKey.type, masterPassword);
    });

    it('should update key value', async () => {
      const newValue = 'new-secret-value';

      await keyStore.update(testKey.name, newValue, masterPassword);

      const value = await keyStore.get(testKey.name, masterPassword);
      expect(value).toBe(newValue);
    });

    it('should fail with wrong password', async () => {
      await expect(
        keyStore.update(testKey.name, 'new-value', 'wrong-password')
      ).rejects.toThrow();
    });

    it('should fail if key doesn\'t exist', async () => {
      await expect(
        keyStore.update('non-existent-key', 'new-value', masterPassword)
      ).rejects.toThrow('Key not found');
    });
  });

  describe('rotatePassword', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add('key1', 'value1', KeyType.TOKEN, masterPassword);
      await keyStore.add('key2', 'value2', KeyType.PASSWORD, masterPassword);
    });

    it('should rotate password successfully', async () => {
      const newPassword = 'new-master-password';

      await keyStore.rotatePassword(masterPassword, newPassword);

      // Should work with new password
      const keys = await keyStore.list(newPassword);
      expect(keys).toHaveLength(2);

      // Should fail with old password
      await expect(keyStore.list(masterPassword)).rejects.toThrow();
    });

    it('should preserve all key values', async () => {
      const newPassword = 'new-master-password';

      await keyStore.rotatePassword(masterPassword, newPassword);

      const value1 = await keyStore.get('key1', newPassword);
      const value2 = await keyStore.get('key2', newPassword);

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
    });

    it('should fail with wrong old password', async () => {
      await expect(
        keyStore.rotatePassword('wrong-password', 'new-password')
      ).rejects.toThrow();
    });
  });

  describe('export', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add('key1', 'value1', KeyType.TOKEN, masterPassword, 'Description 1');
      await keyStore.add('key2', 'value2', KeyType.PASSWORD, masterPassword, 'Description 2');
    });

    it('should export keystore successfully', async () => {
      const exportPassword = 'export-password';
      const exported = await keyStore.export(masterPassword, exportPassword);

      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should fail with wrong password', async () => {
      await expect(
        keyStore.export('wrong-password', 'export-password')
      ).rejects.toThrow();
    });
  });

  describe('import', () => {
    let exportedData: string;
    const exportPassword = 'export-password';

    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add('key1', 'value1', KeyType.TOKEN, masterPassword, 'Description 1');
      await keyStore.add('key2', 'value2', KeyType.PASSWORD, masterPassword, 'Description 2');
      exportedData = await keyStore.export(masterPassword, exportPassword);

      // Create new keystore for import
      await fs.remove(path.join(testDir, '.docjays'));
      keyStore = new KeyStore(testDir);
    });

    it('should import keystore successfully', async () => {
      const newMasterPassword = 'new-master-password';

      await keyStore.import(exportedData, exportPassword, newMasterPassword);

      const keys = await keyStore.list(newMasterPassword);
      expect(keys).toHaveLength(2);
      expect(keys.map((k) => k.name)).toEqual(['key1', 'key2']);
    });

    it('should preserve key values', async () => {
      const newMasterPassword = 'new-master-password';

      await keyStore.import(exportedData, exportPassword, newMasterPassword);

      const value1 = await keyStore.get('key1', newMasterPassword);
      const value2 = await keyStore.get('key2', newMasterPassword);

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
    });

    it('should fail with wrong export password', async () => {
      await expect(
        keyStore.import(exportedData, 'wrong-password', 'new-master-password')
      ).rejects.toThrow();
    });

    it('should fail with corrupted data', async () => {
      await expect(
        keyStore.import('corrupted-data', exportPassword, 'new-master-password')
      ).rejects.toThrow();
    });

    it('should fail if keystore already exists', async () => {
      await keyStore.init('some-password');

      await expect(
        keyStore.import(exportedData, exportPassword, 'new-master-password')
      ).rejects.toThrow('Keystore already exists');
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await keyStore.init(masterPassword);
      await keyStore.add(testKey.name, testKey.value, testKey.type, masterPassword);
    });

    it('should destroy keystore successfully', async () => {
      await keyStore.destroy(masterPassword);

      const keystorePath = path.join(testDir, '.docjays', 'keystore.json');
      const exists = await fs.pathExists(keystorePath);

      expect(exists).toBe(false);
    });

    it('should fail with wrong password', async () => {
      await expect(keyStore.destroy('wrong-password')).rejects.toThrow();
    });

    it('should allow re-initialization after destroy', async () => {
      await keyStore.destroy(masterPassword);
      await keyStore.init('new-master-password');

      const keys = await keyStore.list('new-master-password');
      expect(keys).toEqual([]);
    });
  });
});
