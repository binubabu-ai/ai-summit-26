import path from 'path';
import fs from 'fs-extra';
import { CryptoManager, EncryptedData } from './crypto';
import { Logger } from '../../utils/logger';

/**
 * Key types supported by DocJays
 */
export enum KeyType {
  TOKEN = 'token',
  SSH = 'ssh',
  API_KEY = 'api_key',
  PASSWORD = 'password',
}

/**
 * Metadata for a stored key
 */
export interface KeyMetadata {
  name: string;
  type: KeyType;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

/**
 * Stored key with encrypted value
 */
interface StoredKey extends KeyMetadata {
  value: EncryptedData;
}

/**
 * Keystore file structure
 */
interface KeystoreData {
  version: string;
  passwordHash: string;
  keys: StoredKey[];
}

/**
 * KeyStore Manager
 * Manages secure storage and retrieval of authentication credentials
 */
export class KeyStore {
  private keystorePath: string;
  private keysDir: string;
  private masterKeyPath: string;
  private logger: Logger;

  constructor(basePath: string = process.cwd()) {
    this.keysDir = path.join(basePath, '.docjays', '.keys');
    this.keystorePath = path.join(this.keysDir, 'keystore.enc');
    this.masterKeyPath = path.join(this.keysDir, '.master-key');
    this.logger = new Logger();
  }

  /**
   * Check if keystore is initialized
   */
  async isInitialized(): Promise<boolean> {
    return fs.pathExists(this.keystorePath);
  }

  /**
   * Initialize the keystore with a master password
   */
  async init(masterPassword: string): Promise<void> {
    if (await this.isInitialized()) {
      throw new Error('Keystore already initialized');
    }

    // Validate password strength
    this.validatePassword(masterPassword);

    // Create keys directory
    await fs.ensureDir(this.keysDir);

    // Create initial keystore
    const keystoreData: KeystoreData = {
      version: '1.0.0',
      passwordHash: CryptoManager.hashPassword(masterPassword),
      keys: [],
    };

    // Save encrypted keystore
    await this.saveKeystore(keystoreData, masterPassword);

    // Generate and save master key (for additional security layer)
    const masterKey = CryptoManager.generateMasterKey();
    await fs.writeFile(this.masterKeyPath, masterKey, { mode: 0o600 });

    this.logger.success('Keystore initialized successfully');
  }

  /**
   * Verify master password
   */
  async verifyPassword(password: string): Promise<boolean> {
    const keystoreData = await this.loadKeystoreRaw();
    return CryptoManager.verifyPassword(password, keystoreData.passwordHash);
  }

  /**
   * Add a new key
   */
  async add(
    name: string,
    value: string,
    type: KeyType,
    password: string,
    description?: string
  ): Promise<void> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Check for duplicate
    if (keystoreData.keys.find((k) => k.name === name)) {
      throw new Error(`Key '${name}' already exists`);
    }

    // Encrypt key value
    const encryptedValue = CryptoManager.encrypt(value, password);

    // Add key
    const newKey: StoredKey = {
      name,
      type,
      value: encryptedValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description,
    };

    keystoreData.keys.push(newKey);

    // Save keystore
    await this.saveKeystore(keystoreData, password);

    // Clear sensitive data from memory
    CryptoManager.sanitize(value);
  }

  /**
   * Get a key value (decrypted)
   */
  async get(name: string, password: string): Promise<string> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Find key
    const key = keystoreData.keys.find((k) => k.name === name);
    if (!key) {
      throw new Error(`Key '${name}' not found`);
    }

