# Branching vs Revision Architecture - Strategic Decision

## The Core Question

**How should AI assistants and users collaborate on documentation with proper version control?**

Key considerations:
1. **Main/Grounded version** - What is the "source of truth"?
2. **MCP bidirectional flow** - Can AI create proposals AND read proposal status?
3. **Branching model** - Git-like branches or simpler revisions?
4. **Approval workflow** - Who approves? How?

---

## Option 1: Simple Proposal System (Current Implementation)

### Structure
```
Main Branch (Single Source of Truth)
  ↓
Proposals (Pending Changes)
  ↓
Approval → Merge to Main
```

### Database Schema
```prisma
Document {
  content: String  // Main version
}

Proposal {
  status: "OPEN" | "MERGED" | "REJECTED"
  branchName: String  // Virtual branch
}

Version {
  content: String
  proposalId?: String  // Links to proposal
}
```

### MCP Flow
```
MCP Client (Claude/Cursor)
  ↓
read_document → Returns MAIN version
  ↓
propose_change → Creates Proposal
  ↓
User reviews in web UI
  ↓
User approves → Main updates
  ↓
MCP reads updated main
```

### ✅ Pros
- Simple to understand
- Clear "main" vs "proposed" distinction
- Easy approval workflow
- Matches ChatGPT/ChatPRD model

### ❌ Cons
- No true branching
- Can't work on multiple features in parallel
- MCP can't see proposal status
- No draft revisions
- All-or-nothing merge

---

## Option 2: Git-like Branching System

### Structure
```
Main Branch (production)
  ├─ feature/update-auth (long-lived branch)
  ├─ fix/typos (short-lived branch)
  └─ draft/ai-suggestions (AI-created branch)

Each branch has:
  - Full document history
  - Independent changes
  - Can be merged or deleted
```

### Database Schema
```prisma
Branch {
  id: String
  name: String  // "main", "feature/auth", "ai/suggestion-123"
  isMain: Boolean
  isGrounded: Boolean  // Is this truth?
  parentBranchId: String?
  createdBy: String  // "user" | "ai" | "mcp"
}

DocumentVersion {
  id: String
  branchId: String
  content: String
  commitMessage: String
}

MergeRequest {
  fromBranchId: String
  toBranchId: String
  status: "OPEN" | "MERGED" | "REJECTED"
}
```

### MCP Flow
```
MCP Client
  ↓
list_branches → ["main", "feature/auth", "ai/draft-1"]
  ↓
read_document(branch="main") → Grounded truth
  ↓
create_branch(name="ai/improve-intro", from="main")
  ↓
update_document(branch="ai/improve-intro", content="...")
  ↓
create_merge_request(from="ai/improve-intro", to="main")
  ↓
User reviews diff in web UI
  ↓
User merges → Main updates
  ↓
MCP reads updated main
```

### ✅ Pros
- True version control
- Multiple parallel branches
- MCP can create and manage branches
- Long-lived feature branches
- Granular control
- Matches developer workflow

### ❌ Cons
- Complex for non-developers
- More database tables
- Merge conflicts possible
- Overhead for simple changes

---

## Option 3: Hybrid Revision System (RECOMMENDED)

### Structure
```
Document
  ├─ Main Version (grounded=true)
  ├─ Revision #1 (proposed by AI, pending)
  ├─ Revision #2 (proposed by user, approved)
  └─ Revision #3 (draft, AI working on it)

Each revision:
  - Has status: "draft" | "proposed" | "approved" | "rejected"
  - Can become main if approved
  - Timestamped and tracked
  - Linked to creator (user/AI/MCP)
```

