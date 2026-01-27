import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Docjays CLI
 * Main CLI application class
 */
export class DocjaysCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  /**
   * Setup the CLI program
   */
  private setupProgram(): void {
    const version = this.getVersion();

    this.program
      .name('docjays')
      .description(
        chalk.cyan('Documentation management for AI-assisted development')
      )
      .version(version, '-v, --version', 'Output the current version')
      .helpOption('-h, --help', 'Display help for command');

    // Global options
    this.program
      .option('--verbose', 'Enable verbose output')
      .option('--quiet', 'Suppress all output except errors')
      .option('--debug', 'Enable debug mode');

    // Register all commands
    this.registerCommands();

    // Custom help
    this.program.addHelpText(
      'after',
      `
${chalk.bold('Examples:')}
  ${chalk.dim('$')} docjays login
  ${chalk.dim('$')} docjays init
  ${chalk.dim('$')} docjays migrate
  ${chalk.dim('$')} docjays create-skills
  ${chalk.dim('$')} docjays add-source --name docs --type git --url <repo-url>
  ${chalk.dim('$')} docjays sync
  ${chalk.dim('$')} docjays serve

${chalk.bold('Learn more:')} https://docjays.dev
${chalk.bold('Report issues:')} https://github.com/techjays/ai-summit/issues
`
    );
  }

  /**
   * Register all CLI commands
   */
  private registerCommands(): void {
    // Init command
    const { InitCommand } = require('./commands/init');
    const initCommand = new InitCommand(this.program);
    initCommand.register();

    // Migrate command
    const { MigrateCommand } = require('./commands/migrate');
    const migrateCommand = new MigrateCommand(this.program);
    migrateCommand.register();

    // Login command
    const { LoginCommand } = require('./commands/login');
    const loginCommand = new LoginCommand(this.program);
    loginCommand.register();

    // Whoami command
    const { WhoamiCommand } = require('./commands/whoami');
    const whoamiCommand = new WhoamiCommand(this.program);
    whoamiCommand.register();

    // Logout command
    const { LogoutCommand } = require('./commands/logout');
    const logoutCommand = new LogoutCommand(this.program);
    logoutCommand.register();

    // Auth command
    const { AuthCommand } = require('./commands/auth');
    const authCommand = new AuthCommand(this.program);
    authCommand.register();

    // Add Source command
    const { AddSourceCommand } = require('./commands/add-source');
    const addSourceCommand = new AddSourceCommand(this.program);
    addSourceCommand.register();

    // Sync command
    const { SyncCommand } = require('./commands/sync');
    const syncCommand = new SyncCommand(this.program);
    syncCommand.register();

    // Serve command (MCP server)
    const { ServeCommand } = require('./commands/serve');
    const serveCommand = new ServeCommand(this.program);
    serveCommand.register();

    // Status command
    const { StatusCommand } = require('./commands/status');
    const statusCommand = new StatusCommand(this.program);
    statusCommand.register();

    // List Sources command
    const { ListSourcesCommand } = require('./commands/list-sources');
    const listSourcesCommand = new ListSourcesCommand(this.program);
    listSourcesCommand.register();

    // Clean command
    const { CleanCommand } = require('./commands/clean');
    const cleanCommand = new CleanCommand(this.program);
    cleanCommand.register();

    // Watch command
    const { WatchCommand } = require('./commands/watch');
    const watchCommand = new WatchCommand(this.program);
    watchCommand.register();

    // Create Skills command
    const { CreateSkillsCommand } = require('./commands/create-skills');
    const createSkillsCommand = new CreateSkillsCommand(this.program);
    createSkillsCommand.register();

    // Link command
    const { LinkCommand } = require('./commands/link');
    const linkCommand = new LinkCommand(this.program);
    linkCommand.register();

    // Unlink command
    const { UnlinkCommand } = require('./commands/unlink');
    const unlinkCommand = new UnlinkCommand(this.program);
    unlinkCommand.register();
  }

  /**
   * Run the CLI with given arguments
   */
  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error: any) {
      this.handleError(error);
      process.exit(1);
    }
  }

  /**
   * Handle CLI errors
   */
  private handleError(error: any): void {
    console.error('');
    console.error(chalk.red('✗ Error:'), error.message);

    if (process.env.DEBUG) {
      console.error('');
      console.error(chalk.dim('Stack trace:'));
      console.error(chalk.dim(error.stack));
    } else {
      console.error('');
      console.error(
        chalk.dim('Run with --debug flag for more information')
      );
    }

    console.error('');
  }

  /**
   * Get package version
   */
  private getVersion(): string {
    try {
      const packagePath = join(__dirname, '..', '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      return packageJson.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }
}
