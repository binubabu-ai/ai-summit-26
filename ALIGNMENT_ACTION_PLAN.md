# Web App & CLI Alignment Action Plan

**Status:** Critical Priority
**Created:** 2026-01-27
**Audit Report:** See comprehensive audit above

---

## Executive Summary

The Next.js web app and Docjays CLI package are **fundamentally misaligned** in their approach to documentation management. They use different data models, authentication systems, and have no integration path. This creates **four critical problems**:

1. **No Single Source of Truth** - Documents can exist in both systems with conflicting states
2. **Authentication Incompatibility** - CLI cannot authenticate against web app MCP endpoint
3. **Lost Metadata** - Grounding status, quality scores lost when syncing from CLI sources
4. **Workflow Conflicts** - Users cannot seamlessly work across both systems

**Impact:** Users attempting to use both will experience confusion, data loss, and broken workflows.

**Solution:** Create a **unified architecture** with bidirectional sync, shared authentication, and a single conceptual model.

---

## 🎯 Strategic Direction

### Option A: Web App as Primary (Recommended)

**Philosophy:** Web app is source of truth; CLI becomes a sync/access tool

```
Documents in Database → CLI syncs FROM web app → Local cache for offline work
```

**Benefits:**
- Preserves grounding state, quality scores, team collaboration
- Clear ownership model
- No loss of metadata
- Existing web app features remain intact

**CLI Changes:**
- Add command: `docjays connect <project-url> --api-key <key>`
- Add command: `docjays pull` (sync from web app to local)
- Add command: `docjays push` (propose changes back to web app)
- MCP server reads from local cache OR proxies to web app

### Option B: CLI as Primary

**Philosophy:** CLI manages sources; web app imports and adds metadata

```
Sources (git/http/local) → CLI syncs → Web app imports → Adds grounding/metadata
```

**Benefits:**
- Preserves existing CLI workflow
- Source management remains in CLI
- Clear separation: CLI = sync, Web = governance

**Challenges:**
- Web app needs full Source model implementation
- Risk of metadata loss on re-sync
- More complex bidirectional sync logic

### Option C: Hybrid (Most Complex)

**Philosophy:** Both are peers; explicit merge workflow

```
CLI Sources ←sync→ Web App Documents (with conflict resolution UI)
```

**Not Recommended:** Complexity outweighs benefits for most use cases.

---

## 🚀 Phase 1: Foundation (Week 1-2)

### Goal: Enable Basic Integration

#### 1.1 Unified Authentication

**Problem:** CLI cannot authenticate against web app MCP endpoint

**Solution:**
- [ ] Extend API key format to support CLI operations
- [ ] Add CLI authentication command: `docjays auth connect`
- [ ] Store API key in CLI keystore (encrypted)
- [ ] Update CLI MCP server to use API key when connecting to web

**Implementation:**
```typescript
// CLI: src/cli/commands/connect.ts
async execute(url: string, apiKey: string) {
  // Validate API key against web app
  const response = await fetch(`${url}/api/mcp`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  // Store in keystore
  await this.keyStore.add('web-app-key', apiKey, KeyType.API_KEY, password);

  // Save connection config
  await this.configManager.update({ webApp: { url, connected: true } });
}
```

**Web App Changes:**
```typescript
// lib/api-keys.ts - Add CLI permissions
const PERMISSIONS = {
  cli: {
    sync_documents: true,
    propose_changes: true,
    read_grounding: true
  }
};
```

**Files to Modify:**
- `packages/docjays-cli/src/cli/commands/connect.ts` (NEW)
- `packages/docjays-cli/src/types/index.ts` (add webApp config)
- `lib/api-keys.ts` (add CLI permission model)
- `app/api/mcp/route.ts` (accept CLI-specific requests)

---

#### 1.2 Document Sync Model

**Problem:** No data model mapping between systems

**Solution:** Create shared TypeScript types