### Database Schema
```prisma
Document {
  id: String
  path: String
  projectId: String

  // Current grounded version
  mainContent: String
  mainRevisionId: String

  // Metadata
  isLocked: Boolean  // Prevent simultaneous edits
  lockedBy: String?
  lockedAt: DateTime?
}

Revision {
  id: String
  documentId: String
  content: String

  // Status and grounding
  status: String  // "draft", "proposed", "approved", "rejected", "main"
  isMain: Boolean  // Is this the grounded truth?

  // Metadata
  title: String
  description: String
  reasoning: String  // Why this change?

  // Author
  authorId: String?
  authorType: String  // "user" | "ai" | "mcp"
  source: String?  // "web-ui" | "mcp-claude" | "api"

  // Timestamps
  createdAt: DateTime
  proposedAt: DateTime?
  approvedAt: DateTime?

  // Relationships
  parentRevisionId: String?  // What revision was this based on?
  replacedRevisionId: String?  // What revision did this replace?
}

RevisionDiff {
  id: String
  revisionId: String
  baseRevisionId: String
  diffData: Json  // Computed diff for fast display
  hasConflicts: Boolean
  conflictRegions: Json?
}
```

### MCP Flow with Grounding

#### Read Flow
```
MCP Client: get_document_info("architecture.md")
  ↓
Response: {
  "path": "architecture.md",
  "mainRevision": {
    "id": "rev_123",
    "content": "...",
    "isGrounded": true,
    "updatedAt": "2024-01-24"
  },
  "pendingRevisions": [
    {
      "id": "rev_456",
      "title": "Improve clarity",
      "status": "proposed",
      "proposedBy": "ai",
      "confidence": 0.85
    }
  ]
}
```

#### Write Flow (Draft)
```
MCP Client: create_revision({
  documentPath: "architecture.md",
  content: "...",
  title: "Improve intro",
  reasoning: "...",
  status: "draft"  // Not yet proposed
})
  ↓
Server creates Revision with status="draft"
  ↓
Response: {
  "revisionId": "rev_789",
  "status": "draft",
  "canPropose": true,
  "reviewUrl": "https://app.com/revisions/rev_789"
}
```

#### Write Flow (Proposed)
```
MCP Client: create_revision({
  documentPath: "architecture.md",
  content: "...",
  title: "Improve intro",
  reasoning: "...",
  status: "proposed"  // Submit for review
})
  ↓
Server creates Revision with status="proposed"
  ↓
Server generates diff against main
  ↓
Server notifies user (webhook/email)
  ↓
Response: {
  "revisionId": "rev_890",
  "status": "proposed",
  "requiresApproval": true,
  "reviewUrl": "https://app.com/revisions/rev_890",
  "diffUrl": "https://app.com/revisions/rev_890/diff"
}
```

#### Bidirectional Status Check
```
MCP Client: get_revision_status("rev_890")
  ↓
Response: {
  "status": "approved",  // User approved it!
  "approvedAt": "2024-01-24T15:30:00Z",
  "approvedBy": "user@example.com",
  "isNowMain": true,
  "previousMainRevisionId": "rev_123"
}

// OR if rejected:
Response: {
  "status": "rejected",
  "rejectedAt": "...",
  "rejectedBy": "...",
  "feedback": "Please add more examples"
}
```

### ✅ Pros
- **Simple** - Easier than git branches
- **Grounded truth** - Clear "main" version
- **Drafts** - AI can create drafts before proposing
- **Bidirectional** - MCP can check proposal status
- **Flexible** - Can have multiple pending revisions
- **Trackable** - Full history with reasoning
- **Conflicts** - Can detect and prevent conflicts

### ❌ Cons
- Not as powerful as full git branching
- Still some complexity
- Need conflict detection

---

## Ideal Flow: Revision System with Grounding

### User Story 1: AI Improves Documentation

