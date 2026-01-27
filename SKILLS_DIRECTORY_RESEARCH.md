# Skills Directory Research

**Date:** 2026-01-27
**Status:** 🔵 Research & Analysis
**Question:** Should Docjays CLI auto-generate a `docskills.md` file in a `skills/` directory?

---

## Research Scope

### Questions to Answer

1. **Standards:** Is there a standard for skills directories across AI agents?
2. **Format:** What format should skills files use?
3. **Discovery:** How do AI agents discover and use skills?
4. **Auto-generation:** Should CLI auto-generate or provide templates?
5. **Tool Support:** Which AI tools support skills?
6. **MCP Integration:** Is there an MCP skills protocol?
7. **Best Practices:** What's the industry best practice?

---

## Current State Analysis

### What We Have Now

**Project Root:**
- `skills.md` - Docjays workflow skills for Claude Code
- `CLAUDE.md` - Project conventions
- `docs/ai/docjays-workflow.md` - Comprehensive workflow guide

**Per-Project (`.docjays/`):**
- `config.json` - Configuration
- `README.md` - Auto-generated guide
- `features/` - Feature specs
- `context/` - AI context
- `sources/` - External docs

### What's Proposed

**Option A: Root Skills Directory**
```
skills/
├── docskills.md           # Docjays-specific skills
├── general.md             # General project skills
└── team-conventions.md    # Team-specific skills
```

**Option B: .docjays Skills**
```
.docjays/
├── skills/
│   ├── docjays.md         # Docjays workflow skills
│   ├── feature-dev.md     # Feature development skills
│   └── grounding.md       # Grounding skills
```

**Option C: Hybrid**
```
skills.md                  # Root-level (committed)
.docjays/
└── skills/                # Per-project (git-ignored)
    ├── project.md         # Project-specific skills
    └── _current.md        # Auto-generated current context
```

---

## AI Agent Skills Support Research

### Claude Code / Claude Desktop

**Skills Support:** ✅ Yes

**How It Works:**
- Reads `skills.md` from project root
- Treats skills as executable workflows
- Can reference skills by name
- Skills are just markdown with clear structure

**Format:**
```markdown
# Skills

## Skill: [Skill Name]

[Description of when to use this skill]

**Steps:**
1. Step 1
2. Step 2
3. Step 3

**Example:**
[Example usage]
```

**Discovery:**
- Automatically reads `skills.md` in project root
- No configuration needed
- Works in both Claude Code CLI and Claude Desktop (via context)

**Best Practices:**
- One skill per section
- Clear "when to use" descriptions
- Step-by-step instructions
- Concrete examples

**Limitations:**
- No nested skills directories (yet)
- No skill inheritance
- No skill dependencies
- Skills are documentation, not executable code

### Cursor

**Skills Support:** ⚠️ Partial

**How It Works:**
- No native "skills" concept
- But: Reads any markdown in project
- But: Can follow structured instructions
- Works best with `.cursorrules` file

**Format:**
```markdown
# .cursorrules

## Docjays Workflow

When working with documentation:
1. Check .docjays/features/ first
2. Reference .docjays/context/ for architecture
3. Follow .docjays/sources/ for standards

[Similar to skills, different format]
```

**Discovery:**
- Reads `.cursorrules` in project root
- Can also read other markdown files if referenced
- No automatic skills discovery

**Best Practices:**
- Use `.cursorrules` for project-wide instructions
- Keep instructions concise
- Be explicit about workflows

**Limitations:**
- Not called "skills"
- No structured skill format
- Limited discoverability

### Windsurf (Codeium)

**Skills Support:** ⚠️ Partial

**How It Works:**
- Similar to Cursor
- Reads project context files
- No native skills concept
- Uses `.windsurfrules` or similar

**Format:**
```markdown
# Project Instructions

## Documentation Workflow
[Instructions here]
```

**Discovery:**
- Looks for `.windsurfrules` or similar
- Can read other markdown files
- No automatic skills discovery

### GitHub Copilot

**Skills Support:** ❌ No

**How It Works:**
- Uses code context only
- No markdown instruction files
- No skills concept
- Relies on comments and code patterns

**Workaround:**
- Add instructions in comments
- Use consistent patterns
- Not ideal for complex workflows

### MCP (Model Context Protocol)

**Skills Support:** 🔄 Evolving

**Current State:**
- MCP v1.0 has **prompts** (similar to skills)
- Prompts can be provided by MCP servers
- Prompts are discoverable via protocol
- Still evolving standard