```typescript
// packages/shared-types/src/index.ts (NEW PACKAGE)

export interface SyncableDocument {
  id: string;
  path: string;
  content: string;

  // Web app metadata (optional for CLI)
  groundingState?: 'ungrounded' | 'in_progress' | 'grounded' | 'review_needed';
  freshnessScore?: number;
  riskScore?: number;
  mainRevisionId?: string;

  // CLI metadata (optional for web)
  sourceName?: string;
  sourceType?: 'git' | 'http' | 'local';
  lastSyncedAt?: string;

  // Shared
  updatedAt: string;
  createdAt: string;
}

export interface SyncRequest {
  operation: 'pull' | 'push' | 'status';
  documents?: SyncableDocument[];
  since?: string; // ISO timestamp for incremental sync
}

export interface SyncResponse {
  success: boolean;
  conflicts?: ConflictInfo[];
  documents?: SyncableDocument[];
  metadata: {
    totalDocuments: number;
    syncedDocuments: number;
    conflictCount: number;
  };
}
```

**Files to Create:**
- `packages/shared-types/package.json`
- `packages/shared-types/src/index.ts`
- `packages/shared-types/tsconfig.json`

**Files to Update:**
- Root `package.json` (add to workspaces)
- `packages/docjays-cli/package.json` (add dependency)
- `package.json` (web app - add dependency)

---

#### 1.3 Sync API Endpoint

**Problem:** No web app endpoint for CLI sync

**Solution:** Create `/api/cli/sync` endpoint

```typescript
// app/api/cli/sync/route.ts (NEW)
import { SyncRequest, SyncResponse } from '@ai-summit/shared-types';

export async function POST(request: Request) {
  const apiKey = extractApiKey(request);
  const project = await validateApiKey(apiKey);

  const body: SyncRequest = await request.json();

  switch (body.operation) {
    case 'pull':
      return pullDocuments(project.id, body.since);
    case 'push':
      return pushDocuments(project.id, body.documents);
    case 'status':
      return getSyncStatus(project.id, body.since);
  }
}

async function pullDocuments(projectId: string, since?: string) {
  const documents = await prisma.document.findMany({
    where: {
      projectId,
      updatedAt: since ? { gte: new Date(since) } : undefined
    },
    include: {
      mainRevision: true
    }
  });

  return Response.json({
    success: true,
    documents: documents.map(doc => ({
      id: doc.id,
      path: doc.path,
      content: doc.mainRevision?.content || doc.content,
      groundingState: doc.groundingState,
      freshnessScore: doc.freshnessScore,
      updatedAt: doc.updatedAt.toISOString()
    }))
  });
}

async function pushDocuments(projectId: string, documents: SyncableDocument[]) {
  // Create proposals for each changed document
  const proposals = [];

  for (const doc of documents) {
    const existing = await prisma.document.findFirst({
      where: { projectId, path: doc.path }
    });

    if (!existing) {
      // Create new document
      await prisma.document.create({
        data: {
          path: doc.path,
          content: doc.content,
          projectId,
          groundingState: 'ungrounded',
          uploadState: 'uploaded'
        }
      });
    } else {
      // Create revision proposal
      const proposal = await prisma.revision.create({
        data: {
          documentId: existing.id,
          content: doc.content,
          status: 'proposed',
          sourceClient: 'cli',
          basedOn: existing.mainRevisionId
        }
      });
      proposals.push(proposal);
    }
  }

  return Response.json({
    success: true,
    metadata: {
      createdDocuments: documents.length - proposals.length,
      proposedChanges: proposals.length
    }
  });
}
```

**Files to Create:**
- `app/api/cli/sync/route.ts`
- `app/api/cli/auth/route.ts` (verify API key)

---

#### 1.4 CLI Sync Commands

**Problem:** CLI has no commands to sync with web app

**Solution:** Add pull/push commands

