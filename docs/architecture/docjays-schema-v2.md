# DocJays Schema v2 - Document Governance Layer

**Version**: 2.0
**Date**: 2026-01-26
**Phase**: 1 - Database Foundation
**Status**: Design Complete

---

## Overview

DocJays v2 enhances the database schema to support comprehensive knowledge governance, including:

- **Document Taxonomy**: Type classification (ARCHITECTURE, API_CONTRACT, etc.)
- **Constraint Enforcement**: HARD vs SOFT constraint levels
- **Lifecycle Management**: Grounding metadata, review schedules, approval workflows
- **Usage Tracking**: Feature relationships, reference counts, staleness detection
- **Decision Registry**: Automated capture of architectural decisions
- **Health Monitoring**: Alerts for stale docs, conflicts, missing reviews

---

## Schema Changes Summary

### New Enums
1. `DocumentType` - Document taxonomy
2. `ConstraintLevel` - Enforcement level for constraints
3. `ReviewSchedule` - Review frequency
4. `ApprovalAction` - Approval workflow actions
5. `LinkType` - Feature-document link types
6. `SystemicType` - Systemic conflict classification
7. `ResolutionType` - How conflicts were resolved
8. `DecisionStatus` - Decision lifecycle state
9. `DecisionSource` - Where decision originated
10. `ConceptStatus` - Concept registry status
11. `AlertType` - Alert categories
12. `AlertSeverity` - Alert priority
13. `AlertStatus` - Alert lifecycle state

### Enhanced Models
1. **Document** - Add 15+ governance fields
2. **DocumentModule** - Add 10+ metadata fields
3. **ModuleConflict** - Add systemic tracking

### New Models
1. **DocumentApproval** - Approval workflow tracking
2. **FeatureDocLink** - Feature-document relationships
3. **DecisionRecord** - Architectural decisions
4. **ConceptRegistry** - Domain concepts
5. **Alert** - Health monitoring alerts

---

## Detailed Schema Design

### 1. Document Model Enhancements

#### New Fields

```prisma
model Document {
  // ... existing fields ...

  // Document Taxonomy
  docType           DocumentType       @default(GENERAL)
  constraintLevel   ConstraintLevel    @default(SOFT)
  category          String?            // "authentication", "database", "api"
  tags              String[]           @default([])

  // Grounding Metadata
  groundedBy        String?            // User ID who grounded
  groundedReason    String?            @db.Text  // Why was this grounded
  owner             String?            // Primary maintainer User ID
  reviewSchedule    ReviewSchedule     @default(NEVER)
  nextReviewDate    DateTime?

  // Usage Tracking
  relatedFeatures   String[]           @default([])  // Feature slugs
  lastReferencedAt  DateTime?          // Last time referenced by code/AI
  referenceCount    Int                @default(0)   // How many times referenced

  // Relations (new)
  approvals         DocumentApproval[]
  featureLinks      FeatureDocLink[]
  ownerUser         User?              @relation("DocumentOwner", fields: [owner], references: [id])
  grounderUser      User?              @relation("DocumentGrounder", fields: [groundedBy], references: [id])
  alerts            Alert[]

  @@index([docType])
  @@index([constraintLevel])
  @@index([category])
  @@index([owner])
  @@index([reviewSchedule])
  @@index([lastReferencedAt])
}
```

#### DocumentType Enum

```prisma
enum DocumentType {
  ARCHITECTURE       // ADRs, system design docs
  API_CONTRACT       // API specifications, schemas
  DOMAIN_MODEL       // Business logic, domain concepts
  SECURITY           // Security policies, compliance
  FEATURE_SPEC       // Feature specifications
  RUNBOOK            // Operational procedures
  GENERAL            // Everything else
}
```

#### ConstraintLevel Enum

```prisma
enum ConstraintLevel {
  HARD               // MUST comply (blocks execution)
  SOFT               // SHOULD comply (warns only)
  INFO               // Informational (no enforcement)
}
```

#### ReviewSchedule Enum

```prisma
enum ReviewSchedule {
  NEVER              // No periodic review
  MONTHLY            // Review every 30 days
  QUARTERLY          // Review every 90 days
  BIANNUAL           // Review every 180 days
  ANNUAL             // Review every 365 days
}
```

---

