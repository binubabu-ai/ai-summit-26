import chalk from 'chalk';
import ora from 'ora';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseCommand } from './base';
import { AuthManager } from '../../core/auth/manager';

const execAsync = promisify(exec);

// Open browser using platform-specific command
const openBrowser = async (url: string) => {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case 'darwin':  // macOS
      command = `open "${url}"`;
      break;
    case 'win32':   // Windows
      command = `start "" "${url}"`;
      break;
    default:        // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error('Failed to open browser');
  }
};

interface PollResult {
  success: boolean;
  timeout?: boolean;
  cancelled?: boolean;
  error?: string;
  data?: {
    token: string;
    refreshToken?: string;
    email: string;
    userId: string;
    expiresAt: string;
  };
}

/**
 * Login Command
 * Authenticate with Docjays via OAuth flow
 */
export class LoginCommand extends BaseCommand {
  register(): void {
    this.program
      .command('login')
      .description('Authenticate with Docjays')
      .option('-f, --force', 'Force re-authentication even if already logged in')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      const authManager = new AuthManager();

      // Check if already authenticated
      const existingAuth = await authManager.getAuth();

      if (existingAuth && !options.force) {
        console.log('');
        this.logger.info(
          'You are already logged in as: ' + chalk.cyan(existingAuth.email)
        );
        this.logger.info(
          'Token expires: ' +
            chalk.dim(authManager.formatExpiry(existingAuth.expiresAt))
        );
        console.log('');

        const reauth = await this.confirmLogin('Do you want to re-authenticate?', false);
        if (!reauth) {
          this.logger.info('Login cancelled');
          return;
        }
      }

      // Generate session ID
      const session = this.generateSessionId();

      // Build auth URL
      const webUrl =
        process.env.DOCJAYS_WEB_URL || 'https://docjays.vercel.app';
      const fullUrl = `${webUrl}/cli/auth?session=${session}`;

      console.log('');
      console.log(chalk.cyan('📱 Opening browser for authentication...'));
      console.log('');
      console.log(
        chalk.dim("If your browser doesn't open automatically, visit:")
      );
      console.log(chalk.underline(fullUrl));
      console.log('');

      // Open browser
      try {
        await openBrowser(fullUrl);
      } catch (error) {
        this.logger.warn('Failed to open browser automatically');
        this.logger.info('Please manually open the URL above');
      }

      // Poll for token
      const spinner = ora({
        text: 'Waiting for authentication...',
        spinner: 'dots',
      }).start();

      const result = await this.pollForToken(session, webUrl, spinner);

      if (result.success && result.data) {
        spinner.succeed('Authentication successful!');

        // Save token
        await authManager.saveAuth(result.data);

        console.log('');
        this.logger.success(
          'Saved credentials to ' +
            chalk.cyan(authManager.getAuthFilePath())
        );
        console.log('');
        console.log(
          chalk.bold('Logged in as: ') + chalk.cyan(result.data.email)
        );
        console.log(chalk.dim('User ID: ' + result.data.userId));
        console.log(
          chalk.dim(
            'Token expires: ' + authManager.formatExpiry(result.data.expiresAt)
          )
        );
        console.log('');
        console.log(
          chalk.dim("You're all set! Run ") +
            chalk.cyan('docjays init') +
            chalk.dim(' to get started.')
        );
        console.log('');
      } else if (result.timeout) {
        spinner.fail('Authentication timed out');
        console.log('');
        this.logger.error('Session expired after 5 minutes');
        this.logger.info(
          'Please run ' + chalk.cyan('docjays login') + ' again'
        );
        console.log('');
      } else if (result.cancelled) {
        spinner.fail('Authentication cancelled');
        console.log('');
        this.logger.info('Login cancelled by user');
        console.log('');
      } else {
        spinner.fail('Authentication failed');
        console.log('');
        this.logger.error(result.error || 'Unknown error occurred');
        console.log('');
      }
    } catch (error: any) {
      this.handleError(error, 'login');
    }
  }

  /**
   * Generate a secure random session ID
   */
  private generateSessionId(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Poll for authentication token
   */
  private async pollForToken(
    session: string,
    baseUrl: string,
    spinner: any
  ): Promise<PollResult> {
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeRemaining = Math.ceil((maxAttempts - attempt) * 5 / 60);
        spinner.text = `Waiting for authentication... (${timeRemaining} min remaining)`;

        const response = await fetch(`${baseUrl}/api/cli/auth/${session}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Session not found yet, keep polling
            await this.sleep(pollInterval);
            continue;
          }

          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
          };
        }

        const data: any = await response.json();

        switch (data.status) {
          case 'success':
            return {
              success: true,
              data: {
                token: data.token,
                refreshToken: data.refreshToken,
                email: data.email,
                userId: data.userId,
                expiresAt: data.expiresAt,
              },
            };

          case 'cancelled':
            return { success: false, cancelled: true };

          case 'waiting':
            // Continue polling
            await this.sleep(pollInterval);
            continue;

          default:
            return {
              success: false,
              error: 'Unknown status: ' + data.status,
            };
        }
      } catch (error: any) {
        // Network error, keep retrying
        if (attempt < maxAttempts) {
          await this.sleep(pollInterval);
          continue;
        } else {
          return {
            success: false,
            error: 'Network error: ' + error.message,
          };
        }
      }
    }

    // Timed out
    return { success: false, timeout: true };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Prompt for confirmation
   */
  private async confirmLogin(message: string, defaultValue: boolean = true): Promise<boolean> {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const defaultText = defaultValue ? 'Y/n' : 'y/N';
      readline.question(`? ${message} (${defaultText}) `, (answer) => {
        readline.close();

        if (answer.trim() === '') {
          resolve(defaultValue);
        } else {
          const normalized = answer.trim().toLowerCase();
          resolve(normalized === 'y' || normalized === 'yes');
        }
      });
    });
  }
}
