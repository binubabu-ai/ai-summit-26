import chalk from 'chalk';
import ora from 'ora';
import { BaseCommand } from './base';
import { StructureManager } from '../../core/structure';

/**
 * Clean Command
 * Clean cache, logs, or remove .docjays folder
 */
export class CleanCommand extends BaseCommand {
  register(): void {
    this.program
      .command('clean')
      .description('Clean cache, logs, or remove .docjays folder')
      .option('--cache', 'Clean cache only')
      .option('--logs', 'Clean logs only')
      .option('--all', 'Remove entire .docjays folder')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      const structureManager = new StructureManager();

      // Determine what to clean
      if (options.all) {
        await this.cleanAll(structureManager, options.force);
      } else if (options.cache) {
        await this.cleanCache(structureManager, options.force);
      } else if (options.logs) {
        await this.cleanLogs(structureManager, options.force);
      } else {
        // Default: clean both cache and logs
        await this.cleanCacheAndLogs(structureManager, options.force);
      }
    } catch (error: any) {
      this.handleError(error, 'clean');
    }
  }

  /**
   * Clean entire .docjays folder
   */
  private async cleanAll(
    structureManager: StructureManager,
    force: boolean
  ): Promise<void> {
    console.log('');
    console.log(chalk.red.bold('⚠ WARNING: This will delete the entire .docjays folder!'));
    console.log(chalk.dim('All documentation, configuration, and credentials will be removed.'));
    console.log('');

    if (!force) {
      const confirmed = await this.confirm(
        'Are you sure you want to remove .docjays?',
        false
      );

      if (!confirmed) {
        this.logger.info('Cancelled');
        return;
      }

      // Double confirmation for destructive operation
      const doubleConfirm = await this.confirm(
        'This action cannot be undone. Continue?',
        false
      );

      if (!doubleConfirm) {
        this.logger.info('Cancelled');
        return;
      }
    }

    const spinner = ora('Removing .docjays folder...').start();

    try {
      await structureManager.remove();
      spinner.succeed('.docjays folder removed');

      console.log('');
      console.log(chalk.green.bold('✓ Docjays has been completely removed'));
      console.log('');
      console.log(chalk.dim('To reinitialize: docjays init'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to remove .docjays folder');
      throw error;
    }
  }

  /**
   * Clean cache only
   */
  private async cleanCache(
    structureManager: StructureManager,
    force: boolean
  ): Promise<void> {
    if (!force) {
      const confirmed = await this.confirm('Clean cache folder?', true);
      if (!confirmed) {
        this.logger.info('Cancelled');
        return;
      }
    }

    const spinner = ora('Cleaning cache...').start();

    try {
      // Clean cache by removing and recreating
      const fs = await import('fs-extra');
      const path = await import('path');
      const cachePath = structureManager.getCachePath();

      if (await fs.pathExists(cachePath)) {
        await fs.emptyDir(cachePath);
        await fs.writeFile(path.join(cachePath, '.gitkeep'), '');
      }

      spinner.succeed('Cache cleaned');
      console.log('');
      console.log(chalk.green('✓ Cache folder has been cleared'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to clean cache');
      throw error;
    }
  }

  /**
   * Clean logs only
   */
  private async cleanLogs(
    structureManager: StructureManager,
    force: boolean
  ): Promise<void> {
    if (!force) {
      const confirmed = await this.confirm('Clean logs folder?', true);
      if (!confirmed) {
        this.logger.info('Cancelled');
        return;
      }
    }

    const spinner = ora('Cleaning logs...').start();

    try {
      // Clean logs by removing and recreating
      const fs = await import('fs-extra');
      const path = await import('path');
      const logsPath = structureManager.getLogsPath();

      if (await fs.pathExists(logsPath)) {
        await fs.emptyDir(logsPath);
        await fs.writeFile(path.join(logsPath, '.gitkeep'), '');
      }

      spinner.succeed('Logs cleaned');
      console.log('');
      console.log(chalk.green('✓ Logs folder has been cleared'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to clean logs');
      throw error;
    }
  }

  /**
   * Clean both cache and logs
   */
  private async cleanCacheAndLogs(
    structureManager: StructureManager,
    force: boolean
  ): Promise<void> {
    if (!force) {
      const confirmed = await this.confirm('Clean cache and logs?', true);
      if (!confirmed) {
        this.logger.info('Cancelled');
        return;
      }
    }

    const spinner = ora('Cleaning cache and logs...').start();

    try {
      await structureManager.clean();
      spinner.succeed('Cache and logs cleaned');

      console.log('');
      console.log(chalk.green('✓ Cache and logs have been cleared'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to clean');
      throw error;
    }
  }
}