### 2. DocumentApproval Model (New)

Tracks approval workflow for grounded documents.

```prisma
model DocumentApproval {
  id                 String           @id @default(cuid())
  documentId         String

  // Approval Details
  approver           String           // User ID
  action             ApprovalAction
  comment            String?          @db.Text
  metadata           Json?            // { reason, tags, etc. }

  // Timestamps
  createdAt          DateTime         @default(now())

  // Relations
  document           Document         @relation(fields: [documentId], references: [id], onDelete: Cascade)
  approverUser       User             @relation(fields: [approver], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@index([approver])
  @@index([action])
  @@index([createdAt])
  @@map("document_approvals")
}

enum ApprovalAction {
  APPROVED           // Approved grounding
  REJECTED           // Rejected grounding
  REQUESTED_CHANGES  // Requested changes before approval
  REVIEWED           // Periodic review completed
  DEPRECATED         // Marked as deprecated
}
```

---

### 3. FeatureDocLink Model (New)

Bidirectional links between features and documents.

```prisma
model FeatureDocLink {
  id                 String           @id @default(cuid())
  projectId          String

  // Link Details
  featureSlug        String           // e.g., "user-export"
  documentId         String
  linkType           LinkType

  // Metadata
  reason             String?          @db.Text
  createdBy          String?          // User ID
  createdAt          DateTime         @default(now())
  lastVerifiedAt     DateTime?

  // Relations
  document           Document         @relation(fields: [documentId], references: [id], onDelete: Cascade)
  creator            User?            @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@unique([featureSlug, documentId, linkType])
  @@index([featureSlug])
  @@index([documentId])
  @@index([projectId])
  @@index([linkType])
  @@map("feature_doc_links")
}

enum LinkType {
  IMPLEMENTS         // Feature implements this spec
  REFERENCES         // Feature references this doc
  CONSTRAINS         // Doc constrains how feature is built
  DOCUMENTS          // Doc documents the feature
}
```

---

### 4. DocumentModule Enhancements

```prisma
model DocumentModule {
  // ... existing fields ...

  // New Fields
  category           String?           // "api", "security", "business-logic"
  tags               String[]          @default([])
  entities           String[]          @default([])  // Extracted entities
  concepts           String[]          @default([])  // Domain concepts
  dependencies       String[]          @default([])  // External dependencies

  // Quality Metrics
  qualityScore       Float             @default(0.5)  // 0.0-1.0
  clarityScore       Float             @default(0.5)  // 0.0-1.0

  @@index([category])
}
```

---

### 5. ModuleConflict Enhancements

```prisma
model ModuleConflict {
  // ... existing fields ...

  // New Fields
  affectedFeatures   String[]          @default([])  // Feature slugs
  systemicType       SystemicType?     // If this is a pattern

  // Resolution Tracking
  resolutionType     ResolutionType?
  resolutionDiff     Json?             // What changed to resolve

  @@index([systemicType])
  @@index([resolutionType])
}

enum SystemicType {
  NAMING_INCONSISTENCY      // Inconsistent terminology
  VERSIONING_CONFLICT       // Version mismatch
  SCOPE_OVERLAP             // Overlapping responsibilities
  DEPENDENCY_CIRCULAR       // Circular dependency
  ARCHITECTURE_DRIFT        // Deviation from architecture
}

enum ResolutionType {
  MERGED                    // Conflicting parts merged
  PRIORITIZED               // One version chosen
  SPLIT                     // Split into separate concerns
  DEPRECATED                // Marked old version deprecated
  REWRITTEN                 // Complete rewrite
}
```

---

### 6. DecisionRecord Model (New)

Auto-extracted architectural and technical decisions.

