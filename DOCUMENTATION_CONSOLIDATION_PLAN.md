# Documentation Consolidation Plan for AI Summit & DocJays

**Status:** Proposed
**Created:** 2026-01-27
**Priority:** High

---

## Executive Summary

The AI Summit project has **strong CLI documentation** but **fragmented web app documentation** and **incomplete developer guides**. This plan proposes a unified documentation architecture that serves all audiences: CLI users, web app users, developers, AI agents, and operations teams.

### Current State
- ✅ **DocJays CLI:** Excellent (README, USAGE, PUBLISHING, PROJECT_SUMMARY)
- ⚠️ **Web Application:** Minimal (scattered feature specs, no user guide)
- ⚠️ **Developer Docs:** Incomplete (missing setup, testing, deployment guides)
- ⚠️ **API Docs:** MCP only (REST endpoints undocumented)
- ⚠️ **Operations:** Missing (no deployment, monitoring guides)

### Proposed State
- 🎯 **Centralized documentation hub** accessible from web UI, CLI, and MCP
- 🎯 **Audience-specific documentation** with clear navigation
- 🎯 **Auto-generated API docs** from code annotations
- 🎯 **Interactive tutorials** and examples
- 🎯 **Versioned documentation** alongside releases

---

## 📊 Documentation Inventory

### Current Documentation (72+ files, ~14,108+ lines)

#### By Location:
1. **Root Level** (5 files)
   - CLAUDE.md, DOCJAYS_IMPLEMENTATION_PLAN.md, DOCJAYS_QUICKSTART.md, CONSOLIDATION_PLAN.md, README.md

2. **Main Docs** (/docs - 42 files)
   - ai/ (7 files) - AI context maps
   - features/ (4 files) - Feature specifications
   - architecture/ (1 file) - Schema docs
   - phases/ (1 file) - Phase completion
   - Root: 41 planning, implementation, and architecture docs

3. **CLI Package** (/packages/docjays-cli - 4 files)
   - README.md, USAGE.md, PUBLISHING.md, PROJECT_SUMMARY.md, CHANGELOG.md

4. **CLI Templates** (/packages/docjays-cli/templates - 4 files)
   - config.json, README.md, feature-template.md, gitignore.txt

5. **Claude Commands** (/.claude/commands - 16 files)
   - Phase commands (docjays-phase1-7.md)
   - Workflow commands (feature-new, onboard, plan, pr, etc.)

#### By Audience:
- **CLI Users:** 5 files (excellent coverage)
- **Web Users:** 0 dedicated files (gap!)
- **Developers:** 20+ files (fragmented)
- **AI Agents:** 7 context maps + MCP docs
- **Operations:** 0 files (critical gap!)

---

## 🎯 Proposed Documentation Architecture

### Three-Tier Structure

```
docs/
├── 📘 user-guides/              # User-facing documentation
│   ├── web-app/                 # Web UI guides
│   ├── cli/                     # CLI guides (from packages/docjays-cli)
│   └── integrations/            # Third-party integrations
│
├── 📗 developer/                # Developer documentation
│   ├── getting-started/         # Setup and onboarding
│   ├── architecture/            # System design
│   ├── api-reference/           # API documentation
│   ├── guides/                  # How-to guides
│   └── contributing/            # Contribution guidelines
│
├── 📕 operations/               # Operations documentation
│   ├── deployment/              # Deployment guides
│   ├── configuration/           # Configuration reference
│   ├── monitoring/              # Observability
│   └── security/                # Security guidelines
│
└── 📙 reference/                # Reference materials
    ├── feature-specs/           # Feature specifications
    ├── decisions/               # Architecture Decision Records (ADRs)
    ├── roadmaps/                # Product roadmaps
    └── glossary/                # Terminology
```

---

## 📚 Documentation by Audience

### 1. Web Application Users

**Target:** Product managers, team members, clients
**Access:** In-app help, docs website
**Priority:** HIGH (currently missing!)

#### Proposed Structure:
```
docs/user-guides/web-app/
├── index.md                     # Overview and navigation
├── getting-started.md           # First-time user guide
├── projects/
│   ├── creating-projects.md
│   ├── managing-teams.md
│   └── project-settings.md
├── documents/
│   ├── creating-documents.md
│   ├── editing-documents.md
│   ├── document-types.md
│   └── grounding-documents.md
├── revisions/
│   ├── creating-revisions.md
│   ├── reviewing-revisions.md
│   └── revision-workflow.md
├── audit/
│   ├── running-audits.md
│   ├── interpreting-results.md
│   └── fixing-issues.md
├── ai-features/
│   ├── doc-chat.md              # AI chat in documents
│   ├── grounded-knowledge.md    # Knowledge modules
│   └── decision-extraction.md   # Decision records
└── faq.md                       # Frequently asked questions
```

