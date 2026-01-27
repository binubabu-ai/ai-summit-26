import chalk from 'chalk';
import { BaseCommand } from './base';
import { AuthManager } from '../../core/auth/manager';

/**
 * Whoami Command
 * Show current authentication status
 */
export class WhoamiCommand extends BaseCommand {
  register(): void {
    this.program
      .command('whoami')
      .description('Show current authentication status')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      const authManager = new AuthManager();
      const auth = await authManager.getAuth();

      if (!auth) {
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                authenticated: false,
                message: 'Not logged in',
              },
              null,
              2
            )
          );
        } else {
          console.log('');
          this.logger.warn('Not logged in');
          console.log('');
          this.logger.info(
            'Run ' + chalk.cyan('docjays login') + ' to authenticate'
          );
          console.log('');
        }
        process.exit(1);
        return;
      }

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              authenticated: true,
              email: auth.email,
              userId: auth.userId,
              expiresAt: auth.expiresAt,
              daysRemaining: this.calculateDaysRemaining(auth.expiresAt),
            },
            null,
            2
          )
        );
      } else {
        console.log('');
        console.log(chalk.bold('Authentication Status'));
        console.log('');
        console.log(
          '  ' + chalk.gray('Logged in as:') + ' ' + chalk.cyan(auth.email)
        );
        console.log('  ' + chalk.gray('User ID:     ') + ' ' + auth.userId);
        console.log(
          '  ' +
            chalk.gray('Token expires:') +
            ' ' +
            authManager.formatExpiry(auth.expiresAt)
        );
        console.log(
          '  ' +
            chalk.gray('Config file: ') +
            ' ' +
            chalk.dim(authManager.getAuthFilePath())
        );
        console.log('');
      }
    } catch (error: any) {
      this.handleError(error, 'whoami');
    }
  }

  private calculateDaysRemaining(expiresAt: string): number {
    const expiry = new Date(expiresAt);
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}