```
1. User opens document in Cursor
   ↓
2. Cursor (via MCP) reads main version
   GET /api/mcp → read_document("architecture.md")
   Response: { content: "...", isGrounded: true, revisionId: "rev_main_123" }
   ↓
3. User asks: "Improve the intro section"
   ↓
4. Cursor analyzes and prepares changes
   ↓
5. Cursor creates DRAFT revision (not yet proposed)
   POST /api/mcp → create_revision({
     path: "architecture.md",
     content: "improved content...",
     title: "Improve intro clarity",
     reasoning: "Reduced complexity, added examples",
     status: "draft",
     basedOn: "rev_main_123"
   })
   ↓
6. Server creates draft revision
   Response: { revisionId: "rev_draft_456", status: "draft" }
   ↓
7. Cursor shows user the draft in IDE
   "I've created a draft improvement. Review it?"
   [Show Diff] [Propose for Review] [Discard]
   ↓
8. User clicks [Propose for Review]
   ↓
9. Cursor updates revision status
   POST /api/mcp → propose_revision("rev_draft_456")
   ↓
10. Server:
    - Updates status to "proposed"
    - Generates diff vs main
    - Checks for conflicts
    - Notifies document owner
    ↓
11. User gets notification in web UI
    "AI proposed changes to architecture.md"
    [Review Changes]
    ↓
12. User reviews side-by-side diff
    ✅ Looks good!
    [Approve] [Request Changes] [Reject]
    ↓
13. User clicks [Approve]
    ↓
14. Server:
    - Marks revision as "approved"
    - Sets revision as new main (isMain=true)
    - Archives old main
    - Creates version history entry
    ↓
15. Cursor polls for status (or webhook)
    GET /api/mcp → get_revision_status("rev_draft_456")
    Response: { status: "approved", isNowMain: true }
    ↓
16. Cursor notifies user:
    "✅ Your changes were approved and are now live!"
```

### User Story 2: Multiple Pending Revisions

```
Scenario: AI creates multiple improvement suggestions

Document: "api/auth.md"
Main Version: rev_main_100

Pending Revisions:
1. rev_prop_101 - "Add OAuth examples" (proposed by AI, pending)
2. rev_prop_102 - "Fix typos" (proposed by AI, pending)
3. rev_draft_103 - "Restructure sections" (draft, not yet proposed)

MCP Client can:
- Read main version (grounded truth)
- Read any revision
- Check status of any revision
- Create new revisions based on latest main
- Propose multiple revisions independently

User can:
- Approve rev_prop_101 → becomes main
- Reject rev_prop_102 → stays rejected
- Wait for rev_draft_103 to be proposed

If rev_prop_101 is approved:
- Main version updates
- rev_prop_102 and rev_draft_103 now have conflicts
- System detects conflicts
- AI can update rev_prop_102 based on new main
```

### User Story 3: Conflict Detection

```
Situation:
- Main version updated
- AI has pending revision based on OLD main
- Conflict detected

Flow:
1. User approves revision A → main updates
   ↓
2. AI's revision B is now based on outdated main
   ↓
3. System detects conflict:
   RevisionDiff {
     revisionId: "rev_B",
     baseRevisionId: "rev_old_main",
     currentMainRevisionId: "rev_new_main",
     hasConflicts: true,
     conflictRegions: [...]
   }
   ↓
4. MCP polls status of revision B:
   Response: {
     status: "conflicted",
     reason: "Base version has changed",
     currentMain: "rev_new_main",
     needsRebase: true
   }
   ↓
5. AI rebases revision B:
   - Read new main
   - Re-apply changes
   - Create new revision C based on new main
   - Link to original revision B
   ↓
6. Propose revision C for review
```

---

## MCP Tools with Grounding

### Enhanced MCP Tools

#### 1. read_document (Enhanced)
```typescript
{
  "name": "read_document",
  "parameters": {
    "path": "architecture.md",
    "revision": "main" | "rev_123" | "latest"  // Default: "main"
  },
  "response": {
    "content": "...",
    "revisionId": "rev_main_123",
    "isGrounded": true,  // Is this the main version?
    "updatedAt": "2024-01-24",
    "hasConflicts": false,
    "pendingRevisions": [
      { "id": "rev_456", "title": "...", "status": "proposed" }
    ]
  }
}
```

#### 2. create_revision (New)
```typescript
{
  "name": "create_revision",
  "parameters": {
    "path": "architecture.md",
    "content": "...",
    "title": "Improve intro",
    "reasoning": "...",
    "status": "draft" | "proposed",  // Draft = not yet ready, Proposed = ready for review
    "basedOn": "rev_main_123"  // Which version is this based on?
  },
  "response": {
    "revisionId": "rev_789",
    "status": "draft",
    "reviewUrl": "https://...",
    "canPropose": true
  }
}
```

#### 3. propose_revision (New)
```typescript
{
  "name": "propose_revision",
  "parameters": {
    "revisionId": "rev_789"
  },
  "response": {
    "status": "proposed",
    "requiresApproval": true,
    "reviewUrl": "https://...",
    "diffUrl": "https://..."
  }
}
```