**Content to Create:**
- [ ] Getting started guide with screenshots
- [ ] Feature walkthroughs with examples
- [ ] Video tutorials (optional)
- [ ] Troubleshooting common issues
- [ ] Best practices guide

---

### 2. CLI Users (DocJays CLI)

**Target:** Developers using DocJays CLI
**Access:** npm package, GitHub, command line
**Priority:** LOW (already excellent!)

#### Current Structure (Keep):
```
packages/docjays-cli/
├── README.md                    # Quick start ✅
├── USAGE.md                     # Complete guide ✅
├── PUBLISHING.md                # Publishing workflow ✅
├── PROJECT_SUMMARY.md           # Architecture ✅
├── CHANGELOG.md                 # Version history ✅
└── templates/                   # User templates ✅
```

**Enhancements:**
- [ ] Link CLI docs to main docs site
- [ ] Add video tutorials
- [ ] Create interactive CLI tutorial (optional)
- [ ] Add common patterns library

**Distribution:**
- Keep in package for offline access
- Mirror to docs website for discovery
- Link from web UI settings (if CLI is used in projects)

---

### 3. Developers (Contributors)

**Target:** Engineers contributing to the project
**Access:** GitHub repo, local development
**Priority:** HIGH (currently fragmented!)

#### Proposed Structure:
```
docs/developer/
├── index.md                     # Developer hub
│
├── getting-started/
│   ├── local-setup.md           # Environment setup ⚠️ NEW
│   ├── project-structure.md     # Code organization ✅ (exists as codestructure.md)
│   ├── tech-stack.md            # Technologies used ✅ (partial)
│   └── first-contribution.md    # Quick contribution guide ⚠️ NEW
│
├── architecture/
│   ├── overview.md              # System architecture ⚠️ (exists as template)
│   ├── database-schema.md       # Prisma models ⚠️ NEW
│   ├── api-design.md            # API architecture ⚠️ (exists as template)
│   ├── mcp-integration.md       # MCP implementation ✅
│   └── authentication.md        # Auth system ✅ (partial)
│
├── api-reference/
│   ├── rest-endpoints.md        # REST API docs ⚠️ NEW
│   ├── mcp-tools.md             # MCP tools ✅ (partial)
│   ├── database-queries.md      # Common queries ⚠️ NEW
│   └── utilities.md             # Helper functions ✅
│
├── guides/
│   ├── testing.md               # Testing guide ⚠️ NEW
│   ├── debugging.md             # Debug techniques ⚠️ NEW
│   ├── database-migrations.md   # Prisma migrations ⚠️ NEW
│   ├── adding-features.md       # Feature workflow ✅ (CLAUDE.md)
│   ├── mcp-tools.md             # Creating MCP tools ⚠️ NEW
│   └── ui-components.md         # Component library ⚠️ NEW
│
└── contributing/
    ├── code-style.md            # Coding standards ✅ (partial in CLAUDE.md)
    ├── commit-messages.md       # Commit conventions ✅ (partial in CLAUDE.md)
    ├── pull-requests.md         # PR workflow ✅ (partial in CLAUDE.md)
    └── code-review.md           # Review guidelines ⚠️ NEW
```

**Content to Create:**
- [ ] **Local setup guide** (env vars, database, npm install)
- [ ] **Testing guide** (Jest, Playwright, strategies)
- [ ] **Database migration guide** (Prisma workflow)
- [ ] **REST API documentation** (all endpoints)
- [ ] **Debugging guide** (common issues, tools)
- [ ] **Component library guide** (UI components)

**Content to Migrate:**
- [ ] Move architecture docs from /docs/ai/ to /docs/developer/architecture/
- [ ] Consolidate scattered implementation docs
- [ ] Update code structure doc

---

### 4. Operations Teams

**Target:** DevOps, SRE, system administrators
**Access:** Private docs repo or internal wiki
**Priority:** MEDIUM (currently missing!)

