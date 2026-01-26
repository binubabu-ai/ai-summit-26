/**
 * Template System Types
 * Defines all template-related interfaces
 */

import { DocumentType } from '@prisma/client';

export type TechStack = {
  framework?: 'nextjs' | 'react' | 'vue' | 'angular' | 'other';
  database?: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'other';
  orm?: 'prisma' | 'drizzle' | 'typeorm' | 'sequelize' | 'other';
  auth?: 'supabase' | 'clerk' | 'nextauth' | 'auth0' | 'custom' | 'other';
  language?: 'typescript' | 'javascript' | 'python' | 'go' | 'java' | 'other';
  deployment?: 'vercel' | 'aws' | 'docker' | 'kubernetes' | 'other';
};

export type TemplateCategory =
  | 'implementation'
  | 'database'
  | 'api'
  | 'constraint'
  | 'architecture'
  | 'testing'
  | 'deployment';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  docType: DocumentType;
  description: string;
  requiredTechStack?: (keyof TechStack)[];
  applicableWhen?: (context: GenerationContext) => boolean;
  template: string | ((context: GenerationContext) => string);
  priority: number; // Higher = more important
}

export interface Feature {
  name: string;
  slug: string;
  description: string;
  requirements: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface Constraint {
  type: 'security' | 'performance' | 'validation' | 'business' | 'technical';
  category: string;
  rules: string[];
  severity: 'hard' | 'soft' | 'info';
}

export interface ArchitecturalDecision {
  title: string;
  context: string;
  options: string[];
  decision: string;
  consequences: string[];
  status: 'proposed' | 'accepted' | 'deprecated';
}

export interface GenerationContext {
  // Source document
  sourcePath: string;
  sourceContent: string;
  sourceDocId: string;

  // Tech stack
  techStack: TechStack;

  // Extracted entities
  features: Feature[];
  constraints: Constraint[];
  decisions: ArchitecturalDecision[];

  // Project context
  projectId: string;
  projectName?: string;
  existingDocs?: string[];

  // Generation options
  outputDirectory?: string;
  customVariables?: Record<string, any>;
}

export interface DocumentToGenerate {
  templateId: string;
  title: string;
  path: string;
  docType: DocumentType;
  category: TemplateCategory;
  priority: number;

  // Context for this specific document
  feature?: Feature;
  constraint?: Constraint;
  decision?: ArchitecturalDecision;

  // Variables to fill template
  variables: Record<string, any>;
}

export interface GeneratedDocument {
  path: string;
  content: string;
  docType: DocumentType;
  title: string;

  metadata: {
    templateId: string;
    generatedFrom: string;
    techStack: TechStack;
    prompt?: string;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface SpecAnalysisResult {
  // Detected tech stack
  detectedTechStack: TechStack;
  confidence: number; // 0-1

  // Extracted entities
  features: Feature[];
  constraints: Constraint[];
  decisions: ArchitecturalDecision[];

  // Documents to generate
  documentsToGenerate: DocumentToGenerate[];

  // Suggestions
  suggestions: string[];
  warnings: string[];

  // Metadata
  analysisTokens: number;
  analysisCost: number;
}