#### 4. get_revision_status (New)
```typescript
{
  "name": "get_revision_status",
  "parameters": {
    "revisionId": "rev_789"
  },
  "response": {
    "status": "draft" | "proposed" | "approved" | "rejected" | "conflicted",
    "isMain": false,
    "updatedAt": "...",
    "approvedBy": "user@example.com",
    "feedback": "Please add more examples",
    "hasConflicts": false
  }
}
```

#### 5. list_revisions (New)
```typescript
{
  "name": "list_revisions",
  "parameters": {
    "path": "architecture.md",
    "status": "proposed" | "all"  // Filter by status
  },
  "response": {
    "mainRevision": { "id": "rev_main_123", "updatedAt": "..." },
    "revisions": [
      {
        "id": "rev_456",
        "title": "Improve intro",
        "status": "proposed",
        "authorType": "ai",
        "confidence": 0.85,
        "createdAt": "..."
      }
    ]
  }
}
```

#### 6. update_revision (New)
```typescript
{
  "name": "update_revision",
  "parameters": {
    "revisionId": "rev_789",
    "content": "...",  // Updated content
    "reasoning": "...",  // Why updated
    "basedOn": "rev_main_124"  // Rebase to new main
  },
  "response": {
    "success": true,
    "newRevisionId": "rev_790",  // New revision created
    "previousRevisionId": "rev_789"
  }
}
```

---

## Implementation Phases

### Phase 1: Basic Revision System (Week 1)
- [ ] Update Prisma schema (Revision model)
- [ ] Create revision API endpoints
- [ ] Implement create_revision MCP tool
- [ ] Add draft/proposed status
- [ ] Build revision review UI

### Phase 2: Grounding & Status (Week 2)
- [ ] Add isMain flag to revisions
- [ ] Implement propose_revision MCP tool
- [ ] Implement get_revision_status MCP tool
- [ ] Add approval workflow
- [ ] Build status polling

### Phase 3: Conflict Detection (Week 3)
- [ ] Implement RevisionDiff model
- [ ] Detect conflicts on propose
- [ ] Add conflict resolution UI
- [ ] Implement rebase functionality

### Phase 4: Bidirectional Flow (Week 4)
- [ ] Add webhooks for status changes
- [ ] Implement list_revisions MCP tool
- [ ] Add revision history UI
- [ ] Build revision comparison view

---

## Recommendation: Hybrid Revision System

**Why this is the best approach:**

1. ✅ **Simple enough** - Not as complex as git
2. ✅ **Powerful enough** - Supports drafts, proposals, multiple revisions
3. ✅ **Grounded** - Clear "main" version (source of truth)
4. ✅ **Bidirectional** - MCP can read status and propose changes
5. ✅ **Conflict-aware** - Detects and handles conflicts
6. ✅ **User-friendly** - Easy for non-developers to understand
7. ✅ **AI-friendly** - AI can create drafts, check status, rebase

**Decision Matrix:**

| Feature | Simple Proposals | Git Branches | Hybrid Revisions |
|---------|-----------------|--------------|------------------|
| Easy to use | ✅ | ❌ | ✅ |
| Multiple pending changes | ❌ | ✅ | ✅ |
| Grounded main version | ✅ | ✅ | ✅ |
| Draft mode | ❌ | ✅ | ✅ |
| Bidirectional MCP | ❌ | ✅ | ✅ |
| Status checking | ❌ | ✅ | ✅ |
| Conflict detection | ⚠️ | ✅ | ✅ |
| Developer-friendly | ✅ | ✅ | ✅ |
| Non-dev-friendly | ✅ | ❌ | ✅ |

**Winner: Hybrid Revision System** 🏆

---

## Next Steps

1. **Update database schema** - Add Revision and RevisionDiff models
2. **Implement core revision API** - Create, propose, approve, reject
3. **Update MCP tools** - Add grounding, status checking, revision management
4. **Build UI** - Revision review, diff view, approval workflow
5. **Add conflict detection** - Detect and resolve conflicts automatically

**Should we proceed with the Hybrid Revision System implementation?**
