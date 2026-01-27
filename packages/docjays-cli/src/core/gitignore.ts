import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/logger';

/**
 * GitIgnore Manager
 * Manages .gitignore file updates for Docjays
 */
export class GitIgnoreManager {
  private gitignorePath: string;
  private logger: Logger;

  constructor(basePath: string = process.cwd()) {
    this.gitignorePath = path.join(basePath, '.gitignore');
    this.logger = new Logger();
  }

  /**
   * Check if .gitignore exists
   */
  async exists(): Promise<boolean> {
    return fs.pathExists(this.gitignorePath);
  }

  /**
   * Add .docjays to .gitignore
   */
  async addDocjays(): Promise<boolean> {
    const entry = '.docjays/';
    const marker = '# Docjays managed documentation (never commit)';

    // Check if .gitignore exists
    if (!(await this.exists())) {
      // Create new .gitignore
      const content = `${marker}\n${entry}\n`;
      await fs.writeFile(this.gitignorePath, content);
      this.logger.success('Created .gitignore with .docjays entry');
      return true;
    }

    // Read existing .gitignore
    const content = await fs.readFile(this.gitignorePath, 'utf-8');

    // Check if already present
    if (this.hasDocjaysEntry(content)) {
      this.logger.info('.docjays already in .gitignore');
      return false;
    }

    // Add entry
    const updatedContent = this.addEntry(content, marker, entry);
    await fs.writeFile(this.gitignorePath, updatedContent);

    this.logger.success('Added .docjays to .gitignore');
    return true;
  }

  /**
   * Remove .docjays from .gitignore
   */
  async removeDocjays(): Promise<boolean> {
    if (!(await this.exists())) {
      return false;
    }

    const content = await fs.readFile(this.gitignorePath, 'utf-8');

    if (!this.hasDocjaysEntry(content)) {
      return false;
    }

    // Remove the entry and marker
    const lines = content.split('\n');
    const filtered = lines.filter((line) => {
      return (
        !line.includes('.docjays') &&
        !line.includes('Docjays managed documentation')
      );
    });

    const updatedContent = filtered.join('\n');
    await fs.writeFile(this.gitignorePath, updatedContent);

    this.logger.success('Removed .docjays from .gitignore');
    return true;
  }

  /**
   * Check if .docjays entry exists
   */
  async hasEntry(): Promise<boolean> {
    if (!(await this.exists())) {
      return false;
    }

    const content = await fs.readFile(this.gitignorePath, 'utf-8');
    return this.hasDocjaysEntry(content);
  }

  /**
   * Check if content has .docjays entry
   */
  private hasDocjaysEntry(content: string): boolean {
    const lines = content.split('\n');
    return lines.some(
      (line) =>
        line.trim() === '.docjays' ||
        line.trim() === '.docjays/' ||
        line.trim() === '/.docjays' ||
        line.trim() === '/.docjays/'
    );
  }

  /**
   * Add entry to content
   */
  private addEntry(content: string, marker: string, entry: string): string {
    // Ensure content ends with newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }

    // Add marker and entry
    content += `\n${marker}\n${entry}\n`;

    return content;
  }

  /**
   * Get .gitignore content
   */
  async getContent(): Promise<string | null> {
    if (!(await this.exists())) {
      return null;
    }

    return fs.readFile(this.gitignorePath, 'utf-8');
  }

  /**
   * Create default .gitignore for Docjays projects
   */
  async createDefault(): Promise<void> {
    const defaultContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
out/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log

# Testing
coverage/

# Cache
.cache/

# Docjays managed documentation (never commit)
.docjays/
`;

    await fs.writeFile(this.gitignorePath, defaultContent);
    this.logger.success('Created default .gitignore');
  }
}
