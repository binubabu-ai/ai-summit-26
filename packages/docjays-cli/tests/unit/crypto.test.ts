import { CryptoManager, EncryptedData } from '../../src/core/auth/crypto';

describe('CryptoManager', () => {
  const testPassword = 'test-password-123';
  const testData = 'sensitive-data-to-encrypt';

  describe('encrypt', () => {
    it('should encrypt data successfully', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.tag).toBeDefined();
    });

    it('should produce different ciphertext for same data', () => {
      const encrypted1 = CryptoManager.encrypt(testData, testPassword);
      const encrypted2 = CryptoManager.encrypt(testData, testPassword);

      // Different IVs and salts should produce different ciphertexts
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should produce different ciphertext for different passwords', () => {
      const encrypted1 = CryptoManager.encrypt(testData, 'password1');
      const encrypted2 = CryptoManager.encrypt(testData, 'password2');

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('should handle empty string', () => {
      const encrypted = CryptoManager.encrypt('', testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
    });

    it('should handle long data', () => {
      const longData = 'a'.repeat(10000);
      const encrypted = CryptoManager.encrypt(longData, testPassword);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);
      const decrypted = CryptoManager.decrypt(encrypted, testPassword);

      expect(decrypted).toBe(testData);
    });

    it('should fail with wrong password', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);

      expect(() => {
        CryptoManager.decrypt(encrypted, 'wrong-password');
      }).toThrow();
    });

    it('should fail with corrupted data', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);
      const corrupted: EncryptedData = {
        ...encrypted,
        encrypted: 'corrupted-data',
      };

      expect(() => {
        CryptoManager.decrypt(corrupted, testPassword);
      }).toThrow();
    });

    it('should fail with corrupted IV', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);
      const corrupted: EncryptedData = {
        ...encrypted,
        iv: 'corrupted-iv',
      };

      expect(() => {
        CryptoManager.decrypt(corrupted, testPassword);
      }).toThrow();
    });

    it('should handle empty string', () => {
      const encrypted = CryptoManager.encrypt('', testPassword);
      const decrypted = CryptoManager.decrypt(encrypted, testPassword);

      expect(decrypted).toBe('');
    });

    it('should handle long data', () => {
      const longData = 'a'.repeat(10000);
      const encrypted = CryptoManager.encrypt(longData, testPassword);
      const decrypted = CryptoManager.decrypt(encrypted, testPassword);

      expect(decrypted).toBe(longData);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', () => {
      const hashed = CryptoManager.hashPassword(testPassword);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password', () => {
      const hashed1 = CryptoManager.hashPassword(testPassword);
      const hashed2 = CryptoManager.hashPassword(testPassword);

      // Different salts should produce different hashes
      expect(hashed1).not.toBe(hashed2);
    });

    it('should produce different hashes for different passwords', () => {
      const hashed1 = CryptoManager.hashPassword('password1');
      const hashed2 = CryptoManager.hashPassword('password2');

      expect(hashed1).not.toBe(hashed2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const hashed = CryptoManager.hashPassword(testPassword);
      const result = CryptoManager.verifyPassword(testPassword, hashed);

      expect(result).toBe(true);
    });

    it('should reject incorrect password', () => {
      const hashed = CryptoManager.hashPassword(testPassword);
      const result = CryptoManager.verifyPassword('wrong-password', hashed);

      expect(result).toBe(false);
    });

    it('should reject empty password', () => {
      const hashed = CryptoManager.hashPassword(testPassword);
      const result = CryptoManager.verifyPassword('', hashed);

      expect(result).toBe(false);
    });

    it('should handle malformed hash', () => {
      const result = CryptoManager.verifyPassword(testPassword, 'malformed-hash');

      expect(result).toBe(false);
    });
  });

  describe('encrypt-decrypt round-trip', () => {
    it('should preserve data through encryption and decryption', () => {
      const testCases = [
        'simple string',
        'string with special chars: !@#$%^&*()',
        'multi\nline\nstring',
        'unicode: 你好世界',
        JSON.stringify({ key: 'value', nested: { data: 123 } }),
        '',
        'a'.repeat(1000),
      ];

      testCases.forEach((testCase) => {
        const encrypted = CryptoManager.encrypt(testCase, testPassword);
        const decrypted = CryptoManager.decrypt(encrypted, testPassword);
        expect(decrypted).toBe(testCase);
      });
    });

    it('should work with different password lengths', () => {
      const passwords = [
        'short',
        'medium-length-password',
        'very-long-password-with-many-characters-for-testing',
      ];

      passwords.forEach((password) => {
        const encrypted = CryptoManager.encrypt(testData, password);
        const decrypted = CryptoManager.decrypt(encrypted, password);
        expect(decrypted).toBe(testData);
      });
    });
  });

  describe('security properties', () => {
    it('should use unique salt for each password hash', () => {
      const hashes = new Set();

      for (let i = 0; i < 10; i++) {
        const hashed = CryptoManager.hashPassword(testPassword);
        hashes.add(hashed);
      }

      // All hashes should be unique due to random salts
      expect(hashes.size).toBe(10);
    });

    it('should use unique IV for each encryption', () => {
      const ivs = new Set();

      for (let i = 0; i < 10; i++) {
        const encrypted = CryptoManager.encrypt(testData, testPassword);
        ivs.add(encrypted.iv);
      }

      // All IVs should be unique
      expect(ivs.size).toBe(10);
    });

    it('should not expose plaintext in encrypted object', () => {
      const encrypted = CryptoManager.encrypt(testData, testPassword);
      const serialized = JSON.stringify(encrypted);

      expect(serialized).not.toContain(testData);
      expect(serialized).not.toContain(testPassword);
    });
  });
});
