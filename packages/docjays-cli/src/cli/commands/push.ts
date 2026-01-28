import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { AuthManager } from '../../core/auth/manager';

interface PushOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface DocumentToPush {
  path: string;
  content: string;
  localPath: string;
  size: number;
}

/**
 * Push Command
 * Push local documentation to cloud project
 */
export class PushCommand extends BaseCommand {
  register(): void {
    this.program
      .command('push')
      .description('Push local documentation to cloud project')
      .option('-n, --dry-run', 'Preview what would be pushed without making changes')
      .option('-f, --force', 'Push all files even if unchanged')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: PushOptions): Promise<void> {
    try {
      // Check if .docjays exists
      const configManager = new ConfigManager();
      if (!(await configManager.isInitialized())) {
        this.logger.error('.docjays not found');
        this.logger.info('Please run ' + chalk.cyan('docjays init') + ' first');
        return;
      }

      // Check if linked to cloud
      if (!(await configManager.isCloudLinked())) {
        console.log('');
        this.logger.error('Not linked to a cloud project');
        this.logger.info('Please run ' + chalk.cyan('docjays link') + ' first');
        console.log('');
        return;
      }

      // Check authentication
      const authManager = new AuthManager();
      const auth = await authManager.getAuth();

      if (!auth) {
        console.log('');
        this.logger.error('Not logged in');
        this.logger.info('Please run ' + chalk.cyan('docjays login') + ' first');
        console.log('');
        return;
      }

      const cloudConfig = await configManager.getCloudConfig();
      if (!cloudConfig?.projectId) {
        this.logger.error('Invalid cloud configuration');
        return;
      }

      console.log('');
      console.log(chalk.cyan.bold('📤 Push to Cloud'));
      console.log(chalk.dim(`Project: ${cloudConfig.projectName}`));
      console.log(chalk.dim(`Logged in as: ${auth.email}`));
      console.log('');

      // Gather documents to push
      const spinner = ora('Scanning local documentation...').start();
      const documents = await this.gatherDocuments();
      spinner.stop();

      if (documents.length === 0) {
        this.logger.warn('No documents found to push');
        console.log('');
        console.log(chalk.dim('Documents are expected in .docjays/sources/'));
        console.log(chalk.dim('Run docjays sync or docjays add-source first'));
        console.log('');
        return;
      }

      // Display summary
      console.log(chalk.bold('Documents to push:'));
      console.log('');

      const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

      for (const doc of documents.slice(0, 10)) {
        const sizeStr = this.formatSize(doc.size);
        console.log(`  ${chalk.cyan('•')} ${doc.path} ${chalk.dim(`(${sizeStr})`)}`);
      }

      if (documents.length > 10) {
        console.log(chalk.dim(`  ... and ${documents.length - 10} more files`));
      }

      console.log('');
      console.log(chalk.dim(`Total: ${documents.length} files (${this.formatSize(totalSize)})`));
      console.log('');

      // Dry run - just show what would happen
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no changes will be made'));
        console.log('');
        console.log('The following documents would be pushed:');
        for (const doc of documents) {
          console.log(`  ${chalk.green('+')} ${doc.path}`);
        }
        console.log('');
        console.log(chalk.dim('Run without --dry-run to push documents'));
        return;
      }

      // Push documents
      const pushSpinner = ora('Pushing documents to cloud...').start();

      try {
        const result = await this.pushDocuments(
          auth.token,
          cloudConfig.projectId,
          documents
        );

        pushSpinner.stop();

        // Display results
        console.log('');
        this.logger.success('Push completed!');
        console.log('');
        console.log(chalk.bold('Summary:'));
        console.log(`  ${chalk.green('Created:')} ${result.summary.created}`);
        console.log(`  ${chalk.blue('Updated:')} ${result.summary.updated}`);
        console.log(`  ${chalk.dim('Unchanged:')} ${result.summary.unchanged}`);

        if (result.summary.errors > 0) {
          console.log(`  ${chalk.red('Errors:')} ${result.summary.errors}`);
          console.log('');
          console.log(chalk.red('Errors:'));
          for (const err of result.results.errors) {
            console.log(`  ${chalk.red('✗')} ${err.path}: ${err.error}`);
          }
        }

        console.log('');
        console.log(chalk.dim(`View your documents at https://docjays.vercel.app/projects/${cloudConfig.projectName}`));
        console.log('');

      } catch (error: any) {
        pushSpinner.fail('Push failed');
        throw error;
      }

    } catch (error: any) {
      this.handleError(error, 'push');
    }
  }

  /**
   * Gather all documents from .docjays/sources/
   */
  private async gatherDocuments(): Promise<DocumentToPush[]> {
    const documents: DocumentToPush[] = [];
    const sourcesPath = path.join(process.cwd(), '.docjays', 'sources');

    if (!(await fs.pathExists(sourcesPath))) {
      return documents;
    }

    // Recursively find all markdown and text files
    const files = await this.walkDir(sourcesPath);

    for (const filePath of files) {
      // Only push markdown and common doc files
      const ext = path.extname(filePath).toLowerCase();
      if (!['.md', '.mdx', '.txt', '.rst', '.adoc'].includes(ext)) {
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(sourcesPath, filePath);
      const stats = await fs.stat(filePath);

      documents.push({
        path: relativePath.replace(/\\/g, '/'), // Normalize path separators
        content,
        localPath: filePath,
        size: stats.size,
      });
    }

    return documents;
  }

  /**
   * Recursively walk directory and return all file paths
   */
  private async walkDir(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common non-doc directories
        if (['node_modules', '.git', '__pycache__', '.cache'].includes(entry.name)) {
          continue;
        }
        const subFiles = await this.walkDir(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Push documents to cloud API
   */
  private async pushDocuments(
    token: string,
    projectId: string,
    documents: DocumentToPush[]
  ): Promise<any> {
    const webUrl = process.env.DOCJAYS_WEB_URL || 'https://docjays.vercel.app';

    const response = await fetch(`${webUrl}/api/cli/projects/${projectId}/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: documents.map(d => ({
          path: d.path,
          content: d.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Push failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Format file size for display
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
