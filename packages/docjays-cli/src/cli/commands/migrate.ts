import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';

interface DocLocation {
  type: 'folder' | 'file';
  path: string;
  relativePath: string;
  fileCount?: number;
  size?: number;
}

interface MigrateOptions {
  auto?: boolean;
  move?: boolean;
  dry?: boolean;
}

/**
 * Migrate Command
 * Discover and migrate existing documentation to .docjays folder
 */
export class MigrateCommand extends BaseCommand {
  private readonly COMMON_DOC_FOLDERS = [
    'docs',
    'doc',
    'documentation',
    'wiki',
    '.github',
    'guides',
    'examples',
  ];

  private readonly COMMON_DOC_FILES = [
    'README.md',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'LICENSE.md',
    'ARCHITECTURE.md',
  ];

  private readonly IGNORE_PATTERNS = [
    // Dependencies
    'node_modules',
    'vendor',
    'bower_components',
    'jspm_packages',

    // Build outputs
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.next',
    '.nuxt',
    '.output',

    // Caches
    '.cache',
    '.parcel-cache',
    '.eslintcache',
    '.stylelintcache',
    'coverage',
    '.nyc_output',

    // Version control
    '.git',
    '.svn',
    '.hg',

    // IDE
    '.vscode',
    '.idea',
    '.vs',

    // DocJays
    '.docjays',

    // Temp
    'tmp',
    'temp',
    '.tmp',
  ];

