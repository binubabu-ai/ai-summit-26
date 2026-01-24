import { createHash, randomBytes } from 'crypto';

/**
 * Generate a new project-scoped API key
 * Format: dj_proj_{projectId}_{randomString}
 */
export function generateApiKey(projectId: string): {
  key: string;
  keyPrefix: string;
  keyHash: string;
} {
  // Generate random string (32 bytes = 64 hex chars)
  const randomString = randomBytes(32).toString('hex');

  // Create the full key
  const key = `dj_proj_${projectId.substring(0, 8)}_${randomString}`;

  // Create hash for storage (never store plain keys!)
  const keyHash = createHash('sha256').update(key).digest('hex');

  // First 12 characters for display
  const keyPrefix = key.substring(0, 20) + '...';

  return {
    key, // Return this only ONCE to the user
    keyPrefix, // Store this for display
    keyHash, // Store this for verification
  };
}

/**
 * Hash an API key for verification
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key matches the stored hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  return keyHash === hash;
}

/**
 * Extract project ID from API key
 * Format: dj_proj_{projectId}_{randomString}
 */
export function extractProjectIdFromKey(key: string): string | null {
  if (!key.startsWith('dj_proj_')) {
    return null;
  }

  const parts = key.split('_');
  if (parts.length < 4) {
    return null;
  }

  // The project ID prefix is at parts[2]
  return parts[2];
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Should start with dj_proj_ and have the right structure
  const pattern = /^dj_proj_[a-z0-9]{8}_[a-f0-9]{64}$/;
  return pattern.test(key);
}