```typescript
// packages/docjays-cli/src/cli/commands/pull.ts (NEW)
export class PullCommand extends BaseCommand {
  async execute(options: any) {
    // Check connection
    const config = await this.configManager.load();
    if (!config.webApp?.connected) {
      throw new Error('Not connected to web app. Run: docjays connect <url> <api-key>');
    }

    // Get API key from keystore
    const password = await this.promptPassword('Enter keystore password:');
    const apiKey = await this.keyStore.get('web-app-key', password);

    // Fetch documents from web app
    const response = await fetch(`${config.webApp.url}/api/cli/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'pull',
        since: options.since // Optional: incremental sync
      })
    });

    const result: SyncResponse = await response.json();

    // Save documents to local cache
    for (const doc of result.documents) {
      const filePath = path.join(this.basePath, '.docjays', 'web-cache', doc.path);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, doc.content);

      // Save metadata
      const metaPath = filePath + '.meta.json';
      await fs.writeFile(metaPath, JSON.stringify({
        id: doc.id,
        groundingState: doc.groundingState,
        freshnessScore: doc.freshnessScore,
        lastSyncedAt: new Date().toISOString()
      }));
    }

    console.log(chalk.green(`✓ Pulled ${result.documents.length} documents`));
  }
}

// packages/docjays-cli/src/cli/commands/push.ts (NEW)
export class PushCommand extends BaseCommand {
  async execute(options: any) {
    // Read changed files from local
    const changedFiles = await this.getChangedFiles(options.since);

    // Get API key
    const password = await this.promptPassword('Enter keystore password:');
    const apiKey = await this.keyStore.get('web-app-key', password);

    // Push to web app
    const response = await fetch(`${config.webApp.url}/api/cli/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operation: 'push',
        documents: changedFiles.map(f => ({
          path: f.path,
          content: f.content,
          sourceName: f.source,
          updatedAt: f.modifiedAt
        }))
      })
    });

    const result = await response.json();
    console.log(chalk.green(`✓ Pushed ${changedFiles.length} documents`));
    if (result.metadata.proposedChanges > 0) {
      console.log(chalk.yellow(`⚠ ${result.metadata.proposedChanges} changes require approval`));
    }
  }
}
```

**Files to Create:**
- `packages/docjays-cli/src/cli/commands/connect.ts`
- `packages/docjays-cli/src/cli/commands/pull.ts`
- `packages/docjays-cli/src/cli/commands/push.ts`
- `packages/docjays-cli/src/cli/commands/status.ts` (enhance to show sync status)

---

## 🚀 Phase 2: MCP Unification (Week 3-4)

### Goal: Align MCP Implementations

#### 2.1 Standardize Tool Names

**Problem:** Tools have different names in web vs CLI

**Solution:** Create canonical tool registry

```typescript
// packages/shared-types/src/mcp-tools.ts (NEW)

export const CANONICAL_TOOLS = {
  // Document operations (aligned names)
  READ_DOCUMENT: 'read_document',        // was read_doc in CLI
  SEARCH_DOCUMENTS: 'search_documents',  // was search_docs in CLI
  LIST_DOCUMENTS: 'list_documents',      // new in CLI

  // Source operations (CLI-only, add to web)
  LIST_SOURCES: 'list_sources',
  SYNC_SOURCE: 'sync_source',            // new

  // Revision operations (web-only, add to CLI)
  PROPOSE_CHANGE: 'propose_change',
  LIST_REVISIONS: 'list_revisions',
  APPROVE_REVISION: 'approve_revision',

  // Grounding operations (web-only, add to CLI)
  QUERY_GROUNDED_KNOWLEDGE: 'query_grounded_knowledge',
  GET_GROUNDING_STATUS: 'get_grounding_status'
} as const;

export type ToolName = typeof CANONICAL_TOOLS[keyof typeof CANONICAL_TOOLS];
```

**Files to Update:**
- `packages/docjays-cli/src/mcp/tools.ts` (rename tools)
- `app/api/mcp/route.ts` (add missing tools)

---

#### 2.2 Unified Resource URI Scheme

**Problem:** Different URI schemes cause conflicts

**Solution:** Standardize to `docjays://`

```typescript
// Web app resources
docjays://projects/{projectSlug}/documents/{path}
docjays://projects/{projectSlug}/revisions/{revisionId}
docjays://projects/{projectSlug}/grounding/{moduleId}

// CLI resources (local)
docjays://local/sources/{sourceName}/{path}
docjays://local/features/{featureName}
docjays://local/cache/{path}                    // From web app pull

// CLI resources (proxied to web)
docjays://remote/{projectSlug}/documents/{path}
```

**Files to Update:**
- `packages/docjays-cli/src/mcp/resources.ts`
- `app/api/mcp/route.ts`

---

#### 2.3 MCP Proxy Mode

**Problem:** CLI MCP server doesn't expose web app data

**Solution:** Add proxy mode to CLI

```typescript
// packages/docjays-cli/src/mcp/proxy.ts (NEW)

export class MCPProxy {
  async proxyToWebApp(toolName: string, args: any) {
    const config = await this.configManager.load();
    if (!config.webApp?.connected) {
      throw new Error('Not connected to web app');
    }

    const apiKey = await this.keyStore.get('web-app-key', this.password);

    const response = await fetch(`${config.webApp.url}/api/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: { name: toolName, arguments: args }
      })
    });

    return response.json();
  }
}

