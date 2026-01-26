/**
 * Embedding Generation Service
 * Generates and manages vector embeddings for semantic search and similarity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OpenAI embedding models
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Pricing (USD per 1M tokens)
const EMBEDDING_PRICING = {
  'text-embedding-3-small': 0.02,  // $0.02 per 1M tokens
  'text-embedding-3-large': 0.13,  // $0.13 per 1M tokens
};

// Chunk settings
const MAX_CHUNK_TOKENS = 8000; // OpenAI limit is 8191
const TYPICAL_TOKENS_PER_CHAR = 0.25;

export interface EmbeddingResult {
  embedding: number[];
  chunkText: string;
  chunkIndex: number;
}

export interface EmbeddingUsage {
  inputTokens: number;
  cost: number;
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings with batching support
 */
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // OpenAI supports up to 2048 inputs in a single request
  const BATCH_SIZE = 100; // Conservative batch size
  const batches: string[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    allEmbeddings.push(...data.data.map((d: any) => d.embedding));
  }

  return allEmbeddings;
}

/**
 * Chunk text into embedding-sized pieces
 */
function chunkText(text: string, maxChunkSize: number = MAX_CHUNK_TOKENS): string[] {
  const estimatedTokens = Math.floor(text.length * TYPICAL_TOKENS_PER_CHAR);

  // If text fits in one chunk, return as is
  if (estimatedTokens <= maxChunkSize) {
    return [text];
  }

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;

  for (const para of paragraphs) {
    const paraSize = Math.floor(para.length * TYPICAL_TOKENS_PER_CHAR);

    // If single paragraph exceeds max, split by sentences
    if (paraSize > maxChunkSize) {
      // Flush current chunk
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentSize = 0;
      }

      // Split large paragraph by sentences
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        const sentSize = Math.floor(sentence.length * TYPICAL_TOKENS_PER_CHAR);

        if (currentSize + sentSize > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentSize = 0;
        }

        currentChunk.push(sentence);
        currentSize += sentSize;
      }
    } else {
      // Normal paragraph
      if (currentSize + paraSize > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(para);
      currentSize += paraSize;
    }
  }

  // Flush final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

/**
 * Generate and store embeddings for a document
 */
export async function generateDocumentEmbeddings(
  documentId: string,
  documentContent: string
): Promise<{ embeddings: EmbeddingResult[]; usage: EmbeddingUsage }> {
  // Check if embeddings already exist
  const existing = await prisma.embedding.findMany({
    where: { documentId },
    orderBy: { chunkIndex: 'asc' },
  });

  if (existing.length > 0) {
    // Return cached embeddings
    return {
      embeddings: existing.map(e => ({
        embedding: JSON.parse(e.embedding),
        chunkText: e.chunkText,
        chunkIndex: e.chunkIndex,
      })),
      usage: {
        inputTokens: 0,
        cost: 0,
      },
    };
  }

  // Chunk the document
  const chunks = chunkText(documentContent);

  // Generate embeddings in batch
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Store in database
  const embeddingRecords = await Promise.all(
    embeddings.map((embedding, idx) =>
      prisma.embedding.create({
        data: {
          documentId,
          chunkIndex: idx,
          chunkText: chunks[idx],
          embedding: JSON.stringify(embedding),
          model: EMBEDDING_MODEL,
          dimensions: EMBEDDING_DIMENSIONS,
        },
      })
    )
  );

  // Calculate usage
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const inputTokens = Math.floor(totalChars * TYPICAL_TOKENS_PER_CHAR);
  const cost = (inputTokens / 1_000_000) * EMBEDDING_PRICING[EMBEDDING_MODEL];

  return {
    embeddings: embeddingRecords.map(e => ({
      embedding: JSON.parse(e.embedding),
      chunkText: e.chunkText,
      chunkIndex: e.chunkIndex,
    })),
    usage: {
      inputTokens,
      cost,
    },
  };
}

/**
 * Generate embedding for a single text (module or query)
 * Does not store in database - used for on-the-fly comparisons
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  // If text is too long, chunk and average embeddings
  const chunks = chunkText(text);

  if (chunks.length === 1) {
    return generateEmbedding(chunks[0]);
  }

  // Generate embeddings for all chunks
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Average embeddings (simple approach)
  const avgEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      avgEmbedding[i] += embedding[i];
    }
  }

  // Normalize
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    avgEmbedding[i] /= embeddings.length;
  }

  return avgEmbedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar documents using vector similarity
 */
