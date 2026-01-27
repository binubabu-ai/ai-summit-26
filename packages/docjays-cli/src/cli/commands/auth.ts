import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BaseCommand } from './base';
import { KeyStore, KeyType } from '../../core/auth/keystore';

/**
 * Auth Command
 * Manages authentication credentials for DocJays
 */
export class AuthCommand extends BaseCommand {
  private keyStore: KeyStore;

  constructor(program: Command) {
    super(program);
    this.keyStore = new KeyStore();
  }

  register(): void {
    const auth = this.program
      .command('auth')
      .description('Manage authentication credentials');

    // auth init
    auth
      .command('init')
      .description('Initialize the keystore with a master password')
      .action(async () => {
        await this.execute('init');
      });

    // auth add
    auth
      .command('add <name>')
      .description('Add a new authentication key')
      .option('-t, --type <type>', 'Key type (token, ssh, api_key, password)', 'token')
      .option('-d, --description <desc>', 'Key description')
      .option('-f, --file <path>', 'Import from file (for SSH keys)')
      .action(async (name, options) => {
        await this.execute('add', name, options);
      });

    // auth list
    auth
      .command('list')
      .alias('ls')
      .description('List all stored keys')
      .action(async () => {
        await this.execute('list');
      });

    // auth remove
    auth
      .command('remove <name>')
      .alias('rm')
      .description('Remove a key')
      .action(async (name) => {
        await this.execute('remove', name);
      });

    // auth update
    auth
      .command('update <name>')
      .description('Update a key value')
      .action(async (name) => {
        await this.execute('update', name);
      });

    // auth rotate-password
    auth
      .command('rotate-password')
      .description('Change the master password')
      .action(async () => {
        await this.execute('rotate-password');
      });

    // auth export
    auth
      .command('export')
      .description('Export keys (encrypted)')
      .option('-o, --output <file>', 'Output file', 'keys.enc')
      .action(async (options) => {
        await this.execute('export', options);
      });

    // auth import
    auth
      .command('import')
      .description('Import keys from export')
      .option('-i, --input <file>', 'Input file', 'keys.enc')
      .action(async (options) => {
        await this.execute('import', options);
      });

    // auth destroy
    auth
      .command('destroy')
      .description('Destroy keystore (delete all keys)')
      .action(async () => {
        await this.execute('destroy');
      });
  }