// Update packages/docjays-cli/src/mcp/tools.ts
async call(name: string, args: any) {
  // Check if tool should be proxied
  if (PROXIED_TOOLS.includes(name) && this.config.webApp?.connected) {
    return this.proxy.proxyToWebApp(name, args);
  }

  // Otherwise, handle locally
  return this.handleLocalTool(name, args);
}
```

**Files to Create:**
- `packages/docjays-cli/src/mcp/proxy.ts`

**Files to Update:**
- `packages/docjays-cli/src/mcp/server.ts` (add proxy support)
- `packages/docjays-cli/src/mcp/tools.ts` (routing logic)

---

## 🚀 Phase 3: Data Model Alignment (Week 5-6)

### Goal: Prevent Metadata Loss

#### 3.1 Add Source Model to Web App

**Problem:** Web app doesn't track external sources

**Solution:** Add Source model to Prisma schema

```prisma
// prisma/schema.prisma

model Source {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  name        String
  type        SourceType
  url         String
  branch      String?
  enabled     Boolean  @default(true)

  // Auth reference (stored in project's keystore)
  authKeyName String?

  // Sync tracking
  lastSyncedAt DateTime?
  syncState    SyncState @default(PENDING)
  syncError    String?

  // Documents imported from this source
  documents   Document[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, name])
}

enum SourceType {
  GIT
  HTTP
  LOCAL
}

enum SyncState {
  PENDING
  IN_PROGRESS
  SYNCED
  ERROR
}

// Update Document model
model Document {
  // ... existing fields

  sourceId    String?
  source      Source?  @relation(fields: [sourceId], references: [id])

  // Track if document is synced from external source
  isSynced    Boolean  @default(false)
  lastSyncedAt DateTime?
}
```

**Files to Update:**
- `prisma/schema.prisma`
- Run migration: `npx prisma migrate dev --name add-sources`

---

#### 3.2 Source Sync Job

**Problem:** Web app can't sync from CLI-configured sources

**Solution:** Create background job

```typescript
// app/api/sources/[sourceId]/sync/route.ts (NEW)