**How It Works:**
```typescript
// MCP Server can expose prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "create-feature-spec",
        description: "Create a new feature specification",
        arguments: [
          {
            name: "feature-name",
            description: "Name of the feature",
            required: true
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "create-feature-spec") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a feature spec for ${request.params.arguments.featureName}`
          }
        }
      ]
    };
  }
});
```

**Discovery:**
- Client asks server for available prompts
- Server returns list dynamically
- Client can invoke prompts

**Best Practices:**
- Use prompts for common workflows
- Make prompts parameterizable
- Provide clear descriptions

**Limitations:**
- Only works with MCP-enabled tools
- Requires MCP server running
- Not as simple as markdown files

---

## Industry Best Practices

### Pattern 1: Root-Level Skills File

**Used by:** Claude Code, various projects

**Structure:**
```
project-root/
├── skills.md              # All skills in one file
├── CLAUDE.md              # Project conventions
└── README.md              # Project docs
```

**Pros:**
- ✅ Simple, one file
- ✅ Easy to discover
- ✅ Works with Claude Code
- ✅ Easy to maintain

**Cons:**
- ❌ Can get large for big projects
- ❌ Mixes different skill types
- ❌ No organization for many skills

### Pattern 2: Skills Directory

**Used by:** Some large projects

**Structure:**
```
project-root/
├── skills/
│   ├── README.md          # Index of skills
│   ├── feature-dev.md     # Feature development skills
│   ├── testing.md         # Testing skills
│   └── deployment.md      # Deployment skills
└── CLAUDE.md
```

**Pros:**
- ✅ Organized by category
- ✅ Scalable for many skills
- ✅ Each file focused

**Cons:**
- ❌ Not standard (yet)
- ❌ Discovery mechanism unclear
- ❌ May need index/manifest

### Pattern 3: Hybrid (Root + Directory)

**Used by:** Some projects

**Structure:**
```
project-root/
├── skills.md              # Quick reference / index
├── skills/                # Detailed skills
│   ├── feature-dev.md
│   └── testing.md
└── CLAUDE.md
```

**Pros:**
- ✅ Best of both worlds
- ✅ Root file for quick access
- ✅ Directory for organization

**Cons:**
- ❌ Potential duplication
- ❌ Need to keep in sync

### Pattern 4: Auto-Generated Context

**Used by:** Some CLI tools

**Structure:**
```
project-root/
├── .ai/                   # Git-ignored
│   ├── context.md         # Auto-generated context
│   └── current-work.md    # What's being worked on now
└── skills.md              # Static skills
```

**Pros:**
- ✅ Always up-to-date
- ✅ Context-aware
- ✅ Reduces manual maintenance

**Cons:**
- ❌ Git-ignored (not in repo)
- ❌ Lost when cleaned
- ❌ Requires CLI to generate

---

## Recommendation Analysis

### Option 1: CLI Generates `docskills.md` in `.docjays/skills/`

**Implementation:**
```bash
docjays init
# Creates:
# .docjays/skills/docjays.md - Docjays workflow skills
# .docjays/skills/current.md - Current project context
```

**Structure:**
```
.docjays/
├── skills/
│   ├── docjays.md         # Docjays workflow skills
│   ├── current.md         # Auto-generated current context
│   └── project.md         # Project-specific skills
```

**Pros:**
- ✅ Organized under `.docjays/`
- ✅ Can be auto-generated
- ✅ Can update dynamically
- ✅ Clear separation

**Cons:**
- ❌ Git-ignored (not in repo)
- ❌ Not discovered by Claude Code (expects root `skills.md`)
- ❌ Lost when `.docjays/` cleaned
- ❌ Non-standard location

**Verdict:** ❌ Not recommended (conflicts with Claude Code expectations)

---

### Option 2: CLI Generates Root `skills.md` (if not exists)

**Implementation:**
```bash
docjays init
# Checks for skills.md in root
# If not exists, creates from template
# If exists, leaves it alone
```

**Structure:**
```
project-root/
├── skills.md              # Created by CLI (if not exists)
├── .docjays/
│   └── README.md          # Auto-generated guide
```

**Pros:**
- ✅ Works with Claude Code immediately
- ✅ Standard location
- ✅ Committed to repo
- ✅ Easy to discover

**Cons:**
- ❌ CLI can't update (user-owned file)
- ❌ May conflict with existing file
- ❌ Single file can get large

**Verdict:** ✅ Good option for initial setup

---

### Option 3: CLI Generates Skills Index + Directory

**Implementation:**
```bash
docjays init
# Creates:
# skills.md (index) - if not exists
# .docjays/skills/ (directory) - always
# .docjays/skills/current.md - auto-generated context
```

**Structure:**
```
project-root/
├── skills.md                      # Index (committed, user-editable)
├── .docjays/
│   └── skills/
│       ├── current.md             # Auto-generated (git-ignored)
│       └── project-context.md     # Auto-generated (git-ignored)
```

**skills.md (Index):**
```markdown
# Skills

