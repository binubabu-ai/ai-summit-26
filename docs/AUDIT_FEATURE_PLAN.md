# Audit Feature Implementation Plan

## Overview

A comprehensive, AI-powered audit system that analyzes documentation quality, consistency, security, and completeness at multiple levels: Dashboard, Project, and Document.

## Architecture

### Three-Tier Audit System

```
┌─────────────────────────────────────────────────────┐
│ Dashboard Audit                                     │
│ • Portfolio-wide health score                       │
│ • Cross-project consistency                         │
│ • Global security issues                            │
│ • Team performance metrics                          │
└─────────────────────────────────────────────────────┘
           │
           ├──────────────────────────────────────────┐
           │                                          │
┌──────────────────────┐          ┌──────────────────────┐
│ Project Audit        │          │ Project Audit        │
│ • Project health     │          │ • Project health     │
│ • Doc consistency    │          │ • Doc consistency    │
│ • Team issues        │          │ • Team issues        │
└──────────────────────┘          └──────────────────────┘
           │                                          │
           ├──────────┬──────────┐                   │
           │          │          │                   │
     ┌─────────┐ ┌─────────┐ ┌─────────┐           │
     │ Doc     │ │ Doc     │ │ Doc     │           │
     │ Audit   │ │ Audit   │ │ Audit   │           │
     └─────────┘ └─────────┘ └─────────┘           │
```

## Audit Levels

### 1. Dashboard-Level Audit

**Location**: `/dashboard`

**Scope**: All projects owned or accessible by the user

**Metrics**:
- **Portfolio Health Score** (0-100)
- **Projects at Risk** (outdated, inconsistent)
- **Security Issues** (exposed secrets, permissions)
- **Cross-Project Consistency** (naming conventions, structure)
- **Team Collaboration Health** (activity, responsiveness)
- **AI Usage Statistics** (revisions, suggestions, approvals)

**UI Position**: Top-right corner of dashboard

```
┌─────────────────────────────────────────────┐
│  Dashboard                    [Refresh Icon]│
│  Last audited: 2 minutes ago                │
├─────────────────────────────────────────────┤
│                                             │
│  Portfolio Health:  85/100  [View Report]   │
│  Projects at Risk:  2/10                    │
│  Security Issues:   1 Critical              │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Project-Level Audit

**Location**: `/projects/[slug]` (Overview tab)

**Scope**: Single project with all its documents

**Metrics**:
- **Project Health Score** (0-100)
- **Documentation Coverage** (% of features documented)
- **Consistency Score** (naming, formatting, structure)
- **Freshness Score** (outdated content detection)
- **Collaboration Health** (team activity, review velocity)
- **Technical Debt** (TODOs, FIXMEs, deprecated code)
- **Broken Links** (internal/external references)
- **Conflicting Information** (contradictions across docs)

**UI Position**: Project overview page, top section

```
┌─────────────────────────────────────────────┐
│  Project: Vortex AI       [Refresh Icon]    │
│  Last audited: 5 minutes ago                │
├─────────────────────────────────────────────┤
│                                             │
│  Health Score:     92/100   [View Details]  │
│                                             │
│  Coverage:         85%      23/27 docs      │
│  Freshness:        Good     2 outdated      │
│  Consistency:      88%      3 issues        │
│  Broken Links:     2 found                  │
│                                             │
│  [View Full Audit Report]                   │
└─────────────────────────────────────────────┘
```

### 3. Document-Level Audit

**Location**: `/projects/[slug]/docs/[...path]`

**Scope**: Single document

**Metrics**:
- **Quality Score** (0-100)
- **Readability** (Flesch-Kincaid, complexity)
- **Completeness** (missing sections, TODOs)
- **Grammar & Style** (spelling, grammar issues)
- **Consistency** (with project standards)
- **Accuracy** (fact-checking against codebase)
- **Freshness** (last updated, staleness indicators)
- **Links** (broken internal/external links)
- **Code Examples** (outdated, errors)

**UI Position**: Document editor page, sidebar or top panel

```
┌─────────────────────────────────────────────┐
│  Document Audit         [Refresh Icon]      │
│  Last audited: 1 minute ago                 │
├─────────────────────────────────────────────┤
│                                             │
│  Quality Score:   78/100                    │
│                                             │
│  Readability:     Grade 9   Good            │
│  Completeness:    85%       3 TODOs         │
│  Grammar:         2 issues  [Fix All]       │
│  Broken Links:    1 found   [Fix]           │
│  Freshness:       14 days old Warning       │
│                                             │
│  Suggestions (4):                           │
│  • Add code example in "Setup" section      │
│  • Fix broken link to /api/endpoints        │
│  • Update version number (mentions v1.0)    │
│  • Simplify paragraph in "Overview"         │
│                                             │
│  [Apply All Suggestions]  [View Report]     │
└─────────────────────────────────────────────┘
```

## Data Model

### Audit Schema

```typescript
// prisma/schema.model
model Audit {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())

  // Polymorphic - can be dashboard, project, or document
  auditType   String   // 'dashboard' | 'project' | 'document'
  targetId    String?  // null for dashboard, project/document ID otherwise

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Scores (0-100)
  healthScore       Int
  consistencyScore  Int?
  freshnessScore    Int?
  qualityScore      Int?

  // Findings
  findings   Json     // Array of AuditFinding

  // Metadata
  duration   Int      // milliseconds
  aiModel    String   // e.g., "gemini-2.5-pro"
  cost       Float    // USD
}

