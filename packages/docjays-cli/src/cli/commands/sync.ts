import chalk from 'chalk';
import ora from 'ora';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { SourceCloner } from '../../core/cloner';
import { SyncResult } from '../../types';

/**
 * Sync Command
 * Sync documentation sources
 */
export class SyncCommand extends BaseCommand {
  register(): void {
    this.program
      .command('sync')
      .description('Sync documentation sources')
      .option('-s, --source <name>', 'Sync specific source only')
      .option('-f, --force', 'Force re-clone (delete and clone fresh)')
      .option('--no-progress', 'Disable progress indicators')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      // Load configuration
      const configManager = new ConfigManager();
      const config = await configManager.load();

      // Get sources to sync
      let sources = options.source
        ? config.sources.filter((s) => s.name === options.source)
        : config.sources.filter((s) => s.enabled);

      if (sources.length === 0) {
        if (options.source) {
          throw new Error(`Source '${options.source}' not found`);
        } else {
          this.logger.warn('No enabled sources to sync');
          console.log('');
          console.log(chalk.dim('Add a source: docjays add-source'));
          return;
        }
      }

      // Check if any source requires auth
      const requiresAuth = sources.some((s) => s.auth);
      let masterPassword: string | undefined;

      if (requiresAuth) {
        console.log('');
        masterPassword = await this.promptPassword('Enter keystore master password:');
      }

      // Show sync header
      console.log('');
      console.log(chalk.bold(`Syncing ${sources.length} source(s)...`));
      console.log('');

      // Sync all sources
      const results = await this.syncSources(sources, options, masterPassword);

      // Show results
      console.log('');
      this.showResults(results);
    } catch (error: any) {
      this.handleError(error, 'sync');
    }
  }

  /**
   * Sync multiple sources
   */
  private async syncSources(
    sources: any[],
    options: any,
    masterPassword?: string
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const cloner = new SourceCloner();

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      console.log(chalk.bold(`[${i + 1}/${sources.length}] ${source.name}`));
      console.log(chalk.dim(`  Type: ${source.type}`));
      console.log(chalk.dim(`  URL: ${source.url}`));

      const spinner = ora('Starting...').start();

      try {
        const result = await cloner.sync(
          source,
          {
            force: options.force,
            onProgress: (progress) => {
              if (options.progress !== false) {
                spinner.text = progress.message;
              }
            },
          },
          masterPassword
        );

        if (result.success) {
          spinner.succeed(
            chalk.green(`Synced successfully`) + chalk.dim(` (${result.duration}ms)`)
          );
        } else {
          spinner.fail(chalk.red('Sync failed'));
          if (result.error) {
            console.log(chalk.red(`  Error: ${result.error.message}`));
          }
        }

        results.push(result);
      } catch (error: any) {
        spinner.fail(chalk.red('Sync failed'));
        console.log(chalk.red(`  Error: ${error.message}`));
        results.push({
          source: source.name,
          success: false,
          error,
          duration: 0,
        });
      }

      console.log('');
    }

    return results;
  }

  /**
   * Show sync results summary
   */
  private showResults(results: SyncResult[]): void {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log(chalk.bold('Sync Summary:'));
    console.log('─'.repeat(50));
    console.log(`  ${chalk.green('✓')} Successful: ${chalk.bold(successful.toString())}`);

    if (failed > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${chalk.bold(failed.toString())}`);
    }

    console.log(`  ${chalk.blue('⏱')} Total time: ${chalk.bold(totalTime.toString())}ms`);
    console.log('─'.repeat(50));

    if (failed > 0) {
      console.log('');
      console.log(chalk.yellow('Failed sources:'));
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  ${chalk.red('•')} ${r.source}`);
          if (r.error) {
            console.log(`    ${chalk.dim(r.error.message)}`);
          }
        });
    }

    console.log('');

    if (successful > 0) {
      console.log(chalk.green.bold(`✓ ${successful} source(s) synced successfully!`));
    }

    if (failed > 0) {
      console.log('');
      console.log(chalk.dim('Tip: Use --force to force re-clone failed sources'));
      console.log(chalk.dim('     docjays sync --force'));
    }

    console.log('');
  }
}
