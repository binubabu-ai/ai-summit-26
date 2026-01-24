# Project-Level AI Features Plan

## Overview

Building on the existing doc-level AI chat, we're adding three major features:

1. **Project-Level AI Assistant** - Query across ALL docs, but only update current doc
2. **Project-Level Audit** - Analyze all documentation for issues and gaps
3. **Transcription/Paste Input** - Quick doc creation from meetings, observations, opportunities

---

## Architecture Comparison

### Current: Doc-Level AI (✅ Implemented)

```
┌─────────────────────────────────────┐
│ Document Editor                     │
│ ┌───────────────────────────────┐   │
│ │ Tiptap Editor (single doc)    │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ DocChat Sidebar               │   │
│ │ - Context: Current doc only   │   │
│ │ - Can reference other docs    │   │
│ │ - Updates: Current doc only   │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

Use Cases:
✓ "Make this section more concise"
✓ "Fix grammar in this document"
✓ "Add OAuth examples here"
```

### Proposed: Project-Level AI (NEW)

```
┌─────────────────────────────────────┐
│ Project Dashboard                   │
│ ┌───────────────────────────────┐   │
│ │ Project AI Assistant          │   │
│ │ - Context: ALL docs in project│   │
│ │ - Search: Semantic + keyword  │   │
│ │ - Updates: Current doc ONLY   │   │
│ └───────────────────────────────┘   │
│                                     │
│ Open Doc: api/auth.md               │
│ ┌───────────────────────────────┐   │
│ │ Tiptap Editor                 │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

Use Cases:
✓ "What authentication methods do we support?"
  → Searches across api/auth.md, setup.md, architecture.md
  → Shows answer with sources
✓ "Update this doc to match our OAuth flow in setup.md"
  → Reads setup.md for context
  → Proposes changes to CURRENT doc (api/auth.md)
✓ "Find all mentions of API keys across docs"
  → Returns list of docs + excerpts
```

---

## Feature 1: Project-Level AI Assistant

### Key Requirements

1. **Query Across ALL Docs**
   - Semantic search using embeddings
   - Keyword search as fallback
   - Show sources (which docs were referenced)

2. **Only Update Current Open Doc**
   - Even if AI finds issues in other docs, changes only apply to current doc
   - Can suggest "Also update X.md" but requires manual action

3. **Context Window Management**
   - Can't load all docs into context (token limits)
   - Use RAG pattern: retrieve relevant chunks, then answer

### UI Design

#### Option A: Floating Assistant (Recommended)

```
┌─────────────────────────────────────────────────┐
│ [🌟 Project AI]  [Minimize]                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ 👤 User: What auth methods do we support?      │
│                                                 │
│ 🤖 AI: Based on 3 documents:                   │
│                                                 │
│   We support:                                   │
│   1. OAuth 2.0 (api/auth.md)                   │
│   2. API Keys (api/keys.md)                    │
│   3. JWT tokens (architecture.md)              │
│                                                 │
│   📄 Sources:                                   │
│   • api/auth.md (lines 45-67)                  │
│   • api/keys.md (lines 12-34)                  │
│   • architecture.md (lines 89-102)             │
│                                                 │
│   [View All Sources] [Update Current Doc]      │
│                                                 │
│ [Type question about the project...]    [Send] │
└─────────────────────────────────────────────────┘

Position: Floating button in bottom right
Can be opened from any page
Persists across navigation
```

#### Option B: Dashboard Widget

```
┌─────────────────────────────────────┐
│ Project: Vortex AI                  │
├─────────────────────────────────────┤
│ [Documents] [AI Assistant] [Audit]  │
│                                     │
│ AI Assistant Tab:                   │
│ - Chat interface                    │
│ - Search bar for docs               │
│ - Recent queries                    │
│ - Suggested actions                 │
└─────────────────────────────────────┘
```

### Technical Implementation

#### Database Schema (Already Exists)

```prisma
model Embedding {
  id          String   @id @default(cuid())
  documentId  String
  chunkIndex  Int
  chunkText   String   @db.Text
  embedding   String   @db.Text  // JSON array
  model       String   @default("text-embedding-3-small")
  dimensions  Int      @default(1536)
}

model Analysis {
  id             String   @id @default(cuid())
  documentId     String
  analysisType   String   // "freshness", "completeness", etc.
  result         Json
  score          Float
  recommendations Json?
}
```