```prisma
model DecisionRecord {
  id                 String           @id @default(cuid())
  projectId          String

  // Decision Details
  title              String
  description        String           @db.Text
  context            String           @db.Text  // Why this decision was needed
  decision           String           @db.Text  // What was decided
  consequences       String           @db.Text  // Expected impact

  // Classification
  decisionType       String           // "architectural", "technical", "process"
  status             DecisionStatus   @default(PROPOSED)
  source             DecisionSource

  // Provenance
  sourceUrl          String?          // PR URL, commit SHA, doc path
  extractedFrom      String?          // "PR #123", "commit abc123", "doc: arch.md"
  extractedAt        DateTime         @default(now())
  extractedBy        String?          // "ai", "manual", User ID

  // Grounding
  documentId         String?          // If grounded to a document
  suggestedDocPath   String?          // AI suggestion for where to ground

  // Relationships
  supersedes         String[]         @default([])  // Decision IDs
  supersededBy       String?          // Decision ID
  relatedDecisions   String[]         @default([])  // Decision IDs

  // Metadata
  tags               String[]         @default([])
  affectedComponents String[]         @default([])
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  // Relations
  document           Document?        @relation(fields: [documentId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([status])
  @@index([source])
  @@index([decisionType])
  @@index([extractedAt])
  @@map("decision_records")
}

enum DecisionStatus {
  PROPOSED           // Proposed decision
  ACCEPTED           // Decision accepted
  REJECTED           // Decision rejected
  DEPRECATED         // Decision no longer valid
  SUPERSEDED         // Replaced by another decision
}

enum DecisionSource {
  PR                 // Extracted from pull request
  COMMIT             // Extracted from commit message
  DOCUMENT           // Extracted from document
  MEETING            // Captured from meeting notes
  MANUAL             // Manually created
}
```

---

### 7. ConceptRegistry Model (New)

Registry of domain concepts and their definitions.

```prisma
model ConceptRegistry {
  id                 String           @id @default(cuid())
  projectId          String

  // Concept Details
  term               String           // "API Key", "Grounding", "Revision"
  definition         String           @db.Text
  aliases            String[]         @default([])  // Alternative terms

  // Classification
  category           String?          // "technical", "business", "domain"
  domain             String?          // "authentication", "versioning"

  // Provenance
  firstSeenIn        String?          // Document path or module ID
  definitionSource   String?          // Where definition came from
  extractedAt        DateTime         @default(now())

  // Status
  status             ConceptStatus    @default(ACTIVE)
  confidence         Float            @default(0.8)  // AI confidence

  // Relationships
  relatedConcepts    String[]         @default([])  // Concept IDs
  usedInDocuments    String[]         @default([])  // Document IDs

  // Metadata
  examples           Json?            // Usage examples
  references         Json?            // External references
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@unique([projectId, term])
  @@index([projectId])
  @@index([category])
  @@index([status])
  @@index([term])
  @@map("concept_registry")
}

enum ConceptStatus {
  ACTIVE             // Actively used
  DEPRECATED         // No longer preferred
  AMBIGUOUS          // Multiple definitions exist
  CLARIFICATION_NEEDED  // Needs better definition
}
```

---

### 8. Alert Model (New)

Health monitoring alerts for knowledge governance.

```prisma
model Alert {
  id                 String           @id @default(cuid())
  projectId          String

  // Alert Target
  documentId         String?          // If doc-specific
  moduleId           String?          // If module-specific

  // Alert Details
  type               AlertType
  severity           AlertSeverity
  title              String
  message            String           @db.Text
  metadata           Json?            // Additional context

  // Status
  status             AlertStatus      @default(ACTIVE)
  acknowledgedBy     String?          // User ID
  acknowledgedAt     DateTime?
  resolvedBy         String?          // User ID
  resolvedAt         DateTime?
  resolutionNote     String?          @db.Text

  // Timestamps
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  expiresAt          DateTime?        // Auto-resolve after this

  // Relations
  document           Document?        @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([documentId])
  @@index([type])
  @@index([severity])
  @@index([status])
  @@index([createdAt])
  @@map("alerts")
}

enum AlertType {
  STALE_DOCUMENT         // Document not reviewed in time
  MISSING_REVIEW         // Review overdue
  HARD_CONSTRAINT_VIOLATION  // HARD constraint violated
  CONFLICT_DETECTED      // New conflict found
  ORPHANED_DOCUMENT      // No feature references
  DEPRECATED_USAGE       // Using deprecated doc
  MISSING_OWNER          // Document has no owner
  LOW_QUALITY            // Quality score dropped
}

enum AlertSeverity {
  CRITICAL           // Immediate action required
  HIGH               // Address soon
  MEDIUM             // Normal priority
  LOW                // Informational
}

enum AlertStatus {
  ACTIVE             // Alert is active
  ACKNOWLEDGED       // User acknowledged
  RESOLVED           // Issue resolved
  DISMISSED          // User dismissed
  EXPIRED            // Auto-expired
}
```