export async function POST(
  request: Request,
  { params }: { params: { sourceId: string } }
) {
  const apiKey = extractApiKey(request);
  const project = await validateApiKey(apiKey);

  const source = await prisma.source.findUnique({
    where: { id: params.sourceId }
  });

  if (!source || source.projectId !== project.id) {
    return Response.json({ error: 'Source not found' }, { status: 404 });
  }

  // Update sync state
  await prisma.source.update({
    where: { id: source.id },
    data: { syncState: 'IN_PROGRESS' }
  });

  try {
    const documents = await syncSourceDocuments(source);

    // Import documents
    for (const doc of documents) {
      await upsertDocument(project.id, source.id, doc);
    }

    await prisma.source.update({
      where: { id: source.id },
      data: {
        syncState: 'SYNCED',
        lastSyncedAt: new Date()
      }
    });

    return Response.json({ success: true, documentCount: documents.length });
  } catch (error: any) {
    await prisma.source.update({
      where: { id: source.id },
      data: {
        syncState: 'ERROR',
        syncError: error.message
      }
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function syncSourceDocuments(source: Source) {
  switch (source.type) {
    case 'GIT':
      return syncGitSource(source);
    case 'HTTP':
      return syncHttpSource(source);
    case 'LOCAL':
      throw new Error('LOCAL sources not supported in web app');
  }
}
```

**Files to Create:**
- `app/api/sources/route.ts` (CRUD operations)
- `app/api/sources/[sourceId]/sync/route.ts`
- `lib/source-sync.ts` (sync logic, reuse CLI code)

---

#### 3.3 Grounding Preservation

**Problem:** Grounding metadata lost when re-syncing

**Solution:** Store grounding separately from content

```typescript
// When syncing from source
async function upsertDocument(projectId: string, sourceId: string, syncedDoc: any) {
  const existing = await prisma.document.findFirst({
    where: { projectId, path: syncedDoc.path }
  });

  if (!existing) {
    // Create new document
    return prisma.document.create({
      data: {
        projectId,
        sourceId,
        path: syncedDoc.path,
        content: syncedDoc.content,
        isSynced: true,
        groundingState: 'ungrounded', // Default
        uploadState: 'uploaded'
      }
    });
  }

  // Document exists - preserve grounding metadata
  const groundingSnapshot = await prisma.groundingSnapshot.findFirst({
    where: { documentId: existing.id },
    orderBy: { createdAt: 'desc' }
  });

  // Create new revision with updated content
  const newRevision = await prisma.revision.create({
    data: {
      documentId: existing.id,
      content: syncedDoc.content,
      status: 'draft',
      sourceClient: 'source-sync',
      basedOn: existing.mainRevisionId
    }
  });

  // If document was grounded, mark new revision for review
  if (existing.groundingState === 'grounded' && groundingSnapshot) {
    await prisma.revision.update({
      where: { id: newRevision.id },
      data: {
        status: 'proposed',
        hasConflicts: true,
        conflictReason: 'Source updated after grounding'
      }
    });
  } else {
    // Not grounded, safe to update main revision
    await prisma.document.update({
      where: { id: existing.id },
      data: {
        mainRevisionId: newRevision.id,
        lastSyncedAt: new Date()
      }
    });
  }

  return existing;
}
```

**Workflow:**
1. Source updates → create new revision (status: draft)
2. If document was grounded → mark revision as "proposed" with conflict
3. Human reviews → approves or rejects
4. If approved → becomes new main revision
5. Grounding status preserved independently

---

## 🚀 Phase 4: UI Integration (Week 7-8)

### Goal: Unified User Experience

#### 4.1 Source Management UI

**Problem:** No UI to manage sources

**Solution:** Add to project settings

```tsx
// app/projects/[slug]/settings/sources/page.tsx (NEW)

export default function SourcesPage({ params }: { params: { slug: string } }) {
  const sources = useSources(params.slug);

  return (
    <div>
      <h1>External Documentation Sources</h1>

      <SourceList sources={sources.data} />

      <AddSourceDialog projectSlug={params.slug} />
    </div>
  );
}

// components/sources/SourceList.tsx
function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="space-y-4">
      {sources.map(source => (
        <SourceCard key={source.id} source={source} />
      ))}
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const syncMutation = useMutation({
    mutationFn: () => fetch(`/api/sources/${source.id}/sync`, { method: 'POST' })
  });

  return (
    <div className="border rounded p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">{source.name}</h3>
          <p className="text-sm text-gray-600">{source.url}</p>
          <p className="text-xs text-gray-500">
            Type: {source.type} |
            Last synced: {source.lastSyncedAt ? formatDate(source.lastSyncedAt) : 'Never'}
          </p>
        </div>

        <div className="flex gap-2">
          <SyncStateIndicator state={source.syncState} />

          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Files to Create:**
- `app/projects/[slug]/settings/sources/page.tsx`
- `components/sources/SourceList.tsx`
- `components/sources/AddSourceDialog.tsx`
- `components/sources/SyncStateIndicator.tsx`

---

#### 4.2 CLI Connection UI

**Problem:** No UI to get API key for CLI

**Solution:** Add to project settings

```tsx
// app/projects/[slug]/settings/cli/page.tsx (NEW)

export default function CLISettingsPage({ params }: { params: { slug: string } }) {
  const [apiKey, setApiKey] = useState<string | null>(null);

  const generateKey = async () => {
    const response = await fetch(`/api/projects/${params.slug}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'CLI Access',
        permissions: { cli: true }
      })
    });
    const data = await response.json();
    setApiKey(data.key);
  };

  return (
    <div>
      <h1>CLI Integration</h1>

      <section>
        <h2>Connect Docjays CLI</h2>
        <p>Use the Docjays CLI to sync documents from external sources.</p>

        {!apiKey && (
          <Button onClick={generateKey}>Generate API Key</Button>
        )}

        {apiKey && (
          <div>
            <p className="font-mono bg-gray-100 p-2">{apiKey}</p>
            <p className="text-sm text-yellow-600">
              ⚠️ Save this key! It won't be shown again.
            </p>

            <div className="mt-4">
              <h3>Setup Instructions:</h3>
              <CodeBlock language="bash">
                {`# Install CLI
npm install -g docjays

# Initialize keystore
docjays auth init

# Connect to this project
docjays connect ${window.location.origin} ${apiKey}

# Pull documents
docjays pull

# Start MCP server (for Claude)
docjays serve`}
              </CodeBlock>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2>Active CLI Connections</h2>
        <ApiKeyList projectSlug={params.slug} />
      </section>
    </div>
  );
}
```

**Files to Create:**
- `app/projects/[slug]/settings/cli/page.tsx`
- `components/cli/ConnectionInstructions.tsx`

---

#### 4.3 Sync Status Indicators

**Problem:** Users don't know when documents are out of sync

**Solution:** Add indicators to document tree

```tsx
// components/documents/DocumentTreeItem.tsx (UPDATE)

function DocumentTreeItem({ document }: { document: Document }) {
  const syncStatus = useSyncStatus(document.id);

  return (
    <div className="flex items-center gap-2">
      <FileIcon />
      <span>{document.path}</span>

      {document.isSynced && (
        <Tooltip content="Synced from external source">
          <CloudIcon className="text-blue-500" />
        </Tooltip>
      )}

      {syncStatus.hasChanges && (
        <Tooltip content="Source has updates">
          <AlertIcon className="text-yellow-500" />
        </Tooltip>
      )}

      {document.groundingState === 'grounded' && (
        <Tooltip content="Grounded content">
          <CheckIcon className="text-green-500" />
        </Tooltip>
      )}
    </div>
  );
}
```

**Files to Update:**
- `components/documents/DocumentTreeItem.tsx`
- `hooks/useSyncStatus.ts` (NEW)

---

## 🚀 Phase 5: Advanced Features (Week 9-10)

### Goal: Seamless Workflows

#### 5.1 Auto-Sync Scheduler

**Problem:** Manual sync is tedious

**Solution:** Background job with Vercel Cron

```typescript
// app/api/cron/sync-sources/route.ts (NEW)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find sources that need syncing
  const sources = await prisma.source.findMany({
    where: {
      enabled: true,
      syncState: { not: 'IN_PROGRESS' }
    }
  });

  const results = [];

  for (const source of sources) {
    try {
      const result = await syncSource(source);
      results.push({ sourceId: source.id, success: true, documentCount: result.length });
    } catch (error: any) {
      results.push({ sourceId: source.id, success: false, error: error.message });
    }
  }

  return Response.json({ synced: results.length, results });
}
```

**Vercel Configuration:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-sources",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

**Files to Create:**
- `app/api/cron/sync-sources/route.ts`
- Update `vercel.json`

---

#### 5.2 Conflict Resolution UI

**Problem:** No UI to resolve sync conflicts

**Solution:** Add conflict viewer

```tsx
// app/projects/[slug]/conflicts/page.tsx (NEW)

