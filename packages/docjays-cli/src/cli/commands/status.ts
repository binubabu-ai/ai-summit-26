import chalk from 'chalk';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { StructureManager } from '../../core/structure';
import { KeyStore } from '../../core/auth/keystore';

/**
 * Status Command
 * Show DocJays status and sync information
 */
export class StatusCommand extends BaseCommand {
  register(): void {
    this.program
      .command('status')
      .description('Show DocJays status and sync information')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      const status = await this.gatherStatus();

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        this.displayStatus(status);
      }
    } catch (error: any) {
      this.handleError(error, 'status');
    }
  }

  /**
   * Gather all status information
   */
  private async gatherStatus(): Promise<any> {
    const configManager = new ConfigManager();
    const structureManager = new StructureManager();
    const keyStore = new KeyStore();

    const config = await configManager.load();
    const info = await structureManager.getInfo();
    const keystoreInitialized = await keyStore.isInitialized();

    return {
      initialized: info.exists,
      config: {
        version: config.version,
        mcp: {
          enabled: config.mcp.enabled,
          transport: config.mcp.transport,
        },
        sync: {
          auto: config.sync.auto,
          interval: config.sync.interval,
        },
      },
      sources: {
        total: config.sources.length,
        enabled: config.sources.filter((s) => s.enabled).length,
        disabled: config.sources.filter((s) => !s.enabled).length,
        withAuth: config.sources.filter((s) => s.auth).length,
        list: config.sources.map((s) => ({
          name: s.name,
          type: s.type,
          enabled: s.enabled,
          hasAuth: !!s.auth,
        })),
      },
      structure: {
        sourceCount: info.sourceCount || 0,
        featureCount: info.featureCount || 0,
        contextCount: info.contextCount || 0,
        size: info.size || 0,
      },
      keystore: {
        initialized: keystoreInitialized,
      },
    };
  }

  /**
   * Display status in terminal
   */
  private displayStatus(status: any): void {
    console.log('');
    console.log(chalk.bold.cyan('📊 DocJays Status'));
    console.log('─'.repeat(60));
    console.log('');

    // Initialization status
    console.log(chalk.bold('Initialization:'));
    console.log(`  Status: ${status.initialized ? chalk.green('✓ Initialized') : chalk.red('✗ Not initialized')}`);
    console.log(`  Version: ${chalk.cyan(status.config.version)}`);
    console.log('');

    // MCP Configuration
    console.log(chalk.bold('MCP Server:'));
    console.log(`  Enabled: ${status.config.mcp.enabled ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log(`  Transport: ${chalk.cyan(status.config.mcp.transport)}`);
    console.log('');

    // Sync Configuration
    console.log(chalk.bold('Auto-Sync:'));
    console.log(`  Enabled: ${status.config.sync.auto ? chalk.green('Yes') : chalk.yellow('No')}`);
    if (status.config.sync.auto) {
      console.log(`  Interval: ${chalk.cyan(status.config.sync.interval)}`);
    }
    console.log('');

    // Sources
    console.log(chalk.bold('Documentation Sources:'));
    console.log(`  Total: ${chalk.cyan(status.sources.total)}`);
    console.log(`  Enabled: ${chalk.green(status.sources.enabled)}`);
    if (status.sources.disabled > 0) {
      console.log(`  Disabled: ${chalk.yellow(status.sources.disabled)}`);
    }
    if (status.sources.withAuth > 0) {
      console.log(`  With Auth: ${chalk.cyan(status.sources.withAuth)}`);
    }
    console.log('');

    if (status.sources.list.length > 0) {
      console.log(chalk.bold('  Configured Sources:'));
      status.sources.list.forEach((source: any) => {
        const statusIcon = source.enabled ? chalk.green('✓') : chalk.gray('○');
        const authIcon = source.hasAuth ? chalk.cyan('🔐') : '';
        console.log(`    ${statusIcon} ${chalk.bold(source.name)} ${chalk.dim(`(${source.type})`)} ${authIcon}`);
      });
      console.log('');
    }

    // Content Statistics
    console.log(chalk.bold('Content:'));
    console.log(`  Documentation files: ${chalk.cyan(status.structure.sourceCount)}`);
    console.log(`  Feature specs: ${chalk.cyan(status.structure.featureCount)}`);
    console.log(`  Context files: ${chalk.cyan(status.structure.contextCount)}`);
    console.log(`  Total size: ${chalk.cyan(this.formatBytes(status.structure.size))}`);
    console.log('');

    // Keystore
    console.log(chalk.bold('Keystore:'));
    console.log(`  Status: ${status.keystore.initialized ? chalk.green('✓ Initialized') : chalk.yellow('○ Not initialized')}`);
    console.log('');

    // Quick Actions
    console.log(chalk.bold('Quick Actions:'));
    if (status.sources.enabled === 0) {
      console.log(chalk.dim('  • Add a source: docjays add-source'));
    }
    if (status.sources.enabled > 0) {
      console.log(chalk.dim('  • Sync sources: docjays sync'));
    }
    if (status.config.mcp.enabled) {
      console.log(chalk.dim('  • Start MCP server: docjays serve'));
    }
    if (!status.keystore.initialized) {
      console.log(chalk.dim('  • Initialize keystore: docjays auth init'));
    }
    console.log('');
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