---

## User Model Enhancements

Add new relations to User model:

```prisma
model User {
  // ... existing fields and relations ...

  // New Relations
  ownedDocuments     Document[]       @relation("DocumentOwner")
  groundedDocuments  Document[]       @relation("DocumentGrounder")
  approvals          DocumentApproval[]
  createdLinks       FeatureDocLink[]

  // ... rest of model ...
}
```

---

## Migration Strategy

### Safe Migration Approach

1. **Add nullable fields first**: All new fields start as optional
2. **Backfill data**: Use scripts to populate new fields from existing data
3. **Add constraints**: After backfill, make fields required where needed
4. **Add indexes**: Optimize query performance
5. **Test thoroughly**: Verify no data loss or corruption

### Migration Order

1. **001_add_document_governance.sql** - Add core document fields and enums
2. **002_add_approval_workflow.sql** - Create DocumentApproval model
3. **003_add_feature_linking.sql** - Create FeatureDocLink model
4. **004_enhance_modules.sql** - Enhance DocumentModule
5. **005_enhance_conflicts.sql** - Enhance ModuleConflict
6. **006_add_decision_concept.sql** - Create DecisionRecord and ConceptRegistry
7. **007_add_alerts.sql** - Create Alert model

### Rollback Plan

Each migration includes:
- Explicit DOWN migration to reverse changes
- Data preservation strategies
- Validation queries to verify integrity

---

## Data Backfill Strategy

### 1. Document Type Inference

```typescript
// Infer docType from path
const inferDocType = (path: string): DocumentType => {
  if (path.match(/adr|architecture|design/i)) return 'ARCHITECTURE'
  if (path.match(/api|schema|contract/i)) return 'API_CONTRACT'
  if (path.match(/security|compliance|policy/i)) return 'SECURITY'
  if (path.match(/domain|model|business/i)) return 'DOMAIN_MODEL'
  if (path.match(/feature|spec|requirement/i)) return 'FEATURE_SPEC'
  if (path.match(/runbook|procedure|ops/i)) return 'RUNBOOK'
  return 'GENERAL'
}
```

### 2. Constraint Level Defaults

- Grounded documents → `SOFT` (default)
- Security documents → `HARD` (stricter)
- General documents → `INFO` (informational)

### 3. Review Schedule

- Architecture docs → `QUARTERLY`
- API contracts → `MONTHLY`
- Security docs → `MONTHLY`
- General docs → `NEVER`

### 4. Reference Tracking

- Scan git history for file references
- Count imports/includes in codebase
- Set `referenceCount` and `lastReferencedAt`

---

## Performance Considerations

### Indexes Added

1. `Document(docType, constraintLevel)` - Composite for constraint queries
2. `Document(owner, reviewSchedule)` - Owner dashboard queries
3. `FeatureDocLink(featureSlug, linkType)` - Feature constraint lookups
4. `Alert(projectId, status, severity)` - Alert dashboard
5. `DecisionRecord(projectId, status, source)` - Decision queries

### Query Optimization

- Materialized views for dashboard metrics
- Partial indexes for active alerts only
- Denormalized reference counts for quick access

---

## Testing Requirements

### Unit Tests

- [ ] All new enums have valid values
- [ ] All new fields accept correct data types
- [ ] Relations are properly configured

### Integration Tests

- [ ] Grounding workflow with approvals
- [ ] Feature linking creates bidirectional links
- [ ] Alerts are created for stale documents
- [ ] Backfill scripts preserve existing data

### Performance Tests

- [ ] Query performance with 10k+ documents
- [ ] Index usage verified with EXPLAIN
- [ ] Migration completes in < 5 minutes

---

## Success Criteria

- ✅ All 7 migrations created and tested
- ✅ Zero data loss during migration
- ✅ All existing queries still work
- ✅ New fields properly indexed
- ✅ Backfill scripts tested on staging
- ✅ Rollback procedures documented and tested

---

## Next Steps

After Phase 1 completion:
1. Deploy migrations to staging
2. Verify application functionality
3. Deploy to production
4. Monitor for issues
5. Proceed to **Phase 2: Lifecycle Management APIs**
