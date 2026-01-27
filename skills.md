# Docjays Skills

> Skills for AI agents working with Docjays documentation management

---

## Skill: Create Feature Specification

**When to use:** User asks to implement a new feature

**Steps:**
1. Create feature spec file at `.docjays/features/<feature-slug>.md`
2. Use template structure from `docs/features/_TEMPLATE.md`
3. Include required sections:
   - **Objective:** What problem are we solving? Success criteria?
   - **Scope:** What's in scope? What's explicitly out of scope?
   - **Impacted Files:** Which files will be created/modified?
   - **Data Model:** Database/schema changes required?
   - **Test Plan:** Unit, integration, E2E test requirements
   - **Rollout:** Deployment strategy and rollback plan

4. Reference external documentation:
   - Check `.docjays/sources/` for relevant company standards
   - Link to external APIs, libraries, frameworks
   - Follow established patterns from `.docjays/context/patterns.md`

5. Update architectural context if needed:
   - If architecture changes, update `.docjays/context/architecture.md`
   - If new patterns emerge, update `.docjays/context/patterns.md`
   - If conventions change, update `.docjays/context/conventions.md`

**Example:**
```markdown
User: "Help me add user authentication with JWT"

Actions:
1. Create .docjays/features/user-auth.md with:
   - Objective: Secure user authentication using JWT tokens
   - Scope: Login, logout, token refresh (exclude OAuth providers)
   - Impacted Files: lib/auth/, app/api/auth/, middleware.ts
   - Test Plan: Unit tests for token generation, E2E for login flow

2. Check .docjays/sources/company-standards/ for:
   - Authentication policies
   - Token expiry standards
   - Security requirements

3. Update .docjays/context/architecture.md:
   - Add authentication flow diagram
   - Document token storage strategy
   - Explain middleware chain
```

---

## Skill: Add External Documentation Source

**When to use:** User needs to reference external documentation (company standards, API docs, etc.)

**Steps:**
1. Use Docjays CLI to add the source:
   ```bash
   docjays add-source \
     --name <descriptive-name> \
     --type <git|http|local> \
     --url <source-url> \
     --branch <branch-name>  # for git sources
   ```

2. Sync the documentation:
   ```bash
   docjays sync
   ```

3. Verify the source is available:
   ```bash
   docjays list-sources
   docjays status
   ```

4. Reference in feature specs:
   - Use relative paths: `.docjays/sources/<name>/path/to/doc.md`
   - Link to specific sections: `See [Auth Guidelines](./.docjays/sources/company-standards/auth.md#jwt-tokens)`
   - Always cite sources when using external standards

5. Keep sources updated:
   - Run `docjays sync` regularly
   - Check `docjays status` for outdated sources
   - Update references if source structure changes

**Example:**
```markdown
User: "Add our company's coding standards as a reference"

Actions:
1. Run command:
   docjays add-source \
     --name company-standards \
     --type git \
     --url https://github.com/techjays/coding-standards \
     --branch main

2. Sync:
   docjays sync

3. Reference in code:
   # In .docjays/features/user-auth.md
   According to [company standards](./.docjays/sources/company-standards/security.md),
   all passwords must be hashed with bcrypt...
```

---

## Skill: Update AI Context Files

**When to use:** Making architectural decisions, establishing patterns, or defining conventions

**Context file types:**
- `.docjays/context/architecture.md` - System design, component relationships, data flow
- `.docjays/context/patterns.md` - Code patterns, design patterns, best practices
- `.docjays/context/conventions.md` - Naming conventions, file structure, code style

**Steps:**
1. Identify the type of context being updated:
   - **Architecture:** How components interact, system boundaries
   - **Patterns:** Reusable code solutions, design patterns
   - **Conventions:** Team agreements, style choices

