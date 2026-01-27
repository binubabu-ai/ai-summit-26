import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';

interface UnlinkOptions {
  force?: boolean;
}

/**
 * Unlink Command
 * Disconnect from cloud and switch to local-only mode
 */
export class UnlinkCommand extends BaseCommand {
  register(): void {
    this.program
      .command('unlink')
      .description('Disconnect from cloud (switch to local-only mode)')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: UnlinkOptions): Promise<void> {
    try {
      const configManager = new ConfigManager();

      // Check if .docjays exists
      if (!(await configManager.isInitialized())) {
        this.logger.error('.docjays not found');
        this.logger.info('Please run ' + chalk.cyan('docjays init') + ' first');
        return;
      }

      // Check if linked to cloud
      if (!(await configManager.isCloudLinked())) {
        this.logger.info('Not linked to cloud');
        this.logger.info('Already in local-only mode');
        return;
      }

      // Get current cloud config
      const cloudConfig = await configManager.getCloudConfig();

      if (!cloudConfig) {
        this.logger.error('Failed to read cloud configuration');
        return;
      }

      console.log('');
      console.log(chalk.yellow.bold('⚠️  Unlink from Cloud'));
      console.log('');
      console.log(chalk.bold('Currently linked to:'));
      console.log(`  Project: ${chalk.cyan(cloudConfig.projectName)}`);
      console.log(`  ID: ${chalk.dim(cloudConfig.projectId)}`);
      console.log('');
      console.log(chalk.yellow('This will:'));
      console.log(`  ${chalk.yellow('•')} Switch to local-only mode`);
      console.log(`  ${chalk.yellow('•')} Remove cloud project connection`);
      console.log(`  ${chalk.yellow('•')} Keep all local documentation`);
      console.log('');
      console.log(chalk.dim('You can re-link later with: ') + chalk.cyan('docjays link'));
      console.log('');

      // Confirm unlink
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to unlink from cloud?',
            default: false,
          },
        ]);

        if (!confirm) {
          this.logger.info('Unlink cancelled');
          return;
        }
      }

      // Unlink from cloud
      await configManager.unlinkCloud();

      console.log('');
      this.logger.success('Successfully disconnected from cloud');
      console.log('');
      console.log(chalk.dim('Your .docjays folder is now in local-only mode'));
      console.log(chalk.dim('All local documentation has been preserved'));
      console.log('');
    } catch (error: any) {
      this.handleError(error, 'unlink');
    }
  }
}