export default function ConflictsPage({ params }: { params: { slug: string } }) {
  const conflicts = useConflicts(params.slug);

  return (
    <div>
      <h1>Sync Conflicts</h1>
      <p>These documents have been updated externally after being grounded.</p>

      {conflicts.data?.map(conflict => (
        <ConflictCard key={conflict.id} conflict={conflict} />
      ))}
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: Revision }) {
  return (
    <div className="border rounded p-4">
      <h3>{conflict.document.path}</h3>
      <p className="text-sm text-gray-600">{conflict.conflictReason}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <h4>Current (Grounded)</h4>
          <pre>{conflict.basedOnRevision?.content}</pre>
        </div>
        <div>
          <h4>Updated (From Source)</h4>
          <pre>{conflict.content}</pre>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={() => approveRevision(conflict.id)}>
          Accept Updated Version
        </Button>
        <Button variant="outline" onClick={() => rejectRevision(conflict.id)}>
          Keep Grounded Version
        </Button>
      </div>
    </div>
  );
}
```

**Files to Create:**
- `app/projects/[slug]/conflicts/page.tsx`
- `components/conflicts/ConflictCard.tsx`
- `hooks/useConflicts.ts`

---

## 📋 Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Create shared-types package
- [ ] Add unified authentication
- [ ] Create sync API endpoint
- [ ] Add CLI connect/pull/push commands
- [ ] Update API key permissions

### Phase 2: MCP Unification ✅
- [ ] Standardize tool names
- [ ] Align resource URI schemes
- [ ] Add MCP proxy mode to CLI
- [ ] Test bidirectional MCP calls

### Phase 3: Data Model ✅
- [ ] Add Source model to Prisma
- [ ] Implement source sync job
- [ ] Add grounding preservation logic
- [ ] Test metadata retention

### Phase 4: UI Integration ✅
- [ ] Create source management UI
- [ ] Add CLI connection settings page
- [ ] Add sync status indicators
- [ ] Test end-to-end workflow

### Phase 5: Advanced ✅
- [ ] Implement auto-sync scheduler
- [ ] Create conflict resolution UI
- [ ] Add batch operations
- [ ] Performance optimization

---

## 🎯 Success Criteria

### Week 2
- [ ] User can run `docjays connect` and authenticate
- [ ] User can run `docjays pull` and get documents from web app
- [ ] API key works for both web MCP and CLI

### Week 4
- [ ] CLI MCP server can proxy to web app MCP
- [ ] All tool names aligned
- [ ] No URI scheme conflicts

### Week 6
- [ ] Web app can sync from git sources
- [ ] Grounding metadata preserved on re-sync
- [ ] Source model fully functional

### Week 8
- [ ] UI to manage sources
- [ ] UI to generate CLI API keys
- [ ] Sync status visible in document tree

### Week 10
- [ ] Auto-sync works via cron
- [ ] Conflict resolution UI functional
- [ ] Full integration tested

---

## 🚨 Migration Path

### For Existing CLI Users
1. Install updated CLI: `npm update -g docjays`
2. Run `docjays connect <url> <api-key>`
3. Run `docjays pull` to get existing documents
4. Continue using CLI normally

### For Existing Web App Users
1. Go to Project Settings → CLI Integration
2. Generate API key
3. Install CLI: `npm install -g docjays`
4. Connect: `docjays connect <url> <api-key>`
5. Optionally configure sources for external docs

---

**Priority:** Critical
**Owner:** Engineering Team
**Next Review:** Weekly standup
**Dependencies:** Requires Prisma migration, shared-types package

---

**Last Updated:** 2026-01-27
