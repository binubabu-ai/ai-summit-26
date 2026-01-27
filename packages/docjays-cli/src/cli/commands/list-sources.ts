import chalk from 'chalk';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';

/**
 * List Sources Command
 * List all configured documentation sources
 */
export class ListSourcesCommand extends BaseCommand {
  register(): void {
    this.program
      .command('list-sources')
      .alias('ls')
      .description('List all configured documentation sources')
      .option('--enabled', 'Show only enabled sources')
      .option('--disabled', 'Show only disabled sources')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      const configManager = new ConfigManager();
      const config = await configManager.load();

      let sources = config.sources;

      // Filter by status if requested
      if (options.enabled) {
        sources = sources.filter((s) => s.enabled);
      } else if (options.disabled) {
        sources = sources.filter((s) => !s.enabled);
      }

      if (sources.length === 0) {
        this.logger.info('No sources configured');
        console.log('');
        console.log(chalk.dim('Add a source: docjays add-source'));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(sources, null, 2));
      } else {
        this.displaySources(sources);
      }
    } catch (error: any) {
      this.handleError(error, 'list-sources');
    }
  }

  /**
   * Display sources in terminal
   */
  private displaySources(sources: any[]): void {
    console.log('');
    console.log(chalk.bold('Documentation Sources:'));
    console.log('─'.repeat(60));
    console.log('');

    sources.forEach((source, index) => {
      const statusIcon = source.enabled ? chalk.green('✓') : chalk.gray('○');
      const typeColor = this.getTypeColor(source.type);

      console.log(`${chalk.bold(`${index + 1}.`)} ${statusIcon} ${chalk.bold.cyan(source.name)}`);
      console.log(`   Type: ${typeColor(source.type)}`);
      console.log(`   URL: ${chalk.dim(source.url)}`);

      if (source.branch) {
        console.log(`   Branch: ${chalk.dim(source.branch)}`);
      }

      console.log(`   Path: ${chalk.dim(source.path)}`);

      if (source.auth) {
        console.log(`   Auth: ${chalk.cyan(source.auth)} 🔐`);
      }

      console.log(`   Status: ${source.enabled ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
      console.log('');
    });

    console.log(chalk.dim(`Total: ${sources.length} source(s)`));
    console.log('');

    // Show actions
    console.log(chalk.bold('Actions:'));
    console.log(chalk.dim('  • Sync all: docjays sync'));
    console.log(chalk.dim('  • Sync specific: docjays sync --source <name>'));
    console.log(chalk.dim('  • Add source: docjays add-source'));
    console.log('');
  }

  /**
   * Get color for source type
   */
  private getTypeColor(type: string): (text: string) => string {
    switch (type) {
      case 'git':
        return chalk.green;
      case 'http':
        return chalk.blue;
      case 'local':
        return chalk.yellow;
      default:
        return chalk.white;
    }
  }
}
