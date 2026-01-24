# Revision System Flow Diagrams

## Visual Architecture

### Current vs Proposed

```
┌─────────────────────────────────────────────────────────┐
│ CURRENT: Simple Proposal System                         │
└─────────────────────────────────────────────────────────┘

Document
  └── content: "Main version only"

Proposal (Separate entity)
  └── changes: "Proposed changes"
  └── status: OPEN/MERGED/REJECTED

Problem: No grounding, no bidirectional flow


┌─────────────────────────────────────────────────────────┐
│ PROPOSED: Hybrid Revision System ⭐                     │
└─────────────────────────────────────────────────────────┘

Document
  ├── mainContent: "Grounded truth"
  ├── mainRevisionId: "rev_123"
  └── Revisions:
        ├── rev_123 [MAIN] ← Grounded version
        ├── rev_456 [PROPOSED] ← AI suggestion
        ├── rev_457 [DRAFT] ← AI working on it
        └── rev_458 [REJECTED] ← User rejected

Benefits:
✓ Clear grounded version
✓ Multiple parallel revisions
✓ Drafts + Proposals
✓ Bidirectional MCP flow
✓ Status tracking
```

---

## Flow 1: AI Creates Draft → Proposes → User Approves

```
┌──────────────┐
│ Cursor IDE   │
│ (MCP Client) │
└──────┬───────┘
       │
       │ 1. Read main version
       ├────────────────────────────────────────┐
       │ GET read_document("api/auth.md")      │
       │ ◄─────────────────────────────────────┤
       │ Response: {                            │
       │   content: "...",                      │
       │   revisionId: "rev_main_100",         │
       │   isGrounded: true ← This is truth    │
       │ }                                      │
       └────────────────────────────────────────┘
       │
       │ 2. User asks: "Add OAuth examples"
       │
       │ 3. AI creates DRAFT (not yet proposed)
       ├────────────────────────────────────────┐
       │ POST create_revision({                 │
       │   path: "api/auth.md",                │
       │   content: "...with OAuth...",        │
       │   title: "Add OAuth examples",        │
       │   status: "draft", ← Draft status     │
       │   basedOn: "rev_main_100"             │
       │ })                                     │
       │ ◄─────────────────────────────────────┤
       │ Response: {                            │
       │   revisionId: "rev_draft_101",        │
       │   status: "draft",                     │
       │   reviewUrl: "https://..."            │
       │ }                                      │
       └────────────────────────────────────────┘
       │
       │ 4. Show draft to user in IDE
       │    [Show Diff] [Propose] [Discard]
       │
       │ 5. User clicks [Propose]
       │
       │ 6. AI proposes revision
       ├────────────────────────────────────────┐
       │ POST propose_revision("rev_draft_101") │
       │ ◄─────────────────────────────────────┤
       │ Response: {                            │
       │   status: "proposed", ← Now proposed  │
       │   requiresApproval: true              │
       │ }                                      │
       └────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Web UI     │ 7. User gets notification
│ (Dashboard)  │    "AI proposed changes to api/auth.md"
└──────┬───────┘    [Review Changes]
       │
       │ 8. User reviews diff
       │    Original │ Proposed
       │    ─────────┼──────────
       │    ...      │ ...OAuth...
       │
       │    [✓ Approve] [✗ Reject]
       │
       │ 9. User clicks [Approve]
       │
       ├────────────────────────────────────────┐
       │ Server:                                │
       │ - Mark rev_draft_101 as "approved"    │
       │ - Set isMain = true                   │
       │ - Archive old main (rev_main_100)     │
       │ - Update document.mainRevisionId      │
       │ - Notify MCP client (webhook)         │
       └────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Cursor IDE   │ 10. Cursor polls for status
└──────┬───────┘
       ├────────────────────────────────────────┐
       │ GET get_revision_status("rev_draft_101")│
       │ ◄─────────────────────────────────────┤
       │ Response: {                            │
       │   status: "approved",                 │
       │   isNowMain: true, ← It's live!       │
       │   approvedBy: "user@example.com"      │
       │ }                                      │
       └────────────────────────────────────────┘
       │
       │ 11. Show success notification
       │     "✅ Your changes are now live!"
       │
       ▼
     Done!
```

---

## Flow 2: Multiple Parallel Revisions