  async execute(action: string, ...args: any[]): Promise<void> {
    try {
      switch (action) {
        case 'init':
          await this.initKeystore();
          break;
        case 'add':
          await this.addKey(args[0], args[1]);
          break;
        case 'list':
          await this.listKeys();
          break;
        case 'remove':
          await this.removeKey(args[0]);
          break;
        case 'update':
          await this.updateKey(args[0]);
          break;
        case 'rotate-password':
          await this.rotatePassword();
          break;
        case 'export':
          await this.exportKeys(args[0]);
          break;
        case 'import':
          await this.importKeys(args[0]);
          break;
        case 'destroy':
          await this.destroyKeystore();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.handleError(error, 'auth');
    }
  }

  /**
   * Initialize keystore
   */
  private async initKeystore(): Promise<void> {
    if (await this.keyStore.isInitialized()) {
      this.logger.warn('Keystore already initialized');
      const overwrite = await this.confirm('Re-initialize keystore? This will delete all keys.', false);

      if (!overwrite) {
        return;
      }

      // Destroy existing keystore
      const password = await this.promptPassword('Enter current master password:');
      await this.keyStore.destroy(password);
    }

    this.logger.info('Initializing keystore...');
    console.log('');
    console.log(chalk.yellow('⚠ Important:'));
    console.log(chalk.dim('  - Choose a strong master password'));
    console.log(chalk.dim('  - You will need this password to access your keys'));
    console.log(chalk.dim('  - Do not lose this password!'));
    console.log('');

    // Prompt for password
    const password = await this.promptPassword('Enter master password (min 8 characters):');
    const confirmPassword = await this.promptPassword('Confirm master password:');

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const spinner = ora('Creating keystore...').start();

    try {
      await this.keyStore.init(password);
      spinner.succeed('Keystore initialized successfully');

      console.log('');
      console.log(chalk.green('✓ Keystore is ready!'));
      console.log('');
      console.log('Next steps:');
      console.log(chalk.cyan('  1. Add authentication keys:'));
      console.log(chalk.dim('     docjays auth add <name> --type token'));
      console.log(chalk.cyan('  2. Use keys in sources:'));
      console.log(chalk.dim('     docjays add-source --name docs --url <url> --auth <key-name>'));
    } catch (error: any) {
      spinner.fail('Failed to initialize keystore');
      throw error;
    }
  }

  /**
   * Add a new key
   */
  private async addKey(name: string, options: any): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    // Get master password
    const password = await this.promptPassword('Enter master password:');

    // Get key value
    let keyValue: string;

    if (options.file) {
      // Import from file (for SSH keys)
      const fs = await import('fs-extra');
      if (!(await fs.pathExists(options.file))) {
        throw new Error(`File not found: ${options.file}`);
      }
      keyValue = await fs.readFile(options.file, 'utf-8');
      this.logger.info(`Importing key from ${options.file}`);
    } else {
      // Prompt for value
      const keyType = options.type as KeyType;
      keyValue = await this.promptPassword(`Enter ${keyType} value:`);
    }

    const spinner = ora(`Adding key '${name}'...`).start();

    try {
      await this.keyStore.add(
        name,
        keyValue,
        options.type as KeyType,
        password,
        options.description
      );

      spinner.succeed(`Key '${name}' added successfully`);

      console.log('');
      console.log(chalk.dim('Use this key in sources:'));
      console.log(chalk.cyan(`  docjays add-source --name <source> --url <url> --auth ${name}`));
    } catch (error: any) {
      spinner.fail(`Failed to add key '${name}'`);
      throw error;
    }
  }

  /**
   * List all keys
   */
  private async listKeys(): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    // Get master password
    const password = await this.promptPassword('Enter master password:');

    const keys = await this.keyStore.list(password);

    if (keys.length === 0) {
      this.logger.info('No keys stored');
      console.log('');
      console.log(chalk.dim('Add a key: docjays auth add <name>'));
      return;
    }

    console.log('');
    console.log(chalk.bold('Stored Keys:'));
    console.log('');

    for (const key of keys) {
      const createdDate = new Date(key.createdAt).toLocaleDateString();
      const typeColor = this.getTypeColor(key.type);

      console.log(`  ${chalk.cyan('•')} ${chalk.bold(key.name)}`);
      console.log(`    Type: ${typeColor(key.type)}`);
      console.log(`    Created: ${chalk.dim(createdDate)}`);
      if (key.description) {
        console.log(`    Description: ${chalk.dim(key.description)}`);
      }
      console.log('');
    }