#### Proposed Structure:
```
docs/operations/
├── index.md                     # Operations hub
│
├── deployment/
│   ├── production-setup.md      # Prod deployment ⚠️ NEW
│   ├── staging-setup.md         # Staging env ⚠️ NEW
│   ├── environment-variables.md # Config reference ⚠️ NEW
│   ├── database-setup.md        # Database provisioning ⚠️ NEW
│   └── ci-cd-pipeline.md        # GitHub Actions ✅ (partial)
│
├── configuration/
│   ├── authentication.md        # Auth providers ⚠️ NEW
│   ├── storage.md               # File storage config ⚠️ NEW
│   ├── email.md                 # Email service config ✅ (partial)
│   └── feature-flags.md         # Feature toggles ⚠️ NEW
│
├── monitoring/
│   ├── logging.md               # Logging setup ⚠️ NEW
│   ├── metrics.md               # Metrics collection ⚠️ NEW
│   ├── alerting.md              # Alert configuration ⚠️ NEW
│   └── dashboards.md            # Monitoring dashboards ⚠️ NEW
│
├── security/
│   ├── security-hardening.md    # Security best practices ⚠️ NEW
│   ├── secrets-management.md    # Managing secrets ⚠️ NEW
│   ├── ssl-certificates.md      # HTTPS setup ⚠️ NEW
│   └── backup-recovery.md       # Backup procedures ⚠️ NEW
│
└── troubleshooting/
    ├── common-issues.md         # FAQ for ops ⚠️ NEW
    ├── performance.md           # Performance tuning ⚠️ NEW
    └── incident-response.md     # Incident runbook ⚠️ NEW
```

**Content to Create (all new!):**
- [ ] Production deployment guide
- [ ] Environment variable reference
- [ ] Monitoring and logging setup
- [ ] Backup and recovery procedures
- [ ] Security hardening checklist
- [ ] Incident response runbook

---

### 5. AI Agents (Claude, GPT, etc.)

**Target:** AI assistants via MCP
**Access:** MCP server, `.docjays/` folder
**Priority:** MEDIUM (currently good, needs enhancement)

#### Current Structure (Keep):
```
docs/ai/                         # AI context maps ✅
├── architecture.md              # System overview
├── codestructure.md             # Code organization
├── datamodel.md                 # Database schema
├── integrations.md              # External services
├── api-endpoints.md             # API reference
├── utilities.md                 # Helper functions
└── technical-debt.md            # Known issues
```

#### Enhanced Structure:
```
docs/ai/
├── index.md                     # AI context hub ⚠️ NEW
├── architecture.md              # Complete (currently template) ⚠️ ENHANCE
├── codestructure.md             # Keep ✅
├── datamodel.md                 # Keep ✅
├── integrations.md              # Keep ✅
├── api-endpoints.md             # Complete (currently template) ⚠️ ENHANCE
├── utilities.md                 # Keep ✅
├── technical-debt.md            # Keep ✅
├── patterns/                    # Common patterns ⚠️ NEW
│   ├── authentication.md
│   ├── database-queries.md
│   ├── api-handlers.md
│   └── ui-components.md
└── workflows/                   # Development workflows ⚠️ NEW
    ├── feature-development.md
    ├── bug-fixes.md
    └── refactoring.md
```

**Enhancements:**
- [ ] Complete architecture.md (currently template)
- [ ] Complete api-endpoints.md (currently template)
- [ ] Add common patterns library
- [ ] Add workflow guides for AI agents
- [ ] Ensure all docs are grounded in `.docjays/`

**MCP Integration:**
- Keep exposing via MCP server
- Add more granular resources (e.g., per-feature docs)
- Improve search capabilities

---

### 6. npm Package Users

**Target:** Developers installing DocJays from npm
**Access:** npm registry, GitHub
**Priority:** LOW (already excellent!)

#### Keep Current:
- README.md on npm registry
- Link to full docs: https://docjays.dev (to be created)
- CHANGELOG.md for version history

**Enhancements:**
- [ ] Create https://docjays.dev website
- [ ] Add installation video
- [ ] Add interactive examples
- [ ] Add community showcase

---

## 🏗️ Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up documentation infrastructure

- [ ] Create new directory structure
- [ ] Set up documentation website (Docusaurus, VitePress, or Nextra)
- [ ] Migrate CLI docs to main docs site (symlink or copy)
- [ ] Create documentation templates
- [ ] Set up auto-deployment for docs

**Deliverables:**
- New `/docs/` structure
- Documentation website live
- CI/CD for docs deployment

---

### Phase 2: User Guides (Week 3-4)
**Goal:** Create web app user documentation

- [ ] Write getting started guide
- [ ] Document all major features (projects, documents, revisions, audit)
- [ ] Create screenshots and diagrams
- [ ] Write FAQ
- [ ] Add in-app help links

**Deliverables:**
- Complete web app user guide
- In-app help system
- Video tutorials (optional)

---

### Phase 3: Developer Docs (Week 5-6)
**Goal:** Complete developer documentation