```
┌───────────────────────────────────────────────────────┐
│ Document: api/auth.md                                 │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Main Version (Grounded Truth)                        │
│ rev_main_100 [MAIN] ✓                                │
│ "Current authentication documentation"               │
│                                                       │
│ ─────────────────────────────────────────────────── │
│                                                       │
│ Pending Revisions:                                   │
│                                                       │
│ rev_prop_101 [PROPOSED] ⏳                           │
│ "Add OAuth 2.0 examples"                             │
│ Proposed by: AI (Claude via MCP)                     │
│ Status: Waiting for approval                         │
│                                                       │
│ rev_prop_102 [PROPOSED] ⏳                           │
│ "Fix typos and grammar"                              │
│ Proposed by: AI (Cursor via MCP)                     │
│ Status: Waiting for approval                         │
│                                                       │
│ rev_draft_103 [DRAFT] 📝                             │
│ "Restructure sections"                               │
│ Proposed by: AI (Claude Code via MCP)                │
│ Status: Draft, not yet proposed                      │
│                                                       │
└───────────────────────────────────────────────────────┘

User Actions:

Option 1: Approve rev_prop_101
  ↓
rev_main_100 → [ARCHIVED]
rev_prop_101 → [MAIN] ✓ ← New grounded truth
rev_prop_102 → [CONFLICTED] ⚠️ ← Based on old main
rev_draft_103 → [CONFLICTED] ⚠️ ← Based on old main

Option 2: Approve rev_prop_102 first
  ↓
rev_main_100 → [ARCHIVED]
rev_prop_102 → [MAIN] ✓ ← New grounded truth
rev_prop_101 → [CONFLICTED] ⚠️ ← Based on old main
rev_draft_103 → [CONFLICTED] ⚠️ ← Based on old main

Option 3: Reject both, approve none
  ↓
rev_main_100 → [MAIN] ✓ ← Still the truth
rev_prop_101 → [REJECTED] ✗
rev_prop_102 → [REJECTED] ✗
rev_draft_103 → [DRAFT] 📝 ← Still working
```

---

## Flow 3: Conflict Detection & Resolution

```
Timeline:

T0: Main version
┌─────────────────────────────────────┐
│ rev_main_100 [MAIN]                │
│ "Section 1: Intro"                  │
│ "Section 2: Setup"                  │
└─────────────────────────────────────┘

T1: AI creates revision A based on main
┌─────────────────────────────────────┐
│ rev_A [PROPOSED]                    │
│ Based on: rev_main_100             │
│ Changes: "Updated Section 1"        │
└─────────────────────────────────────┘

T2: AI creates revision B based on same main
┌─────────────────────────────────────┐
│ rev_B [PROPOSED]                    │
│ Based on: rev_main_100             │
│ Changes: "Updated Section 1" (different!)│
└─────────────────────────────────────┘

T3: User approves revision A
┌─────────────────────────────────────┐
│ rev_main_100 → [ARCHIVED]          │
│ rev_A → [MAIN] ✓ New truth         │
└─────────────────────────────────────┘

T4: Conflict detected for revision B
┌─────────────────────────────────────┐
│ rev_B [CONFLICTED] ⚠️              │
│ Based on: rev_main_100 (old)       │
│ Current main: rev_A (new)          │
│ Conflict: Section 1 modified in both│
└─────────────────────────────────────┘

T5: MCP polls status of revision B
┌──────────────┐
│ Cursor IDE   │
└──────┬───────┘
       ├──────────────────────────────────┐
       │ GET get_revision_status("rev_B") │
       │ ◄────────────────────────────────┤
       │ Response: {                      │
       │   status: "conflicted",          │
       │   reason: "Base has changed",   │
       │   currentMainId: "rev_A",       │
       │   needsRebase: true             │
       │ }                                │
       └──────────────────────────────────┘

T6: AI rebases revision B on new main
┌──────────────┐
│ Cursor IDE   │
└──────┬───────┘
       │ 1. Read new main (rev_A)
       │ 2. Re-apply changes from rev_B
       │ 3. Create new revision C
       │
       ├──────────────────────────────────┐
       │ POST create_revision({           │
       │   path: "api/auth.md",          │
       │   content: "...merged...",      │
       │   title: "Updated Section 1 (rebased)",│
       │   basedOn: "rev_A", ← New base  │
       │   replacedRevisionId: "rev_B"   │
       │ })                               │
       └──────────────────────────────────┘

T7: New revision proposed
┌─────────────────────────────────────┐
│ rev_C [PROPOSED]                    │
│ Based on: rev_A (current main) ✓   │
│ Replaces: rev_B                     │
│ Status: Ready for review            │
└─────────────────────────────────────┘
```

---

## Flow 4: MCP Bidirectional Communication

