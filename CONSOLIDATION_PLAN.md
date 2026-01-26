# Knowledge System Consolidation Plan

## Problem Statement

The current implementation has **functional bloat** with a separate "Knowledge" tab that duplicates existing document management functionality. This creates:
- Confusing UX (two places to manage documents)
- Unnecessary navigation complexity
- Redundant UI components
- Maintenance burden

## Current System Analysis

### Project Page (`/projects/[slug]`)
**Current Features:**
- Document tree view with folders
- "New Document" button (creates empty .md file)
- Audit metrics card
- Open proposals section
- Navigation: Knowledge | Connect | Settings

**Missing:**
- Grounding controls
- Bulk upload capability
- Module decomposition preview
- Conflict visibility

### Knowledge Page (`/projects/[slug]/knowledge`)
**Current Features:**
- 4-tab interface: Upload | Library | Grounding | Conflicts
- Bulk file upload with drag-and-drop
- Module decomposition preview
- Grounding toggles per module
- Conflict resolution interface
- Knowledge health metrics dashboard

**Duplication:**
- Library tab shows same documents as Project page
- Both have document management

## Database Schema (Solid Foundation)

✅ **Keep As-Is** - The backend is well-designed:

```prisma
Document {
  // Existing fields
  groundingState: String  // "ungrounded" | "grounded" | "deprecated"
  editorialState: String  // "draft" | "review" | "active" | "archived"
  uploadState: String     // "raw" | "processing" | "ready" | "failed"

  // Relations
  modules: DocumentModule[]
}

DocumentModule {
  isGrounded: Boolean
  confidenceScore: Float
  moduleType: String
  tags: Json
  conflicts: ModuleConflict[]
}

ModuleConflict {
  severity: String  // "critical" | "high" | "medium" | "low"
  status: String    // "open" | "resolved" | "ignored"
}
```

✅ **Keep As-Is** - API routes are comprehensive:
- `/api/projects/[slug]/knowledge/*` (15+ endpoints)
- Audit logging integrated
- MCP tools for AI agents

## Consolidation Strategy

### Option A: Single Unified View (RECOMMENDED)

**Consolidate everything into the main Project page with enhanced DocumentTree**

#### Changes to Project Page:

1. **Enhanced Document Tree** - Add inline metadata:
   ```
   📁 architecture/
   └── 📄 overview.md ✅ Grounded | ⚠️ 2 conflicts | 5 modules
   ```

2. **Smart "New Document" Button** - Dual mode:
   - Click: Create empty document (current behavior)
   - Dropdown arrow: Show "Upload Files" option

3. **Document Actions Menu** (right-click or •••):
   ```
   - Edit content
   - View modules (if decomposed)
   - Ground/Unground
   - Resolve conflicts
   - Delete
   ```

4. **Filter Bar** (above DocumentTree):
   ```
   All | 📗 Grounded | 📙 Ungrounded | ⚠️ Conflicts | 📦 Processing
   ```

5. **Expandable Sections** (optional accordion below Audit Card):
   ```
   📊 Knowledge Health
   ├─ 45/50 documents grounded (90%)
   ├─ 3 open conflicts
   └─ View Details →
   ```

6. **Module View Modal** - Click document → See modules:
   ```
   architecture/overview.md
   ├─ Introduction ✅
   ├─ Core Concepts ✅
   ├─ API Design ⚠️ Conflict
   └─ Future Work ⬜ Not grounded
   ```

#### What Gets Removed:
- ❌ Separate `/knowledge` page entirely
- ❌ Knowledge navigation button
- ❌ 600 lines of duplicate UI code

#### What Gets Added to Project Page:
- ✅ Grounding badge on each document
- ✅ Conflict count indicator
- ✅ Module count badge
- ✅ Upload files option
- ✅ Filter/sort controls
- ✅ Quick actions menu

---

### Option B: Keep Separate But Minimal

**Keep Knowledge tab for power users, basic controls in Documents**

#### Project Page Changes:
- Add grounding checkbox to each document
- Add conflict badges
- Add "Upload Files" button

#### Knowledge Page Changes:
- Remove "Library" tab (redundant)
- Keep only:
  - **Bulk Upload** (50+ files at once)
  - **Conflict Resolution** (side-by-side comparison)
  - **Analytics Dashboard** (metrics deep-dive)

#### Use Case Split:
- **Project Page**: Daily editing, quick grounding, single doc management
- **Knowledge Tab**: Bulk operations, conflict analysis, admin tasks

---

## Recommendation: Option A (Single Unified View)

### Why?

1. **Simpler Mental Model**: One place to manage documents
2. **Better Discoverability**: Grounding is visible where docs live
3. **Less Navigation**: No tab switching
4. **Easier Maintenance**: One UI to maintain
5. **Progressive Disclosure**: Advanced features in modals/dropdowns

### Implementation Phases

#### Phase 1: Enhance Project Page (2-3 hours)
1. Add grounding badges to DocumentTree nodes
2. Add filter bar (All | Grounded | Ungrounded | Conflicts)
3. Add "Upload Files" option to New Document button
4. Add document action menu (•••)

#### Phase 2: Module View Modal (1-2 hours)
5. Create ModuleListModal component
6. Show modules when clicking grounded document
7. Allow toggling grounding per module