See also: `.docjays/skills/` for auto-generated context

## Skill: Create Feature Spec
[Instructions]

## Skill: Ground with Docjays
See `.docjays/skills/current.md` for current project context
[Instructions]
```

**Pros:**
- ✅ Root file works with Claude Code
- ✅ Directory for dynamic content
- ✅ CLI can update `.docjays/skills/`
- ✅ Best of both worlds

**Cons:**
- ❌ More complex
- ❌ Potential confusion (two locations)
- ❌ Need to keep in sync

**Verdict:** 🟡 Good but complex

---

### Option 4: CLI Provides Template, User Commits

**Implementation:**
```bash
docjays init

# Output:
# ✓ Created .docjays/
# ℹ  Tip: Add Docjays skills to your project
#   Copy: packages/docjays-cli/templates/skills.md
#   To: ./skills.md
#   Or run: docjays create-skills
```

```bash
docjays create-skills
# Copies template to root if not exists
# User commits it
# CLI never modifies it
```

**Structure:**
```
project-root/
├── skills.md              # User commits (from template)
├── .docjays/
│   ├── README.md          # Auto-generated
│   └── skills/            # Optional: dynamic context
│       └── current.md     # Auto-generated current work
```

**Pros:**
- ✅ Clear ownership (user owns root file)
- ✅ CLI provides good defaults
- ✅ Works with Claude Code
- ✅ Can optionally add dynamic context
- ✅ User can customize

**Cons:**
- ❌ Extra step for user
- ❌ User might not run it

**Verdict:** ✅✅ Best option (clear ownership, flexible)

---

## Recommended Implementation

### Phase 1: Integrated into Init

**What:**
- CLI includes `templates/skills.md` template
- `docjays init` prompts to create skills.md
- Creates root `skills.md` from template during init
- User commits it to repo

**When:**
```bash
# During init - one command, complete setup
docjays init

# Prompts:
? Create skills.md for AI agent instructions? (Y/n)
# If yes:
✓ Created .docjays/
✓ Created skills.md
✓ Updated .gitignore

# If no:
✓ Created .docjays/
ℹ  Tip: Run `docjays create-skills` later to add AI agent skills
```

**Template Location:**
```
packages/docjays-cli/
├── templates/
│   ├── skills.md              # Docjays skills template
│   ├── feature-spec.md        # Feature spec template
│   └── context.md             # Context file template
```

**Template Content:**
```markdown
# Docjays Skills

> Auto-generated by Docjays CLI
> You can customize this file for your project

## Skill: Create Feature Specification
[... content from our current skills.md ...]

## Skill: Add External Documentation Source
[... content from our current skills.md ...]

## Skill: Update AI Context Files
[... content from our current skills.md ...]

## Skill: Ground Responses with Docjays
[... content from our current skills.md ...]

## Skill: Sync and Maintain Documentation
[... content from our current skills.md ...]
```

**CLI Implementation:**
```typescript
// packages/docjays-cli/src/cli/commands/init.ts

export async function init(options: InitOptions) {
  // ... existing init code ...

  // After creating .docjays/ folder

  // Prompt to create skills.md
  const { createSkills } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createSkills',
      message: 'Create skills.md for AI agent instructions?',
      default: true
    }
  ]);

  if (createSkills) {
    await createSkillsFile();
    logger.success('Created skills.md');
    logger.info('Tip: Customize skills.md for your project');
    logger.info('Tip: Commit skills.md to your repository');
  } else {
    logger.info('Skipped skills.md creation');
    logger.info('Tip: Run `docjays create-skills` later if needed');
  }

  // ... rest of init ...
}

// Shared function for creating skills.md
async function createSkillsFile() {
  const rootDir = process.cwd();
  const skillsPath = path.join(rootDir, 'skills.md');
  const templatePath = path.join(__dirname, '../../../templates/skills.md');

  // Check if already exists
  if (fs.existsSync(skillsPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'skills.md already exists. Overwrite?',
        default: false
      }
    ]);

    if (!overwrite) {
      return false;
    }
  }

  // Copy template
  fs.copyFileSync(templatePath, skillsPath);
  return true;
}