- [ ] Write local setup guide
- [ ] Document database schema and migrations
- [ ] Create API reference (REST + MCP)
- [ ] Write testing guide
- [ ] Document UI component library

**Deliverables:**
- Complete developer guides
- API reference documentation
- Testing and debugging guides

---

### Phase 4: Operations (Week 7-8)
**Goal:** Create operations documentation

- [ ] Write deployment guides (production, staging)
- [ ] Document environment configuration
- [ ] Create monitoring and alerting guide
- [ ] Write security hardening checklist
- [ ] Create incident response runbook

**Deliverables:**
- Complete operations guides
- Deployment automation scripts
- Security checklist

---

### Phase 5: AI Context (Week 9-10)
**Goal:** Enhance AI agent documentation

- [ ] Complete architecture.md
- [ ] Complete api-endpoints.md
- [ ] Create patterns library
- [ ] Create workflow guides
- [ ] Improve MCP resource exposure

**Deliverables:**
- Complete AI context maps
- Enhanced MCP integration
- Workflow automation

---

### Phase 6: Polish & Launch (Week 11-12)
**Goal:** Finalize and launch

- [ ] Review all documentation for accuracy
- [ ] Add search functionality
- [ ] Create documentation videos
- [ ] Set up feedback system
- [ ] Launch docs website

**Deliverables:**
- Polished documentation
- Public docs website launch
- Announcement and marketing

---

## 🛠️ Technology Stack for Documentation

### Documentation Website
**Recommendation:** Nextra (Next.js-based)

**Why Nextra:**
- ✅ Built on Next.js (same stack as main app)
- ✅ Excellent DX with hot reload
- ✅ Built-in search (Flexsearch)
- ✅ Markdown + MDX support
- ✅ Great theming and customization
- ✅ Easy deployment to Vercel

**Alternatives:**
- **Docusaurus** (React-based, feature-rich)
- **VitePress** (Vue-based, fast)
- **GitBook** (Hosted solution)

### Hosting
- **Vercel** (free for docs, auto-deploy from GitHub)
- **Netlify** (alternative)
- **GitHub Pages** (free but limited)

### Automation
- **GitHub Actions** (auto-deploy on commit)
- **Vale** (prose linting)
- **markdownlint** (markdown linting)

---

## 📍 Documentation Locations

### Where to Place Documentation

#### 1. **User Guides (Web App)**
```
Location: /docs/user-guides/web-app/
Distribution:
  - Docs website: https://docs.ai-summit.com
  - In-app help: Link from nav bar
  - PDF export: For offline use
```

#### 2. **CLI Documentation**
```
Location: /packages/docjays-cli/docs/ (keep)
Symlink: /docs/user-guides/cli/ → /packages/docjays-cli/docs/
Distribution:
  - npm package: Bundled with CLI
  - Docs website: Linked section
  - Command line: docjays --help
```

#### 3. **Developer Documentation**
```
Location: /docs/developer/
Distribution:
  - Docs website: https://docs.ai-summit.com/developer
  - GitHub README: Link to docs
  - AI agents: Via MCP and .docjays/
```

#### 4. **Operations Documentation**
```
Location: /docs/operations/ (or private repo)
Distribution:
  - Internal docs site (if private)
  - Docs website (if public)
  - Notion/Confluence (alternative)
```

#### 5. **AI Context**
```
Location: /docs/ai/ (keep)
Distribution:
  - MCP server: Exposed as resources
  - .docjays/ folder: For local AI agents
  - Docs website: Reference section
```

#### 6. **Reference Materials**
```
Location: /docs/reference/
Distribution:
  - Feature specs: /docs/reference/feature-specs/
  - ADRs: /docs/reference/decisions/
  - Roadmaps: /docs/reference/roadmaps/
  - Glossary: /docs/reference/glossary/
```

---

## 🔗 Integration Points

### 1. Web Application → Docs
```typescript
// Add to nav bar
<Link href="https://docs.ai-summit.com">
  Documentation
</Link>

// Contextual help
<HelpButton docUrl="/docs/user-guides/web-app/documents/editing" />

// Inline tooltips
<Tooltip>
  Learn more about <a href="/docs/...">document grounding</a>
</Tooltip>
```

### 2. CLI → Docs
```bash
# Link from help text
docjays --help
# Shows: "Learn more: https://docjays.dev"

# Open docs command
docjays docs
# Opens browser to docs website
```

### 3. MCP → Docs
```json
// Expose docs as MCP resources
{
  "resources": [
    {
      "uri": "docjays://docs/user-guides/web-app",
      "name": "Web App User Guide"
    },
    {
      "uri": "docjays://docs/developer",
      "name": "Developer Documentation"
    }
  ]
}
```

