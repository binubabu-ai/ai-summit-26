import crypto from 'crypto';

/**
 * Crypto Manager
 * Handles encryption and decryption of sensitive data using AES-256-GCM
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const ITERATIONS = 100000;

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

export class CryptoManager {
  /**
   * Generate a random master key
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Derive a key from password using PBKDF2
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypt data with password
   */
  static encrypt(data: string, password: string): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key from password
      const key = this.deriveKey(password, salt);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with password
   */
  static decrypt(encryptedData: EncryptedData, password: string): string {
    try {
      // Convert hex strings back to buffers
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      // Derive key from password
      const key = this.deriveKey(password, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Decryption failed: Invalid password or corrupted data');
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt an object
   */
  static encryptObject(obj: any, password: string): EncryptedData {
    const json = JSON.stringify(obj);
    return this.encrypt(json, password);
  }

  /**
   * Decrypt an object
   */
  static decryptObject<T = any>(encryptedData: EncryptedData, password: string): T {
    const json = this.decrypt(encryptedData, password);
    return JSON.parse(json);
  }

  /**
   * Hash a password (for verification, not for encryption)
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify a password against a hash
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const [saltHex, hashHex] = hashedPassword.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
      return hash.toString('hex') === hashHex;
    } catch {
      return false;
    }
  }

  /**
   * Generate a random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Securely compare two strings (timing-safe)
   */
  static secureCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      if (bufA.length !== bufB.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize sensitive data from memory
   */
  static sanitize(data: string): void {
    // Overwrite the string in memory (best effort in JavaScript)
    if (data) {
      for (let i = 0; i < data.length; i++) {
        data = data.substring(0, i) + '\0' + data.substring(i + 1);
      }
    }
  }
}