    // Decrypt value
    return CryptoManager.decrypt(key.value, password);
  }

  /**
   * Remove a key
   */
  async remove(name: string, password: string): Promise<void> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Remove key
    keystoreData.keys = keystoreData.keys.filter((k) => k.name !== name);

    // Save keystore
    await this.saveKeystore(keystoreData, password);
  }

  /**
   * Update a key value
   */
  async update(
    name: string,
    newValue: string,
    password: string
  ): Promise<void> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Find key
    const key = keystoreData.keys.find((k) => k.name === name);
    if (!key) {
      throw new Error(`Key '${name}' not found`);
    }

    // Encrypt new value
    key.value = CryptoManager.encrypt(newValue, password);
    key.updatedAt = new Date().toISOString();

    // Save keystore
    await this.saveKeystore(keystoreData, password);

    // Clear sensitive data from memory
    CryptoManager.sanitize(newValue);
  }

  /**
   * List all keys (metadata only, no values)
   */
  async list(password: string): Promise<KeyMetadata[]> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Return metadata only
    return keystoreData.keys.map((k) => ({
      name: k.name,
      type: k.type,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      description: k.description,
    }));
  }

  /**
   * Check if a key exists
   */
  async has(name: string, password: string): Promise<boolean> {
    try {
      const keystoreData = await this.loadKeystore(password);
      return keystoreData.keys.some((k) => k.name === name);
    } catch {
      return false;
    }
  }

  /**
   * Rotate master password
   */
  async rotatePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify old password
    if (!(await this.verifyPassword(oldPassword))) {
      throw new Error('Invalid current password');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Load keystore with old password
    const keystoreData = await this.loadKeystore(oldPassword);

    // Decrypt all keys with old password and re-encrypt with new password
    for (const key of keystoreData.keys) {
      const decryptedValue = CryptoManager.decrypt(key.value, oldPassword);
      key.value = CryptoManager.encrypt(decryptedValue, newPassword);
      CryptoManager.sanitize(decryptedValue);
    }

    // Update password hash
    keystoreData.passwordHash = CryptoManager.hashPassword(newPassword);

    // Save with new password
    await this.saveKeystore(keystoreData, newPassword);

    this.logger.success('Master password rotated successfully');
  }

  /**
   * Export keystore (encrypted with export password)
   */
  async export(password: string, exportPassword: string): Promise<string> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Load keystore
    const keystoreData = await this.loadKeystore(password);

    // Decrypt all keys
    const exportData = {
      version: keystoreData.version,
      keys: await Promise.all(
        keystoreData.keys.map(async (k) => ({
          name: k.name,
          type: k.type,
          value: CryptoManager.decrypt(k.value, password),
          createdAt: k.createdAt,
          updatedAt: k.updatedAt,
          description: k.description,
        }))
      ),
    };

    // Encrypt with export password
    const encrypted = CryptoManager.encryptObject(exportData, exportPassword);

    return JSON.stringify(encrypted, null, 2);
  }

  /**
   * Import keystore (from export)
   */
  async import(
    exportedData: string,
    exportPassword: string,
    masterPassword: string
  ): Promise<void> {
    // Verify master password
    if (!(await this.verifyPassword(masterPassword))) {
      throw new Error('Invalid master password');
    }

    // Decrypt export data
    const encrypted = JSON.parse(exportedData);
    const exportData = CryptoManager.decryptObject(encrypted, exportPassword);

    // Load current keystore
    const keystoreData = await this.loadKeystore(masterPassword);

    // Import keys (re-encrypt with master password)
    for (const key of exportData.keys) {
      // Check if key already exists
      const existingIndex = keystoreData.keys.findIndex(
        (k) => k.name === key.name
      );

      const encryptedValue = CryptoManager.encrypt(key.value, masterPassword);

      const storedKey: StoredKey = {
        name: key.name,
        type: key.type,
        value: encryptedValue,
        createdAt: key.createdAt,
        updatedAt: new Date().toISOString(),
        description: key.description,
      };

      if (existingIndex >= 0) {
        // Update existing key
        keystoreData.keys[existingIndex] = storedKey;
      } else {
        // Add new key
        keystoreData.keys.push(storedKey);
      }

      // Clear from memory
      CryptoManager.sanitize(key.value);
    }

    // Save keystore
    await this.saveKeystore(keystoreData, masterPassword);

    this.logger.success(`Imported ${exportData.keys.length} key(s)`);
  }

  /**
   * Destroy keystore (delete all keys)
   */
  async destroy(password: string): Promise<void> {
    // Verify password
    if (!(await this.verifyPassword(password))) {
      throw new Error('Invalid master password');
    }

    // Remove keys directory
    await fs.remove(this.keysDir);

    this.logger.success('Keystore destroyed');
  }

  /**
   * Load keystore (decrypted)
   */
  private async loadKeystore(_password: string): Promise<KeystoreData> {
    const raw = await this.loadKeystoreRaw();

    // The keystore itself is stored as plaintext JSON
    // Individual keys are encrypted
    return raw;
  }

  /**
   * Load keystore (raw, encrypted keys)
   */
  private async loadKeystoreRaw(): Promise<KeystoreData> {
    if (!(await fs.pathExists(this.keystorePath))) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    const content = await fs.readFile(this.keystorePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save keystore
   */
  private async saveKeystore(
    keystoreData: KeystoreData,
    _password: string
  ): Promise<void> {
    await fs.ensureDir(this.keysDir);

    // Save as JSON with restricted permissions
    const content = JSON.stringify(keystoreData, null, 2);
    await fs.writeFile(this.keystorePath, content, { mode: 0o600 });
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Optional: Add more validation rules
    // - Must contain uppercase, lowercase, numbers, special chars
  }
}
