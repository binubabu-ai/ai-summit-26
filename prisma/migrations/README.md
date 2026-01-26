# DocJays Phase 1 - Database Migration Guide

## Overview

This directory contains migration scripts and backfill utilities for DocJays Phase 1: Document Governance Layer.

## Files

- `phase1_docjays_governance.sql` - Complete SQL migration (from-empty)
- `backfill-doctypes.ts` - Backfill script for document types and governance metadata
- `backfill-modules.ts` - Backfill script for module enhancements

## Migration Strategy

### For New/Empty Databases

If you're setting up a fresh database:

```bash
# Apply schema
npx prisma db push

# Or use migrations
npx prisma migrate dev
```

### For Existing Databases (IMPORTANT)

**⚠️ CAUTION**: The production database already has data. Do NOT run `prisma migrate dev` directly.

Instead, follow this safe migration process:

#### 1. Backup Database

```bash
# Create backup before any changes
# (Use your database provider's backup tool)
```

#### 2. Generate Prisma Client

The schema has been updated with all Phase 1 enhancements. Generate the new client:

```bash
npx prisma generate
```

#### 3. Apply Schema Changes

Since all new fields are **optional** (nullable or have defaults), you can safely push the schema:

```bash
# This will add new columns/tables without breaking existing data
npx prisma db push
```

This command will:
- Add new enums (DocumentType, ConstraintLevel, etc.)
- Add new optional columns to Document model
- Add new optional columns to DocumentModule model
- Add new optional columns to ModuleConflict model
- Create new tables (DocumentApproval, FeatureDocLink, DecisionRecord, ConceptRegistry, Alert)

#### 4. Run Backfill Scripts

After schema is applied, populate new fields with sensible defaults:

```bash
# Install tsx if not already installed
npm install -D tsx

# Backfill document types and governance metadata
npx tsx prisma/migrations/backfill-doctypes.ts

# Backfill module enhancements
npx tsx prisma/migrations/backfill-modules.ts
```

#### 5. Verify Data Integrity

```bash
# Open Prisma Studio to inspect data
npx prisma studio

# Check that:
# - All documents have docType (not all GENERAL)
# - Constraint levels are set appropriately
# - Review schedules are configured
# - Modules have categories and quality scores
```

## What Changed

### New Enums

1. `DocumentType` - ARCHITECTURE, API_CONTRACT, DOMAIN_MODEL, SECURITY, FEATURE_SPEC, RUNBOOK, GENERAL
2. `ConstraintLevel` - HARD, SOFT, INFO
3. `ReviewSchedule` - NEVER, MONTHLY, QUARTERLY, BIANNUAL, ANNUAL
4. `ApprovalAction` - APPROVED, REJECTED, REQUESTED_CHANGES, REVIEWED, DEPRECATED
5. `LinkType` - IMPLEMENTS, REFERENCES, CONSTRAINS, DOCUMENTS
6. `SystemicType` - NAMING_INCONSISTENCY, VERSIONING_CONFLICT, SCOPE_OVERLAP, DEPENDENCY_CIRCULAR, ARCHITECTURE_DRIFT
7. `ResolutionType` - MERGED, PRIORITIZED, SPLIT, DEPRECATED, REWRITTEN
8. `DecisionStatus` - PROPOSED, ACCEPTED, REJECTED, DEPRECATED, SUPERSEDED
9. `DecisionSource` - PR, COMMIT, DOCUMENT, MEETING, MANUAL
10. `ConceptStatus` - ACTIVE, DEPRECATED, AMBIGUOUS, CLARIFICATION_NEEDED
11. `AlertType` - STALE_DOCUMENT, MISSING_REVIEW, HARD_CONSTRAINT_VIOLATION, etc.
12. `AlertSeverity` - CRITICAL, HIGH, MEDIUM, LOW
13. `AlertStatus` - ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED, EXPIRED

### Document Model Additions

- `docType` - Document taxonomy
- `constraintLevel` - Enforcement level
- `category` - Category string
- `tags` - Array of tags
- `groundedBy` - User ID who grounded
- `groundedReason` - Why grounded
- `owner` - Primary maintainer
- `reviewSchedule` - Review frequency
- `nextReviewDate` - Next review date
- `relatedFeatures` - Feature slugs
- `lastReferencedAt` - Last reference timestamp
- `referenceCount` - Reference count

### DocumentModule Additions

- `category` - Module category
- `moduleTags` - Tags array
- `entities` - Extracted entities
- `concepts` - Domain concepts
- `dependencies` - External dependencies
- `qualityScore` - Quality metric (0-1)
- `clarityScore` - Clarity metric (0-1)

### ModuleConflict Additions

- `affectedFeatures` - Feature slugs
- `systemicType` - Systemic pattern type
- `resolutionType` - How resolved
- `resolutionDiff` - Resolution diff

### New Models

1. **DocumentApproval** - Approval workflow tracking
2. **FeatureDocLink** - Feature-document relationships
3. **DecisionRecord** - Decision registry
4. **ConceptRegistry** - Domain concepts
5. **Alert** - Knowledge governance alerts

## Safety Guarantees

✅ All new fields are **optional** (nullable or have defaults)
✅ No existing data will be modified
✅ No existing queries will break
✅ Backfill scripts are idempotent (safe to re-run)
✅ Build passes with zero TypeScript errors

## Rollback Plan

If you need to rollback:

1. **Restore from backup**
   ```bash
   # Use your database provider's restore functionality
   ```

2. **Revert Prisma schema**
   ```bash
   git checkout HEAD~1 -- prisma/schema.prisma
   npx prisma generate
   ```

3. **Rebuild application**
   ```bash
   npm run build
   ```

## Testing Checklist

Before deploying to production:

- [ ] Backup created
- [ ] Schema applied via `prisma db push`
- [ ] Backfill scripts executed successfully
- [ ] Data verified in Prisma Studio
- [ ] Application builds without errors
- [ ] Existing queries still work
- [ ] New fields populated correctly
- [ ] Performance is acceptable (< 5min migration time)

## Next Steps

After Phase 1 completion:
- Proceed to **Phase 2: Lifecycle Management APIs**
- See `DOCJAYS_IMPLEMENTATION_PLAN.md` for details

## Support

For issues or questions:
1. Check `docs/architecture/docjays-schema-v2.md` for design details
2. Review `DOCJAYS_IMPLEMENTATION_PLAN.md` for context
3. Contact the team lead
