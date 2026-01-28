import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCommand } from './base';
import { StructureManager } from '../../core/structure';
import { ConfigManager } from '../../core/config';
import { GitIgnoreManager } from '../../core/gitignore';
import { KeyStore } from '../../core/auth/keystore';

/**
 * Init Command
 * Initialize Docjays in the current project
 */
export class InitCommand extends BaseCommand {
  register(): void {
    this.program
      .command('init')
      .description('Initialize Docjays in the current project')
      .option('-y, --yes', 'Skip prompts and use defaults')
      .option('--no-gitignore', 'Skip updating .gitignore')
      .option('--no-auth', 'Skip keystore initialization')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: any): Promise<void> {
    try {
      // Check if already initialized
      const configManager = new ConfigManager();
      let isReinit = false;
      if (await configManager.isInitialized()) {
        this.logger.warn('.docjays already exists');
        const overwrite = await this.confirm(
          'Re-initialize Docjays? This will preserve existing sources but reset configuration.',
          false
        );

        if (!overwrite) {
          this.logger.info('Initialization cancelled');
          return;
        }
        isReinit = true;
      }

      // Welcome message
      this.showWelcome();

      // Get configuration from user
      const config = options.yes
        ? this.getDefaultConfig()
        : await this.promptForConfig();

      // Create folder structure
      await this.createStructure();

      // Initialize configuration (force=true if re-initializing)
      await this.initializeConfig(config, isReinit);

      // Maybe create skills.md
      if (!options.yes) {
        await this.maybeCreateSkills();
      }

      // Update .gitignore
      if (options.gitignore !== false) {
        await this.updateGitIgnore();
      }

      // Initialize keystore (optional)
      if (options.auth !== false && config.initializeKeystore) {
        await this.initializeKeystore();
      }

      // Show success message
      this.showSuccess(config.initializeKeystore);

      // Maybe link to cloud (optional, non-intrusive)
      if (!options.yes) {
        await this.maybeLinkToCloud();
      }
    } catch (error: any) {
      this.handleError(error, 'init');
    }
  }

  /**
   * Show welcome message
   */
  private showWelcome(): void {
    console.log('');
    console.log(chalk.cyan.bold('📚 Docjays - Documentation Management'));
    console.log(chalk.dim('Setting up documentation management for this project...'));
    console.log('');
  }