#### API Endpoints

**POST /api/ai/project-chat**
```typescript
{
  projectId: string;
  message: string;
  currentDocPath?: string;  // If user is viewing a specific doc
  conversationHistory?: Message[];
}

Response:
{
  message: string;
  sources: Array<{
    documentPath: string;
    excerpt: string;
    lines: string;
    relevance: number;
  }>;
  suggestions?: Array<{
    title: string;
    documentPath: string;  // Only current doc
    content: string;
  }>;
}
```

#### RAG Pipeline

```typescript
// lib/ai/project-assistant.ts

export async function queryProject(
  projectId: string,
  query: string,
  currentDocPath?: string
) {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Vector search for relevant chunks
  const relevantChunks = await searchEmbeddings(
    projectId,
    queryEmbedding,
    topK: 10
  );

  // 3. Load full docs for top matches
  const relevantDocs = await loadDocuments(
    relevantChunks.map(c => c.documentId)
  );

  // 4. Build context for Claude
  const context = buildProjectContext(
    relevantDocs,
    relevantChunks,
    currentDocPath
  );

  // 5. Query Claude with context
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    system: PROJECT_ASSISTANT_PROMPT,
    messages: [
      {
        role: 'user',
        content: `
Project Context:
${context}

Current Document: ${currentDocPath || 'None (viewing dashboard)'}

User Question: ${query}

Please answer the question using the provided context.
If suggesting changes, ONLY propose changes to the current document.
Always cite your sources.
`
      }
    ]
  });

  // 6. Parse response and extract sources
  return parseResponse(response);
}
```

#### Embedding Generation

```typescript
// lib/embeddings.ts

export async function generateDocumentEmbeddings(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId }});

  // Split into chunks (500 tokens each with 100 token overlap)
  const chunks = splitIntoChunks(doc.content, {
    chunkSize: 500,
    overlap: 100,
  });

  // Generate embeddings for each chunk
  const embeddings = await Promise.all(
    chunks.map(async (chunk, index) => {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.text,
      });

      return {
        documentId,
        chunkIndex: index,
        chunkText: chunk.text,
        embedding: JSON.stringify(embedding.data[0].embedding),
        model: 'text-embedding-3-small',
        dimensions: 1536,
      };
    })
  );

  // Bulk insert
  await prisma.embedding.createMany({ data: embeddings });
}

export async function searchEmbeddings(
  projectId: string,
  queryEmbedding: number[],
  topK: number = 10
) {
  // Fetch all embeddings for project (optimize with pgvector later)
  const docs = await prisma.document.findMany({
    where: { projectId },
    include: { embeddings: true },
  });

  // Calculate cosine similarity
  const results = [];
  for (const doc of docs) {
    for (const emb of doc.embeddings) {
      const embedding = JSON.parse(emb.embedding);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      results.push({
        documentId: doc.id,
        documentPath: doc.path,
        chunkIndex: emb.chunkIndex,
        chunkText: emb.chunkText,
        similarity,
      });
    }
  }

  // Sort by similarity and return top K
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
```

---

## Feature 2: Project-Level Audit

### What It Does

Analyzes ALL documents in a project and generates a comprehensive audit report:

- **Freshness Analysis**: Which docs are outdated?
- **Completeness Check**: Missing sections, incomplete content
- **Consistency Scan**: Contradictions between documents
- **Broken References**: Links to non-existent docs
- **Risk Assessment**: Critical docs with high risk scores
- **Duplicate Detection**: Redundant information across docs

### UI Design

