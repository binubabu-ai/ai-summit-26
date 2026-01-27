import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { ConfigManager } from '../../core/config';
import { AuthManager } from '../../core/auth/manager';

interface LinkOptions {
  project?: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
}

/**
 * Link Command
 * Link local .docjays to cloud project
 */
export class LinkCommand extends BaseCommand {
  register(): void {
    this.program
      .command('link')
      .description('Link local .docjays to cloud project')
      .option('-p, --project <id>', 'Project ID to link to')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  async execute(options: LinkOptions): Promise<void> {
    try {
      // Check if .docjays exists
      const configManager = new ConfigManager();
      if (!(await configManager.isInitialized())) {
        this.logger.error('.docjays not found');
        this.logger.info('Please run ' + chalk.cyan('docjays init') + ' first');
        return;
      }

      // Check if already linked
      if (await configManager.isCloudLinked()) {
        const cloudConfig = await configManager.getCloudConfig();
        this.logger.warn(
          `Already linked to project: ${chalk.cyan(cloudConfig?.projectName)}`
        );

        const { relink } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'relink',
            message: 'Do you want to link to a different project?',
            default: false,
          },
        ]);

        if (!relink) {
          this.logger.info('Link cancelled');
          return;
        }
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

      console.log('');
      console.log(chalk.cyan.bold('🔗 Link to Cloud'));
      console.log(chalk.dim(`Logged in as: ${auth.email}`));
      console.log('');

      // Fetch user's projects
      const spinner = ora('Fetching your projects...').start();
      const projects = await this.fetchProjects(auth.token);
      spinner.stop();

      if (projects.length === 0) {
        console.log('');
        this.logger.info('You don\'t have any projects yet');
        console.log('');

        const { create } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'create',
            message: 'Would you like to create a new project?',
            default: true,
          },
        ]);

        if (!create) {
          this.logger.info('Link cancelled');
          return;
        }

        // Create new project
        await this.createAndLinkProject(auth.token);
        return;
      }

      // Let user choose or create new
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Link to existing project', value: 'existing' },
            { name: 'Create new project', value: 'create' },
          ],
        },
      ]);

      if (action === 'create') {
        await this.createAndLinkProject(auth.token);
      } else {
        await this.linkToExistingProject(auth.token, projects, options.project);
      }
    } catch (error: any) {
      this.handleError(error, 'link');
    }
  }

  /**
   * Fetch user's projects from API
   */
  private async fetchProjects(token: string): Promise<Project[]> {
    const webUrl = process.env.DOCJAYS_WEB_URL || 'https://docjays.vercel.app';

    const response = await fetch(`${webUrl}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.projects || [];
  }

  /**
   * Link to existing project
   */
  private async linkToExistingProject(
    token: string,
    projects: Project[],
    projectId?: string
  ): Promise<void> {
    let selectedProject: Project | undefined;

    if (projectId) {
      // Project ID provided via flag
      selectedProject = projects.find((p) => p.id === projectId);
      if (!selectedProject) {
        this.logger.error(`Project with ID ${projectId} not found`);
        return;
      }
    } else {
      // Let user choose
      const { project } = await inquirer.prompt([
        {
          type: 'list',
          name: 'project',
          message: 'Select a project:',
          choices: projects.map((p) => ({
            name: `${p.name} ${p.description ? chalk.dim(`(${p.description})`) : ''}`,
            value: p,
          })),
        },
      ]);
      selectedProject = project;
    }

    if (!selectedProject) {
      return;
    }

    // Fetch project details including API key
    const spinner = ora('Fetching project details...').start();
    const projectDetails = await this.fetchProjectDetails(token, selectedProject.id);
    spinner.stop();

    if (!projectDetails || !projectDetails.apiKey) {
      this.logger.error('Failed to fetch project API key');
      return;
    }

    // Link to cloud
    const configManager = new ConfigManager();
    await configManager.linkCloud({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      apiKey: projectDetails.apiKey,
    });

    console.log('');
    this.logger.success('Successfully linked to cloud project!');
    console.log('');
    console.log(chalk.bold('Project Details:'));
    console.log(`  Name: ${chalk.cyan(selectedProject.name)}`);
    console.log(`  ID: ${chalk.dim(selectedProject.id)}`);
    console.log(`  API Key: ${chalk.dim(projectDetails.apiKey.substring(0, 12) + '...')}`);
    console.log('');
    console.log(chalk.dim('Your local .docjays is now connected to the cloud.'));
    console.log('');
  }

  /**
   * Create new project and link
   */
  private async createAndLinkProject(token: string): Promise<void> {
    console.log('');

    // Get project name from git or folder
    const defaultName = await this.getDefaultProjectName();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: defaultName,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Project name is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
      },
    ]);

    // Create project
    const spinner = ora('Creating project...').start();

    const webUrl = process.env.DOCJAYS_WEB_URL || 'https://docjays.vercel.app';
    const response = await fetch(`${webUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: answers.name,
        description: answers.description || null,
      }),
    });

    if (!response.ok) {
      spinner.fail('Failed to create project');
      const error: any = await response.json();
      this.logger.error(error.error || 'Unknown error');
      return;
    }

    const data: any = await response.json();
    spinner.succeed('Project created!');

    if (!data.apiKey) {
      this.logger.warn('Project created but no API key received');
      return;
    }

    // Link to cloud
    const configManager = new ConfigManager();
    await configManager.linkCloud({
      projectId: data.project.id,
      projectName: data.project.name,
      apiKey: data.apiKey,
    });

    console.log('');
    this.logger.success('Successfully linked to cloud project!');
    console.log('');
    console.log(chalk.bold('Project Details:'));
    console.log(`  Name: ${chalk.cyan(data.project.name)}`);
    console.log(`  ID: ${chalk.dim(data.project.id)}`);
    console.log(`  API Key: ${chalk.dim(data.apiKey.substring(0, 12) + '...')}`);
    console.log('');
    console.log(chalk.dim('Your local .docjays is now connected to the cloud.'));
    console.log('');
  }

  /**
   * Fetch project details including API key
   */
  private async fetchProjectDetails(token: string, projectId: string): Promise<any> {
    const webUrl = process.env.DOCJAYS_WEB_URL || 'https://docjays.vercel.app';

    const response = await fetch(`${webUrl}/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    const data: any = await response.json();

    // Extract API key from nested structure
    const apiKey = data.project?.project_api_keys?.[0]?.key || null;

    return {
      ...data.project,
      apiKey,
    };
  }

  /**
   * Get default project name from git or folder name
   */
  private async getDefaultProjectName(): Promise<string> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const path = require('path');

    try {
      // Try to get from git remote
      const { stdout } = await execAsync('git remote get-url origin');
      const url = stdout.trim();
      const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
      if (match) {
        return match[1];
      }
    } catch {
      // Not a git repo or no remote
    }

    // Fallback to folder name
    return path.basename(process.cwd());
  }
}
