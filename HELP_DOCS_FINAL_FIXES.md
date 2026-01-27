# Help Documentation Final Fixes Plan

## Issues Identified

### Issue 1: Blue/Unreadable Text in Dark Mode (MCP Page)
**Problem**: The MCP integration page uses `text-muted-foreground`, `bg-muted`, `border-primary`, and `bg-accent` which render as blue/unreadable colors in dark mode.

**Affected File**: `app/help/api/mcp/page.tsx`

**Specific Problems**:
- Line 15, 23, 26, 55, 58, 83, 106, 125, 138, 143: `text-muted-foreground` (shows as blue in dark mode)
- Lines 87, 91, 95, 128: `bg-muted` (incorrect background color)
- Lines 52-53, 80-81, 103-104, 135-136: `border-primary/20` and `bg-primary` (primary color borders/backgrounds)
- Line 141: `bg-accent/50` (accent background)
- Typography: Still uses old smaller sizes (text-4xl, text-2xl, text-xl)

### Issue 2: Missing IDE Integration Options
**Problem**: The help documentation ONLY mentions Claude Desktop, but the `/projects/[slug]/connect` page actually supports:
- ✅ Claude Desktop (implemented)
- ✅ Cursor (implemented)
- ✅ Windsurf (implemented)
- ✅ Claude Code CLI (implemented)
- ✅ VS Code with Continue extension (implemented)

**Gap**:
- Help docs are Claude Desktop-specific
- Page title: "MCP Integration with Claude Desktop" (too narrow)
- No mention of Cursor, Windsurf, VS Code, or Claude Code
- Users don't know they can use these other tools

**Evidence**:
- `lib/mcp/ide-metadata.ts` defines all 5 IDE options
- `components/connect/IdeConfigTabs.tsx` renders tabs for all IDEs
- `app/projects/[slug]/connect/page.tsx` shows IDE selection interface
- But `app/help/api/mcp/page.tsx` only documents Claude Desktop

---

## Fix Plan

### Phase 1: Fix Dark Mode Text Colors (MCP Page) - URGENT

#### 1.1 Replace All Color Classes
**Target**: `app/help/api/mcp/page.tsx`

Replace:
- `text-muted-foreground` → `text-neutral-600 dark:text-neutral-400`
- `bg-muted` → `bg-neutral-100 dark:bg-neutral-900`
- `border-primary/20` → `border-neutral-200 dark:border-neutral-800`
- `bg-primary` → `bg-black dark:bg-white`
- `bg-accent/50` → `bg-neutral-100 dark:bg-neutral-900`

#### 1.2 Update Typography
- `text-4xl font-bold` → `text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white`
- `text-2xl font-bold` → `text-3xl font-light text-black dark:text-white`
- `text-xl` → `text-lg text-neutral-600 dark:text-neutral-400`

#### 1.3 Redesign Step Timeline
- Replace primary-colored borders/dots with neutral colors
- Match the getting started page design pattern
- Use step badges: `bg-black dark:bg-white text-white dark:text-black`

#### 1.4 Update Code Blocks Background
- Currently uses `bg-muted`
- Should use `bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800`

### Phase 2: Expand MCP Documentation to Cover All IDEs

#### 2.1 Update Page Title & Metadata
**Current**:
```tsx
title: 'MCP Integration - Docjays Help'
description: 'Connect Claude Desktop to your Docjays documentation'
<h1>MCP Integration with Claude Desktop</h1>
```

**New**:
```tsx
title: 'MCP Integration - Docjays Help'
description: 'Connect AI assistants (Claude Desktop, Cursor, Windsurf, VS Code) to your Docjays documentation'
<h1>MCP Integration</h1>
<p>Connect your AI assistant to Docjays documentation using the Model Context Protocol (MCP)</p>
```

#### 2.2 Add "Supported AI Assistants" Section
**After "What is MCP?" section, add**:

```tsx
<section>
  <h2>Supported AI Assistants</h2>
  <p>Docjays supports MCP integration with the following AI assistants:</p>

  <div className="grid gap-4">
    <IdeCard
      icon={<Sparkles />}
      name="Claude Desktop"
      description="Official Claude desktop application"
      platforms={['macOS', 'Windows']}
      href="#claude-desktop"
    />
    <IdeCard
      icon={<Code2 />}
      name="Cursor"
      description="AI-first code editor with built-in MCP support"
      platforms={['macOS', 'Windows', 'Linux']}
      href="#cursor"
    />
    <IdeCard
      icon={<Wind />}
      name="Windsurf"
      description="Collaborative IDE with MCP integration"
      platforms={['macOS', 'Windows', 'Linux']}
      href="#windsurf"
    />
    <IdeCard
      icon={<Terminal />}
      name="Claude Code CLI"
      description="Terminal-based AI assistant"
      platforms={['macOS', 'Windows', 'Linux']}
      href="#claude-code"
    />
    <IdeCard
      icon={<Boxes />}
      name="VS Code (Continue)"
      description="Continue extension for Visual Studio Code"
      platforms={['macOS', 'Windows', 'Linux']}
      href="#vscode"
    />
  </div>
</section>
```

#### 2.3 Create IDE-Specific Setup Instructions

**Structure**:
```
## Setup Instructions

### General Setup Steps
1. Generate an API Key
2. Locate your AI assistant's configuration
3. Add Docjays configuration
4. Restart/reload your AI assistant

### IDE-Specific Guides

#### Claude Desktop
[Current detailed instructions]

#### Cursor
**Config Location**: Settings > MCP Servers
**Steps**:
1. Open Cursor settings
2. Navigate to MCP Servers
3. Click "Add Server"
4. Configure [show config]

#### Windsurf
[Instructions specific to Windsurf]

#### Claude Code CLI
**Config Location**: `~/.config/claude-code/mcp.json`
[Instructions]

#### VS Code (Continue)
**Extension**: Continue
**Config Location**: VS Code Settings > Extensions > Continue
[Instructions]
```

