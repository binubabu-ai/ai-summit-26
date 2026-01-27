import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { SourceCloner } from '../../core/cloner';
import { Source } from '../../types';

/**
 * Add Source Command
 * Add a new documentation source
 */
export class AddSourceCommand extends BaseCommand {
  register(): void {
    this.program
      .command('add-source')
      .description('Add a new documentation source')
      .option('-n, --name <name>', 'Source name (required)')
      .option('-t, --type <type>', 'Source type: git, http, local (required)')
      .option('-u, --url <url>', 'Source URL or path (required)')
      .option('-b, --branch <branch>', 'Git branch (default: main)')
      .option('-p, --path <path>', 'Destination path in .docjays/sources/')
      .option('-a, --auth <keyname>', 'Authentication key name from keystore')
      .option('--no-sync', 'Do not sync after adding')
      .option('--disabled', 'Add as disabled source')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      await this.requireInitialization();

      // Interactive mode if options not provided
      const source = options.name
        ? await this.getSourceFromOptions(options)
        : await this.getSourceFromPrompts();

      // Validate source
      await this.validateSource(source);

      // Add to configuration
      await this.addSource(source);

      // Sync if requested
      if (options.sync !== false) {
        await this.syncSource(source);
      }

      this.showSuccess(source, options.sync !== false);
    } catch (error: any) {
      this.handleError(error, 'add-source');
    }
  }

  /**
   * Get source configuration from command options
   */
  private async getSourceFromOptions(options: any): Promise<Source> {
    if (!options.type) {
      throw new Error('--type is required');
    }

    if (!options.url) {
      throw new Error('--url is required');
    }

    // Generate path if not provided
    const path = options.path || `sources/${options.name}`;

    return {
      name: options.name,
      type: options.type,
      url: options.url,
      branch: options.branch || 'main',
      path,
      enabled: !options.disabled,
      auth: options.auth,
    };
  }

  /**
   * Get source configuration from interactive prompts
   */
  private async getSourceFromPrompts(): Promise<Source> {
    console.log('');
    console.log(chalk.bold('📚 Add Documentation Source'));
    console.log('');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Source name:',
        validate: (input) => {
          if (!input.trim()) return 'Name is required';
          if (!/^[a-z0-9-_]+$/i.test(input)) {
            return 'Name must contain only letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Source type:',
        choices: [
          { name: 'Git Repository', value: 'git' },
          { name: 'HTTP/HTTPS URL', value: 'http' },
          { name: 'Local Path', value: 'local' },
        ],
      },
      {
        type: 'input',
        name: 'url',
        message: (answers) => {
          switch (answers.type) {
            case 'git':
              return 'Git repository URL:';
            case 'http':
              return 'HTTP URL:';
            case 'local':
              return 'Local path:';
            default:
              return 'URL or path:';
          }
        },
        validate: (input) => {
          if (!input.trim()) return 'URL or path is required';
          return true;
        },
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Git branch:',
        default: 'main',
        when: (answers) => answers.type === 'git',
      },
      {
        type: 'confirm',
        name: 'requiresAuth',
        message: 'Requires authentication?',
        default: false,
        when: (answers) => answers.type === 'git' || answers.type === 'http',
      },
      {
        type: 'input',
        name: 'auth',
        message: 'Authentication key name (from keystore):',
        when: (answers) => answers.requiresAuth,
        validate: (input) => {
          if (!input.trim()) return 'Key name is required';
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Enable this source immediately?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'syncNow',
        message: 'Sync this source now?',
        default: true,
      },
    ]);

    // Generate path
    const path = `sources/${answers.name}`;

    return {
      name: answers.name,
      type: answers.type,
      url: answers.url,
      branch: answers.branch || 'main',
      path,
      enabled: answers.enabled,
      auth: answers.auth,
    };
  }

  /**
   * Validate source before adding
   */
  private async validateSource(source: Source): Promise<void> {
    const spinner = ora('Validating source...').start();

    try {
      const cloner = new SourceCloner();
      const validation = await cloner.validate(source);

      if (!validation.valid) {
        spinner.fail('Validation failed');
        throw new Error(validation.error);
      }

      spinner.succeed('Source validated');
    } catch (error: any) {
      spinner.fail('Validation failed');
      throw error;
    }
  }

  /**
   * Add source to configuration
   */
  private async addSource(source: Source): Promise<void> {
    const spinner = ora('Adding source to configuration...').start();

    try {
      const configManager = new ConfigManager();
      await configManager.addSource(source);
      spinner.succeed('Source added to configuration');
    } catch (error: any) {
      spinner.fail('Failed to add source');
      throw error;
    }
  }

  /**
   * Sync source immediately
   */
  private async syncSource(source: Source): Promise<void> {
    console.log('');
    console.log(chalk.bold(`Syncing ${source.name}...`));

    // Get master password if auth is required
    let masterPassword: string | undefined;
    if (source.auth) {
      masterPassword = await this.promptPassword('Enter keystore master password:');
    }

    const spinner = ora('Syncing...').start();

    try {
      const cloner = new SourceCloner();
      const result = await cloner.sync(source, {
        force: true,
        onProgress: (progress) => {
          spinner.text = progress.message;
        },
      }, masterPassword);

      if (result.success) {
        spinner.succeed(`Synced successfully (${result.duration}ms)`);
      } else {
        spinner.fail('Sync failed');
        if (result.error) {
          this.logger.error(result.error.message);
        }
      }
    } catch (error: any) {
      spinner.fail('Sync failed');
      throw error;
    }
  }

  /**
   * Show success message
   */
  private showSuccess(source: Source, synced: boolean): void {
    console.log('');
    console.log(chalk.green.bold('✓ Source added successfully!'));
    console.log('');
    console.log(chalk.bold('Source Details:'));
    console.log(`  Name: ${chalk.cyan(source.name)}`);
    console.log(`  Type: ${chalk.cyan(source.type)}`);
    console.log(`  URL: ${chalk.dim(source.url)}`);
    if (source.branch) {
      console.log(`  Branch: ${chalk.dim(source.branch)}`);
    }
    console.log(`  Path: ${chalk.dim(source.path)}`);
    console.log(`  Status: ${source.enabled ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
    if (source.auth) {
      console.log(`  Auth: ${chalk.cyan(source.auth)}`);
    }
    console.log('');

    if (!synced) {
      console.log(chalk.dim('To sync this source:'));
      console.log(chalk.gray(`  docjays sync --source ${source.name}`));
      console.log('');
    }

    console.log(chalk.dim('To sync all sources:'));
    console.log(chalk.gray('  docjays sync'));
    console.log('');
  }
}
