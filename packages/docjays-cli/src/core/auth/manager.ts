import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AuthData {
  token: string;
  email: string;
  userId: string;
  expiresAt: string;
}

/**
 * AuthManager
 * Manages global authentication credentials
 */
export class AuthManager {
  private authDir: string;
  private authFile: string;

  constructor() {
    this.authDir = path.join(os.homedir(), '.docjays');
    this.authFile = path.join(this.authDir, 'auth.json');
  }

  /**
   * Get current authentication data
   * Returns null if not authenticated or expired
   */
  async getAuth(): Promise<AuthData | null> {
    try {
      const data = await fs.readFile(this.authFile, 'utf-8');
      const auth: AuthData = JSON.parse(data);

      // Check if expired
      if (new Date(auth.expiresAt) < new Date()) {
        // Token expired, remove it
        await this.removeAuth();
        return null;
      }

      return auth;
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Save authentication data
   */
  async saveAuth(auth: AuthData): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.authDir, { recursive: true });

    // Save auth data
    await fs.writeFile(
      this.authFile,
      JSON.stringify(auth, null, 2),
      'utf-8'
    );

    // Set restrictive permissions (Unix only)
    try {
      await fs.chmod(this.authFile, 0o600);
    } catch (error) {
      // Windows doesn't support chmod, that's okay
    }
  }

  /**
   * Remove authentication data
   */
  async removeAuth(): Promise<void> {
    try {
      await fs.unlink(this.authFile);
    } catch (error) {
      // File doesn't exist, that's okay
    }
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const auth = await this.getAuth();
    return auth !== null;
  }

  /**
   * Get auth file path
   */
  getAuthFilePath(): string {
    return this.authFile;
  }

  /**
   * Format expiry date for display
   */
  formatExpiry(expiresAt: string): string {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysRemaining = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      return 'Expired';
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return 'Expires tomorrow';
    } else if (daysRemaining < 7) {
      return `Expires in ${daysRemaining} days`;
    } else {
      return `${expiry.toLocaleDateString()} (${daysRemaining} days remaining)`;
    }
  }
}