interface AuditFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'consistency' | 'quality' | 'freshness' | 'links' | 'grammar';
  title: string;
  description: string;
  location?: {
    documentId?: string;
    lineNumber?: number;
    section?: string;
  };
  suggestion?: string;
  autoFixable: boolean;
}
```

## API Endpoints

### Dashboard Audit

```typescript
POST /api/audit/dashboard
// Runs audit on all user's projects
// Returns: { auditId, healthScore, findings[], runTime }
```

### Project Audit

```typescript
POST /api/audit/project
Body: { projectId }
// Runs audit on single project and all its documents
// Returns: { auditId, healthScore, findings[], runTime }
```

### Document Audit

```typescript
POST /api/audit/document
Body: { documentId }
// Runs audit on single document
// Returns: { auditId, qualityScore, findings[], runTime }
```

### Get Audit Results

```typescript
GET /api/audit/:auditId
// Returns: Full audit results
```

### Apply Suggestion

```typescript
POST /api/audit/apply-fix
Body: { auditId, findingId }
// Applies an auto-fixable suggestion
// Returns: { success, updatedContent }
```

## AI-Powered Analysis

### Gemini Integration

Use `gemini-2.5-pro` for comprehensive analysis:

```typescript
// lib/ai/audit.ts

export async function auditDocument(document: Document) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',  // Best for complex reasoning
    systemInstruction: AUDIT_SYSTEM_PROMPT,
  });

  const prompt = `
Audit this technical document for quality, accuracy, and completeness.

Document Title: ${document.title}
Document Path: ${document.path}
Last Updated: ${document.updatedAt}

Content:
\`\`\`markdown
${document.content}
\`\`\`

Analyze for:
1. Readability (grade level, complexity)
2. Completeness (missing sections, TODOs)
3. Grammar & spelling
4. Consistency with project standards
5. Accuracy (fact-checking)
6. Freshness (outdated information)
7. Broken links
8. Code examples (errors, outdated syntax)

Return JSON:
{
  "qualityScore": 0-100,
  "readability": {
    "gradeLevel": number,
    "complexity": "low" | "medium" | "high",
    "score": string
  },
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "category": string,
      "title": string,
      "description": string,
      "lineNumber": number,
      "suggestion": string,
      "autoFixable": boolean
    }
  ],
  "suggestions": {
    "addSections": string[],
    "improveSections": string[],
    "fixLinks": string[]
  }
}
`;

  const result = await model.generateContent(prompt);
  return parseAuditResponse(result.response.text());
}
```

### Audit System Prompts

```typescript
const AUDIT_SYSTEM_PROMPT = `You are an expert documentation auditor and technical writer.

Your role:
- Analyze documentation for quality, accuracy, and completeness
- Identify issues with different severity levels
- Provide actionable suggestions for improvement
- Check for consistency with best practices
- Detect outdated or inaccurate information
- Evaluate readability for target audience

Guidelines:
- Be thorough but concise in findings
- Prioritize by severity (critical > high > medium > low)
- Provide specific line numbers when possible
- Suggest auto-fixable solutions when applicable
- Consider technical accuracy and clarity
- Flag security issues immediately
`;
```

## UI Components

### Audit Card Component

```typescript
// components/audit/AuditCard.tsx

interface AuditCardProps {
  level: 'dashboard' | 'project' | 'document';
  auditData?: AuditResult;
  onRefresh: () => Promise<void>;
  loading?: boolean;
}

