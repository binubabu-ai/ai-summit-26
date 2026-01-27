import { Command } from 'commander';
import { Logger } from '../../utils/logger';
import { CommandOptions } from '../../types';

/**
 * Base Command Class
 * All CLI commands extend from this base class
 */
export abstract class BaseCommand {
  protected logger: Logger;
  protected options: CommandOptions = {};

  constructor(protected program: Command) {
    this.logger = new Logger();
  }

  /**
   * Register the command with the CLI program
   * Must be implemented by each command
   */
  abstract register(): void;

  /**
   * Execute the command logic
   * Must be implemented by each command
   */
  abstract execute(...args: any[]): Promise<void>;

  /**
   * Handle errors in a consistent way
   */
  protected handleError(error: Error, context?: string): void {
    if (context) {
      this.logger.error(error.message, context);
    } else {
      this.logger.error(error.message);
    }

    if (this.options.debug || process.env.DEBUG) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    throw error;
  }

  /**
   * Set command options (verbose, quiet, debug)
   */
  protected setOptions(options: CommandOptions): void {
    this.options = options;

    // Update logger based on options
    if (options.verbose) {
      this.logger.setLevel(0); // DEBUG
    } else if (options.quiet) {
      this.logger.setLevel(3); // ERROR only
    }
  }

  /**
   * Check if DocJays is initialized
   */
  protected async requireInitialization(): Promise<void> {
    const { ConfigManager } = await import('../../core/config');
    const configManager = new ConfigManager();

    if (!(await configManager.isInitialized())) {
      throw new Error(
        'DocJays not initialized in this directory.\nRun: docjays init'
      );
    }
  }

  /**
   * Get user confirmation
   */
  protected async confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
    const inquirer = await import('inquirer');
    const { confirm } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: defaultValue,
      },
    ]);

    return confirm;
  }

  /**
   * Prompt for input
   */
  protected async prompt(
    message: string,
    defaultValue?: string
  ): Promise<string> {
    const inquirer = await import('inquirer');
    const { value } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: defaultValue,
      },
    ]);

    return value;
  }

  /**
   * Prompt for password (hidden input)
   */
  protected async promptPassword(message: string): Promise<string> {
    const inquirer = await import('inquirer');
    const { password } = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'password',
        message,
        mask: '*',
      },
    ]);

    return password;
  }

  /**
   * Select from list
   */
  protected async select(
    message: string,
    choices: string[]
  ): Promise<string> {
    const inquirer = await import('inquirer');
    const { selected } = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
      },
    ]);

    return selected;
  }
}
