import chalk from 'chalk';
import { BaseCommand } from './base';
import { MCPServer } from '../../mcp/server';
import { ConfigManager } from '../../core/config';

/**
 * Serve Command
 * Start MCP server for Claude integration
 */
export class ServeCommand extends BaseCommand {
  register(): void {
    this.program
      .command('serve')
      .description('Start MCP server for Claude integration')
      .option('--stdio', 'Use stdio transport (default)', true)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(_options: any): Promise<void> {
    try {
      await this.requireInitialization();

      // Check if MCP is enabled
      const configManager = new ConfigManager();
      const config = await configManager.load();

      if (!config.mcp.enabled) {
        this.logger.warn('MCP server is disabled in configuration');
        const enable = await this.confirm('Enable MCP server now?', true);

        if (enable) {
          await configManager.updateMCP({ enabled: true });
          this.logger.success('MCP server enabled');
        } else {
          this.logger.info('Cancelled');
          return;
        }
      }

      // Show startup message (to stderr, not stdout, as stdout is used for MCP communication)
      console.error('');
      console.error(chalk.cyan.bold('🚀 DocJays MCP Server'));
      console.error('');
      console.error(chalk.dim('Starting MCP server for Claude integration...'));
      console.error('');
      console.error(chalk.bold('Server Info:'));
      console.error(`  ${chalk.dim('Transport:')} ${chalk.cyan('stdio')}`);
      console.error(`  ${chalk.dim('Resources:')} ${chalk.cyan(config.mcp.resources.join(', '))}`);
      console.error(`  ${chalk.dim('Status:')} ${chalk.green('Ready')}`);
      console.error('');
      console.error(chalk.bold('Available Tools:'));
      console.error(`  ${chalk.cyan('•')} search_docs       ${chalk.dim('Search across all documentation')}`);
      console.error(`  ${chalk.cyan('•')} list_sources      ${chalk.dim('List all configured sources')}`);
      console.error(`  ${chalk.cyan('•')} read_doc          ${chalk.dim('Read a specific document')}`);
      console.error(`  ${chalk.cyan('•')} list_features     ${chalk.dim('List all feature specs')}`);
      console.error(`  ${chalk.cyan('•')} list_resources    ${chalk.dim('List all resources')}`);
      console.error('');
      console.error(chalk.dim('Waiting for MCP client connection...'));
      console.error(chalk.dim('Press Ctrl+C to stop'));
      console.error('');
      console.error('─'.repeat(60));
      console.error('');

      // Start MCP server
      const server = new MCPServer();
      await server.start();

      // Server is now running and will handle requests via stdio
      // This function won't return until the server is stopped
    } catch (error: any) {
      this.handleError(error, 'serve');
    }
  }
}