export async function findSimilarDocuments(
  documentId: string,
  threshold: number = 0.80,
  limit: number = 10
): Promise<Array<{ documentId: string; similarity: number; chunkIndex: number }>> {
  // Get embeddings for target document
  const targetEmbeddings = await prisma.embedding.findMany({
    where: { documentId },
    orderBy: { chunkIndex: 'asc' },
  });

  if (targetEmbeddings.length === 0) {
    return [];
  }

  // Get all other embeddings
  const allEmbeddings = await prisma.embedding.findMany({
    where: {
      documentId: { not: documentId },
    },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      embedding: true,
    },
  });

  // Calculate similarities
  const similarities: Array<{ documentId: string; similarity: number; chunkIndex: number }> = [];

  for (const targetEmb of targetEmbeddings) {
    const targetVector = JSON.parse(targetEmb.embedding);

    for (const otherEmb of allEmbeddings) {
      const otherVector = JSON.parse(otherEmb.embedding);
      const similarity = cosineSimilarity(targetVector, otherVector);

      if (similarity >= threshold) {
        similarities.push({
          documentId: otherEmb.documentId,
          similarity,
          chunkIndex: otherEmb.chunkIndex,
        });
      }
    }
  }

  // Sort by similarity and limit
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Find similar modules within a project
 * Used for conflict detection (Stage 1)
 */