2. Create or update the appropriate context file:
   ```markdown
   # [Topic Name]

   ## Overview
   Brief explanation of what this is and why it matters

   ## Current Implementation
   How this is currently implemented in the project
   - Key components involved
   - Data flow
   - Dependencies

   ## Rationale
   Why we chose this approach
   - Alternatives considered
   - Trade-offs made
   - Constraints that influenced decision

   ## Examples
   Code examples showing proper usage
   ```python
   # Example code here
   ```

   ## Guidelines
   - Do: Best practices
   - Don't: Common pitfalls to avoid

   ## Related
   - Feature specs that use this: `.docjays/features/user-auth.md`
   - External docs: `.docjays/sources/company-standards/...`
   - Other context: `.docjays/context/patterns.md#authentication`
   ```

3. Keep context files focused:
   - One topic per file (or major section)
   - Clear headings and structure
   - Concrete examples over abstract descriptions

4. Link context to features:
   - Reference context in feature specs
   - Update context when features introduce changes
   - Remove outdated information

**Example:**
```markdown
User: "We're implementing authentication. Document the approach."

Actions:
1. Update .docjays/context/architecture.md:
   # Authentication Flow

   ## Overview
   JWT-based stateless authentication with refresh tokens

   ## Current Implementation
   - Access tokens: 15 min expiry, stored in memory
   - Refresh tokens: 7 day expiry, stored in httpOnly cookie
   - Middleware validates on each request

   ## Rationale
   - Stateless: No session storage needed, scales horizontally
   - Refresh tokens: Balance security with UX
   - httpOnly: Prevents XSS attacks

   ## Examples
   [Show middleware code]

2. Update .docjays/context/patterns.md:
   # Protected Route Pattern

   ## Usage
   Wrap routes with auth middleware:
   ```typescript
   import { withAuth } from '@/lib/auth/middleware';

   export default withAuth(async (req, res) => {
     // Route handler
   });
   ```

3. Link in feature spec .docjays/features/user-auth.md:
   See authentication architecture in .docjays/context/architecture.md#authentication-flow