```
┌─────────────────────────────────────────────────┐
│ Project Audit Report                            │
│ Generated: Jan 24, 2026 2:45 PM                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📊 Overall Health: 72/100                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                 │
│ 🔴 Critical Issues (3)                          │
│ ───────────────────────────────────────────────│
│ ⚠️ api/auth.md contradicts architecture.md     │
│    Lines 45-67 describe OAuth flow differently │
│    [View Conflict] [Resolve]                   │
│                                                 │
│ ⚠️ setup.md is severely outdated                │
│    Last updated 180 days ago, references v1.0  │
│    [Update Document]                            │
│                                                 │
│ ⚠️ Missing critical section in architecture.md │
│    No security section found                    │
│    [Add Section]                                │
│                                                 │
│ 🟡 Warnings (7)                                 │
│ ───────────────────────────────────────────────│
│ • api/keys.md has ambiguous statements          │
│ • deployment.md references broken link          │
│ • README.md missing examples section            │
│ [View All Warnings]                             │
│                                                 │
│ 📈 Freshness Scores                             │
│ ───────────────────────────────────────────────│
│ api/auth.md      ████████░░ 80%  ✅ Fresh      │
│ architecture.md  ██████░░░░ 60%  ⚠️ Aging      │
│ setup.md         ███░░░░░░░ 30%  🔴 Stale      │
│ [View All Docs]                                 │
│                                                 │
│ 🔍 Detected Conflicts (2)                       │
│ ───────────────────────────────────────────────│
│ 1. OAuth flow described differently in:         │
│    • api/auth.md (lines 45-67)                 │
│    • architecture.md (lines 89-102)            │
│    [View Diff] [Resolve]                       │
│                                                 │
│ 📋 Action Items                                 │
│ ───────────────────────────────────────────────│
│ ☐ Update setup.md with latest setup steps      │
│ ☐ Resolve OAuth flow conflict                  │
│ ☐ Add security section to architecture.md      │
│ ☐ Fix broken link in deployment.md             │
│                                                 │
│ [Run Full Audit Again] [Export Report]         │
└─────────────────────────────────────────────────┘
```

### Technical Implementation

#### API Endpoint

**POST /api/ai/audit/run**
```typescript
{
  projectId: string;
  analysisTypes?: string[];  // Optional: run specific analyses
}

Response:
{
  overallHealth: number;  // 0-100
  criticalIssues: Issue[];
  warnings: Issue[];
  freshnessScores: Record<documentPath, number>;
  conflicts: Conflict[];
  actionItems: ActionItem[];
  completedAt: string;
}
```

#### Audit Pipeline

```typescript
// lib/ai/audit.ts

export async function runProjectAudit(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { docs: true },
  });

  // Run analyses in parallel
  const [
    freshnessAnalysis,
    completenessAnalysis,
    consistencyAnalysis,
    brokenLinksAnalysis,
  ] = await Promise.all([
    analyzeFreshness(project.docs),
    analyzeCompleteness(project.docs),
    analyzeConsistency(project.docs),
    analyzeBrokenLinks(project.docs),
  ]);

  // Aggregate results
  const issues = [
    ...freshnessAnalysis.issues,
    ...completenessAnalysis.issues,
    ...consistencyAnalysis.issues,
    ...brokenLinksAnalysis.issues,
  ];

  // Calculate overall health
  const overallHealth = calculateOverallHealth(issues, project.docs.length);

  // Store audit results
  await prisma.auditLog.create({
    data: {
      entityType: 'project',
      entityId: projectId,
      action: 'audit',
      actorType: 'system',
      changes: {
        overallHealth,
        issueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
      },
    },
  });

  return {
    overallHealth,
    criticalIssues: issues.filter(i => i.severity === 'critical'),
    warnings: issues.filter(i => i.severity === 'warning'),
    freshnessScores: freshnessAnalysis.scores,
    conflicts: consistencyAnalysis.conflicts,
    actionItems: generateActionItems(issues),
  };
}
```

#### Specific Analyses

```typescript
// Freshness Analysis
async function analyzeFreshness(docs: Document[]) {
  const now = new Date();
  const scores: Record<string, number> = {};
  const issues: Issue[] = [];

  for (const doc of docs) {
    const daysSinceUpdate = (now.getTime() - doc.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    let score = 1.0;
    if (daysSinceUpdate > 180) score = 0.3;  // Very stale
    else if (daysSinceUpdate > 90) score = 0.6;  // Aging
    else if (daysSinceUpdate > 30) score = 0.8;  // Fresh

    scores[doc.path] = score;

    if (score < 0.5) {
      issues.push({
        severity: score < 0.4 ? 'critical' : 'warning',
        type: 'stale_content',
        documentPath: doc.path,
        message: `Document is ${Math.floor(daysSinceUpdate)} days old`,
        suggestion: 'Review and update content',
      });
    }
  }

  return { scores, issues };
}

// Consistency Analysis (AI-powered)
async function analyzeConsistency(docs: Document[]) {
  // Use Claude to find contradictions
  const prompt = `
Analyze these documents for contradictions and inconsistencies:

