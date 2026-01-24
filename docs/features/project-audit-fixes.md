# Project Audit & Fixes - Feature Specification

## Overview
Comprehensive audit and fixes for project creation, routing, navigation, and UX improvements.

## Issues Identified

### 🐛 Critical Bugs
1. **Project Detail Page 404 Error**
   - **Issue**: Page fetches `/api/projects/${id}` which doesn't exist (only slug-based routes available)
   - **Location**: `app/projects/[slug]/page.tsx:62`
   - **Impact**: All projects show "Project Not Found" after creation

2. **Missing Loading States**
   - **Issue**: Create project form has no loading/submitting state
   - **Location**: `app/dashboard/page.tsx:72-93`
   - **Impact**: Poor UX, users may double-click and create duplicates

3. **No Project Deletion**
   - **Issue**: Users cannot delete projects from settings
   - **Location**: Settings page lacks delete functionality
   - **Impact**: No way to remove unwanted projects

### 🎨 UX/UI Improvements Needed
1. **MCP Configuration in Wrong Place**
   - Currently buried in Settings → API Keys
   - Should be a dedicated top-level menu item
   - MCP is a key feature, deserves better visibility

2. **Poor Project Navigation**
   - No breadcrumbs
   - No project-level sidebar/menu
   - Hard to navigate between documents, settings, and MCP

3. **Inconsistent Layouts**
   - Some pages use different max-widths
   - Inconsistent padding and spacing

## Implementation Plan

### Phase 1: Critical Bug Fixes (Priority: URGENT)

#### 1.1 Fix Project Detail Page Routing
**Files to Modify**:
- `app/projects/[slug]/page.tsx`
- Create `app/api/projects/[slug]/route.ts` (GET endpoint)

**Changes**:
```typescript
// app/projects/[slug]/page.tsx
const fetchProject = async () => {
  try {
    // ❌ OLD: Fetch by ID
    // const res = await fetch(`/api/projects/${found.id}`);

    // ✅ NEW: Fetch by slug directly
    const res = await fetch(`/api/projects/${resolvedParams.slug}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    } else {
      console.error('Project not found');
    }
  } catch (error) {
    console.error('Failed to fetch project:', error);
  } finally {
    setLoading(false);
  }
};
```

**New API Endpoint**:
```typescript
// app/api/projects/[slug]/route.ts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      docs: {
        orderBy: { path: 'asc' },
        select: {
          id: true,
          path: true,
          updatedAt: true,
        },
      },
      proposals: {
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          docs: true,
          proposals: true,
          members: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

export async function PATCH(/* update project */) { /* ... */ }
export async function DELETE(/* delete project */) { /* ... */ }
```

#### 1.2 Add Loading States to Project Creation
**File**: `app/dashboard/page.tsx`

**Changes**:
```typescript
const [creating, setCreating] = useState(false);

const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  setCreating(true); // ✅ Show loading state

  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const newProject = await res.json();
      setFormData({ name: '', slug: '' });
      setShowCreateForm(false);
      fetchProjects();
      // Redirect to new project
      router.push(`/projects/${newProject.slug}`);
    } else {
      const error = await res.json();
      alert(error.error || 'Failed to create project');
    }
  } catch (error) {
    console.error('Failed to create project:', error);
    alert('Failed to create project');
  } finally {
    setCreating(false); // ✅ Hide loading state
  }
};
```

**UI Update**:
```tsx
<Button
  type="submit"
  disabled={creating || !formData.name || !formData.slug}
>
  {creating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Creating...
    </>
  ) : (
    'Create Project'
  )}
