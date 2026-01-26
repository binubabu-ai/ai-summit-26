/**
 * Template Registry
 * Central registry for all document templates
 */

import { Template, TechStack } from './types';

const templates = new Map<string, Template>();

/**
 * Register a template
 */
export function registerTemplate(template: Template): void {
  if (templates.has(template.id)) {
    console.warn(`Template ${template.id} is already registered. Overwriting.`);
  }
  templates.set(template.id, template);
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return templates.get(id);
}

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
  return Array.from(templates.values());
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  return Array.from(templates.values()).filter(t => t.category === category);
}

/**
 * Get applicable templates for given tech stack
 */
export function getApplicableTemplates(techStack: TechStack): Template[] {
  return Array.from(templates.values()).filter(template => {
    // If template has no tech stack requirements, it's always applicable
    if (!template.requiredTechStack || template.requiredTechStack.length === 0) {
      return true;
    }

    // Check if all required tech stack components are present
    return template.requiredTechStack.every(key => {
      const value = techStack[key];
      return value !== undefined && value !== 'other';
    });
  });
}

/**
 * Get recommended templates (sorted by priority)
 */
export function getRecommendedTemplates(techStack: TechStack): Template[] {
  const applicable = getApplicableTemplates(techStack);
  return applicable.sort((a, b) => b.priority - a.priority);
}

/**
 * Clear all templates (for testing)
 */
export function clearTemplates(): void {
  templates.clear();
}