  register(): void {
    this.program
      .command('migrate')
      .description('Discover and migrate existing documentation to .docjays')
      .option('--auto', 'Automatically migrate all found documentation without prompts')
      .option('--move', 'Move files instead of copying (default: copy)')
      .option('--dry', 'Dry run - show what would be migrated without making changes')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: MigrateOptions): Promise<void> {
    try {
      // Check if .docjays exists
      const configManager = new ConfigManager();
      if (!(await configManager.isInitialized())) {
        this.logger.error('.docjays not found');
        this.logger.info('Please run ' + chalk.cyan('docjays init') + ' first');
        return;
      }

      // Welcome message
      console.log('');
      console.log(chalk.cyan.bold('📦 Documentation Migration'));
      console.log(chalk.dim('Scanning your project for existing documentation...'));
      console.log('');

      // Scan for documentation
      const spinner = ora('Scanning project...').start();
      const foundDocs = await this.scanForDocumentation();
      spinner.succeed(`Found ${foundDocs.length} documentation location(s)`);

      if (foundDocs.length === 0) {
        console.log('');
        this.logger.info('No documentation found to migrate');
        console.log('');
        console.log(chalk.dim('Searched for:'));
        console.log(chalk.dim('  - Common doc folders: ') + this.COMMON_DOC_FOLDERS.join(', '));
        console.log(chalk.dim('  - Common doc files: ') + this.COMMON_DOC_FILES.join(', '));
        console.log('');
        return;
      }

      // Display findings
      console.log('');
      this.displayFindings(foundDocs);
      console.log('');

      // Select what to migrate
      const selected = options.auto
        ? foundDocs
        : await this.selectDocumentation(foundDocs);

      if (selected.length === 0) {
        this.logger.info('Migration cancelled');
        return;
      }

      // Dry run check
      if (options.dry) {
        console.log('');
        console.log(chalk.yellow.bold('DRY RUN - No changes will be made'));
        console.log('');
        this.showMigrationPlan(selected, options.move || false);
        return;
      }

      // Confirm migration
      if (!options.auto) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `${options.move ? 'Move' : 'Copy'} ${selected.length} item(s) to .docjays?`,
            default: true,
          },
        ]);

        if (!confirm) {
          this.logger.info('Migration cancelled');
          return;
        }
      }

      // Perform migration
      console.log('');
      await this.performMigration(selected, options.move || false);

      // Show success message
      this.showSuccess(selected.length, options.move || false);
    } catch (error: any) {
      this.handleError(error, 'migrate');
    }
  }

  /**
   * Scan project for documentation
   */
  private async scanForDocumentation(): Promise<DocLocation[]> {
    const cwd = process.cwd();
    const found: DocLocation[] = [];

    // Check for common doc folders
    for (const folderName of this.COMMON_DOC_FOLDERS) {
      const folderPath = path.join(cwd, folderName);
      try {
        const stat = await fs.stat(folderPath);
        if (stat.isDirectory()) {
          const fileCount = await this.countMarkdownFiles(folderPath);
          if (fileCount > 0) {
            found.push({
              type: 'folder',
              path: folderPath,
              relativePath: folderName,
              fileCount,
            });
          }
        }
      } catch {
        // Folder doesn't exist, skip
      }
    }

    // Check for common doc files
    for (const fileName of this.COMMON_DOC_FILES) {
      const filePath = path.join(cwd, fileName);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          found.push({
            type: 'file',
            path: filePath,
            relativePath: fileName,
            size: stat.size,
          });
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    return found;
  }

  /**
   * Count markdown files in a directory (recursive)
   */
  private async countMarkdownFiles(dir: string): Promise<number> {
    let count = 0;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip ignored patterns
        if (this.IGNORE_PATTERNS.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          count += await this.countMarkdownFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          count++;
        }
      }
    } catch {
      // Ignore errors
    }

    return count;
  }

  /**
   * Display findings to user
   */
  private displayFindings(docs: DocLocation[]): void {
    console.log(chalk.bold('Found documentation:'));
    console.log('');

    for (const doc of docs) {
      if (doc.type === 'folder') {
        console.log(
          `  ${chalk.cyan('📁')} ${chalk.white(doc.relativePath + '/')} ${chalk.dim(
            `(${doc.fileCount} .md files)`
          )}`
        );
      } else {
        const sizeKb = doc.size ? (doc.size / 1024).toFixed(1) : '0';
        console.log(
          `  ${chalk.cyan('📄')} ${chalk.white(doc.relativePath)} ${chalk.dim(
            `(${sizeKb} KB)`
          )}`
        );
      }
    }
  }

  /**
   * Let user select what to migrate
   */
  private async selectDocumentation(docs: DocLocation[]): Promise<DocLocation[]> {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Select documentation to migrate:',
        choices: docs.map((doc) => {
          const label =
            doc.type === 'folder'
              ? `${doc.relativePath}/ (${doc.fileCount} files)`
              : `${doc.relativePath}`;

          return {
            name: label,
            value: doc,
            checked: true,
          };
        }),
      },
    ]);

    return selected;
  }

  /**
   * Show migration plan (for dry run)
   */
  private showMigrationPlan(docs: DocLocation[], move: boolean): void {
    console.log(chalk.bold('Migration Plan:'));
    console.log('');

    for (const doc of docs) {
      const action = move ? chalk.yellow('MOVE') : chalk.green('COPY');
      const destination = path.join('.docjays', 'sources', 'local-migration', doc.relativePath);

      console.log(`  ${action} ${doc.relativePath}`);
      console.log(`  ${chalk.dim('→')} ${destination}`);
      console.log('');
    }
  }

  /**
   * Perform the actual migration
   */
  private async performMigration(docs: DocLocation[], move: boolean): Promise<void> {
    const migrationDir = path.join(process.cwd(), '.docjays', 'sources', 'local-migration');

    // Ensure migration directory exists
    await fs.mkdir(migrationDir, { recursive: true });

    for (const doc of docs) {
      const spinner = ora(`${move ? 'Moving' : 'Copying'} ${doc.relativePath}...`).start();

      try {
        const destination = path.join(migrationDir, doc.relativePath);

        if (doc.type === 'folder') {
          // Copy/move entire folder
          await this.copyDirectory(doc.path, destination);

          if (move) {
            await fs.rm(doc.path, { recursive: true });
          }
        } else {
          // Copy/move single file
          await fs.mkdir(path.dirname(destination), { recursive: true });
          await fs.copyFile(doc.path, destination);

          if (move) {
            await fs.unlink(doc.path);
          }
        }

        spinner.succeed(`${move ? 'Moved' : 'Copied'} ${doc.relativePath}`);
      } catch (error: any) {
        spinner.fail(`Failed to ${move ? 'move' : 'copy'} ${doc.relativePath}`);
        this.logger.debug(error.message);
      }
    }

    // Register as source in config
    await this.registerMigrationSource();
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      // Skip ignored patterns
      if (this.IGNORE_PATTERNS.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Register migration source in config
   */
  private async registerMigrationSource(): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.load();

    // Add migration source if not already present
    const sources = config.sources || [];
    const migrationExists = sources.some((s: any) => s.name === 'local-migration');

    if (!migrationExists) {
      sources.push({
        name: 'local-migration',
        type: 'local',
        url: 'local',
        path: 'sources/local-migration',
        enabled: true,
      });

      config.sources = sources;
      await configManager.save(config);
    }
  }

  /**
   * Show success message
   */
  private showSuccess(count: number, moved: boolean): void {
    console.log('');
    console.log(chalk.green.bold(`✓ Successfully ${moved ? 'moved' : 'copied'} ${count} item(s)!`));
    console.log('');
    console.log(chalk.bold('Migration complete:'));
    console.log(`  ${chalk.cyan('.docjays/sources/local-migration/')}`);
    console.log('');
    console.log(chalk.dim('Your documentation is now organized and ready for AI assistants.'));
    console.log('');
    console.log(chalk.bold('Next steps:'));
    console.log(`  ${chalk.cyan('docjays serve')}     Start MCP server`);
    console.log(`  ${chalk.cyan('docjays status')}    View migration status`);
    console.log('');
  }
}
