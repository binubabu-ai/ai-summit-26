/**
 * Shared TypeScript types for Knowledge System
 */

// Grounding States
export type UploadState = 'raw' | 'processing' | 'ready' | 'failed';
export type GroundingState = 'ungrounded' | 'grounded' | 'deprecated';
export type EditorialState = 'draft' | 'review' | 'active' | 'archived';
export type ConflictStatus = 'open' | 'acknowledged' | 'resolved' | 'ignored';
export type ConflictType = 'content' | 'scope' | 'version' | 'dependency';
export type ConflictSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ResolutionStrategy = 'merge' | 'replace' | 'deprecate' | 'clarify' | 'split_scope' | 'version_both';

// Document
export interface Document {
  id: string;
  projectId: string;
  path: string;
  content: string;
  uploadState: UploadState;
  uploadedAt?: string;
  processedAt?: string;
  processingError?: string;
  groundingState: GroundingState;
  groundedAt?: string;
  deprecatedAt?: string;
  deprecationReason?: string;
  editorialState: EditorialState;
  publishedAt?: string;
  archivedAt?: string;
  expiresAt?: string;
  ttlDays?: number;
  lastReviewedAt?: string;
  nextReviewDue?: string;
  createdAt: string;
  updatedAt: string;
}

// Module
export interface DocumentModule {
  id: string;
  documentId: string;
  moduleKey: string;
  title: string;
  description: string;
  content: string;
  contentHash: string;
  order: number;
  startLine?: number;
  endLine?: number;
  headingLevel?: number;
  moduleType: string;
  isGrounded: boolean;
  groundedAt?: string;
  groundingSource?: string;
  confidenceScore: number;
  tags?: string[];
  dependsOn: string[];
  createdAt: string;
  updatedAt: string;
  lastGroundedAt?: string;
  document?: {
    id: string;
    path: string;
  };
  conflicts?: ModuleConflict[];
}

// Conflict
export interface ModuleConflict {
  id: string;
  moduleId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  description: string;
  conflictingModuleId?: string;
  conflictingDocId?: string;
  conflictingLocation?: any;
  detectedBy: 'ai' | 'rule';
  status: ConflictStatus;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  module?: {
    id: string;
    moduleKey: string;
    title: string;
    document: {
      path: string;
    };
  };
}

// Knowledge Status
export interface KnowledgeStatus {
  documents: {
    total: number;
    raw: number;
    processing: number;
    ready: number;
    failed: number;
    grounded: number;
    active: number;
    groundingCoverage: number;
  };
  modules: {
    total: number;
    grounded: number;
    coverage: number;
  };
  conflicts: {
    open: number;
  };
  recentActivity: Array<{
    id: string;
    path: string;
    uploadState: UploadState;
    uploadedAt: string;
  }>;
}

// Health Metrics
export interface HealthMetrics {
  overallScore: number;
  freshnessScore: number;
  groundingCoverage: number;
  conflictRate: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface KnowledgeMetrics {
  health: HealthMetrics;
  documents: {
    total: number;
    grounded: number;
    active: number;
    expiringWithin7Days: number;
    needsReview: number;
  };
  modules: {
    total: number;
    grounded: number;
    coverage: number;
    byType: Record<string, { total: number; grounded: number }>;
  };
  categories: {
    total: number;
    topCategories: Array<{ category: string; count: number }>;
  };
  conflicts: {
    totalConflicts: number;
    openConflicts: number;
    resolvedConflicts: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  embeddings: {
    totalEmbeddings: number;
    totalDocuments: number;
    avgChunksPerDoc: number;
    oldestEmbedding: string | null;
    estimatedStorageSize: string;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    reason: string;
    occurredAt: string;
    module: {
      moduleKey: string;
      title: string;
      document: {
        path: string;
      };
    };
  }>;
}

// API Responses
export interface UploadResponse {
  uploaded: number;
  documents: Array<{
    id: string;
    path: string;
    uploadState: UploadState;
    uploadedAt: string;
  }>;
  status: string;
  message: string;
}

export interface ProcessResponse {
  processed: number;
  documents: Array<{
    documentId: string;
    path: string;
    mode: 'as-is' | 'modules';
    status: 'ready' | 'failed';
    modulesCreated?: number;
    error?: string;
  }>;
  modulesCreated: number;
  totalCost: string;
  status: string;
}

export interface ConflictDetectionResponse {
  detected: number;
  stored: number;
  summary: {
    totalConflicts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  usage: {
    stage1Tokens: number;
    stage2Tokens: number;
    stage3Tokens: number;
    totalCost: number;
  };
  message: string;
}

export interface ResolutionSuggestion {
  strategy: ResolutionStrategy;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  steps: string[];
  preview: {
    sourceModuleAfter?: string;
    conflictingModuleAfter?: string;
    newMergedContent?: string;
  };
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
}

export interface ConflictDetailResponse {
  conflict: ModuleConflict & {
    conflictingModule?: DocumentModule;
  };
  resolutionSuggestions: ResolutionSuggestion[];
  recommendedStrategy: ResolutionStrategy;
  reasoning: string;
  aiUsage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}