${docs.map(d => `
## ${d.path}
${d.content}
`).join('\n\n---\n\n')}

Find:
1. Contradictory statements
2. Inconsistent terminology
3. Different descriptions of the same concept

Return JSON: { conflicts: [{type, documents, description, severity}] }
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',  // Cheaper model for batch analysis
    messages: [{ role: 'user', content: prompt }],
  });

  const conflicts = parseConflicts(response.content);

  return { conflicts, issues: conflictsToIssues(conflicts) };
}
```

---

## Feature 3: Transcription/Paste Input for Doc Creation

### What It Does

Quick way to create documentation from:
- Meeting transcripts
- Voice notes (via transcription)
- Observations
- Opportunities
- Pasted text from anywhere

AI processes the input and:
1. Suggests document path and title
2. Extracts structure (headings, sections)
3. Formats content appropriately
4. Identifies document type (meeting notes, technical doc, etc.)

### UI Design

```
┌─────────────────────────────────────────────────┐
│ 📝 Quick Doc Creator                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Paste Text] [Upload File] [Voice Record]      │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Paste your content here...                  │ │
│ │                                             │ │
│ │ (Meeting notes, observations, transcripts)  │ │
│ │                                             │ │
│ │                                             │ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Process with AI] ←                             │
│                                                 │
│ After processing:                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 AI Suggestions                           │ │
│ │                                             │ │
│ │ Document Type: Meeting Notes                │ │
│ │ Suggested Path: meetings/2026-01-24.md      │ │
│ │ Title: API Redesign Discussion              │ │
│ │                                             │ │
│ │ Extracted Structure:                        │ │
│ │ ✓ Participants                              │ │
│ │ ✓ Agenda                                    │ │
│ │ ✓ Discussion Points                         │ │
│ │ ✓ Action Items                              │ │
│ │ ✓ Next Steps                                │ │
│ │                                             │ │
│ │ [Preview] [Edit Path] [Create Document]    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Example Transformations

#### Input: Meeting Transcript

```
hey everyone so we met today to discuss the api redesign
john suggested we move to rest instead of graphql
sarah mentioned security concerns with the current auth flow
we need to update the docs by next week
action items: john will prototype the new endpoints
sarah will review security implications
```

#### AI Output:

```markdown
# API Redesign Discussion

**Date:** January 24, 2026
**Type:** Meeting Notes

## Participants
- John
- Sarah

## Discussion Points

### API Architecture
- **Decision:** Move from GraphQL to REST
- **Proposed by:** John

### Security Concerns
- **Issue:** Current authentication flow has security concerns
- **Raised by:** Sarah
- **Status:** Under review

## Action Items

- [ ] **John:** Prototype new REST endpoints
- [ ] **Sarah:** Review security implications of proposed changes
- [ ] **Team:** Update documentation by next week

## Next Steps
- Complete prototyping
- Security review
- Documentation update

**Status:** In Progress
**Due Date:** January 31, 2026
```

### Technical Implementation

#### API Endpoint

**POST /api/ai/create-from-text**
```typescript
{
  projectId: string;
  rawText: string;
  hint?: string;  // Optional: "meeting notes", "observation", etc.
}

Response:
{
  suggestedPath: string;
  suggestedTitle: string;
  documentType: string;
  formattedContent: string;
  extractedMetadata: {
    date?: string;
    participants?: string[];
    tags?: string[];
    priority?: string;
  };
}
```

#### Processing Pipeline

```typescript
// lib/ai/quick-doc-creator.ts

export async function processTextToDocument(
  projectId: string,
  rawText: string,
  hint?: string
) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    system: QUICK_DOC_CREATOR_PROMPT,
    messages: [
      {
        role: 'user',
        content: `
Convert this text into structured documentation:

${rawText}

${hint ? `Hint: This is ${hint}` : ''}

Return JSON with:
- documentType: string
- suggestedPath: string
- suggestedTitle: string
- formattedContent: string (markdown)
- extractedMetadata: object
`
      }
    ]
  });

  const result = parseJSON(response.content);

  return result;
}
```

#### System Prompt

```typescript
const QUICK_DOC_CREATOR_PROMPT = `
You are a documentation expert that converts raw text into structured markdown documents.

Your tasks:
1. Identify document type (meeting notes, observation, opportunity, technical doc, etc.)
2. Suggest appropriate file path (e.g., meetings/2026-01-24.md, observations/user-feedback.md)
3. Extract structure and create markdown headings
4. Format content professionally
5. Extract metadata (dates, participants, tags, etc.)

