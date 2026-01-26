/**
 * Backfill Script: Document Modules Enhancement
 *
 * This script adds categories, entities, and quality scores to existing modules.
 *
 * Usage:
 *   npx tsx prisma/migrations/backfill-modules.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Extract entities from module content (simple heuristic)
 * Looks for capitalized words that might be entities
 */
function extractEntities(content: string): string[] {
  const entities: Set<string> = new Set()

  // Match capitalized words (potential entities)
  const matches = content.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g)

  if (matches) {
    matches.forEach(match => {
      // Filter out common words
      const commonWords = ['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'Which', 'What', 'How']
      if (!commonWords.includes(match) && match.length > 2) {
        entities.add(match)
      }
    })
  }

  return Array.from(entities).slice(0, 10) // Limit to 10 entities
}

/**
 * Extract concepts (keywords) from content
 */
function extractConcepts(content: string): string[] {
  const concepts: Set<string> = new Set()

  // Common technical terms to look for
  const keywords = content.toLowerCase().match(/\b[a-z]{4,15}\b/g)

  if (keywords) {
    // Simple frequency analysis - take most common words
    const frequency: Record<string, number> = {}
    keywords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Filter out common words
    const stopWords = ['that', 'this', 'with', 'from', 'have', 'will', 'been', 'were', 'their', 'there', 'which']
    const filtered = Object.entries(frequency)
      .filter(([word]) => !stopWords.includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)

    filtered.forEach(word => concepts.add(word))
  }

  return Array.from(concepts)
}

/**
 * Calculate quality score based on module characteristics
 */
function calculateQualityScore(module: {
  content: string
  title: string
  description?: string | null
}): number {
  let score = 0.5 // Base score

  // Has description
  if (module.description && module.description.length > 20) {
    score += 0.1
  }

  // Good title length
  if (module.title.length > 10 && module.title.length < 100) {
    score += 0.1
  }

  // Content length (substantial but not too long)
  const contentLength = module.content.length
  if (contentLength > 100 && contentLength < 5000) {
    score += 0.15
  } else if (contentLength >= 5000) {
    score += 0.1
  }

  // Has structure (paragraphs, lists)
  if (module.content.includes('\n\n') || module.content.includes('- ') || module.content.includes('* ')) {
    score += 0.1
  }

  // Has code examples
  if (module.content.includes('```') || module.content.includes('`')) {
    score += 0.05
  }

  return Math.min(score, 1.0) // Cap at 1.0
}

/**
 * Calculate clarity score based on readability
 */
function calculateClarityScore(content: string): number {
  let score = 0.5 // Base score

  // Sentence structure
  const sentences = content.split(/[.!?]+/)
  if (sentences.length > 2) {
    const avgSentenceLength = content.length / sentences.length
    // Prefer medium-length sentences
    if (avgSentenceLength > 30 && avgSentenceLength < 150) {
      score += 0.2
    }
  }

  // Has headings
  if (content.match(/^#+\s/gm)) {
    score += 0.15
  }

  // Not too dense (has whitespace)
  const lines = content.split('\n')
  const emptyLines = lines.filter(l => l.trim() === '').length
  if (emptyLines / lines.length > 0.1) {
    score += 0.15
  }

  return Math.min(score, 1.0)
}

/**
 * Infer module category from type and content
 */
function inferCategory(moduleType: string, content: string): string | null {
  const lower = content.toLowerCase()

  if (lower.includes('api') || lower.includes('endpoint')) return 'api'
  if (lower.includes('security') || lower.includes('auth')) return 'security'
  if (lower.includes('database') || lower.includes('schema')) return 'database'
  if (lower.includes('business') || lower.includes('domain')) return 'business-logic'
  if (lower.includes('config') || lower.includes('setting')) return 'configuration'

  // Default to module type
  return moduleType !== 'section' ? moduleType : null
}

async function main() {
  console.log('🚀 Starting module enhancement backfill...\n')

  // Get all modules
  const modules = await prisma.documentModule.findMany({
    select: {
      id: true,
      moduleType: true,
      title: true,
      description: true,
      content: true,
      category: true,
    }
  })

  console.log(`Found ${modules.length} modules to process\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const module of modules) {
    try {
      // Skip if already enhanced
      if (module.category) {
        skipped++
        continue
      }

      const entities = extractEntities(module.content)
      const concepts = extractConcepts(module.content)
      const qualityScore = calculateQualityScore(module)
      const clarityScore = calculateClarityScore(module.content)
      const category = inferCategory(module.moduleType, module.content)

      // Extract tags from title and content
      const moduleTags: string[] = []
      if (module.title) {
        moduleTags.push(...module.title.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3))
      }

      // Update module
      await prisma.documentModule.update({
        where: { id: module.id },
        data: {
          category,
          moduleTags,
          entities,
          concepts,
          qualityScore,
          clarityScore,
        }
      })

      updated++

      if (updated % 10 === 0) {
        console.log(`  Processed ${updated} modules...`)
      }
    } catch (error) {
      console.error(`  ❌ Error processing module ${module.id}:`, error)
      errors++
    }
  }

  console.log('\n✅ Backfill complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${modules.length}\n`)

  // Show quality distribution
  const avgQuality = await prisma.documentModule.aggregate({
    _avg: {
      qualityScore: true,
      clarityScore: true,
    }
  })

  console.log('📊 Quality Metrics:')
  console.log(`   Average Quality Score: ${avgQuality._avg.qualityScore?.toFixed(2)}`)
  console.log(`   Average Clarity Score: ${avgQuality._avg.clarityScore?.toFixed(2)}\n`)

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