```

---

## Skill: Ground Responses with Docjays

**When to use:** Answering user questions, making recommendations, or explaining code

**Grounding priority (check in this order):**
1. `.docjays/features/*.md` - Active feature specifications (most authoritative)
2. `.docjays/context/*.md` - Architecture, patterns, conventions
3. `.docjays/sources/*` - External standards, API docs, company policies
4. `docs/` - Project documentation
5. Code itself - As last resort

**Steps:**
1. **Before answering any question:**
   - Search `.docjays/features/` for relevant feature specs
   - Check `.docjays/context/` for architectural context
   - Review `.docjays/sources/` for external standards
   - Read actual code if needed

2. **When providing answers:**
   - Always cite your sources:
     - "According to `.docjays/features/user-auth.md`, authentication uses JWT tokens..."
     - "Based on `.docjays/context/architecture.md`, the middleware chain..."
     - "Per company standards in `.docjays/sources/company-standards/security.md`..."

3. **When encountering conflicts:**
   - Flag discrepancies explicitly:
     - "The code currently uses bcrypt, but `.docjays/features/user-auth.md` specifies argon2. Which should we follow?"
   - Cite both sources
   - Ask for clarification
   - Suggest updating outdated docs

4. **When information is missing:**
   - Be explicit about gaps:
     - "I don't see a feature spec for the user profile. Should I create one?"
   - Suggest creating context files
   - Propose syncing external sources
   - Ask user for clarification

5. **When suggesting changes:**
   - Reference grounded sources:
     - "Based on the feature spec, we should add validation here..."
     - "According to our architecture docs, this should use the auth middleware..."
     - "Per company standards, we need to add error handling..."

**Example:**
```markdown
User: "How should I implement password reset?"

Actions:
1. Check grounding sources:
   - .docjays/features/: No password-reset.md found
   - .docjays/context/architecture.md: See authentication section
   - .docjays/sources/company-standards/security.md: Password policies

2. Provide grounded response:
   "I don't see a feature spec for password reset yet. However, I can provide
   recommendations based on our authentication architecture:

   According to `.docjays/context/architecture.md`, we use JWT tokens for auth.
   For password reset, I recommend:

   1. Generate secure reset token (use crypto.randomBytes)
   2. Store token hash in database with expiry
   3. Send email with reset link
   4. Validate token and update password

   Per company standards (`.docjays/sources/company-standards/security.md`):
   - Reset tokens must expire in 1 hour
   - Use bcrypt with cost factor 12
   - Invalidate all existing sessions on password change

   Would you like me to create a feature spec at
   `.docjays/features/password-reset.md` to document this approach?"
```

---

## Skill: Sync and Maintain Documentation

**When to use:** Regularly, before starting work, when external sources update

**Steps:**
1. Check documentation status:
   ```bash
   docjays status
   ```

2. Sync all sources:
   ```bash
   docjays sync
   ```

3. Review changes:
   - Check what was updated
   - Identify breaking changes in external sources
   - Update feature specs if needed
   - Update context files if patterns changed

4. Keep watch mode running during development:
   ```bash
   docjays watch --interval 30m
   ```

5. Clean stale cache when needed:
   ```bash
   docjays clean --cache
   ```

**Example:**
```bash
# Morning routine
docjays status          # Check what needs updating
docjays sync            # Update all sources
docjays watch -i 1h     # Keep synced during work

# During development
# Sources auto-update every hour
# Use up-to-date documentation

# End of day
# Watch process stops, sources remain synced
```

---

## Skill: Onboard New Developer

**When to use:** New team member joins, explaining Docjays to others

**Steps:**
1. Explain the purpose:
   - `.docjays/` contains project documentation
   - Git-ignored but critical for development
   - Managed by Docjays CLI
   - Exposed to AI agents via MCP

2. Initialize their environment:
   ```bash
   # Login to Docjays (TechJays org only)
   docjays login

   # Initialize project
   docjays init

   # Sync all documentation
   docjays sync

   # Check status
   docjays status
   ```

3. Show folder structure:
   ```
   .docjays/
   ├── features/      # Feature specifications
   ├── context/       # Architecture and patterns
   ├── sources/       # External documentation
   ├── cache/         # CLI cache (ignore)
   └── config.json    # Configuration
   ```

4. Demonstrate workflows:
   - Read feature spec before implementing
   - Reference external sources when needed
   - Update context when making decisions
   - Use MCP integration with Claude

5. Share resources:
   - CLI README: `packages/docjays-cli/README.md`
   - Workflow guide: `docs/ai/docjays-workflow.md`
   - This skills file: `skills.md`

**Example onboarding:**
```markdown
"Welcome to the team! We use Docjays to manage documentation.

Quick setup:
1. Login: `docjays login` (use your @techjays.com email)
2. Init: `docjays init`
3. Sync: `docjays sync`

The .docjays/ folder contains:
- features/: Specs for what we're building
- context/: How our architecture works
- sources/: Company standards and external docs

Before coding a feature:
1. Read the spec in .docjays/features/
2. Check .docjays/context/ for patterns
3. Reference .docjays/sources/ for standards

AI agents (Claude, Cursor) automatically read from .docjays/
so they give better, grounded responses.

Questions? Check docs/ai/docjays-workflow.md"
```

---

## Integration Notes

### For Claude Desktop
- MCP server automatically exposes `.docjays/` content
- Run `docjays serve` to start server
- Claude can read all sources, features, and context

### For Claude Code CLI
- These skills are automatically available
- Reference `.docjays/` files as needed
- Use skills to structure your workflow

### For Other AI Tools (Cursor, Windsurf, etc.)
- Read `docs/ai/docjays-workflow.md` for detailed workflow
- Manually reference `.docjays/` files
- Follow same grounding principles

---

## Best Practices

1. **Always ground responses**
   - Check `.docjays/` before answering
   - Cite specific files and sections
   - Flag conflicts and ask for clarification

2. **Keep documentation current**
   - Update feature specs as work progresses
   - Record architectural decisions in context files
   - Sync external sources regularly

3. **Be explicit about sources**
   - "According to `.docjays/features/user-auth.md`..." ✅
   - "I think authentication works like..." ❌

4. **Suggest improvements**
   - "Should I create a feature spec for this?"
   - "This context file seems outdated, should I update it?"
   - "Would you like me to add this as an external source?"

5. **Respect priority**
   - Feature specs override general docs
   - Context files explain "why" behind decisions
   - External sources provide standards to follow

---

## Troubleshooting

**Problem:** `.docjays/` folder missing
**Solution:** Run `docjays init`

**Problem:** Sources are outdated
**Solution:** Run `docjays sync`

**Problem:** Conflicting information between sources
**Solution:** Flag both sources, ask user which to follow

**Problem:** Feature spec missing
**Solution:** Suggest creating one using the template

**Problem:** Context file unclear
**Solution:** Ask user for clarification, offer to improve it

---

**Implementation Status:** ✅ Ready to use
**Last Updated:** 2026-01-27
**Maintained by:** TechJays