```
┌──────────────────────────────────────────────────────┐
│ MCP Client (Claude Desktop)                          │
└────────────┬─────────────────────────────────────────┘
             │
             │ Direction 1: READ (Already implemented)
             │
             ├─────────────────────────────────────────┐
             │ read_document("api/auth.md")            │
             │ ◄───────────────────────────────────────┤
             │ Returns: Main grounded version          │
             └─────────────────────────────────────────┘
             │
             │ Direction 2: WRITE (Proposals)
             │
             ├─────────────────────────────────────────┐
             │ create_revision({...})                  │
             │ ◄───────────────────────────────────────┤
             │ Returns: Revision created, needs approval│
             └─────────────────────────────────────────┘
             │
             │ Direction 3: STATUS CHECK (NEW!)
             │
             ├─────────────────────────────────────────┐
             │ get_revision_status("rev_123")          │
             │ ◄───────────────────────────────────────┤
             │ Returns: "approved" | "rejected" | "pending"│
             └─────────────────────────────────────────┘
             │
             │ Direction 4: LIST REVISIONS (NEW!)
             │
             ├─────────────────────────────────────────┐
             │ list_revisions("api/auth.md")           │
             │ ◄───────────────────────────────────────┤
             │ Returns: All revisions + statuses       │
             └─────────────────────────────────────────┘
             │
             │ Direction 5: UPDATE/REBASE (NEW!)
             │
             ├─────────────────────────────────────────┐
             │ update_revision("rev_123", {...})       │
             │ ◄───────────────────────────────────────┤
             │ Returns: Updated revision               │
             └─────────────────────────────────────────┘
             │
             ▼

Benefits of Bidirectional Flow:
✓ AI can check if changes were approved
✓ AI can rebase on conflicts
✓ AI can see all pending revisions
✓ AI can update drafts before proposing
✓ Better collaboration loop
```

---

## Flow 5: Web UI + MCP Integration

```
┌─────────────────────────────────────────────────────────┐
│ Complete System Flow                                    │
└─────────────────────────────────────────────────────────┘

     User (Web UI)                    MCP Client (AI)
           │                                │
           │                                │
           ├────── Document State ──────────┤
           │                                │
           │         Main Version           │
           │      rev_main_100 [✓]         │
           │                                │
           │◄───────── Can read ────────────┤
           │──────────► Can read ───────────┤
           │                                │
           │                                │
           │                          1. AI reads main
           │                          2. AI creates draft
           │                                │
           │                          rev_draft_101 [📝]
           │                                │
           │                          3. AI shows to user in IDE
           │                          4. User says "propose"
           │                          5. AI proposes
           │                                │
           │                          rev_prop_101 [⏳]
           │                                │
           │◄─── Notification ─────────────┤
           │ "AI proposed changes"          │
           │                                │
    6. User opens web UI                   │
    7. Reviews diff                         │
           │                                │
    8a. [Approve]                           │
       │                                    │
       ├── Main updates                    │
       │   rev_prop_101 → [MAIN] ✓         │
       │                                    │
       ├── Webhook/Notify ─────────────────┤
       │                                    │
       │                          9. AI polls status
       │                          10. AI sees "approved"
       │                          11. AI notifies user
       │                               "✅ Changes live!"
       │                                    │
    8b. [Reject]                            │
       │                                    │
       ├── Mark rejected ──────────────────┤
       │   rev_prop_101 → [REJECTED] ✗     │
       │                                    │
       │                          9. AI polls status
       │                          10. AI sees "rejected"
       │                          11. AI can revise or discard
       │                                    │
           │                                │
           ▼                                ▼

Result: Seamless collaboration between
        human (web UI) and AI (MCP)
```

---

## Decision Summary

### ✅ RECOMMENDED: Hybrid Revision System

**Why:**
1. **Grounded Truth** - Clear "main" version that MCP clients can rely on
2. **Drafts** - AI can work on changes before proposing
3. **Bidirectional** - AI can check status, rebase, update
4. **Multiple Revisions** - Support parallel suggestions
5. **Conflict Detection** - Automatic detection and resolution
6. **Simple** - Easier than git branches
7. **Powerful** - More flexible than simple proposals

**What it solves:**
- ✅ "Which version is truth?" → Main revision with isMain=true
- ✅ "Can AI see proposal status?" → Yes, get_revision_status()
- ✅ "Can AI create drafts?" → Yes, status="draft"
- ✅ "How to handle conflicts?" → Automatic detection + rebase
- ✅ "Can have multiple pending?" → Yes, unlimited revisions
- ✅ "Bidirectional flow?" → Yes, full read/write/status

**Next Steps:**
1. Update database schema (Revision model)
2. Implement revision API endpoints
3. Add MCP tools (create, propose, status, list)
4. Build revision review UI
5. Add conflict detection

**Should we implement this?** 🚀