#### 2.4 Add "Quick Setup" Alternative
For users who already have a project:

```tsx
<div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
  <h3 className="font-medium mb-2">✨ Quick Setup</h3>
  <p className="text-sm mb-4">
    For a guided setup experience with auto-generated configs for your IDE:
  </p>
  <Link
    href={`/projects/${projectSlug}/connect`}
    className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md"
  >
    Go to Connect Page <ArrowRight className="w-4 h-4" />
  </Link>
</div>
```

### Phase 3: Update FAQ Page

#### 3.1 Update MCP Integration Questions
**Current**: Only mentions Claude Desktop

**Update Questions**:
- "What is MCP?" → Mention all supported assistants
- "How do I set up MCP?" → Reference both Claude Desktop AND other options
- "Can I use MCP with other AI tools?" → YES! List Cursor, Windsurf, Claude Code, VS Code

**Add New Question**:
```tsx
<FAQItem
  question="Which AI assistants work with Docjays MCP?"
  answer={
    <div>
      <p className="mb-2">Docjays MCP integration works with:</p>
      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
        <li><strong>Claude Desktop</strong> - Official desktop app (macOS, Windows)</li>
        <li><strong>Cursor</strong> - AI code editor (all platforms)</li>
        <li><strong>Windsurf</strong> - Collaborative IDE (all platforms)</li>
        <li><strong>Claude Code</strong> - CLI tool (all platforms)</li>
        <li><strong>VS Code</strong> - With Continue extension (all platforms)</li>
      </ul>
      <p className="mt-2">
        See our <Link href="/help/api/mcp">MCP Integration Guide</Link> for setup instructions.
      </p>
    </div>
  }
/>
```

### Phase 4: Update Help Hub Page

#### 4.1 Update API & Integration Card
**Current**:
```tsx
<HelpCard
  title="MCP Integration"
  description="Connect Claude Desktop to your documentation"
  href="/help/api/mcp"
/>
```

**New**:
```tsx
<HelpCard
  title="MCP Integration"
  description="Connect AI assistants (Claude, Cursor, Windsurf, VS Code) to your docs"
  href="/help/api/mcp"
/>
```

---

## Implementation Order

### Immediate (Phase 1) - 30 min
1. ✅ Fix dark mode text colors on MCP page
2. ✅ Update typography to match app design
3. ✅ Redesign step timeline with neutral colors

### Important (Phase 2) - 1-2 hours
4. ✅ Update MCP page title to be generic
5. ✅ Add "Supported AI Assistants" section with all 5 options
6. ✅ Create IDE-specific setup instructions for:
   - Cursor
   - Windsurf
   - Claude Code CLI
   - VS Code (Continue)
7. ✅ Add quick setup callout linking to `/projects/[slug]/connect`

### Enhancement (Phase 3) - 30 min
8. ✅ Update FAQ page with multi-IDE information
9. ✅ Add new FAQ question about supported assistants

### Polish (Phase 4) - 10 min
10. ✅ Update help hub card description
11. ✅ Update getting started references (if any)

---

## Success Criteria

### Phase 1: Dark Mode Fixes
- [ ] No blue text in dark mode on MCP page
- [ ] All text is readable (black/white or neutral-600/400)
- [ ] Typography matches dashboard/landing page design
- [ ] Step timeline uses neutral colors

### Phase 2: Multi-IDE Documentation
- [ ] Page title is generic "MCP Integration" not Claude-specific
- [ ] All 5 IDE options are documented
- [ ] Each IDE has setup instructions
- [ ] Config examples provided for each IDE
- [ ] Link to `/connect` page for guided setup

### Phase 3: FAQ Updates
- [ ] FAQ mentions all supported AI assistants
- [ ] New question about supported assistants added
- [ ] Links to detailed MCP guide included

### Phase 4: Consistency
- [ ] Help hub card updated
- [ ] All references to "Claude Desktop only" removed
- [ ] Multi-platform support clearly communicated

---

## Technical Notes

### Files to Modify
1. `app/help/api/mcp/page.tsx` - Main MCP documentation page (Phase 1 & 2)
2. `app/help/faq/page.tsx` - Update MCP-related questions (Phase 3)
3. `app/help/page.tsx` - Update card description (Phase 4)

### Reference Files (Don't Modify)
- `lib/mcp/ide-metadata.ts` - Already contains all IDE definitions
- `components/connect/IdeConfigTabs.tsx` - Already supports all IDEs
- `app/projects/[slug]/connect/page.tsx` - Working implementation

### Design System Reference
**Colors**:
- Background: `bg-white dark:bg-black` or `bg-neutral-50 dark:bg-neutral-950`
- Text Primary: `text-black dark:text-white`
- Text Secondary: `text-neutral-600 dark:text-neutral-400`
- Text Tertiary: `text-neutral-500 dark:text-neutral-500`
- Borders: `border-neutral-200 dark:border-neutral-800`
- Hover: `hover:bg-neutral-100 dark:hover:bg-neutral-900`

**Typography**:
- H1: `text-5xl md:text-6xl font-light tracking-tight`
- H2: `text-3xl font-light`
- H3: `text-2xl font-normal`
- Body: `text-lg` or base with `text-neutral-600 dark:text-neutral-400`

---

**Priority**: Phase 1 is CRITICAL (dark mode readability). Phase 2 is IMPORTANT (missing information).
