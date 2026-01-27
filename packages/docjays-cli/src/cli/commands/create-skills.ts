import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCommand } from './base';

interface CreateSkillsOptions {
  output?: string;
  force?: boolean;
  merge?: boolean;
  print?: boolean;
}

/**
 * Create Skills Command
 * Create or update skills.md file for AI agent instructions
 */
export class CreateSkillsCommand extends BaseCommand {
  register(): void {
    this.program
      .command('create-skills')
      .description('Create skills.md file for AI agent instructions')
      .option('-o, --output <file>', 'Output to specific file (default: skills.md)')
      .option('-f, --force', 'Overwrite if exists')
      .option('-m, --merge', 'Append to existing file')
      .option('-p, --print', 'Just print template without creating file')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: CreateSkillsOptions): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../../../templates/skills.md');
      const template = await fs.readFile(templatePath, 'utf-8');

      // Just print template
      if (options.print) {
        console.log(template);
        return;
      }

      // Determine output file
      const outputFile = options.output || 'skills.md';
      const outputPath = path.join(process.cwd(), outputFile);

      // Check if file exists
      const exists = await fs.access(outputPath).then(() => true).catch(() => false);

      if (exists && !options.force && !options.merge) {
        await this.handleExistingFile(outputPath, outputFile, template);
        return;
      }

      // Merge mode: append to existing
      if (options.merge && exists) {
        await this.mergeSkills(outputPath, outputFile, template);
        return;
      }

      // Force or new file: just write
      await this.createNewSkillsFile(outputPath, outputFile, template);
    } catch (error: any) {
      this.handleError(error, 'create-skills');
    }
  }

  /**
   * Handle existing file with interactive prompt
   */
  private async handleExistingFile(
    outputPath: string,
    outputFile: string,
    template: string
  ): Promise<void> {
    // Check if already has Docjays content
    const existing = await fs.readFile(outputPath, 'utf-8');
    if (this.hasDocjaysContent(existing)) {
      this.logger.info('Docjays skills already present in ' + chalk.cyan(outputFile));
      return;
    }

    console.log('');
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.yellow(outputFile + ' already exists.') + ' What would you like to do?',
        choices: [
          {
            name: 'Cancel (keep existing)',
            value: 'cancel',
          },
          {
            name: 'Create as docjays-skills.md instead (recommended)',
            value: 'rename',
          },
          {
            name: 'Overwrite existing file',
            value: 'overwrite',
          },
          {
            name: 'Merge/append to existing',
            value: 'merge',
          },
        ],
      },
    ]);

    console.log('');

    switch (action) {
      case 'cancel':
        this.logger.info('Cancelled');
        return;

      case 'rename':
        const renamePath = path.join(process.cwd(), 'docjays-skills.md');
        await fs.writeFile(renamePath, template);
        this.logger.success('Created ' + chalk.cyan('docjays-skills.md'));
        console.log('');
        console.log(chalk.dim('Tip: Reference in your main skills.md:'));
        console.log(chalk.gray('     See also: [Docjays Skills](./docjays-skills.md)'));
        console.log('');
        return;

      case 'overwrite':
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'This will replace your existing ' + outputFile + '. Are you sure?',
            default: false,
          },
        ]);

        if (confirm) {
          await fs.writeFile(outputPath, template);
          this.logger.success('Created ' + chalk.cyan(outputFile));
          this.logger.warn('Previous ' + outputFile + ' was overwritten');
        } else {
          this.logger.info('Cancelled');
        }
        return;

      case 'merge':
        await this.mergeSkills(outputPath, outputFile, template);
        return;
    }
  }

  /**
   * Merge Docjays skills into existing file
   */
  private async mergeSkills(
    outputPath: string,
    outputFile: string,
    template: string
  ): Promise<void> {
    const existing = await fs.readFile(outputPath, 'utf-8');

    // Check if already has Docjays section
    if (this.hasDocjaysContent(existing)) {
      this.logger.info('Docjays skills already present in ' + chalk.cyan(outputFile));
      return;
    }

    const spinner = ora('Merging Docjays skills...').start();

    try {
      // Append with separator
      const merged = `${existing}\n\n---\n\n${template}`;
      await fs.writeFile(outputPath, merged);
      spinner.succeed('Merged Docjays skills into ' + chalk.cyan(outputFile));
      console.log('');
      console.log(chalk.dim('Added "# Docjays Skills" section at end of file'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to merge skills');
      throw error;
    }
  }

  /**
   * Create new skills file
   */
  private async createNewSkillsFile(
    outputPath: string,
    outputFile: string,
    template: string
  ): Promise<void> {
    const spinner = ora('Creating ' + outputFile + '...').start();

    try {
      await fs.writeFile(outputPath, template);
      spinner.succeed('Created ' + chalk.cyan(outputFile));

      console.log('');
      if (outputFile !== 'skills.md') {
        console.log(chalk.dim('Tip: Reference from your main skills.md:'));
        console.log(chalk.gray('     See also: [Docjays Skills](./' + outputFile + ')'));
      } else {
        console.log(chalk.dim('AI agents like Claude Code can now use Docjays workflows'));
      }
      console.log('');
    } catch (error: any) {
      spinner.fail('Failed to create ' + outputFile);
      throw error;
    }
  }

  /**
   * Check if content has Docjays skills
   */
  private hasDocjaysContent(content: string): boolean {
    return (
      content.includes('# Docjays Skills') ||
      content.includes('Ground Responses with Docjays') ||
      content.includes('Skill: Create Feature Specification')
    );
  }
}