### 4. API → Docs
```typescript
// API error responses link to docs
{
  "error": "Invalid document type",
  "message": "Document type must be one of: ARCHITECTURE, API_CONTRACT, ...",
  "documentation": "https://docs.ai-summit.com/api/documents"
}
```

---

## 📦 Migration Strategy

### Step 1: Create New Structure (No Breaking Changes)
- Create new `/docs/` directories
- Don't delete old files yet
- Use symlinks where appropriate

### Step 2: Copy and Enhance
- Copy existing docs to new locations
- Enhance with missing content
- Update internal links

### Step 3: Update References
- Update all code references to docs
- Update CLI help text
- Update web app links

### Step 4: Deprecate Old Locations
- Add deprecation notices to old docs
- Redirect old URLs to new locations
- Keep old docs for 2-3 releases

### Step 5: Remove Old Docs
- After validation period, remove old files
- Update all remaining references
- Archive old docs for history

---

## 🎯 Success Metrics

### Quantitative
- [ ] 100% of features documented
- [ ] <5 minute time-to-first-value for new users
- [ ] <10 minute developer onboarding time
- [ ] 90%+ documentation freshness (updated within 30 days)
- [ ] <1 week response time on documentation issues

### Qualitative
- [ ] Positive user feedback on docs
- [ ] Reduced support tickets
- [ ] Faster contributor onboarding
- [ ] Improved search rankings for "AI documentation tool"

---

## 🚨 Critical Gaps to Address First

### Priority 1 (This Week)
1. **Local setup guide** for developers
2. **Web app getting started** guide for users
3. **Environment variables** reference for operations

### Priority 2 (Next Week)
4. **API reference** for REST endpoints
5. **Database schema** documentation
6. **Deployment guide** for production

### Priority 3 (Month 1)
7. **Testing guide** for developers
8. **Monitoring setup** for operations
9. **Security hardening** checklist

---

## 📋 Documentation Standards

### Writing Style
- Use clear, concise language
- Write in present tense
- Use active voice
- Include code examples
- Add screenshots where helpful
- Provide "Copy to clipboard" for commands

### Structure
- Start with brief overview
- Include prerequisites
- Provide step-by-step instructions
- End with "Next steps" or "See also"
- Add troubleshooting section

### Maintenance
- Review docs quarterly
- Update with each release
- Track doc issues in GitHub
- Assign doc owners per section
- Use automated freshness checks

---

## 🎬 Next Actions

### Immediate (This Week)
- [ ] **Decision:** Choose documentation tool (Nextra recommended)
- [ ] **Setup:** Create docs website repository
- [ ] **Structure:** Create new directory structure
- [ ] **Priority:** Write local setup guide
- [ ] **Priority:** Write web app getting started guide

### Short-term (This Month)
- [ ] Migrate CLI docs to main site
- [ ] Create API reference
- [ ] Document database schema
- [ ] Set up auto-deployment
- [ ] Launch docs website beta

### Long-term (This Quarter)
- [ ] Complete all user guides
- [ ] Complete all developer guides
- [ ] Complete operations documentation
- [ ] Create video tutorials
- [ ] Launch public docs website

---

## 📞 Ownership

### Documentation Owners
- **User Guides:** Product team
- **Developer Docs:** Engineering team
- **Operations:** DevOps/SRE team
- **API Reference:** Backend team
- **CLI Docs:** DocJays maintainer

### Review Process
- Pull request for all doc changes
- Quarterly documentation audits
- User feedback integration
- Automated link checking

---

## 🔄 Maintenance Plan

### Daily
- Monitor documentation issues
- Respond to user questions
- Fix broken links

### Weekly
- Review new PRs for doc updates
- Update changelog
- Publish blog post on new features

### Monthly
- Audit documentation freshness
- Update screenshots
- Review analytics
- Improve popular pages

### Quarterly
- Full documentation review
- Restructure if needed
- Survey users for feedback
- Plan documentation improvements

---

## 📚 Resources

### Tools
- **Nextra:** https://nextra.site/
- **Docusaurus:** https://docusaurus.io/
- **Vale:** https://vale.sh/ (prose linter)
- **markdownlint:** https://github.com/DavidAnson/markdownlint

### References
- **Good Docs Project:** https://thegooddocsproject.dev/
- **Write the Docs:** https://www.writethedocs.org/
- **Google Developer Docs Style Guide:** https://developers.google.com/style

---

**Last Updated:** 2026-01-27
**Next Review:** 2026-02-27
**Owner:** Engineering Team
