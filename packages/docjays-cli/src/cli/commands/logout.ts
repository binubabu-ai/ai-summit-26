import chalk from 'chalk';
import { BaseCommand } from './base';
import { AuthManager } from '../../core/auth/manager';

/**
 * Logout Command
 * Remove authentication credentials
 */
export class LogoutCommand extends BaseCommand {
  register(): void {
    this.program
      .command('logout')
      .description('Remove authentication credentials')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      const authManager = new AuthManager();
      const auth = await authManager.getAuth();

      if (!auth) {
        console.log('');
        this.logger.info('You are not logged in');
        console.log('');
        return;
      }

      // Show current user
      console.log('');
      this.logger.info('Currently logged in as: ' + chalk.cyan(auth.email));
      console.log('');

      // Confirm logout (unless --force)
      if (!options.force) {
        const inquirer = require('inquirer');
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to logout?',
            default: false,
          },
        ]);

        if (!confirm) {
          this.logger.info('Logout cancelled');
          console.log('');
          return;
        }
      }

      // Remove auth
      await authManager.removeAuth();

      console.log('');
      this.logger.success('Logged out successfully');
      console.log('');
      this.logger.info(
        'Run ' + chalk.cyan('docjays login') + ' to authenticate again'
      );
      console.log('');
    } catch (error: any) {
      this.handleError(error, 'logout');
    }
  }
}