// packages/docjays-cli/src/cli/commands/create-skills.ts
// Optional standalone command if user skipped during init

export async function createSkills() {
  const created = await createSkillsFile();

  if (created) {
    logger.success('Created skills.md from template');
    logger.info('Tip: Customize skills.md for your project');
    logger.info('Tip: Commit skills.md to your repository');
  } else {
    logger.info('Skipped creating skills.md');
  }
}
```

### Phase 2: Dynamic Context (Optional)

**What:**
- CLI can generate `.docjays/skills/current.md`
- Contains current project context
- Auto-updated with project state
- Referenced from root `skills.md`

**When:**
```bash
# Generate current context
docjays context generate

# Creates/updates .docjays/skills/current.md with:
# - Active features
# - Recent changes
# - Available sources
# - Current work
```

**Content:**
```markdown
# Current Project Context

**Generated:** 2026-01-27 10:30 AM
**Auto-generated by:** `docjays context generate`

## Active Features
- user-auth (in progress)
- api-gateway (planning)

## Available Sources
- company-standards (last synced: 2 hours ago)
- api-specs (last synced: 1 day ago)

## Recent Changes
- Added JWT authentication
- Updated architecture context
- Synced company standards

## Current Architecture
See `.docjays/context/architecture.md` for details:
- Authentication: JWT with refresh tokens
- Database: Supabase PostgreSQL
- Deployment: Vercel

## Suggested Next Steps
- Complete user-auth feature tests
- Update api-gateway spec with auth requirements
- Sync api-specs (outdated)
```

**Integration with Root skills.md:**
```markdown
# Skills

## Skill: Ground Responses with Docjays

**Current Project Context:** See `.docjays/skills/current.md`

When answering questions:
1. Check `.docjays/skills/current.md` for current work
2. Check `.docjays/features/` for feature specs
3. Check `.docjays/context/` for architecture
4. Check `.docjays/sources/` for standards
```

---

## Implementation Plan

### Milestone 1: Skills Template (Week 1)

**Tasks:**
1. Create `templates/skills.md` with Docjays skills
2. Add `create-skills` command to CLI
3. Update `init` command to suggest skills creation
4. Add tests for skills creation
5. Update CLI README with skills instructions

**Deliverables:**
- `packages/docjays-cli/templates/skills.md`
- `packages/docjays-cli/src/cli/commands/create-skills.ts`
- Tests for skills creation
- Updated documentation

**Success Criteria:**
- ✅ Users can run `docjays create-skills`
- ✅ Creates `skills.md` in project root
- ✅ Template includes all Docjays skills
- ✅ Works with Claude Code immediately

### Milestone 2: Context Generation (Week 2)

**Tasks:**
1. Add `context generate` command
2. Generate `.docjays/skills/current.md`
3. Include active features, sources, recent changes
4. Update skills template to reference context
5. Add tests and documentation

**Deliverables:**
- `packages/docjays-cli/src/cli/commands/context.ts`
- Auto-generated context file
- Integration with root skills.md
- Tests and documentation

**Success Criteria:**
- ✅ Users can run `docjays context generate`
- ✅ Creates `.docjays/skills/current.md`
- ✅ Contains current project state
- ✅ Referenced from root skills.md

### Milestone 3: Auto-Update (Week 3)

**Tasks:**
1. Auto-generate context on `docjays sync`
2. Add `--auto-context` flag to init
3. Add context generation to watch mode
4. Update documentation

**Deliverables:**
- Automatic context generation
- Configuration options
- Updated documentation

**Success Criteria:**
- ✅ Context auto-updates on sync
- ✅ Optional auto-context mode
- ✅ Works with watch mode

---

## File Structure (Final State)

```
project-root/
├── skills.md                      # User-owned, committed
│   ├── Skill: Create Feature Spec
│   ├── Skill: Add External Docs
│   ├── Skill: Update AI Context
│   ├── Skill: Ground with Docjays
│   └── Skill: Sync Documentation
│
├── CLAUDE.md                      # Project conventions
├── docs/
│   └── ai/
│       └── docjays-workflow.md    # Comprehensive guide
│
└── .docjays/                      # Git-ignored
    ├── README.md                  # Auto-generated
    ├── config.json                # Configuration
    ├── skills/                    # Auto-generated context
    │   ├── current.md             # Current project state
    │   └── .gitkeep
    ├── features/                  # Feature specs
    ├── context/                   # Architecture context
    └── sources/                   # External docs
```

---

## CLI Commands

### New Commands

```bash
# Create skills.md from template
docjays create-skills