Document Type Guidelines:
- Meeting Notes: Include participants, agenda, discussion, action items
- Observations: Include context, findings, insights, recommendations
- Opportunities: Include description, potential impact, next steps
- Technical Docs: Include overview, details, examples, references

Always return valid JSON with formattedContent as a properly formatted markdown string.
`;
```

---

## Implementation Phases

### Phase 1: Project-Level AI Assistant (Week 1-2)

**Week 1:**
- [ ] Set up embedding generation pipeline
- [ ] Create vector search functionality
- [ ] Build RAG context builder
- [ ] Implement project chat API endpoint

**Week 2:**
- [ ] Build floating assistant UI component
- [ ] Add source citation display
- [ ] Integrate with existing doc editor
- [ ] Test with real project data

### Phase 2: Project-Level Audit (Week 3)

**Week 3:**
- [ ] Implement freshness analysis
- [ ] Build completeness checker
- [ ] Create consistency analyzer (AI-powered)
- [ ] Implement broken link detection
- [ ] Build audit report UI
- [ ] Add action item tracking

### Phase 3: Quick Doc Creator (Week 4)

**Week 4:**
- [ ] Build text processing pipeline
- [ ] Create AI prompt for document structuring
- [ ] Implement metadata extraction
- [ ] Build quick creator UI
- [ ] Add voice recording support (optional)
- [ ] Test with various input types

---

## Cost Estimation

### Embeddings
- Model: text-embedding-3-small
- Cost: $0.02 per 1M tokens
- Average doc: 2,000 tokens
- 100 docs = 200,000 tokens = **$0.004**
- Re-embedding after updates: ~$0.01/month for active project

### Project AI Assistant
- Model: Claude Opus 4.5 for queries
- Input: 10,000 tokens (context) + 100 tokens (query)
- Output: 500 tokens (response)
- Cost per query: ~$0.15
- 50 queries/day = **$7.50/day** = **$225/month**

### Audit
- Model: Claude Sonnet 4 (cheaper, batch analysis)
- Input: 50,000 tokens (all docs)
- Output: 2,000 tokens (report)
- Cost per audit: ~$0.15
- Weekly audits: **$0.60/month**

### Quick Doc Creator
- Model: Claude Opus 4.5
- Input: 2,000 tokens (raw text)
- Output: 1,500 tokens (formatted doc)
- Cost per doc: ~$0.03
- 20 docs/month = **$0.60/month**

**Total Estimated Cost: $230-250/month for active use**

---

## Key Decisions

### ✅ Recommended Approach

1. **Project AI Assistant**
   - Floating button (accessible everywhere)
   - RAG with embeddings
   - Claude Opus for accuracy
   - Sources always cited

2. **Audit**
   - Weekly automatic runs
   - On-demand manual runs
   - Email notifications for critical issues
   - Dashboard widget showing health score

3. **Quick Creator**
   - Modal dialog from any page
   - Paste, upload, or record
   - AI suggests path and structure
   - Preview before creating

### ⚠️ Open Questions

1. **Embedding Storage**: Use PostgreSQL now, migrate to pgvector later?
2. **Voice Recording**: Include in Phase 3 or defer to Phase 4?
3. **Audit Frequency**: Weekly automatic, or only on-demand?
4. **Project AI Scope**: All docs at once, or paginated results?

---

## Success Metrics

### Project AI Assistant
- Query response time < 3s
- Source citation accuracy > 90%
- User satisfaction score > 4/5
- Queries per active user > 10/week

### Audit
- Issue detection accuracy > 85%
- False positive rate < 15%
- Time to run audit < 30s for 100 docs
- Action item completion rate > 50%

### Quick Doc Creator
- Doc creation time < 1 min
- Structure accuracy > 80%
- User adoption rate > 30%
- Docs created per week > 5

---

## Next Steps

1. **Approve architecture** - Review and approve this plan
2. **Set up embeddings** - Start with Phase 1 embedding generation
3. **Build Project AI Assistant** - 2-week sprint
4. **Launch beta** - Test with real users
5. **Iterate based on feedback**
6. **Roll out Audit and Quick Creator**

**Should we proceed with Phase 1: Project-Level AI Assistant?**
