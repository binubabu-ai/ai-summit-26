import chalk from 'chalk';
import ora from 'ora';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { SourceCloner } from '../../core/cloner';

/**
 * Watch Command
 * Watch and auto-sync documentation sources
 */
export class WatchCommand extends BaseCommand {
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  register(): void {
    this.program
      .command('watch')
      .description('Watch and auto-sync documentation sources')
      .option('-i, --interval <time>', 'Sync interval (e.g., 1h, 30m, 5m)', '30m')
      .option('--sync-now', 'Sync immediately on start')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      const configManager = new ConfigManager();
      const config = await configManager.load();

      // Get enabled sources
      const sources = config.sources.filter((s) => s.enabled);

      if (sources.length === 0) {
        this.logger.warn('No enabled sources to watch');
        console.log('');
        console.log(chalk.dim('Add a source: docjays add-source'));
        return;
      }

      // Parse interval
      const intervalMs = this.parseInterval(options.interval);

      // Check if any source requires auth
      const requiresAuth = sources.some((s) => s.auth);
      let masterPassword: string | undefined;

      if (requiresAuth) {
        console.log('');
        masterPassword = await this.promptPassword('Enter keystore master password:');
      }

      // Show watch info
      console.log('');
      console.log(chalk.bold.cyan('👀 Watch Mode'));
      console.log('─'.repeat(60));
      console.log('');
      console.log(chalk.bold('Configuration:'));
      console.log(`  Watching: ${chalk.cyan(sources.length)} source(s)`);
      console.log(`  Interval: ${chalk.cyan(options.interval)} (${chalk.dim(intervalMs / 1000 + 's')})`);
      console.log('');
      sources.forEach((source) => {
        const authIcon = source.auth ? chalk.cyan('🔐') : '';
        console.log(`  ${chalk.green('•')} ${chalk.bold(source.name)} ${chalk.dim(`(${source.type})`)} ${authIcon}`);
      });
      console.log('');
      console.log(chalk.dim('Press Ctrl+C to stop watching'));
      console.log('');
      console.log('─'.repeat(60));
      console.log('');

      // Set up graceful shutdown
      this.setupShutdownHandlers();

      // Sync now if requested
      if (options.syncNow) {
        await this.syncAll(sources, masterPassword);
      }

      // Start watching
      this.isRunning = true;
      this.startWatching(sources, intervalMs, masterPassword);

      // Keep process alive
      await new Promise(() => {}); // Never resolves, keeps running until Ctrl+C
    } catch (error: any) {
      this.handleError(error, 'watch');
    }
  }

  /**
   * Start watching and syncing
   */
  private startWatching(
    sources: any[],
    intervalMs: number,
    masterPassword?: string
  ): void {
    const nextSync = new Date(Date.now() + intervalMs);
    console.log(chalk.dim(`Next sync scheduled for: ${nextSync.toLocaleTimeString()}`));
    console.log('');

    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;

      console.log('');
      console.log(chalk.bold.cyan(`🔄 Auto-sync triggered at ${new Date().toLocaleTimeString()}`));
      console.log('─'.repeat(60));
      console.log('');

      await this.syncAll(sources, masterPassword);

      const nextSyncTime = new Date(Date.now() + intervalMs);
      console.log('');
      console.log(chalk.dim(`Next sync scheduled for: ${nextSyncTime.toLocaleTimeString()}`));
      console.log('');
    }, intervalMs);
  }

  /**
   * Sync all sources
   */
  private async syncAll(sources: any[], masterPassword?: string): Promise<void> {
    const cloner = new SourceCloner();
    let successful = 0;
    let failed = 0;

    for (const source of sources) {
      const spinner = ora(`Syncing ${source.name}...`).start();

      try {
        const result = await cloner.sync(
          source,
          {
            force: false,
            onProgress: (progress) => {
              spinner.text = `${source.name}: ${progress.message}`;
            },
          },
          masterPassword
        );

        if (result.success) {
          spinner.succeed(chalk.green(`${source.name} synced`) + chalk.dim(` (${result.duration}ms)`));
          successful++;
        } else {
          spinner.fail(chalk.red(`${source.name} failed`));
          failed++;
        }
      } catch (error: any) {
        spinner.fail(chalk.red(`${source.name} failed: ${error.message}`));
        failed++;
      }
    }

    // Summary
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} Successful: ${successful}`);
    if (failed > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${failed}`);
    }
  }

  /**
   * Parse interval string to milliseconds
   */
  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(h|m|s)$/);

    if (!match) {
      throw new Error(`Invalid interval format: ${interval}. Use format like 1h, 30m, or 60s`);
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'h':
        return num * 60 * 60 * 1000;
      case 'm':
        return num * 60 * 1000;
      case 's':
        return num * 1000;
      default:
        return 30 * 60 * 1000; // Default 30 minutes
    }
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = () => {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.isRunning = false;

      console.log('');
      console.log('');
      console.log(chalk.yellow('👋 Stopping watch mode...'));
      console.log(chalk.green('✓ Watch mode stopped'));
      console.log('');

      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
