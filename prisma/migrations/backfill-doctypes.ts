/**
 * Backfill Script: Document Types and Metadata
 *
 * This script infers document types from paths and sets sensible defaults
 * for new governance fields on existing documents.
 *
 * Usage:
 *   npx tsx prisma/migrations/backfill-doctypes.ts
 */

import { PrismaClient, DocumentType, ConstraintLevel, ReviewSchedule } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Infer document type from file path
 */
function inferDocType(path: string): DocumentType {
  const lowerPath = path.toLowerCase()

  if (lowerPath.match(/adr|architecture|design|system-design/i)) {
    return DocumentType.ARCHITECTURE
  }
  if (lowerPath.match(/api|schema|contract|swagger|openapi/i)) {
    return DocumentType.API_CONTRACT
  }
  if (lowerPath.match(/security|compliance|policy|gdpr|privacy/i)) {
    return DocumentType.SECURITY
  }
  if (lowerPath.match(/domain|model|business|entity|aggregate/i)) {
    return DocumentType.DOMAIN_MODEL
  }
  if (lowerPath.match(/feature|spec|requirement|prd|user-story/i)) {
    return DocumentType.FEATURE_SPEC
  }
  if (lowerPath.match(/runbook|procedure|ops|playbook|incident/i)) {
    return DocumentType.RUNBOOK
  }

  return DocumentType.GENERAL
}

/**
 * Determine constraint level based on document type
 */
function inferConstraintLevel(docType: DocumentType): ConstraintLevel {
  switch (docType) {
    case DocumentType.SECURITY:
      return ConstraintLevel.HARD // Security docs must be followed
    case DocumentType.API_CONTRACT:
      return ConstraintLevel.HARD // API contracts are binding
    case DocumentType.ARCHITECTURE:
      return ConstraintLevel.SOFT // Architecture guidelines
    case DocumentType.FEATURE_SPEC:
      return ConstraintLevel.SOFT // Feature specs guide implementation
    default:
      return ConstraintLevel.INFO // Informational by default
  }
}

/**
 * Determine review schedule based on document type
 */
function inferReviewSchedule(docType: DocumentType): ReviewSchedule {
  switch (docType) {
    case DocumentType.SECURITY:
      return ReviewSchedule.MONTHLY // Security needs frequent review
    case DocumentType.API_CONTRACT:
      return ReviewSchedule.QUARTERLY // APIs reviewed quarterly
    case DocumentType.ARCHITECTURE:
      return ReviewSchedule.QUARTERLY // Architecture reviewed quarterly
    case DocumentType.RUNBOOK:
      return ReviewSchedule.BIANNUAL // Runbooks reviewed twice a year
    case DocumentType.FEATURE_SPEC:
      return ReviewSchedule.NEVER // Feature specs don't need periodic review
    default:
      return ReviewSchedule.NEVER
  }
}

/**
 * Calculate next review date based on schedule
 */
function calculateNextReview(schedule: ReviewSchedule): Date | null {
  if (schedule === ReviewSchedule.NEVER) return null

  const now = new Date()
  const daysToAdd = {
    [ReviewSchedule.MONTHLY]: 30,
    [ReviewSchedule.QUARTERLY]: 90,
    [ReviewSchedule.BIANNUAL]: 180,
    [ReviewSchedule.ANNUAL]: 365,
    [ReviewSchedule.NEVER]: 0,
  }

  const days = daysToAdd[schedule]
  if (days === 0) return null

  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + days)
  return nextReview
}

/**
 * Extract category from path
 */
function extractCategory(path: string): string | null {
  const parts = path.split('/')
  if (parts.length > 1) {
    // Use the first directory as category
    return parts[0].toLowerCase()
  }
  return null
}

/**
 * Extract tags from path and content
 */
function extractTags(path: string, content?: string): string[] {
  const tags: Set<string> = new Set()

  // Add tags from path
  const pathParts = path.toLowerCase().split(/[\/\-_.]/)
  pathParts.forEach(part => {
    if (part.length > 2 && part.length < 20) {
      tags.add(part)
    }
  })

  // Limit to 5 most relevant tags
  return Array.from(tags).slice(0, 5)
}

async function main() {
  console.log('🚀 Starting document type backfill...\n')

  // Get all documents
  const documents = await prisma.document.findMany({
    select: {
      id: true,
      path: true,
      content: true,
      groundingState: true,
      docType: true,
    }
  })

  console.log(`Found ${documents.length} documents to process\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const doc of documents) {
    try {
      // Skip if already has docType set (not GENERAL)
      if (doc.docType && doc.docType !== DocumentType.GENERAL) {
        skipped++
        continue
      }

      const docType = inferDocType(doc.path)
      const constraintLevel = inferConstraintLevel(docType)
      const reviewSchedule = inferReviewSchedule(docType)
      const nextReviewDate = calculateNextReview(reviewSchedule)
      const category = extractCategory(doc.path)
      const tags = extractTags(doc.path, doc.content.substring(0, 500))

      // Update document
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          docType,
          constraintLevel,
          reviewSchedule,
          nextReviewDate,
          category,
          tags,
          // Set grounded metadata for already-grounded docs
          ...(doc.groundingState === 'grounded' ? {
            groundedReason: 'Migrated from existing grounded state'
          } : {})
        }
      })

      updated++

      if (updated % 10 === 0) {
        console.log(`  Processed ${updated} documents...`)
      }
    } catch (error) {
      console.error(`  ❌ Error processing document ${doc.id}:`, error)
      errors++
    }
  }

  console.log('\n✅ Backfill complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${documents.length}\n`)

  // Show distribution
  const distribution = await prisma.document.groupBy({
    by: ['docType'],
    _count: true,
  })

  console.log('📊 Document Type Distribution:')
  distribution.forEach(({ docType, _count }) => {
    console.log(`   ${docType}: ${_count}`)
  })

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