export function AuditCard({ level, auditData, onRefresh, loading }: AuditCardProps) {
  return (
    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-black dark:text-white">
            {level.charAt(0).toUpperCase() + level.slice(1)} Audit
          </h3>
          {auditData && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Last audited: {formatDistanceToNow(auditData.createdAt)} ago
            </p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          {loading ? (
            <Loader size="sm" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
        </button>
      </div>

      {auditData && (
        <div className="space-y-4">
          <HealthScore score={auditData.healthScore} />
          <FindingsList findings={auditData.findings} />
          <Link href={`/audit/${auditData.id}`} className="text-sm text-black dark:text-white hover:underline">
            View Full Report →
          </Link>
        </div>
      )}
    </div>
  );
}
```

### Health Score Component

```typescript
// components/audit/HealthScore.tsx

export function HealthScore({ score }: { score: number }) {
  const color = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200 dark:text-neutral-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${score * 2.827} 282.7`}
            className={`text-${color}-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-black dark:text-white">{score}/100</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Health Score</div>
      </div>
    </div>
  );
}
```

## Refresh Functionality

### Auto-Refresh Strategy

```typescript
// Stale times for each level
const STALE_TIMES = {
  dashboard: 5 * 60 * 1000,  // 5 minutes
  project: 10 * 60 * 1000,   // 10 minutes
  document: 2 * 60 * 1000,   // 2 minutes
};

// Auto-refresh when data becomes stale
useEffect(() => {
  if (!auditData) return;

  const age = Date.now() - new Date(auditData.createdAt).getTime();
  const staleTime = STALE_TIMES[level];

  if (age > staleTime) {
    // Show "Data may be outdated" badge
    setIsStale(true);
  }
}, [auditData, level]);
```

### Manual Refresh

```typescript
const handleRefresh = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`/api/audit/${level}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: level === 'dashboard' ? undefined : targetId,
      }),
    });

    if (!response.ok) {
      throw new Error('Audit failed');
    }

    const result = await response.json();
    setAuditData(result);
    setIsStale(false);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Auto-Fix Feature

### Fixable Issues

```typescript
// Issues that can be automatically fixed
const AUTO_FIXABLE_ISSUES = {
  brokenLinks: async (finding: AuditFinding) => {
    // Update broken links with corrected versions
  },
  grammarErrors: async (finding: AuditFinding) => {
    // Apply grammar corrections
  },
  outdatedVersions: async (finding: AuditFinding) => {
    // Update version numbers
  },
  missingCodeExamples: async (finding: AuditFinding) => {
    // Generate code examples using AI
  },
};
```

### Apply Fix Flow

```typescript
const applyFix = async (finding: AuditFinding) => {
  if (!finding.autoFixable) return;

  setFixing(finding.id);

  try {
    const response = await fetch('/api/audit/apply-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditId: auditData.id,
        findingId: finding.id,
      }),
    });

    if (!response.ok) {
      throw new Error('Fix failed');
    }

    // Refresh audit data
    await handleRefresh();
  } catch (err) {
    setError(err.message);
  } finally {
    setFixing(null);
  }
};
```

## Detailed Audit Report Page

### Route: `/audit/[auditId]`

Full-page audit report with:
- Executive summary
- Detailed findings by category
- Trend charts (if historical data available)
- Action items prioritized by severity
- Export options (PDF, JSON)

```
┌─────────────────────────────────────────────────────┐
│ Audit Report: Vortex AI                             │
│ Ran: 2026-01-24 at 10:30 AM                         │
│ Duration: 12.4s  Cost: $0.08                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Executive Summary                                   │
│ ━━━━━━━━━━━━━━━━━                                   │
│ Health Score: 92/100  (Good)                        │
│                                                     │
│ Critical Issues:  0                                 │
│ High Priority:    3                                 │
│ Medium Priority:  7                                 │
│ Low Priority:     12                                │
│                                                     │
│ [Export PDF]  [Export JSON]  [Schedule Recurring]   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Findings by Category                                │
│ ━━━━━━━━━━━━━━━━━━━━                                │
│                                                     │
│ High Priority (3)                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │  Broken Link in API Reference              │   │
│ │  docs/api-reference.md:42                   │   │
│ │  Link to "/api/v2/users" returns 404        │   │
│ │  [Auto-Fix]  [Ignore]                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Medium Priority (7)                                 │
│ ... (collapsed by default)                          │
│                                                     │
│ Low Priority (12)                                   │
│ ... (collapsed by default)                          │
└─────────────────────────────────────────────────────┘
```

## Performance Considerations

### Caching Strategy

```typescript
// Cache audit results for 2 minutes
const CACHE_TTL = 2 * 60 * 1000;

// Use TanStack Query
const { data: auditData, refetch } = useQuery({
  queryKey: ['audit', level, targetId],
  queryFn: () => fetchAudit(level, targetId),
  staleTime: CACHE_TTL,
  cacheTime: 5 * 60 * 1000,  // Keep in cache for 5 minutes
});
```

### Background Processing

- Run audits in background workers
- Stream progress updates via WebSockets
- Queue multiple audit requests
- Rate limit to prevent abuse

## Testing

- Unit tests for each audit category
- Integration tests for API endpoints
- E2E tests for UI flows
- Load testing for concurrent audits
- Accuracy testing against known good/bad docs

## Future Enhancements

1. **Scheduled Audits**: Run audits on a schedule (daily, weekly)
2. **Audit History**: Track health score over time with charts
3. **Benchmarking**: Compare against industry standards
4. **Custom Rules**: Allow users to define custom audit rules
5. **Webhooks**: Notify on critical findings
6. **Collaboration**: Assign findings to team members
7. **AI Learning**: Improve suggestions based on user feedback

## Success Metrics

- **Audit Adoption**: % of projects with at least one audit run
- **Health Improvement**: Average health score increase over time
- **Auto-Fix Usage**: % of fixable issues that are auto-fixed
- **Time to Fix**: Average time from finding to resolution
- **User Satisfaction**: Rating of audit quality and usefulness