# Generate current context
docjays context generate

# Clear auto-generated context
docjays context clear
```

### Updated Commands

```bash
# Init now suggests skills
docjays init
# Output:
# ✓ Initialized .docjays/
# ℹ  Tip: Run `docjays create-skills` to add AI agent skills

# Sync can auto-update context
docjays sync --update-context
# Syncs sources AND updates .docjays/skills/current.md
```

---

## Benefits

### For Developers

1. **Easy Setup**
   - Run `docjays create-skills`
   - Get working skills file
   - Customize as needed

2. **Current Context**
   - Auto-generated project state
   - Always up-to-date
   - Referenced by AI agents

3. **Flexibility**
   - Can customize root skills.md
   - Can add project-specific skills
   - Can ignore dynamic context if not needed

### For AI Agents

1. **Claude Code**
   - Works immediately with root skills.md
   - Gets Docjays workflow skills
   - Can reference dynamic context

2. **Other Tools**
   - Can read skills.md (standard markdown)
   - Can follow same workflows
   - Not locked to specific tool

3. **Grounding**
   - Skills reference .docjays/ structure
   - Clear instructions for grounding
   - Current context always available

### For Docjays

1. **Adoption**
   - Easy onboarding
   - Good defaults
   - User-customizable

2. **Consistency**
   - Same skills across projects
   - Standard workflows
   - Clear best practices

3. **Evolution**
   - Can update template
   - Users can adopt updates
   - Backwards compatible

---

## Risks and Mitigations

### Risk 1: Conflicts with Existing Files

**Risk:** User already has `skills.md`
**Mitigation:**
- Check before creating
- Prompt to overwrite
- Can skip if exists

### Risk 2: Skills Directory Not Standard

**Risk:** `skills/` directory not widely adopted
**Mitigation:**
- Use root `skills.md` as primary
- Skills directory optional
- Works with Claude Code (main target)

### Risk 3: Dynamic Context Not Used

**Risk:** Users don't run `context generate`
**Mitigation:**
- Make it optional
- Auto-generate on sync (opt-in)
- Skills work without it

### Risk 4: Maintenance Burden

**Risk:** Need to keep template updated
**Mitigation:**
- Template is just markdown
- Easy to update
- Version in CLI

---

## Decision

**Recommended Approach:** **Integrated Init + Optional Command + Dynamic Context**

**Rationale:**
1. ✅ Works with Claude Code immediately
2. ✅ Clear ownership (user owns root file)
3. ✅ Can evolve (dynamic context optional)
4. ✅ Flexible (users can customize)
5. ✅ Standard location (root skills.md)
6. ✅ Best practices (separation of concerns)
7. ✅ **Simple UX: One command setup** (`docjays init` does everything)

**Implementation:**
- **Phase 1:** Integrate into `docjays init` + fallback `create-skills` command
- **Phase 2:** `docjays context generate` command
- **Phase 3:** Auto-generation hooks

**User Experience:**
```bash
# Complete setup in one command
docjays init
? Create skills.md for AI agent instructions? (Y/n) y
✓ Created .docjays/
✓ Created skills.md
✓ Updated .gitignore
✓ Initialized project

# Or skip and add later
docjays create-skills
```

**Timeline:** 3 weeks

---

## Next Steps

### Immediate (Phase 1 - Week 1)

1. ✅ Create this research document
2. ⬜ Get user approval
3. ⬜ Create `templates/skills.md` template
4. ⬜ Integrate skills creation into `init` command
   - Add prompt during init
   - Copy template if user says yes
   - Show tip if user says no
5. ⬜ Add standalone `create-skills` command (fallback)
6. ⬜ Test integration
   - Run `docjays init`
   - Verify skills.md created
   - Test with Claude Code
7. ⬜ Update CLI README
   - Document skills.md
   - Show init workflow
   - Explain customization

### Near-Term (Phase 2 - Week 2)

8. ⬜ Implement `context generate` command
9. ⬜ Create `.docjays/skills/current.md` format
10. ⬜ Test with watch mode
11. ⬜ Update documentation

### Future (Phase 3 - Week 3)

12. ⬜ Add auto-context generation hooks
13. ⬜ Add `--update-context` flag to sync
14. ⬜ Optimize context generation
15. ⬜ Gather user feedback

---

**Status:** ✅ Research Complete - Ready for Implementation

**Estimated Timeline:**
- Phase 1: 3-4 days
- Phase 2: 3-4 days
- Phase 3: 5-6 days
- Total: ~3 weeks