    console.log(chalk.dim(`Total: ${keys.length} key(s)`));
  }

  /**
   * Remove a key
   */
  private async removeKey(name: string): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    // Confirm
    const confirmed = await this.confirm(
      `Remove key '${name}'?`,
      false
    );

    if (!confirmed) {
      this.logger.info('Cancelled');
      return;
    }

    // Get master password
    const password = await this.promptPassword('Enter master password:');

    const spinner = ora(`Removing key '${name}'...`).start();

    try {
      await this.keyStore.remove(name, password);
      spinner.succeed(`Key '${name}' removed`);
    } catch (error: any) {
      spinner.fail(`Failed to remove key '${name}'`);
      throw error;
    }
  }

  /**
   * Update a key
   */
  private async updateKey(name: string): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    // Get master password
    const password = await this.promptPassword('Enter master password:');

    // Check if key exists
    if (!(await this.keyStore.has(name, password))) {
      throw new Error(`Key '${name}' not found`);
    }

    // Get new value
    const newValue = await this.promptPassword('Enter new value:');

    const spinner = ora(`Updating key '${name}'...`).start();

    try {
      await this.keyStore.update(name, newValue, password);
      spinner.succeed(`Key '${name}' updated`);
    } catch (error: any) {
      spinner.fail(`Failed to update key '${name}'`);
      throw error;
    }
  }

  /**
   * Rotate master password
   */
  private async rotatePassword(): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    console.log('');
    console.log(chalk.yellow('⚠ Rotating master password'));
    console.log(chalk.dim('All keys will be re-encrypted with the new password'));
    console.log('');

    // Get current password
    const oldPassword = await this.promptPassword('Enter current master password:');

    // Get new password
    const newPassword = await this.promptPassword('Enter new master password (min 8 characters):');
    const confirmPassword = await this.promptPassword('Confirm new master password:');

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const spinner = ora('Rotating password...').start();

    try {
      await this.keyStore.rotatePassword(oldPassword, newPassword);
      spinner.succeed('Master password updated successfully');
    } catch (error: any) {
      spinner.fail('Failed to rotate password');
      throw error;
    }
  }

  /**
   * Export keys
   */
  private async exportKeys(options: any): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    // Get master password
    const masterPassword = await this.promptPassword('Enter master password:');

    // Get export password
    console.log('');
    console.log(chalk.dim('Choose a password to encrypt the export file'));
    const exportPassword = await this.promptPassword('Enter export password:');
    const confirmPassword = await this.promptPassword('Confirm export password:');

    if (exportPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const spinner = ora('Exporting keys...').start();

    try {
      const exportData = await this.keyStore.export(masterPassword, exportPassword);

      const fs = await import('fs-extra');
      await fs.writeFile(options.output, exportData);

      spinner.succeed(`Keys exported to ${options.output}`);

      console.log('');
      console.log(chalk.yellow('⚠ Important:'));
      console.log(chalk.dim('  - Keep this file secure'));
      console.log(chalk.dim('  - Share it through secure channels only'));
      console.log(chalk.dim(`  - Remember the export password: you'll need it to import`));
    } catch (error: any) {
      spinner.fail('Failed to export keys');
      throw error;
    }
  }

  /**
   * Import keys
   */
  private async importKeys(options: any): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized. Run: docjays auth init');
    }

    const fs = await import('fs-extra');
    if (!(await fs.pathExists(options.input))) {
      throw new Error(`File not found: ${options.input}`);
    }

    // Get master password
    const masterPassword = await this.promptPassword('Enter master password:');

    // Get export password
    const exportPassword = await this.promptPassword('Enter export password:');

    const spinner = ora('Importing keys...').start();

    try {
      const exportData = await fs.readFile(options.input, 'utf-8');
      await this.keyStore.import(exportData, exportPassword, masterPassword);

      spinner.succeed('Keys imported successfully');
    } catch (error: any) {
      spinner.fail('Failed to import keys');
      throw error;
    }
  }

  /**
   * Destroy keystore
   */
  private async destroyKeystore(): Promise<void> {
    if (!(await this.keyStore.isInitialized())) {
      throw new Error('Keystore not initialized');
    }

    console.log('');
    console.log(chalk.red.bold('⚠ WARNING: This will permanently delete ALL keys!'));
    console.log(chalk.dim('This action cannot be undone.'));
    console.log('');

    const confirmed = await this.confirm(
      'Are you absolutely sure you want to destroy the keystore?',
      false
    );

    if (!confirmed) {
      this.logger.info('Cancelled');
      return;
    }

    // Double confirmation
    const doubleConfirm = await this.confirm(
      'Type YES to confirm destruction',
      false
    );

    if (!doubleConfirm) {
      this.logger.info('Cancelled');
      return;
    }

    // Get master password
    const password = await this.promptPassword('Enter master password to confirm:');

    const spinner = ora('Destroying keystore...').start();

    try {
      await this.keyStore.destroy(password);
      spinner.succeed('Keystore destroyed');
    } catch (error: any) {
      spinner.fail('Failed to destroy keystore');
      throw error;
    }
  }

  /**
   * Get color for key type
   */
  private getTypeColor(type: KeyType): (text: string) => string {
    switch (type) {
      case KeyType.TOKEN:
        return chalk.green;
      case KeyType.SSH:
        return chalk.blue;
      case KeyType.API_KEY:
        return chalk.yellow;
      case KeyType.PASSWORD:
        return chalk.magenta;
      default:
        return chalk.white;
    }
  }
}
