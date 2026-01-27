#!/usr/bin/env node

/**
 * Docjays CLI Entry Point
 *
 * This is the main entry point for the docjays command-line tool.
 * It loads the compiled JavaScript and starts the CLI application.
 */

// Check Node version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion < 18) {
  console.error('Error: Docjays requires Node.js 18 or higher.');
  console.error(`You are currently running Node.js ${nodeVersion}`);
  console.error('Please upgrade Node.js: https://nodejs.org/');
  process.exit(1);
}

// Load and run the CLI
try {
  const { DocjaysCLI } = require('../dist/cli/index.js');
  const cli = new DocjaysCLI();

  cli.run(process.argv).catch((error) => {
    console.error('Fatal error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to load Docjays CLI:', error.message);
  console.error('Please ensure the package is properly built with: npm run build');
  process.exit(1);
}