#### Phase 3: Conflict Resolution Modal (2 hours)
8. Create ConflictResolutionModal (reuse from Knowledge page)
9. Open from conflict badge click
10. Show side-by-side comparison

#### Phase 4: Cleanup (1 hour)
11. Remove Knowledge navigation button
12. Remove `/knowledge` page
13. Delete unused components
14. Update documentation

**Total Effort: 6-8 hours**
**Lines of Code Removed: ~600**
**User Confusion Reduced: 100%**

---

## File-by-File Changes

### Files to Modify:

1. **`app/projects/[slug]/page.tsx`**
   - Add grounding state to document fetch
   - Add filter state management
   - Add upload file handler
   - Enhance DocumentTree with badges

2. **`components/documents/DocumentTree.tsx`**
   - Add grounding badge display
   - Add conflict count badge
   - Add module count badge
   - Add action menu (•••)

3. **`components/documents/DocumentNode.tsx`** (create)
   - Individual document node with metadata
   - Grounding toggle
   - Conflict indicator
   - Action dropdown

4. **`components/modals/ModuleListModal.tsx`** (create)
   - List modules for document
   - Toggle grounding per module
   - Show conflicts inline

5. **`components/modals/ConflictResolutionModal.tsx`** (move from knowledge/)
   - Side-by-side comparison
   - Resolution options
   - Apply/dismiss actions

### Files to Delete:

1. **`app/projects/[slug]/knowledge/page.tsx`** (600 lines)
2. **`components/knowledge/UploadWorkflow.tsx`**
3. **`components/knowledge/GroundedDocumentCard.tsx`**
4. **`components/knowledge/GroundingDashboard.tsx`**
5. **`components/knowledge/HealthMetricsWidget.tsx`**
6. **`components/knowledge/CategoryBreakdownWidget.tsx`**

**Keep these (reusable):**
- `components/knowledge/ConflictCard.tsx` → move to `components/modals/`
- `components/knowledge/GroundingStatusBadge.tsx` → move to `components/ui/`

### API Routes (NO CHANGES NEEDED):
✅ All 15+ knowledge API routes remain functional
✅ MCP tools unchanged
✅ Audit logging unchanged
✅ Database schema unchanged

---

## Wireframe: Enhanced Project Page

```
┌─────────────────────────────────────────────────┐
│ ← Back to Projects                              │
│                                                  │
│ My API Documentation                /my-api-docs│
├─────────────────────────────────────────────────┤
│                                                  │
│ 📊 Audit Score: 85%  [Run Audit]               │
│                                                  │
├─────────────────────────────────────────────────┤
│ Documents                      [↑ Upload] [New] │
├─────────────────────────────────────────────────┤
│ Filter: [All ▼] [🔍 Search...]                 │
│                                                  │
│ 📁 architecture/                                │
│   📄 overview.md         ✅ •5 modules  •••     │
│   📄 decisions.md        ⚠️ •2 conflicts •••    │
│                                                  │
│ 📁 api/                                         │
│   📄 authentication.md   ✅ •8 modules  •••     │
│   📄 endpoints.md        📙 Ungrounded  •••     │
│                                                  │
│ 📄 README.md             ✅ •3 modules  •••     │
│                                                  │
├─────────────────────────────────────────────────┤
│ Knowledge Health                        [View →]│
│ 45/50 grounded (90%) • 3 conflicts              │
└─────────────────────────────────────────────────┘
```

### Document Action Menu (•••):
```
┌──────────────────────┐
│ Edit content         │
│ View modules         │  ← Opens modal
│ ✅ Ground document   │
│ ⚠️ Resolve conflicts │  ← Opens modal
│ 🗑️ Delete            │
└──────────────────────┘
```

---

## Risk Analysis

### Low Risk:
✅ Backend is solid (no DB changes)
✅ API routes work as-is
✅ Can implement incrementally
✅ Easy rollback (just revert UI)

### Medium Risk:
⚠️ User adjustment period (but simpler UX)
⚠️ Need to migrate any users actively using Knowledge tab

### Mitigation:
- Add "Quick Tour" tooltip on first visit
- Show changelog announcing consolidation
- Keep Knowledge page URL as redirect for 2 weeks

---

## Success Metrics

After consolidation:
- ✅ 1 page instead of 2 for document management
- ✅ ~600 lines of code removed
- ✅ Faster user workflows (no tab switching)
- ✅ Better discoverability of grounding features
- ✅ Reduced maintenance burden

---

## Questions for User

1. **Approve Option A (Single Unified View)?**
   - Or prefer Option B (Keep minimal Knowledge tab)?

2. **Phased Rollout?**
   - Implement Phase 1 first, get feedback?
   - Or all phases at once?

3. **Keep Knowledge Health Dashboard?**
   - As expandable section on Project page?
   - Or remove entirely (metrics in audit)?

4. **Module Decomposition Preview?**
   - Keep the multi-step upload workflow?
   - Or simplify to just "upload → auto-process"?

---

## Next Steps

**Once approved:**
1. Create feature branch: `consolidate-knowledge-ui`
2. Implement Phase 1 (enhanced DocumentTree)
3. Test with existing data
4. Get user feedback
5. Complete remaining phases
6. Remove Knowledge page
7. Update docs
