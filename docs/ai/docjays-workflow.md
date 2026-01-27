# Docjays Workflow for AI Agents

> Comprehensive guide for AI agents working with Docjays documentation management system

**Version:** 1.0.0
**Last Updated:** 2026-01-27
**Target Audience:** AI Agents (Claude, Cursor, Windsurf, Copilot, etc.)

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose and Philosophy](#purpose-and-philosophy)
3. [Folder Structure](#folder-structure)
4. [Core Workflows](#core-workflows)
5. [Grounding Rules](#grounding-rules)
6. [Best Practices](#best-practices)
7. [Tool Integration](#tool-integration)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Docjays?

Docjays is a documentation management system that:
- Stores external documentation sources in `.docjays/sources/`
- Manages feature specifications in `.docjays/features/`
- Maintains architectural context in `.docjays/context/`
- Provides grounded knowledge base for AI agents
- Keeps documentation separate from source code (git-ignored)

### Why Docjays?

**Problem:** When working on client projects, you need access to company documentation, coding standards, and API specs, but you can't commit these to the client's repository.

**Solution:** Docjays creates a `.docjays/` folder (git-ignored) that contains all documentation. AI agents can access this via MCP (Model Context Protocol) without it being in the main codebase.

**Benefits:**
- ✅ Clean separation of code and external docs
- ✅ Always have latest company standards available
- ✅ AI agents get grounded, accurate responses
- ✅ Works across all projects
- ✅ Zero impact on client repository

---

## Purpose and Philosophy

### Grounded AI Assistance

Docjays enables **grounded AI assistance** where:
- Responses are based on actual documentation, not assumptions
- External standards are consistently applied
- Architectural decisions are documented and referenced
- Feature specs serve as source of truth

### Single Source of Truth

Documentation hierarchy:
1. **Feature Specs** (`.docjays/features/`) - What we're building
2. **Context Files** (`.docjays/context/`) - How/why we built it
3. **External Sources** (`.docjays/sources/`) - Standards we follow
4. **Project Docs** (`docs/`) - General documentation
5. **Code** - Implementation details

### Developer-AI Collaboration

Docjays facilitates:
- **Developers** maintain authoritative documentation
- **AI Agents** ground responses in that documentation
- **Both** work from same knowledge base
- **Result** is consistent, accurate assistance

---

## Folder Structure

### Complete Structure

```
.docjays/                           # Git-ignored documentation folder
├── config.json                     # Docjays configuration
├── README.md                       # Auto-generated guide
│
├── features/                       # Feature specifications
│   ├── _TEMPLATE.md                # Template for new features
│   ├── user-auth.md                # Example: User authentication
│   ├── api-gateway.md              # Example: API gateway
│   └── data-export.md              # Example: Data export
│
├── context/                        # AI context files
│   ├── architecture.md             # System architecture
│   ├── patterns.md                 # Code patterns and conventions
│   ├── conventions.md              # Team conventions
│   ├── tech-stack.md               # Technology choices
│   └── deployment.md               # Deployment strategy
│
├── sources/                        # External documentation
│   ├── company-standards/          # Company coding standards
│   │   ├── security.md
│   │   ├── api-design.md
│   │   └── code-style.md
│   ├── api-specs/                  # External API specifications
│   │   └── openapi.yaml
│   └── framework-docs/             # Framework documentation
│       └── README.md
│
├── cache/                          # CLI cache (ignore in AI context)
└── logs/                           # Operation logs (ignore in AI context)
```

### Folder Purposes

#### `.docjays/features/`
**Purpose:** Feature specifications (what we're building)

**When to use:**
- Planning new features
- Documenting existing features
- Defining scope and requirements
- Planning tests and rollout

**What to include:**
- Objective and success criteria
- In-scope and out-of-scope items
- Impacted files and components
- Data model changes
- Test plan
- Rollout strategy

**Example files:**
- `user-auth.md` - Authentication system
- `api-rate-limiting.md` - API rate limiter
- `pdf-export.md` - PDF generation

#### `.docjays/context/`
**Purpose:** Architectural context (how/why we built it)

**When to use:**
- Making architectural decisions
- Establishing code patterns
- Defining conventions
- Documenting trade-offs

**What to include:**
- System architecture diagrams
- Component relationships
- Data flow explanations
- Pattern examples with code
- Rationale for decisions
- Alternatives considered

**Example files:**
- `architecture.md` - Overall system design
- `patterns.md` - Reusable code patterns
- `conventions.md` - Naming, structure, style
- `tech-stack.md` - Technology choices

#### `.docjays/sources/`
**Purpose:** External documentation (standards we follow)

**When to use:**
- Referencing company standards
- Following API specifications
- Applying external conventions
- Consulting framework docs

**What to include:**
- Company coding standards
- API documentation
- Framework guides
- Third-party specs

**Example sources:**
- `company-standards/` - Techjays standards
- `api-specs/` - External API docs
- `design-system/` - UI component specs

---

## Core Workflows

### Workflow 1: Feature Development

**Trigger:** User asks to implement a new feature

**Steps:**

1. **Create Feature Spec**
   ```markdown
   File: .docjays/features/<feature-slug>.md

   # [Feature Name]

   ## Objective
   What problem are we solving? What does success look like?

   ## Scope
   ### In Scope
   - Feature A
   - Feature B

   ### Out of Scope
   - Feature C (future work)

   ## Impacted Files
   - `app/api/users/route.ts` (new)
   - `lib/auth/index.ts` (modify)
   - `middleware.ts` (modify)

   ## Data Model
   ### New Tables
   - `users` table with columns: id, email, password_hash, created_at

   ### Migrations
   - `001_create_users_table.sql`

   ## Test Plan
   ### Unit Tests
   - Token generation
   - Password hashing
   - Input validation

   ### Integration Tests
   - Login flow
   - Logout flow
   - Token refresh

   ### E2E Tests
   - Complete auth workflow
   - Error scenarios

   ## Rollout
   ### Deployment
   1. Run database migrations
   2. Deploy backend changes
   3. Deploy frontend changes
   4. Enable feature flag

   ### Rollback
   - Disable feature flag
   - Revert migrations if needed
   ```

2. **Check External Sources**
   ```bash
   # List available sources
   docjays list-sources

   # Check for relevant standards
   # Read .docjays/sources/company-standards/security.md
   # Read .docjays/sources/api-specs/authentication.yaml
   ```

3. **Reference in Implementation**
   ```typescript
   // In code, reference the spec
   /**
    * User authentication endpoint
    *
    * Implements JWT authentication as specified in
    * .docjays/features/user-auth.md
    *
    * Following company security standards from
    * .docjays/sources/company-standards/security.md
    */
   ```

4. **Update Context (if needed)**
   ```markdown
   # If architecture changes, update .docjays/context/architecture.md

   ## Authentication Flow (NEW)

   ### Overview
   JWT-based stateless authentication

   ### Implementation
   1. User submits credentials
   2. Server validates and generates JWT
   3. Client stores token
   4. Subsequent requests include token
   5. Middleware validates token

   ### Components
   - `lib/auth/jwt.ts` - Token generation/validation
   - `lib/auth/middleware.ts` - Request validation
   - `app/api/auth/*` - Auth endpoints

   ### Rationale
   Chose JWT for stateless authentication to enable
   horizontal scaling. Considered session-based auth
   but ruled out due to scaling complexity.
   ```

5. **Implement and Test**
   - Follow the spec exactly
   - Write tests per test plan
   - Update spec if scope changes

### Workflow 2: Adding External Documentation

**Trigger:** Need to reference external standards or docs

**Steps:**

1. **Add Source via CLI**
   ```bash
   # Git repository
   docjays add-source \
     --name company-standards \
     --type git \
     --url https://github.com/techjays/standards \
     --branch main

   # HTTP URL
   docjays add-source \
     --name api-docs \
     --type http \
     --url https://api.example.com/docs/openapi.yaml

   # Local path
   docjays add-source \
     --name local-docs \
     --type local \
     --url ./docs/external
   ```

2. **Sync Documentation**
   ```bash
   docjays sync
   ```

3. **Verify Available**
   ```bash
   docjays status
   docjays list-sources
   ```

4. **Reference in Specs**
   ```markdown
   # In .docjays/features/user-auth.md

   ## Security Requirements

   Per company standards (see [security.md](./.docjays/sources/company-standards/security.md)):
   - Passwords must be hashed with bcrypt (cost factor 12)
   - JWT tokens expire after 15 minutes
   - Refresh tokens expire after 7 days
   - All auth endpoints must use HTTPS
   ```

5. **Keep Updated**
   ```bash
   # Check for updates
   docjays status

   # Sync latest changes
   docjays sync

   # Or run watch mode
   docjays watch --interval 1h
   ```

### Workflow 3: Documenting Architecture

**Trigger:** Making architectural decisions or establishing patterns

**Steps:**

1. **Identify Context Type**
   - **Architecture:** System design, components, data flow
   - **Patterns:** Code patterns, design patterns
   - **Conventions:** Naming, structure, style
   - **Tech Stack:** Technology choices, rationale

2. **Create/Update Context File**
   ```markdown
   File: .docjays/context/architecture.md

   # System Architecture

   ## Overview
   This is a Next.js application with:
   - Server-side rendering (SSR)
   - API routes for backend logic
   - Supabase for authentication and database
   - Vercel for hosting

   ## Component Architecture

   ### Frontend
   - `app/` - Next.js App Router pages
   - `components/` - React components
   - `lib/` - Shared utilities

   ### Backend
   - `app/api/` - API route handlers
   - `lib/supabase/` - Database client
   - `lib/auth/` - Authentication logic

   ## Data Flow

   ```
   User Request
     ↓
   Next.js Server (middleware)
     ↓
   API Route Handler
     ↓
   Business Logic (lib/)
     ↓
   Database (Supabase)
     ↓
   Response
   ```

   ## Key Decisions

   ### Why Next.js?
   - SSR for SEO
   - API routes for backend
   - React for frontend
   - Vercel deployment integration

   ### Why Supabase?
   - PostgreSQL database
   - Built-in auth
   - Real-time subscriptions
   - Hosted solution

   ## Related
   - Authentication flow: `.docjays/features/user-auth.md`
   - API patterns: `.docjays/context/patterns.md`
   - Deployment: `.docjays/context/deployment.md`
   ```

3. **Link to Features**
   ```markdown
   # In feature spec
   See architecture documentation: `.docjays/context/architecture.md#authentication-flow`
   ```

4. **Keep Current**
   - Update when architecture changes
   - Remove outdated information
   - Add rationale for major changes

### Workflow 4: Grounding AI Responses

**Trigger:** Answering user questions or making recommendations

**Process:**

1. **Check Grounding Sources (Priority Order)**
   ```
   1st: .docjays/features/*.md      # Feature specs (most authoritative)
   2nd: .docjays/context/*.md       # Architecture/patterns
   3rd: .docjays/sources/*          # External standards
   4th: docs/                       # Project documentation
   5th: Code                        # Implementation
   ```

2. **Search Relevant Files**
   ```bash
   # Example: User asks about authentication

   # Check features
   grep -r "auth" .docjays/features/

   # Check context
   grep -r "authentication" .docjays/context/

   # Check sources
   grep -r "auth" .docjays/sources/
   ```

3. **Cite Sources in Response**
   ```markdown
   According to `.docjays/features/user-auth.md`, our authentication
   system uses JWT tokens with 15-minute expiry.

   Based on `.docjays/context/architecture.md#authentication-flow`,
   the middleware validates tokens on each request.

   Per company standards (`.docjays/sources/company-standards/security.md`),
   we use bcrypt with cost factor 12 for password hashing.
   ```

4. **Handle Conflicts**
   ```markdown
   I notice a discrepancy:

   - The code uses `argon2` for password hashing
   - `.docjays/features/user-auth.md` specifies `bcrypt`
   - `.docjays/sources/company-standards/security.md` recommends `bcrypt`

   Which should we follow? Should I update the spec or the code?
   ```

5. **Suggest Updates**
   ```markdown
   I don't see a feature spec for password reset. Based on the
   existing authentication architecture (`.docjays/context/architecture.md`),
   I can implement it following the same patterns.

   Would you like me to create `.docjays/features/password-reset.md`
   to document the approach first?
   ```

---

## Grounding Rules

### Priority Order

When answering questions, always check sources in this order:

1. **`.docjays/features/*.md`** - Feature specifications
   - Most authoritative
   - Defines current/planned features
   - May override general patterns
   - Updated during active development

2. **`.docjays/context/*.md`** - Architectural context
   - Explains how things work
   - Documents why decisions were made
   - Provides patterns and conventions
   - Updated less frequently

3. **`.docjays/sources/*`** - External documentation
   - Company standards to follow
   - External API specifications
   - Framework documentation
   - Updated via `docjays sync`

4. **`docs/`** - Project documentation
   - General project information
   - Setup instructions
   - Contributing guidelines
   - May be less technical

5. **Code** - Implementation
   - Last resort
   - May not reflect intent
   - Could have bugs
   - Lacks context

### Citation Format

Always cite sources explicitly:

**Good:**
```markdown
According to `.docjays/features/user-auth.md`, authentication
uses JWT tokens with 15-minute expiry.
```

**Bad:**
```markdown
I think authentication uses JWT tokens.
```

**Good:**
```markdown
Based on `.docjays/context/architecture.md#data-flow`,
requests flow through middleware before reaching API handlers.
```

**Bad:**
```markdown
Requests probably go through some middleware.
```

### Conflict Resolution

When sources conflict:

1. **Flag the conflict explicitly:**
   ```markdown
   Conflict detected:
   - Code: Uses argon2 for hashing
   - Spec (.docjays/features/user-auth.md): Specifies bcrypt
   - Standards (.docjays/sources/company-standards/): Recommends bcrypt
   ```

2. **Cite all conflicting sources:**
   - Show what each source says
   - Quote relevant sections
   - Link to specific files/lines

3. **Ask for clarification:**
   ```markdown
   Which should we follow?
   - Update code to match spec? (bcrypt)
   - Update spec to match code? (argon2)
   - Update both to match new decision?
   ```

4. **Suggest resolution:**
   ```markdown
   Recommendation: Update code to match spec and standards.
   Rationale: Spec and standards agree, code appears to be outdated.
   Next steps: Update code + add tests + update related docs.
   ```

### Missing Information

When information is missing:

1. **Be explicit about gaps:**
   ```markdown
   I don't see a feature spec for password reset in
   `.docjays/features/`. Should I create one?
   ```

2. **Offer to create documentation:**
   ```markdown
   The authentication flow isn't documented in
   `.docjays/context/architecture.md`. Would you like me
   to add a section based on the implementation?
   ```

3. **Suggest syncing sources:**
   ```markdown
   The API documentation seems outdated. Try running
   `docjays sync` to get the latest version.
   ```

4. **Ask clarifying questions:**
   ```markdown
   I don't have enough context about the deployment process.
   Could you point me to relevant documentation, or should
   I create `.docjays/context/deployment.md`?
   ```

---

## Best Practices

### For AI Agents

1. **Always Check `.docjays/` First**
   - Before answering questions
   - Before making recommendations
   - Before generating code
   - Before suggesting changes

2. **Cite Sources Explicitly**
   - Use full paths: `.docjays/features/user-auth.md`
   - Include sections: `#jwt-tokens`
   - Quote relevant text
   - Show line numbers if helpful

3. **Flag Conflicts Immediately**
   - Don't hide discrepancies
   - Show all conflicting sources
   - Ask for clarification
   - Suggest resolution

4. **Suggest Documentation Updates**
   - When specs are outdated
   - When context is missing
   - When sources need syncing
   - When patterns emerge

5. **Respect Priority Order**
   - Feature specs override general docs
   - Context explains rationale
   - Sources provide standards
   - Code is last resort

### For Developers

1. **Keep Specs Current**
   - Update during development
   - Reflect scope changes
   - Document decisions
   - Link to related docs

2. **Document Decisions**
   - Why you chose this approach
   - What alternatives were considered
   - What trade-offs were made
   - What constraints influenced you

3. **Sync Sources Regularly**
   ```bash
   docjays sync           # Manual sync
   docjays watch -i 1h    # Auto-sync every hour
   ```

4. **Review AI Suggestions**
   - Check cited sources
   - Verify recommendations
   - Confirm interpretations
   - Update docs if needed

5. **Maintain Context Files**
   - Add new patterns
   - Update architecture
   - Remove outdated info
   - Keep examples current

---

## Tool Integration

### Claude Desktop (MCP)

**Setup:**
```json
{
  "mcpServers": {
    "my-project": {
      "command": "docjays",
      "args": ["serve"],
      "cwd": "/path/to/project"
    }
  }
}
```

**Usage:**
- MCP server automatically exposes `.docjays/` content
- Claude can read all sources, features, context
- No manual file reading needed
- Always up-to-date

**Commands:**
```bash
# Start MCP server
docjays serve

# Check status
docjays status
```

### Claude Code CLI

**Setup:**
- No configuration needed
- Reads `skills.md` automatically
- Follows workflow instructions

**Usage:**
- Use skills from `skills.md`
- Reference `.docjays/` files directly
- Follow grounding rules
- Cite sources in responses

**Best Practices:**
- Check `.docjays/` before answering
- Use Glob/Grep to search documentation
- Read files when needed
- Update docs when appropriate

### Cursor / Windsurf / Copilot

**Setup:**
- Read this file: `docs/ai/docjays-workflow.md`
- Understand folder structure
- Follow grounding rules

**Usage:**
- Manually search `.docjays/` for relevant docs
- Reference files in responses
- Follow same citation format
- Apply same priority order

**Commands:**
```bash
# Find relevant docs
find .docjays -name "*.md" | xargs grep "authentication"

# Check status
docjays status

# Sync sources
docjays sync
```

---

## Examples

### Example 1: Implementing New Feature

**User Request:** "Help me implement user profile editing"

**AI Agent Response:**

```markdown
Let me check if we have a feature spec for this.

[Searches .docjays/features/]

I don't see a feature spec for profile editing yet. Let me create one
based on our existing authentication system.

[Reads .docjays/features/user-auth.md for context]
[Reads .docjays/context/architecture.md for system design]
[Reads .docjays/sources/company-standards/api-design.md for standards]

I'll create `.docjays/features/user-profile-edit.md`:

# User Profile Editing

## Objective
Enable users to update their profile information (name, email, avatar).

Success criteria:
- Users can edit name and email
- Email changes require re-verification
- Changes are validated and saved
- UI provides immediate feedback

## Scope

### In Scope
- Edit name (display name)
- Edit email (with re-verification)
- Upload/change avatar image
- Form validation
- Success/error messages

### Out of Scope
- Password changes (separate feature: password-reset.md)
- Account deletion (future feature)
- Two-factor authentication setup

## Impacted Files
- `app/profile/edit/page.tsx` (new) - Profile edit UI
- `app/api/user/profile/route.ts` (new) - Profile update endpoint
- `lib/user/validation.ts` (new) - Input validation
- `lib/user/update.ts` (new) - Profile update logic
- `prisma/schema.prisma` (modify) - Add avatar_url field

## Data Model

### Updated Tables
users table:
- Add: avatar_url (string, nullable)
- Index on email for lookups

### Migrations
- `002_add_avatar_to_users.sql`

## Test Plan

### Unit Tests
- Name validation (min/max length, allowed characters)
- Email validation (format, uniqueness)
- Avatar upload validation (file type, size)

### Integration Tests
- Profile update endpoint
- Email change flow with verification
- Avatar upload to storage

### E2E Tests
- Complete profile edit workflow
- Email change with verification
- Error handling scenarios

## Rollout

### Dependencies
- User authentication (user-auth.md) must be complete
- Email service configured

### Deployment
1. Run database migration
2. Deploy API endpoint
3. Deploy frontend changes
4. Test in staging
5. Deploy to production

Per company standards (`.docjays/sources/company-standards/api-design.md`),
the API should:
- Use PATCH method for updates
- Return updated user object
- Include appropriate error codes
- Rate limit to 10 requests/hour

Based on our architecture (`.docjays/context/architecture.md#data-flow`),
the flow will be:
1. User submits form
2. Client validates input
3. API endpoint receives request
4. Middleware validates auth token
5. Business logic validates data
6. Database updates user record
7. Response sent to client

Would you like me to start implementing this based on the spec?
```

### Example 2: Answering Architecture Question

**User Request:** "How does our authentication work?"

**AI Agent Response:**

```markdown
According to `.docjays/features/user-auth.md`, our authentication
system uses JWT (JSON Web Tokens) with the following approach:

## Token Types

### Access Tokens
- Expiry: 15 minutes
- Storage: Memory (not localStorage)
- Purpose: API authentication

### Refresh Tokens
- Expiry: 7 days
- Storage: httpOnly cookie
- Purpose: Obtaining new access tokens

## Authentication Flow

Based on `.docjays/context/architecture.md#authentication-flow`:

1. **Login:**
   - User submits email + password
   - Server validates credentials
   - Server generates access + refresh tokens
   - Access token returned in response
   - Refresh token set as httpOnly cookie

2. **API Requests:**
   - Client includes access token in Authorization header
   - Middleware validates token (lib/auth/middleware.ts)
   - If valid, request proceeds
   - If expired, client requests new token

3. **Token Refresh:**
   - Client sends request to /api/auth/refresh
   - Server validates refresh token from cookie
   - If valid, issues new access token
   - If invalid, user must login again

4. **Logout:**
   - Client discards access token
   - Server invalidates refresh token
   - httpOnly cookie cleared

## Security Measures

Per `.docjays/sources/company-standards/security.md`:

- Passwords hashed with bcrypt (cost factor 12)
- Access tokens short-lived (15 min) for security
- Refresh tokens in httpOnly cookie prevents XSS
- All auth endpoints require HTTPS
- Rate limiting: 5 login attempts per 15 minutes

## Implementation Files

Key files implementing this:
- `lib/auth/jwt.ts` - Token generation/validation
- `lib/auth/middleware.ts` - Request authentication
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/refresh/route.ts` - Token refresh endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint

Is there a specific aspect of authentication you'd like me to explain
further?
```

### Example 3: Identifying Conflict

**User Request:** "Should we use argon2 or bcrypt for password hashing?"

**AI Agent Response:**

```markdown
I notice a conflict in our documentation:

## Current State

**Code (lib/auth/password.ts:15):**
```typescript
import argon2 from 'argon2';
const hash = await argon2.hash(password);
```

**Feature Spec (.docjays/features/user-auth.md:45):**
> Passwords must be hashed using bcrypt with cost factor 12

**Company Standards (.docjays/sources/company-standards/security.md:78):**
> Standard password hashing algorithm: bcrypt
> Cost factor: 12 (balances security and performance)
> Rationale: Industry standard, well-tested, OWASP recommended

## Analysis

The code currently uses `argon2`, but both the feature spec and
company standards specify `bcrypt`.

**Recommendation:** Update code to match spec and standards.

**Rationale:**
1. Spec and standards are aligned (bcrypt)
2. Standards document explains rationale
3. Code appears to be inconsistent

**Next Steps:**
1. Update `lib/auth/password.ts` to use bcrypt
2. Update tests to verify bcrypt usage
3. Migrate existing password hashes (if any)
4. Update documentation if bcrypt has issues

**Alternative:** If there's a specific reason to use argon2:
1. Update feature spec to specify argon2
2. Document rationale in `.docjays/context/architecture.md`
3. Request exception from company standards
4. Update this decision in team records

Which approach would you prefer?
```

---

## Troubleshooting

### Problem: `.docjays/` folder missing

**Symptoms:**
- Cannot find `.docjays/` directory
- CLI commands fail

**Solution:**
```bash
docjays init
```

**Prevention:**
- Run `docjays init` after cloning repo
- Add to onboarding documentation

---

### Problem: Sources are outdated

**Symptoms:**
- Documentation doesn't match latest standards
- References to removed APIs
- Old patterns being recommended

**Solution:**
```bash
docjays sync
```

**Prevention:**
```bash
# Run watch mode during development
docjays watch --interval 1h

# Or sync manually daily
docjays sync
```

---

### Problem: Conflicting information

**Symptoms:**
- Code doesn't match spec
- Multiple sources say different things
- Unclear which to follow

**Solution:**
1. Flag all conflicts explicitly
2. Cite each conflicting source
3. Analyze which is likely correct
4. Ask user for clarification
5. Update outdated documentation

**Example:**
```markdown
Conflict detected between sources. I need clarification:

- Code uses approach A
- Spec (.docjays/features/X.md) says approach B
- Standards (.docjays/sources/Y/) recommend approach C

Likely resolution: Follow spec (B), as it's most recent.
Should I update code and check if standards need updating?
```

---

### Problem: Feature spec missing

**Symptoms:**
- User requests feature implementation
- No spec exists
- Unclear requirements

**Solution:**
```markdown
I don't see a feature spec for [feature name] in `.docjays/features/`.

Before implementing, I recommend creating a spec that covers:
- Objective and success criteria
- Scope (in/out)
- Impacted files
- Data model changes
- Test plan
- Rollout strategy

Should I create `.docjays/features/[feature-slug].md` based on
your requirements? Or would you like to create it first?
```

---

### Problem: Context file unclear

**Symptoms:**
- Architecture not well documented
- Pattern usage unclear
- Rationale missing

**Solution:**
```markdown
The context file `.docjays/context/[file].md` doesn't clearly
explain [topic].

Could you clarify:
- How does [component] interact with [other component]?
- Why was [approach] chosen over [alternatives]?
- What are the constraints/trade-offs?

I can update the context file once I understand better.
```

---

## Maintenance

### Regular Updates

**Weekly:**
- Sync sources: `docjays sync`
- Review feature specs for completed features
- Update context files with new patterns

**Monthly:**
- Audit feature specs (archive completed)
- Review context for outdated information
- Check external sources for updates
- Update this workflow guide if needed

**Per Feature:**
- Create feature spec before coding
- Update spec during development
- Update context when architecture changes
- Archive spec when feature is complete

### Version Control

**What to commit:**
- ✅ `skills.md` (root)
- ✅ `docs/ai/docjays-workflow.md` (this file)
- ✅ `CLAUDE.md` (project instructions)
- ✅ `docs/features/` (feature specs)

**What NOT to commit (git-ignored):**
- ❌ `.docjays/` (entire folder)
- ❌ `.docjays/sources/` (external docs)
- ❌ `.docjays/config.json` (local config)

**Why `.docjays/` is git-ignored:**
- Contains external documentation (not owned by project)
- May contain sensitive information
- Each developer has their own sources
- Managed by Docjays CLI, not git

---

## Summary

### Key Takeaways

1. **Always ground responses** in `.docjays/` documentation
2. **Follow priority order:** features > context > sources > docs > code
3. **Cite sources explicitly** with file paths and sections
4. **Flag conflicts immediately** and ask for clarification
5. **Suggest documentation updates** when information is missing or outdated

### Quick Reference

```bash
# Initialize
docjays init

# Add source
docjays add-source --name <name> --type <type> --url <url>

# Sync sources
docjays sync

# Check status
docjays status

# Start MCP server
docjays serve

# Watch mode
docjays watch -i 1h
```

### Documentation Hierarchy

```
Priority   Folder                        Purpose
────────────────────────────────────────────────────────────
1.         .docjays/features/*.md        What we're building
2.         .docjays/context/*.md         How/why we built it
3.         .docjays/sources/*            Standards we follow
4.         docs/                         General docs
5.         Code                          Implementation
```

---

**For Questions:**
- Check `skills.md` for specific workflows
- Check this file for comprehensive guidance
- Check `CLAUDE.md` for project conventions
- Ask your team for clarification

**Last Updated:** 2026-01-27
**Version:** 1.0.0
**Maintained by:** Techjays
