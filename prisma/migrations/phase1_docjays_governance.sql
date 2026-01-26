-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ARCHITECTURE', 'API_CONTRACT', 'DOMAIN_MODEL', 'SECURITY', 'FEATURE_SPEC', 'RUNBOOK', 'GENERAL');

-- CreateEnum
CREATE TYPE "ConstraintLevel" AS ENUM ('HARD', 'SOFT', 'INFO');

-- CreateEnum
CREATE TYPE "ReviewSchedule" AS ENUM ('NEVER', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED', 'REQUESTED_CHANGES', 'REVIEWED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('IMPLEMENTS', 'REFERENCES', 'CONSTRAINS', 'DOCUMENTS');

-- CreateEnum
CREATE TYPE "SystemicType" AS ENUM ('NAMING_INCONSISTENCY', 'VERSIONING_CONFLICT', 'SCOPE_OVERLAP', 'DEPENDENCY_CIRCULAR', 'ARCHITECTURE_DRIFT');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('MERGED', 'PRIORITIZED', 'SPLIT', 'DEPRECATED', 'REWRITTEN');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'DEPRECATED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('PR', 'COMMIT', 'DOCUMENT', 'MEETING', 'MANUAL');

-- CreateEnum
CREATE TYPE "ConceptStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'AMBIGUOUS', 'CLARIFICATION_NEEDED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('STALE_DOCUMENT', 'MISSING_REVIEW', 'HARD_CONSTRAINT_VIOLATION', 'CONFLICT_DETECTED', 'ORPHANED_DOCUMENT', 'DEPRECATED_USAGE', 'MISSING_OWNER', 'LOW_QUALITY');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedFrom" TEXT,
    "permissions" JSONB,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "lastAccessAt" TIMESTAMP(3),

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mainRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "freshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastAnalyzedAt" TIMESTAMP(3),
    "hasConflicts" BOOLEAN NOT NULL DEFAULT false,
    "hasMissingSections" BOOLEAN NOT NULL DEFAULT false,
    "hasAmbiguity" BOOLEAN NOT NULL DEFAULT false,
    "uploadState" TEXT NOT NULL DEFAULT 'ready',
    "uploadedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "groundingState" TEXT NOT NULL DEFAULT 'ungrounded',
    "groundedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),
    "deprecationReason" TEXT,
    "editorialState" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "ttlDays" INTEGER,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewDue" TIMESTAMP(3),
    "docType" "DocumentType" NOT NULL DEFAULT 'GENERAL',
    "constraintLevel" "ConstraintLevel" NOT NULL DEFAULT 'SOFT',
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "groundedBy" TEXT,
    "groundedReason" TEXT,
    "owner" TEXT,
    "reviewSchedule" "ReviewSchedule" NOT NULL DEFAULT 'NEVER',
    "nextReviewDate" TIMESTAMP(3),
    "relatedFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastReferencedAt" TIMESTAMP(3),
    "referenceCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "branchName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "changeRationale" TEXT NOT NULL DEFAULT '',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "riskAssessment" JSONB,
    "conflictCheck" JSONB,
    "reviewComments" JSONB,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "proposalId" TEXT,
    "authorId" TEXT,
    "authorType" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeRationale" TEXT,
    "changeType" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "basedOn" TEXT,
    "replacedRevisionId" TEXT,
    "authorId" TEXT,
    "authorType" TEXT NOT NULL DEFAULT 'ai',
    "sourceClient" TEXT,
    "sourceSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "hasConflicts" BOOLEAN NOT NULL DEFAULT false,
    "conflictReason" TEXT,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_diffs" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "diffType" TEXT NOT NULL,
    "diffData" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflicts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "conflictingDocId" TEXT,
    "conflictingLocation" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detectedBy" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedComment" TEXT,

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "llmModel" TEXT NOT NULL,
    "llmCost" DOUBLE PRECISION,
    "tokenCount" INTEGER,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "dimensions" INTEGER NOT NULL DEFAULT 1536,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chatMessageId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "documentId" TEXT,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "latency" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditType" TEXT NOT NULL,
    "targetId" TEXT,
    "userId" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "consistencyScore" INTEGER,
    "freshnessScore" INTEGER,
    "qualityScore" INTEGER,
    "findings" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "aiModel" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_modules" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "startLine" INTEGER,
    "endLine" INTEGER,
    "headingLevel" INTEGER,
    "isGrounded" BOOLEAN NOT NULL DEFAULT false,
    "groundedAt" TIMESTAMP(3),
    "groundingSource" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "moduleType" TEXT NOT NULL DEFAULT 'section',
    "tags" JSONB,
    "dependsOn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "moduleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "clarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastGroundedAt" TIMESTAMP(3),

    CONSTRAINT "document_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_conflicts" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conflictingModuleId" TEXT,
    "conflictingDocId" TEXT,
    "conflictingLocation" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detectedBy" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,
    "affectedFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systemicType" "SystemicType",
    "resolutionType" "ResolutionType",
    "resolutionDiff" JSONB,

    CONSTRAINT "module_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grounding_snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT,
    "snapshotName" TEXT NOT NULL,
    "description" TEXT,
    "groundingContext" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'project',
    "scopeIdentifier" TEXT,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "moduleCount" INTEGER NOT NULL DEFAULT 0,
    "totalSize" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grounding_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_grounding_history" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "contentBefore" TEXT,
    "contentAfter" TEXT NOT NULL,
    "diffSummary" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_grounding_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_processing_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTime" INTEGER,
    "result" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_approvals" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "approver" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_doc_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "featureSlug" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "feature_doc_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_records" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "source" "DecisionSource" NOT NULL,
    "sourceUrl" TEXT,
    "extractedFrom" TEXT,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractedBy" TEXT,
    "documentId" TEXT,
    "suggestedDocPath" TEXT,
    "supersedes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supersededBy" TEXT,
    "relatedDecisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affectedComponents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_registry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "domain" TEXT,
    "firstSeenIn" TEXT,
    "definitionSource" TEXT,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ConceptStatus" NOT NULL DEFAULT 'ACTIVE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "relatedConcepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usedInDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "examples" JSONB,
    "references" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT,
    "moduleId" TEXT,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_projectId_idx" ON "api_keys"("projectId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

-- CreateIndex
CREATE INDEX "api_keys_createdAt_idx" ON "api_keys"("createdAt");

-- CreateIndex
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- CreateIndex
CREATE INDEX "project_members_invitedBy_idx" ON "project_members"("invitedBy");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_mainRevisionId_key" ON "documents"("mainRevisionId");

-- CreateIndex
CREATE INDEX "documents_projectId_idx" ON "documents"("projectId");

-- CreateIndex
CREATE INDEX "documents_path_idx" ON "documents"("path");

-- CreateIndex
CREATE INDEX "documents_mainRevisionId_idx" ON "documents"("mainRevisionId");

-- CreateIndex
CREATE INDEX "documents_freshnessScore_idx" ON "documents"("freshnessScore");

-- CreateIndex
CREATE INDEX "documents_riskScore_idx" ON "documents"("riskScore");

-- CreateIndex
CREATE INDEX "documents_lastAnalyzedAt_idx" ON "documents"("lastAnalyzedAt");

-- CreateIndex
CREATE INDEX "documents_uploadState_idx" ON "documents"("uploadState");

-- CreateIndex
CREATE INDEX "documents_groundingState_idx" ON "documents"("groundingState");

-- CreateIndex
CREATE INDEX "documents_editorialState_idx" ON "documents"("editorialState");

-- CreateIndex
CREATE INDEX "documents_expiresAt_idx" ON "documents"("expiresAt");

-- CreateIndex
CREATE INDEX "documents_nextReviewDue_idx" ON "documents"("nextReviewDue");

-- CreateIndex
CREATE INDEX "documents_docType_idx" ON "documents"("docType");

-- CreateIndex
CREATE INDEX "documents_constraintLevel_idx" ON "documents"("constraintLevel");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_owner_idx" ON "documents"("owner");

-- CreateIndex
CREATE INDEX "documents_reviewSchedule_idx" ON "documents"("reviewSchedule");

-- CreateIndex
CREATE INDEX "documents_lastReferencedAt_idx" ON "documents"("lastReferencedAt");

-- CreateIndex
CREATE INDEX "documents_nextReviewDate_idx" ON "documents"("nextReviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "documents_projectId_path_key" ON "documents"("projectId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_branchName_key" ON "proposals"("branchName");

-- CreateIndex
CREATE INDEX "proposals_projectId_idx" ON "proposals"("projectId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_branchName_idx" ON "proposals"("branchName");

-- CreateIndex
CREATE INDEX "versions_docId_idx" ON "versions"("docId");

-- CreateIndex
CREATE INDEX "versions_proposalId_idx" ON "versions"("proposalId");

-- CreateIndex
CREATE INDEX "versions_authorId_idx" ON "versions"("authorId");

-- CreateIndex
CREATE INDEX "versions_createdAt_idx" ON "versions"("createdAt");

-- CreateIndex
CREATE INDEX "revisions_documentId_idx" ON "revisions"("documentId");

-- CreateIndex
CREATE INDEX "revisions_status_idx" ON "revisions"("status");

-- CreateIndex
CREATE INDEX "revisions_isMain_idx" ON "revisions"("isMain");

-- CreateIndex
CREATE INDEX "revisions_basedOn_idx" ON "revisions"("basedOn");

-- CreateIndex
CREATE INDEX "revisions_authorId_idx" ON "revisions"("authorId");

-- CreateIndex
CREATE INDEX "revisions_createdAt_idx" ON "revisions"("createdAt");

-- CreateIndex
CREATE INDEX "revisions_proposedAt_idx" ON "revisions"("proposedAt");

-- CreateIndex
CREATE INDEX "revision_diffs_revisionId_idx" ON "revision_diffs"("revisionId");

-- CreateIndex
CREATE UNIQUE INDEX "revision_diffs_revisionId_diffType_key" ON "revision_diffs"("revisionId", "diffType");

-- CreateIndex
CREATE INDEX "conflicts_documentId_idx" ON "conflicts"("documentId");

-- CreateIndex
CREATE INDEX "conflicts_status_idx" ON "conflicts"("status");

-- CreateIndex
CREATE INDEX "conflicts_severity_idx" ON "conflicts"("severity");

-- CreateIndex
CREATE INDEX "conflicts_conflictType_idx" ON "conflicts"("conflictType");

-- CreateIndex
CREATE INDEX "conflicts_detectedAt_idx" ON "conflicts"("detectedAt");

-- CreateIndex
CREATE INDEX "analyses_documentId_idx" ON "analyses"("documentId");

-- CreateIndex
CREATE INDEX "analyses_analysisType_idx" ON "analyses"("analysisType");

-- CreateIndex
CREATE INDEX "analyses_analyzedAt_idx" ON "analyses"("analyzedAt");

-- CreateIndex
CREATE INDEX "analyses_score_idx" ON "analyses"("score");

-- CreateIndex
CREATE INDEX "embeddings_documentId_idx" ON "embeddings"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_documentId_chunkIndex_key" ON "embeddings"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "chat_messages_documentId_idx" ON "chat_messages"("documentId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "suggestions_documentId_idx" ON "suggestions"("documentId");

-- CreateIndex
CREATE INDEX "suggestions_status_idx" ON "suggestions"("status");

-- CreateIndex
CREATE INDEX "suggestions_createdAt_idx" ON "suggestions"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_userId_idx" ON "ai_usage"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_projectId_idx" ON "ai_usage"("projectId");

-- CreateIndex
CREATE INDEX "ai_usage_documentId_idx" ON "ai_usage"("documentId");

-- CreateIndex
CREATE INDEX "ai_usage_operation_idx" ON "ai_usage"("operation");

-- CreateIndex
CREATE INDEX "ai_usage_createdAt_idx" ON "ai_usage"("createdAt");

-- CreateIndex
CREATE INDEX "audits_auditType_idx" ON "audits"("auditType");

-- CreateIndex
CREATE INDEX "audits_targetId_idx" ON "audits"("targetId");

-- CreateIndex
CREATE INDEX "audits_userId_idx" ON "audits"("userId");

-- CreateIndex
CREATE INDEX "audits_createdAt_idx" ON "audits"("createdAt");

-- CreateIndex
CREATE INDEX "document_modules_documentId_idx" ON "document_modules"("documentId");

-- CreateIndex
CREATE INDEX "document_modules_isGrounded_idx" ON "document_modules"("isGrounded");

-- CreateIndex
CREATE INDEX "document_modules_moduleType_idx" ON "document_modules"("moduleType");

-- CreateIndex
CREATE INDEX "document_modules_groundedAt_idx" ON "document_modules"("groundedAt");

-- CreateIndex
CREATE INDEX "document_modules_category_idx" ON "document_modules"("category");

-- CreateIndex
CREATE UNIQUE INDEX "document_modules_documentId_moduleKey_key" ON "document_modules"("documentId", "moduleKey");

-- CreateIndex
CREATE INDEX "module_conflicts_moduleId_idx" ON "module_conflicts"("moduleId");

-- CreateIndex
CREATE INDEX "module_conflicts_status_idx" ON "module_conflicts"("status");

-- CreateIndex
CREATE INDEX "module_conflicts_severity_idx" ON "module_conflicts"("severity");

-- CreateIndex
CREATE INDEX "module_conflicts_conflictType_idx" ON "module_conflicts"("conflictType");

-- CreateIndex
CREATE INDEX "module_conflicts_systemicType_idx" ON "module_conflicts"("systemicType");

-- CreateIndex
CREATE INDEX "module_conflicts_resolutionType_idx" ON "module_conflicts"("resolutionType");

-- CreateIndex
CREATE INDEX "grounding_snapshots_projectId_idx" ON "grounding_snapshots"("projectId");

-- CreateIndex
CREATE INDEX "grounding_snapshots_documentId_idx" ON "grounding_snapshots"("documentId");

-- CreateIndex
CREATE INDEX "grounding_snapshots_isActive_idx" ON "grounding_snapshots"("isActive");

-- CreateIndex
CREATE INDEX "grounding_snapshots_version_idx" ON "grounding_snapshots"("version");

-- CreateIndex
CREATE INDEX "grounding_snapshots_createdAt_idx" ON "grounding_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "module_grounding_history_moduleId_idx" ON "module_grounding_history"("moduleId");

-- CreateIndex
CREATE INDEX "module_grounding_history_action_idx" ON "module_grounding_history"("action");

-- CreateIndex
CREATE INDEX "module_grounding_history_occurredAt_idx" ON "module_grounding_history"("occurredAt");

-- CreateIndex
CREATE INDEX "document_processing_jobs_documentId_idx" ON "document_processing_jobs"("documentId");

-- CreateIndex
CREATE INDEX "document_processing_jobs_status_idx" ON "document_processing_jobs"("status");

-- CreateIndex
CREATE INDEX "document_processing_jobs_priority_idx" ON "document_processing_jobs"("priority");

-- CreateIndex
CREATE INDEX "document_processing_jobs_createdAt_idx" ON "document_processing_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "document_approvals_documentId_idx" ON "document_approvals"("documentId");

-- CreateIndex
CREATE INDEX "document_approvals_approver_idx" ON "document_approvals"("approver");

-- CreateIndex
CREATE INDEX "document_approvals_action_idx" ON "document_approvals"("action");

-- CreateIndex
CREATE INDEX "document_approvals_createdAt_idx" ON "document_approvals"("createdAt");

-- CreateIndex
CREATE INDEX "feature_doc_links_featureSlug_idx" ON "feature_doc_links"("featureSlug");

-- CreateIndex
CREATE INDEX "feature_doc_links_documentId_idx" ON "feature_doc_links"("documentId");

-- CreateIndex
CREATE INDEX "feature_doc_links_projectId_idx" ON "feature_doc_links"("projectId");

-- CreateIndex
CREATE INDEX "feature_doc_links_linkType_idx" ON "feature_doc_links"("linkType");

-- CreateIndex
CREATE UNIQUE INDEX "feature_doc_links_featureSlug_documentId_linkType_key" ON "feature_doc_links"("featureSlug", "documentId", "linkType");

-- CreateIndex
CREATE INDEX "decision_records_projectId_idx" ON "decision_records"("projectId");

-- CreateIndex
CREATE INDEX "decision_records_status_idx" ON "decision_records"("status");

-- CreateIndex
CREATE INDEX "decision_records_source_idx" ON "decision_records"("source");

-- CreateIndex
CREATE INDEX "decision_records_decisionType_idx" ON "decision_records"("decisionType");

-- CreateIndex
CREATE INDEX "decision_records_extractedAt_idx" ON "decision_records"("extractedAt");

-- CreateIndex
CREATE INDEX "concept_registry_projectId_idx" ON "concept_registry"("projectId");

-- CreateIndex
CREATE INDEX "concept_registry_category_idx" ON "concept_registry"("category");

-- CreateIndex
CREATE INDEX "concept_registry_status_idx" ON "concept_registry"("status");

-- CreateIndex
CREATE INDEX "concept_registry_term_idx" ON "concept_registry"("term");

-- CreateIndex
CREATE UNIQUE INDEX "concept_registry_projectId_term_key" ON "concept_registry"("projectId", "term");

-- CreateIndex
CREATE INDEX "alerts_projectId_idx" ON "alerts"("projectId");

-- CreateIndex
CREATE INDEX "alerts_documentId_idx" ON "alerts"("documentId");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_mainRevisionId_fkey" FOREIGN KEY ("mainRevisionId") REFERENCES "revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_fkey" FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_groundedBy_fkey" FOREIGN KEY ("groundedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_docId_fkey" FOREIGN KEY ("docId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision_diffs" ADD CONSTRAINT "revision_diffs_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_modules" ADD CONSTRAINT "document_modules_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_conflicts" ADD CONSTRAINT "module_conflicts_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "document_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grounding_snapshots" ADD CONSTRAINT "grounding_snapshots_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_grounding_history" ADD CONSTRAINT "module_grounding_history_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "document_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_approver_fkey" FOREIGN KEY ("approver") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_doc_links" ADD CONSTRAINT "feature_doc_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_doc_links" ADD CONSTRAINT "feature_doc_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

