import chalk from 'chalk';
import figures from 'figures';
import { LogLevel } from '../types';

/**
 * Logger utility for CLI output
 * Provides consistent, colored logging across the application
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.INFO, prefix: string = '') {
    this.level = level;
    this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  debug(message: string, context?: string): void {
    if (this.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage(message, context);
      console.log(chalk.gray(`${figures.info} [DEBUG] ${formatted}`));
    }
  }

  info(message: string, context?: string): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.formatMessage(message, context);
      console.log(chalk.blue(`${figures.info} ${formatted}`));
    }
  }

  success(message: string, context?: string): void {
    const formatted = this.formatMessage(message, context);
    console.log(chalk.green(`${figures.tick} ${formatted}`));
  }

  warn(message: string, context?: string): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.formatMessage(message, context);
      console.log(chalk.yellow(`${figures.warning} ${formatted}`));
    }
  }

  error(message: string, context?: string): void {
    const formatted = this.formatMessage(message, context);
    console.error(chalk.red(`${figures.cross} ${formatted}`));
  }

  log(message: string): void {
    console.log(message);
  }

  table(data: any[]): void {
    console.table(data);
  }

  json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  newLine(): void {
    console.log('');
  }

  private formatMessage(message: string, context?: string): string {
    const parts: string[] = [];

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    if (context) {
      parts.push(`[${context}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(this.level, childPrefix);
  }
}

// Export a default logger instance
export const logger = new Logger();