</Button>
```

#### 1.3 Add Project Deletion
**Files**:
- `app/api/projects/[slug]/route.ts` (add DELETE handler)
- `app/projects/[slug]/settings/page.tsx` (add delete UI)

**API Endpoint**:
```typescript
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await context.params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Only owner can delete
  if (project.ownerId !== user.id) {
    return NextResponse.json(
      { error: 'Only project owner can delete the project' },
      { status: 403 }
    );
  }

  // Delete project (cascades to all related data)
  await prisma.project.delete({
    where: { id: project.id },
  });

  return NextResponse.json({ success: true });
}
```

**Settings UI**:
Add a "Danger Zone" section at the bottom of settings with:
- Big red "Delete Project" button
- Confirmation modal requiring user to type project name
- Warning about data loss

---

### Phase 2: Navigation Restructure (Priority: HIGH)

#### 2.1 Create Project-Level Sidebar
**New Component**: `components/layout/ProjectSidebar.tsx`

**Structure**:
```
┌─────────────────────┐
│ 🏠 Dashboard        │
├─────────────────────┤
│ Project: Vortex     │
├─────────────────────┤
│ 📄 Documents        │
│ 🔀 Revisions        │
│ 🔌 MCP Config       │  ← NEW: Dedicated menu item
│ ⚙️  Settings        │
│   ├─ General        │
│   ├─ Team           │
│   └─ API Keys       │
└─────────────────────┘
```

**Features**:
- Collapsible on mobile
- Active state indicators
- Breadcrumbs at top
- Quick project switcher dropdown

#### 2.2 Create MCP Configuration Page
**New Page**: `app/projects/[slug]/mcp/page.tsx`

**Sections**:
1. **Getting Started**
   - What is MCP?
   - Why use it with Docsjays?

2. **Generate API Key**
   - Button to create MCP-specific key
   - Shows key once with copy button

3. **Configuration Download**
   - Download button for `mcp-config.json`
   - Pre-filled with project URL and placeholder for API key

4. **IDE-Specific Instructions**
   - Tabs for Claude Desktop, Cursor, Windsurf
   - Step-by-step setup for each
   - Screenshots/GIFs

5. **Test Connection**
   - Button to test MCP endpoint
   - Shows status (connected/disconnected)
   - Lists available tools

6. **Usage Examples**
   - Code snippets showing MCP tools
   - Common workflows

#### 2.3 Update Navigation Structure
**AppNav (Top Bar)**:
- Logo + Dashboard link
- Project selector dropdown (if in project context)
- Theme toggle
- User menu

**ProjectSidebar (Left Side)**:
- Visible only within project pages
- Sticky positioning
- Collapsible on mobile

---

### Phase 3: UX Polish (Priority: MEDIUM)

#### 3.1 Add Breadcrumbs
**Component**: `components/layout/Breadcrumbs.tsx`

**Example**:
```
Dashboard > Vortex Metal AI > Documents > api/auth.md
```

#### 3.2 Improve Error Handling
- Toast notifications instead of alerts
- Proper error boundaries
- Loading skeletons instead of "Loading..."

#### 3.3 Add Empty States
- Empty project list
- Empty document list
- Empty team members
- Empty API keys

#### 3.4 Consistent Layouts
- Use `max-w-[1600px]` everywhere
- Consistent padding (px-6 lg:px-16)
- Consistent spacing between sections

---

### Phase 4: Database Integrity (Priority: LOW)

#### 4.1 Add Database Constraints
- Ensure slug uniqueness
- Add proper indexes
- Validate foreign keys

#### 4.2 Migration Script
- Check for orphaned records
- Fix inconsistent data
- Add missing fields

---

## File Structure After Changes

```
app/
├── projects/
│   └── [slug]/
│       ├── page.tsx (Documents - fixed routing)
│       ├── mcp/
│       │   └── page.tsx (NEW: MCP Config)
│       ├── settings/
│       │   └── page.tsx (Updated: Tabs + Delete)
│       └── docs/
│           └── [...path]/
│               └── page.tsx
├── api/
│   └── projects/
│       ├── route.ts (List all)
│       └── [slug]/
│           ├── route.ts (NEW: GET, PATCH, DELETE)
│           ├── api-keys/
│           ├── team/
│           └── ...
components/
├── layout/
│   ├── AppNav.tsx (Updated)
│   ├── ProjectSidebar.tsx (NEW)
│   └── Breadcrumbs.tsx (NEW)
└── ...
```

---

## Testing Checklist

### Bug Fixes
- [ ] Create new project → should show in dashboard
- [ ] Click project → should load project page (not 404)
- [ ] Create button shows loading state
- [ ] Cannot double-submit project creation
- [ ] Can delete project from settings
- [ ] Delete requires confirmation
- [ ] Delete removes all related data

### Navigation
- [ ] MCP page accessible from sidebar
- [ ] Settings organized into tabs
- [ ] Breadcrumbs show correct path
- [ ] Active menu items highlighted
- [ ] Mobile navigation works (collapsible sidebar)

### UX
- [ ] No more alert() calls (use toast)
- [ ] Loading states everywhere
- [ ] Empty states show helpful messages
- [ ] Consistent spacing and layouts

---

## Rollout Plan

### Week 1: Bug Fixes
1. Day 1: Fix routing (Phase 1.1)
2. Day 2: Add loading states (Phase 1.2)
3. Day 3: Add deletion (Phase 1.3)
4. Day 4-5: Testing and fixes

### Week 2: Navigation
1. Day 1-2: Build ProjectSidebar
2. Day 3-4: Create MCP page
3. Day 5: Update all pages to use new nav

### Week 3: Polish
1. Day 1-2: Breadcrumbs and error handling
2. Day 3-4: Empty states and consistency
3. Day 5: Final testing

---

## Success Metrics

1. **Zero 404 errors** on project pages
2. **< 2 second** project creation time
3. **100% test coverage** for critical paths
4. **Mobile responsive** navigation
5. **Clear MCP setup** (< 5 minutes for new users)

---

## Notes

- Use consistent loading patterns (Loader2 icon + "Loading...")
- All API errors should return structured JSON
- Toast library: Consider `sonner` or `react-hot-toast`
- Document all changes in CHANGELOG.md