export async function findSimilarModules(
  moduleContent: string,
  projectId: string,
  excludeModuleId?: string,
  threshold: number = 0.90
): Promise<Array<{
  moduleId: string;
  moduleKey: string;
  documentId: string;
  similarity: number;
  matchedChunk: string;
}>> {
  // Generate embedding for query module
  const queryEmbedding = await generateTextEmbedding(moduleContent);

  // Get all embeddings for the project
  const projectEmbeddings = await prisma.embedding.findMany({
    where: {
      document: {
        projectId,
      },
    },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      chunkText: true,
      embedding: true,
      document: {
        select: {
          modules: {
            select: {
              id: true,
              moduleKey: true,
              content: true,
            },
          },
        },
      },
    },
  });

  const similarities: Array<{
    moduleId: string;
    moduleKey: string;
    documentId: string;
    similarity: number;
    matchedChunk: string;
  }> = [];

  for (const emb of projectEmbeddings) {
    const embVector = JSON.parse(emb.embedding);
    const similarity = cosineSimilarity(queryEmbedding, embVector);

    if (similarity >= threshold) {
      // Find which module this chunk belongs to
      const modules = emb.document.modules;

      for (const module of modules) {
        if (excludeModuleId && module.id === excludeModuleId) continue;

        // Check if chunk text is part of this module's content
        if (module.content.includes(emb.chunkText.substring(0, 100))) {
          similarities.push({
            moduleId: module.id,
            moduleKey: module.moduleKey,
            documentId: emb.documentId,
            similarity,
            matchedChunk: emb.chunkText,
          });
        }
      }
    }
  }

  // Deduplicate by moduleId and keep highest similarity
  const deduped = new Map<string, typeof similarities[0]>();

  for (const sim of similarities) {
    const existing = deduped.get(sim.moduleId);
    if (!existing || sim.similarity > existing.similarity) {
      deduped.set(sim.moduleId, sim);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Generate embeddings for multiple modules in batch
 * Returns map of moduleId -> embedding
 */
export async function generateModuleEmbeddingsBatch(
  modules: Array<{ id: string; content: string }>
): Promise<Map<string, number[]>> {
  const texts = modules.map(m => m.content);
  const embeddings = await generateEmbeddingsBatch(texts);

  const embeddingMap = new Map<string, number[]>();
  modules.forEach((module, idx) => {
    embeddingMap.set(module.id, embeddings[idx]);
  });

  return embeddingMap;
}

/**
 * Update embeddings when document content changes
 */
export async function updateDocumentEmbeddings(
  documentId: string,
  newContent: string
): Promise<{ updated: number; usage: EmbeddingUsage }> {
  // Delete old embeddings
  await prisma.embedding.deleteMany({
    where: { documentId },
  });

  // Generate new embeddings
  const result = await generateDocumentEmbeddings(documentId, newContent);

  return {
    updated: result.embeddings.length,
    usage: result.usage,
  };
}

/**
 * Search documents using semantic similarity
 */
export async function semanticSearch(
  query: string,
  projectId: string,
  options?: {
    limit?: number;
    threshold?: number;
    groundedOnly?: boolean;
  }
): Promise<Array<{
  documentId: string;
  documentPath: string;
  similarity: number;
  matchedChunk: string;
  chunkIndex: number;
}>> {
  const { limit = 10, threshold = 0.70, groundedOnly = false } = options || {};

  // Generate query embedding
  const queryEmbedding = await generateTextEmbedding(query);

  // Get all embeddings for the project
  const where: any = {
    document: {
      projectId,
    },
  };

  if (groundedOnly) {
    where.document.groundingState = 'grounded';
    where.document.editorialState = 'active';
  }

  const embeddings = await prisma.embedding.findMany({
    where,
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      chunkText: true,
      embedding: true,
      document: {
        select: {
          path: true,
        },
      },
    },
  });

  // Calculate similarities
  const results: Array<{
    documentId: string;
    documentPath: string;
    similarity: number;
    matchedChunk: string;
    chunkIndex: number;
  }> = [];

  for (const emb of embeddings) {
    const embVector = JSON.parse(emb.embedding);
    const similarity = cosineSimilarity(queryEmbedding, embVector);

    if (similarity >= threshold) {
      results.push({
        documentId: emb.documentId,
        documentPath: emb.document.path,
        similarity,
        matchedChunk: emb.chunkText,
        chunkIndex: emb.chunkIndex,
      });
    }
  }

  // Sort by similarity and limit
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Calculate embedding cost
 */
export function calculateEmbeddingCost(textLength: number, model: string = EMBEDDING_MODEL): number {
  const tokens = Math.floor(textLength * TYPICAL_TOKENS_PER_CHAR);
  const pricing = EMBEDDING_PRICING[model as keyof typeof EMBEDDING_PRICING];

  if (!pricing) {
    console.warn(`Unknown embedding model for pricing: ${model}`);
    return 0;
  }

  return (tokens / 1_000_000) * pricing;
}

/**
 * Refresh stale embeddings (older than 30 days)
 */
export async function refreshStaleEmbeddings(projectId: string): Promise<{
  refreshed: number;
  totalCost: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find documents with stale embeddings
  const staleDocuments = await prisma.document.findMany({
    where: {
      projectId,
      embeddings: {
        some: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      },
    },
    select: {
      id: true,
      content: true,
    },
  });

  let totalCost = 0;
  let refreshed = 0;

  for (const doc of staleDocuments) {
    const result = await updateDocumentEmbeddings(doc.id, doc.content);
    totalCost += result.usage.cost;
    refreshed += result.updated;
  }

  return {
    refreshed,
    totalCost,
  };
}

/**
 * Get embedding statistics for a project
 */
export async function getEmbeddingStats(projectId: string): Promise<{
  totalEmbeddings: number;
  totalDocuments: number;
  avgChunksPerDoc: number;
  oldestEmbedding: Date | null;
  estimatedStorageSize: string;
}> {
  const stats = await prisma.embedding.aggregate({
    where: {
      document: {
        projectId,
      },
    },
    _count: {
      id: true,
    },
    _min: {
      createdAt: true,
    },
  });

  const documentCount = await prisma.document.count({
    where: {
      projectId,
      embeddings: {
        some: {},
      },
    },
  });

  const totalEmbeddings = stats._count.id || 0;
  const avgChunksPerDoc = documentCount > 0 ? totalEmbeddings / documentCount : 0;

  // Estimate storage: 1536 dimensions * 4 bytes per float = 6144 bytes per embedding
  const estimatedBytes = totalEmbeddings * 6144;
  const estimatedStorageSize =
    estimatedBytes > 1_000_000
      ? `${(estimatedBytes / 1_000_000).toFixed(2)} MB`
      : `${(estimatedBytes / 1_000).toFixed(2)} KB`;

  return {
    totalEmbeddings,
    totalDocuments: documentCount,
    avgChunksPerDoc: Math.round(avgChunksPerDoc * 10) / 10,
    oldestEmbedding: stats._min.createdAt,
    estimatedStorageSize,
  };
}
