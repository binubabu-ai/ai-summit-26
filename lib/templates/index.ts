/**
 * Template Index
 * Exports all templates and registers them
 */

import { registerTemplate } from './registry';

// Implementation templates
import { nextjsImplementationTemplate } from './implementations/nextjs-implementation';

// Database templates
import { prismaSchemaTemplate } from './database/prisma-schema';

// Constraint templates
import { securityConstraintsTemplate } from './constraints/security-constraints';

// Register all templates
export function initializeTemplates(): void {
  // Implementation
  registerTemplate(nextjsImplementationTemplate);

  // Database
  registerTemplate(prismaSchemaTemplate);

  // Constraints
  registerTemplate(securityConstraintsTemplate);
}

// Auto-initialize on import
initializeTemplates();

// Re-export useful functions
export * from './types';
export * from './registry';
