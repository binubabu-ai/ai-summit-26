# Help Documentation Issues & Fix Plan

## Issues Identified

### 1. **Branding Inconsistency**
- **Problem**: All help pages say "AI Summit" instead of "Docjays"
- **Impact**: Confusing for users, breaks brand identity
- **Files Affected**:
  - `app/help/page.tsx` - "AI Summit Documentation"
  - `app/help/getting-started/page.tsx` - "AI Summit" throughout
  - `app/help/api/mcp/page.tsx` - "AI Summit" references
  - `app/help/faq/page.tsx` - "AI Summit" in multiple places
  - `components/help/HelpSidebar.tsx` - Metadata titles

### 2. **Layout/Padding Issue**
- **Problem**: Content hidden under fixed AppNav (z-50, top-0, h-20)
- **Impact**: Users can't see top of content, sidebar cuts off
- **Root Cause**: AppNav is fixed at top with h-20 (80px), but help layout doesn't account for this
- **Current**: `app/help/layout.tsx` has no top padding
- **Fix Needed**: Add `pt-32` (128px) or `pt-24` (96px) to main content area

### 3. **Design Language Mismatch**
- **Problem**: Help pages don't match app aesthetic
- **Impact**: Looks like different application, breaks user experience

#### App Design Language:
- **Colors**: Neutral palette (neutral-50/950, black/white)
- **Typography**:
  - Large headings: text-5xl/6xl with font-light
  - Body: text-lg/xl with font-light
  - Muted text: neutral-600/400 (not muted-foreground)
- **Spacing**: Large padding (pt-32, px-6 lg:px-16)
- **Layout**: max-w-[1600px] mx-auto
- **Cards**: Minimal Card component, no border-primary hover states
- **Buttons**: Clean Button component with ghost/primary variants

#### Help Pages Current Issues:
- Uses `prose` classes (Tailwind typography)
- Uses `text-muted-foreground`, `bg-accent`, `border-primary`
- Smaller headings (text-4xl vs text-5xl/6xl)
- Different hover states (border-primary, shadow-lg)
- Uses details/summary for FAQ (not matching app patterns)
- Sidebar uses different styling

### 4. **Broken Links (404s)**
- **Problem**: Sidebar links to unimplemented pages
- **Impact**: Users click links and get 404 errors

#### Implemented Pages:
- ✅ `/help` (hub)
- ✅ `/help/getting-started`
- ✅ `/help/api/mcp`
- ✅ `/help/faq`

#### Broken Links in Sidebar:
- ❌ `/help/getting-started/first-project`
- ❌ `/help/getting-started/team-setup`
- ❌ `/help/guides/projects`
- ❌ `/help/guides/documents`
- ❌ `/help/guides/revisions`
- ❌ `/help/guides/ai-features`
- ❌ `/help/guides/audit`
- ❌ `/help/api` (overview page)
- ❌ `/help/api/rest`
- ❌ `/help/troubleshooting`
- ❌ `/help/support`

## Fix Plan

### Phase 1: Critical Fixes (Immediate)

#### 1.1 Fix Branding
- [ ] Replace "AI Summit" with "Docjays" in all help pages
- [ ] Update metadata titles
- [ ] Update all content references

#### 1.2 Fix Layout Padding
- [ ] Add `pt-24` or `pt-28` to help layout main content area
- [ ] Test that content is visible below AppNav
- [ ] Adjust sidebar sticky positioning

#### 1.3 Remove Broken Links from Sidebar
- [ ] Update `HelpSidebar.tsx` to only show implemented pages:
  - Getting Started (single link to /help/getting-started)
  - API & Integration (MCP only)
  - FAQ
  - Remove "Guides" section entirely (not implemented)
  - Remove "Resources" section links (not implemented)

### Phase 2: Design Alignment (Important)

#### 2.1 Update Help Layout
```tsx
// app/help/layout.tsx changes:
- Remove prose classes
- Use neutral color scheme
- Match app typography (font-light, larger sizes)
- Use max-w-[1600px] container
- Match app spacing patterns
```

#### 2.2 Redesign Help Pages
Each page needs:
- Larger headings (text-5xl/6xl font-light)
- Neutral colors (neutral-600/400 instead of muted-foreground)
- Remove accent backgrounds
- Remove border-primary hover states
- Use app's Card component patterns
- Match button styles

#### 2.3 Redesign FAQ Page
- Replace details/summary with Card components
- Match app's accordion patterns (if any)
- Use neutral styling

#### 2.4 Update Sidebar
- Remove prose prose-sm
- Use neutral colors
- Simplify hover states
- Match app navigation patterns

### Phase 3: Content Improvements (Optional)

#### 3.1 Consolidate Getting Started
- Merge all getting started content into single page
- Remove subpage references

#### 3.2 Add Essential Pages Only
If time permits, create only these:
- [ ] `/help/api` - API overview (redirect to MCP for now)
- [ ] `/help/support` - Contact/support page

## Implementation Order

1. **Fix branding** (search and replace across all files)
2. **Fix layout padding** (single line change)
3. **Remove broken links** (update sidebar)
4. **Test basic functionality** (ensure pages load, navigation works)
5. **Redesign layout** (match app aesthetic)
6. **Redesign individual pages** (one by one)

## Color/Style Reference

### App Palette:
- Background: `bg-white dark:bg-black` or `bg-neutral-50 dark:bg-neutral-950`
- Cards: `bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800`
- Text Primary: `text-black dark:text-white`
- Text Secondary: `text-neutral-600 dark:text-neutral-400`
- Text Tertiary: `text-neutral-500 dark:text-neutral-500`
- Borders: `border-neutral-200 dark:border-neutral-800`
- Hover: `hover:bg-neutral-100 dark:hover:bg-neutral-900`

### Help Pages Currently Use (WRONG):
- `text-muted-foreground` → Change to `text-neutral-600 dark:text-neutral-400`
- `bg-accent` → Change to `bg-neutral-100 dark:bg-neutral-900`
- `border-primary` → Change to `border-neutral-200 dark:border-neutral-800`
- `hover:border-primary` → Change to `hover:border-neutral-300 dark:hover:border-neutral-700`
- `text-primary` → Change to `text-black dark:text-white` for emphasis

## Files to Modify

1. `app/help/layout.tsx` - Add padding, remove prose, update colors
2. `components/help/HelpSidebar.tsx` - Remove broken links, update styling
3. `components/help/HelpBreadcrumb.tsx` - Update colors
4. `app/help/page.tsx` - Fix branding, update design
5. `app/help/getting-started/page.tsx` - Fix branding, update design
6. `app/help/api/mcp/page.tsx` - Fix branding, update design
7. `app/help/faq/page.tsx` - Fix branding, redesign FAQ items

## Success Criteria

- [ ] No "AI Summit" references (all say "Docjays")
- [ ] Content visible below AppNav (not hidden)
- [ ] No 404 links in navigation
- [ ] Visual design matches dashboard/landing pages
- [ ] Typography matches app (large, light, spacious)
- [ ] Colors match neutral palette
- [ ] Mobile responsive
- [ ] Dark mode works correctly

---

**Priority**: Phase 1 fixes are CRITICAL and should be done immediately.
**Estimated Time**:
- Phase 1: ~30 minutes
- Phase 2: ~2 hours
- Phase 3: ~1 hour (optional)