  /**
   * Prompt user for configuration
   */
  private async promptForConfig(): Promise<any> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableMCP',
        message: 'Enable MCP server for Claude integration?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'autoSync',
        message: 'Enable automatic syncing of documentation sources?',
        default: false,
      },
      {
        type: 'input',
        name: 'syncInterval',
        message: 'Sync interval (e.g., 1h, 30m):',
        default: '1h',
        when: (answers) => answers.autoSync,
        validate: (input) => {
          if (/^\d+[hms]$/.test(input)) {
            return true;
          }
          return 'Please enter a valid interval (e.g., 1h, 30m, 60s)';
        },
      },
      {
        type: 'confirm',
        name: 'initializeKeystore',
        message: 'Initialize secure keystore for private repo authentication?',
        default: false,
      },
    ]);

    return answers;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): any {
    return {
      enableMCP: true,
      autoSync: false,
      syncInterval: '1h',
      initializeKeystore: false,
    };
  }

  /**
   * Create folder structure
   */
  private async createStructure(): Promise<void> {
    const spinner = ora('Creating .docjays folder structure...').start();

    try {
      const structureManager = new StructureManager();
      await structureManager.create(true); // Allow overwrite
      spinner.succeed('Created .docjays folder structure');
    } catch (error: any) {
      spinner.fail('Failed to create folder structure');
      throw error;
    }
  }

  /**
   * Initialize configuration
   */
  private async initializeConfig(userConfig: any, force: boolean = false): Promise<void> {
    const spinner = ora('Generating configuration...').start();

    try {
      const configManager = new ConfigManager();

      const config = {
        mcp: {
          enabled: userConfig.enableMCP,
          transport: 'stdio' as const,
          resources: ['sources', 'features', 'context'],
        },
        sync: {
          auto: userConfig.autoSync,
          interval: userConfig.syncInterval || '1h',
          onStart: false,
        },
      };

      await configManager.initialize(config, force);
      spinner.succeed('Generated configuration file');
    } catch (error: any) {
      spinner.fail('Failed to generate configuration');
      throw error;
    }
  }

  /**
   * Update .gitignore
   */
  private async updateGitIgnore(): Promise<void> {
    const spinner = ora('Updating .gitignore...').start();

    try {
      const gitignoreManager = new GitIgnoreManager();
      const added = await gitignoreManager.addDocjays();

      if (added) {
        spinner.succeed('Updated .gitignore');
      } else {
        spinner.info('.gitignore already includes .docjays');
      }
    } catch (error: any) {
      spinner.warn('Could not update .gitignore');
      this.logger.debug(error.message);
    }
  }

  /**
   * Maybe create skills.md for AI agent instructions
   */
  private async maybeCreateSkills(): Promise<void> {
    const skillsPath = path.join(process.cwd(), 'skills.md');
    const templatePath = path.join(__dirname, '../../../templates/skills.md');

    try {
      // Check if skills.md already exists
      const exists = await fs.access(skillsPath).then(() => true).catch(() => false);

      if (exists) {
        // Check if it has Docjays content
        const content = await fs.readFile(skillsPath, 'utf-8');
        const hasDocjaysContent =
          content.includes('# Docjays Skills') ||
          content.includes('Ground Responses with Docjays');

        if (hasDocjaysContent) {
          this.logger.info('✓ Docjays skills already configured in skills.md');
          return;
        }

        // Exists but no Docjays content
        console.log('');
        this.logger.info(chalk.dim('skills.md already exists'));
        this.logger.info(chalk.dim('To add Docjays skills, run: ') + chalk.cyan('docjays create-skills'));
        console.log('');
        return;
      }

      // No skills.md, ask to create
      console.log('');
      const { createSkills } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createSkills',
          message: 'Create skills.md for AI agent instructions?',
          default: true,
        },
      ]);

      if (createSkills) {
        const spinner = ora('Creating skills.md...').start();
        try {
          await fs.copyFile(templatePath, skillsPath);
          spinner.succeed('Created skills.md');
          console.log(chalk.dim('  AI agents like Claude Code can now use Docjays workflows'));
        } catch (error: any) {
          spinner.fail('Failed to create skills.md');
          this.logger.debug(error.message);
        }
      } else {
        console.log('');
        this.logger.info(chalk.dim('Skipped skills.md creation'));
        this.logger.info(chalk.dim('To create later, run: ') + chalk.cyan('docjays create-skills'));
      }
      console.log('');
    } catch (error: any) {
      this.logger.debug('Error in maybeCreateSkills:', error.message);
    }
  }

  /**
   * Initialize keystore
   */
  private async initializeKeystore(): Promise<void> {
    console.log('');
    console.log(chalk.bold('🔐 Keystore Setup'));
    console.log(chalk.dim('Secure storage for authentication credentials'));
    console.log('');
    console.log(chalk.yellow('Note: Choose a strong master password'));
    console.log(chalk.dim('      You will need this password to manage keys'));
    console.log('');

    // Prompt for password
    const password = await this.promptPassword('Enter master password (min 8 characters):');
    const confirmPassword = await this.promptPassword('Confirm master password:');

    if (password !== confirmPassword) {
      this.logger.warn('Passwords do not match, skipping keystore setup');
      this.logger.info('You can set up keystore later with: docjays auth init');
      return;
    }

    const spinner = ora('Creating secure keystore...').start();

    try {
      const keyStore = new KeyStore();
      await keyStore.init(password);
      spinner.succeed('Keystore initialized');
    } catch (error: any) {
      spinner.fail('Failed to initialize keystore');
      this.logger.warn('You can set up keystore later with: docjays auth init');
      this.logger.debug(error.message);
    }
  }

  /**
   * Show success message
   */
  private showSuccess(keystoreInitialized: boolean): void {
    console.log('');

    const message = `
${chalk.green.bold('✓ Docjays initialized successfully!')}

${chalk.bold('Folder Structure:')}
  ${chalk.cyan('.docjays/')}
    ├── ${chalk.dim('sources/')}      ${chalk.gray('# Cloned documentation')}
    ├── ${chalk.dim('features/')}     ${chalk.gray('# Feature specifications')}
    ├── ${chalk.dim('context/')}      ${chalk.gray('# AI context files')}
    ├── ${chalk.dim('cache/')}        ${chalk.gray('# Cached data')}
    ├── ${chalk.dim('logs/')}         ${chalk.gray('# Operation logs')}
    ${keystoreInitialized ? `└── ${chalk.dim('.keys/')}       ${chalk.gray('# Encrypted credentials ✓')}` : ''}

${chalk.bold('Next Steps:')}

${chalk.cyan('1. Add documentation sources:')}
   ${chalk.dim('# Add a Git repository')}
   ${chalk.gray('docjays add-source --name docs --type git --url <repo-url>')}

   ${keystoreInitialized ? chalk.dim('# With authentication (if needed)') : chalk.dim('# Set up authentication first')}
   ${keystoreInitialized ? chalk.gray('docjays auth add <key-name> --type token') : chalk.gray('docjays auth init')}
   ${keystoreInitialized ? chalk.gray('docjays add-source --name docs --url <url> --auth <key-name>') : ''}

${chalk.cyan('2. Sync documentation:')}
   ${chalk.gray('docjays sync')}

${chalk.cyan('3. Start MCP server for Claude:')}
   ${chalk.gray('docjays serve')}

${chalk.bold('Documentation:')} ${chalk.underline('https://docjays.dev')}
${chalk.bold('Issues:')} ${chalk.underline('https://github.com/techjays/ai-summit/issues')}
    `;

    console.log(
      boxen(message, {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'green',
      })
    );

    // Show quick reference
    this.showQuickReference();
  }

  /**
   * Show quick reference
   */
  private showQuickReference(): void {
    console.log(chalk.bold('Quick Reference:'));
    console.log('');
    console.log(`  ${chalk.cyan('docjays auth <command>')}`);
    console.log(`  ${chalk.dim('├─')} ${chalk.white('init')}              Initialize keystore`);
    console.log(`  ${chalk.dim('├─')} ${chalk.white('add <name>')}        Add authentication key`);
    console.log(`  ${chalk.dim('├─')} ${chalk.white('list')}              List all keys`);
    console.log(`  ${chalk.dim('└─')} ${chalk.white('remove <name>')}`);
    console.log('');
    console.log(`  ${chalk.cyan('docjays source <command>')}`);
    console.log(`  ${chalk.dim('├─')} ${chalk.white('add')}`);
    console.log(`  ${chalk.dim('├─')} ${chalk.white('list')}`);
    console.log(`  ${chalk.dim('└─')} ${chalk.white('sync')}`);
    console.log('');
    console.log(`  ${chalk.cyan('docjays serve')}           Start MCP server`);
    console.log(`  ${chalk.cyan('docjays watch')}           Watch & auto-sync`);
    console.log(`  ${chalk.cyan('docjays status')}          Show sync status`);
    console.log('');
    console.log(chalk.dim('Run "docjays --help" for full command list'));
    console.log('');
  }

  /**
   * Maybe link to cloud (optional prompt)
   */
  private async maybeLinkToCloud(): Promise<void> {
    try {
      const { AuthManager } = require('../../core/auth/manager');
      const authManager = new AuthManager();
      const auth = await authManager.getAuth();

      // Only prompt if user is logged in
      if (!auth) {
        return;
      }

      console.log('');
      console.log(chalk.cyan.bold('☁️  Cloud Integration (Optional)'));
      console.log(chalk.dim('Link this project to Docjays cloud for team collaboration'));
      console.log('');

      const { linkToCloud } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'linkToCloud',
          message: 'Link to cloud now?',
          default: false,
        },
      ]);

      if (linkToCloud) {
        console.log('');
        this.logger.info('Launching cloud link...');
        console.log('');

        // Import and execute link command
        const { LinkCommand } = require('./link');
        const linkCommand = new LinkCommand(this.program);
        await linkCommand.execute({});
      } else {
        console.log('');
        this.logger.info(chalk.dim('Staying in local-only mode'));
        this.logger.info(chalk.dim('You can link later with: ') + chalk.cyan('docjays link'));
        console.log('');
      }
    } catch (error: any) {
      // Fail silently - cloud linking is optional
      this.logger.debug('Cloud link prompt error:', error.message);
    }
  }
}
