# Docjays Cloud-First Authentication Model

**Version:** 4.0 - Cloud-First
**Date:** 2026-01-27
**Status:** 🔵 Analyzing User's Proposal

---

## Proposed Flow

```bash
# Step 1: Install globally
npm install -g docjays

# Step 2: Login (OAuth)
docjays login

# Step 3: Init project (asks for API key)
docjays init
# Prompts: Enter API key (from docjays.dev)

# Step 4: Validate & sync
# Validates key with cloud
# Syncs docs to .docjays/

# For non-CLI MCP: Use API key directly with endpoint
```

---

## Deep Analysis

### ✅ What Works Really Well

#### 1. **Single Source of Truth: API Key**
```
Everything uses the API key:
├─ CLI authentication
├─ MCP server authentication
├─ Cloud API authentication
└─ Project authorization

One key to rule them all!
```

**Why this is good:**
- No confusion about which auth to use
- API keys are familiar to developers
- Can be managed from web dashboard
- Can be revoked instantly
- Usage tracking built-in

#### 2. **Clear User Journey**
```
Web (docjays.dev)          CLI
─────────────────          ───
1. Sign up/Login    ──→    2. docjays login
3. Create project   ──→    4. Generate API key
5. Copy key         ──→    6. docjays init (paste key)
                           7. docjays serve (uses key)
```

**Why this is good:**
- Linear flow, no branching
- Web-first approach (modern SaaS model)
- User sees their projects in dashboard
- Analytics and monitoring built-in

#### 3. **Non-CLI MCP Support**
```
AI Assistant ──HTTP──→ mcp.docjays.dev/v1/projects/my-project
                       Authorization: Bearer <API_KEY>
```

**Why this is good:**
- No CLI installation needed
- Works from any machine
- Centralized hosting
- Easier for non-technical users

#### 4. **Validation & Sync**
```bash
docjays init
# Enter API key: djkey_proj_abc123_xyz

# Validates with cloud:
# ✓ Key is valid
# ✓ Project: "My Project"
# ✓ Owner: user@example.com

# Syncs configuration:
# ✓ Downloading sources config
# ✓ Syncing to .docjays/
```

**Why this is good:**
- Immediate feedback if key is wrong
- Auto-configures from cloud
- No manual setup needed

---

### ⚠️ What Needs Clarification

#### 1. **Where Does the API Key Come From?**

**Scenario A: User creates project in web first**
```
1. User goes to docjays.dev
2. Creates project "My Project"
3. Generates API key
4. Copies key
5. Goes to CLI
6. Runs: docjays init
7. Pastes key when prompted
```

**Pros:**
- User sees project in web first
- Clear project management
- Can configure in web before CLI

**Cons:**
- Extra step (web → CLI)
- Key copy-paste is error-prone
- Friction in getting started

---

**Scenario B: CLI auto-creates project**
```bash
docjays login              # OAuth
docjays init               # Auto-creates project in cloud
# Output:
# ✓ Project created: "my-project"
# ✓ API Key: djkey_proj_abc123_xyz
# ✓ Saved to .docjays/config.json
```

**Pros:**
- Seamless experience
- No copy-paste
- Faster setup

**Cons:**
- User might not know project exists in web
- Less control over project name/settings

---

**Recommendation: Hybrid Approach**

```bash
# Option 1: Auto-create (default, fastest)
docjays init
# ✓ Created project "my-project" (from folder name)
# ✓ API Key generated and saved
# 📝 View in dashboard: https://docjays.dev/projects/my-project

# Option 2: Use existing (explicit)
docjays init --key djkey_proj_abc123_xyz
# ✓ Connected to project "Existing Project"
# ✓ Synced configuration

# Option 3: Interactive (guided)
docjays init --interactive
# ? Create new project or use existing?
#   > Create new
#     Use existing (enter key)
#
# ? Project name: My Project
# ✓ Created and connected
```

---

#### 2. **What About Private Documentation Sources?**

**The Problem:**
```bash
# User wants to add private GitHub repo
docjays add-source \
  --name company-docs \
  --url https://github.com/company/private-docs

# ❌ Error: Authentication required
# GitHub needs a Personal Access Token
```

**Where do we store GitHub tokens?**

**Option A: Still use local encrypted keystore**
```bash
docjays auth add github-token --type token
# Enter token: ghp_xxxxxxxxxxxx
# Stored encrypted in .docjays/config.json

docjays add-source \
  --name company-docs \
  --url https://github.com/company/private-docs \
  --auth github-token

# Uses stored token
```

**Pros:** Secure, local-only, never sent to cloud
**Cons:** Still need credential management system

---

**Option B: Store in cloud (encrypted)**
```bash
# Add credential to cloud
docjays auth add github-token --type token --cloud
# Enter token: ghp_xxxxxxxxxxxx
# ✓ Stored encrypted in cloud
# ✓ Available on all your machines

docjays add-source \
  --name company-docs \
  --url https://github.com/company/private-docs \
  --auth github-token

# Fetches token from cloud when needed
```

**Pros:** Works on any machine, centralized
**Cons:** Token stored in cloud (even if encrypted)

---

**Option C: OAuth integration (best)**
```bash
# Connect GitHub account
docjays connect github
# Opens browser → GitHub OAuth → Done
# ✓ Connected GitHub account

docjays add-source \
  --name company-docs \
  --url https://github.com/company/private-docs
# Automatically uses OAuth token
# No manual token management!
```

**Pros:** No manual token management, secure, revocable
**Cons:** Requires OAuth implementation for each provider

---

**Recommendation: Hybrid**
- Default: OAuth integrations (GitHub, GitLab, etc.)
- Fallback: Manual token storage (encrypted locally)
- Future: Cloud-encrypted token vault (optional)

---

#### 3. **Local-Only Users**

**The Problem:**
```
Some users might want:
- No cloud dependency
- Offline-only mode
- No account needed
- Privacy-focused
```

**Does this flow support them?**

**Current proposal:**
```bash
npm install -g docjays
docjays login              # ❌ Requires cloud
docjays init               # ❌ Requires API key from cloud
```

**Not supported!**

---

**Solution: Optional Cloud**

```bash
# Cloud-connected (default)
docjays login
docjays init
# Works with cloud

# OR: Local-only mode
docjays init --offline
# ✓ Created local project
# ✓ Generated local project ID
# ⚠️  Cloud features disabled
# ⚠️  MCP authentication limited

# Can connect later
docjays login
docjays sync --cloud
# ✓ Project now synced to cloud
```

**Recommendation:** Support both modes, cloud as default

---

#### 4. **Multiple Projects**

**The Problem:**
```
User has multiple projects:
- Project A: Client work
- Project B: Side project
- Project C: Open source

Each needs different API key
```

**How does this work?**

**Current proposal:**
```bash
cd project-a
docjays init    # API Key A

cd project-b
docjays init    # API Key B

cd project-c
docjays init    # API Key C
```

**This works!** Each project has its own `.docjays/config.json` with its own API key.

**But consider:**
```bash
# User wants to list all their projects
docjays projects list
# Error: No API key in current directory

# User wants to switch between projects
docjays projects use project-b
# How does this work?
```

**Recommendation:** Store global user token separately
```
~/.docjays/
└── auth.json       # Global user token from OAuth

project-a/.docjays/
└── config.json     # API Key A (project-specific)

project-b/.docjays/
└── config.json     # API Key B (project-specific)
```

---

#### 5. **API Key Manual Entry**

**The Problem:**
```bash
docjays init
# Enter API key: djkey_proj_abc123_xyz789_...
# ❌ Typo! Invalid key
# 😤 User frustration
```

**Manual API key entry is error-prone:**
- Long keys (50+ characters)
- Easy to mistype
- No visual feedback during entry
- Clipboard paste might fail

**Solutions:**

**Option A: Copy from web, validate immediately**
```bash
docjays init
# Enter API key (paste from clipboard):
# ✓ Validating...
# ✓ Connected to project "My Project"
```

**Option B: Browser-based flow**
```bash
docjays init
# Opening browser to link your project...
# [Browser opens to docjays.dev/cli/link]
# User clicks "Link to CLI"
# ✓ Project linked automatically!
# ✓ API key saved
```

**Option C: Generate during login**
```bash
docjays login
# OAuth flow...
# ✓ Logged in as user@example.com

docjays init
# ? Create new project or link existing?
#   > Create new: "My Project"
# ✓ Project created
# ✓ API key generated automatically
# ✓ No manual entry needed!
```

**Recommendation:** Option C (auto-generate during init)

---

### 🚨 Critical Issues

#### Issue 1: **Cloud Dependency**

**Current proposal requires cloud for everything:**
- `docjays login` → Cloud
- `docjays init` → Cloud API key
- `docjays serve` → Validates key with cloud?

**What if:**
- User is offline?
- Cloud is down?
- User doesn't want cloud account?

**Impact:** CLI unusable without cloud

**Solution:** Support offline mode as fallback
```bash
docjays init --offline    # Works without cloud
docjays serve --offline   # Works without validation
```

---

#### Issue 2: **API Key as Sole Authentication**

**Everything depends on one API key:**
- CLI operations
- MCP server
- Source access
- Team access

**What if key is compromised?**
- Attacker can access all docs
- Attacker can modify sources
- Attacker can use MCP server
- No granular permissions

**Solution:** Key scoping and permissions
```typescript
interface ApiKey {
  id: string;
  projectId: string;
  permissions: {
    read: boolean;      // Read documentation
    write: boolean;     // Modify sources
    admin: boolean;     // Project settings
    mcp: boolean;       // MCP server access
  };
  scope: {
    sources: string[];  // Specific sources only
    ips: string[];      // IP allowlist
  };
  expiresAt: Date;
}
```

---

#### Issue 3: **Bootstrap Problem**

**To use CLI, user must:**
1. Go to web → Create account
2. Run `docjays login` → OAuth
3. Go back to web → Create project & generate key
4. Run `docjays init` → Paste key
5. Finally start using CLI

**This is 5 steps before any value!**

**Competitor comparison:**
```bash
# Vercel
vercel login    # Done! Can deploy immediately

# Netlify
netlify login   # Done! Can deploy immediately

# Railway
railway login   # Done! Can create projects immediately

# Docjays (proposed)
docjays login   # ✓ Logged in
docjays init    # ❌ Need API key first!
```

**Solution:** Auto-create project during init
```bash
docjays login   # OAuth
docjays init    # Auto-creates project + API key
docjays serve   # Works immediately!
```

---

### 💡 Optimized Flow

Based on analysis, here's the optimal flow:

```bash
# Step 1: Install
npm install -g docjays

# Step 2: Login (OAuth) - Creates global session
docjays login
# Opens browser → OAuth → Done
# ✓ Logged in as user@example.com
# ✓ Token stored in ~/.docjays/auth.json

# Step 3: Init project (auto-creates in cloud)
cd my-project
docjays init
# Using global login...
# ✓ Created project "my-project" in cloud
# ✓ API key generated: djkey_proj_abc123_xyz
# ✓ Saved to .docjays/config.json
#
# 📝 View in dashboard: https://docjays.dev/projects/my-project

# Step 4: Add sources
docjays add-source --name docs --url https://github.com/myorg/docs

# Step 5: Add private source (OAuth flow)
docjays connect github
# Opens browser → GitHub OAuth → Done
# ✓ GitHub connected

docjays add-source \
  --name private-docs \
  --url https://github.com/company/private-docs
# ✓ Uses GitHub OAuth token automatically

# Step 6: Sync
docjays sync
# ✓ Synced 2 sources

# Step 7: Start MCP
docjays serve
# ✓ MCP server started
# ✓ API key validated
# ✓ Ready for AI assistants!
```

**AI Assistant Config:**
```json
{
  "mcpServers": {
    "my-project": {
      "command": "docjays",
      "args": ["serve"],
      "cwd": "/path/to/my-project"
    }
  }
}
```

**Non-CLI MCP (direct connection):**
```json
{
  "mcpServers": {
    "my-project-cloud": {
      "url": "https://mcp.docjays.dev/v1/projects/my-project",
      "headers": {
        "Authorization": "Bearer djkey_proj_abc123_xyz"
      }
    }
  }
}
```

---

### 📊 Comparison Matrix

| Aspect | Proposed Flow | Optimized Flow |
|--------|---------------|----------------|
| **Steps to start** | 5 steps | 3 steps |
| **Manual key entry** | Yes (error-prone) | No (auto-generated) |
| **Cloud dependency** | Required | Optional (has offline mode) |
| **Private sources** | Manual tokens | OAuth integrations |
| **Multiple projects** | Works | Works better (global login) |
| **Non-CLI MCP** | ✅ Supported | ✅ Supported |
| **Offline mode** | ❌ Not supported | ✅ Supported |
| **Key management** | Manual | Automatic |

---

## Final Recommendation

### Keep from Proposed Flow ✅

1. **API Key as central auth** - One key for everything
2. **Cloud-first approach** - Modern SaaS model
3. **Non-CLI MCP support** - Direct HTTPS connections
4. **Validation & sync** - Immediate feedback

### Improve from Proposed Flow 🔧

1. **Auto-generate API keys** - No manual entry
2. **OAuth integrations** - For GitHub, GitLab, etc.
3. **Offline mode** - Fallback for local-only users
4. **Global login** - One login, many projects

### Complete Flow

```bash
# Installation
npm install -g docjays

# Global login (once per machine)
docjays login
# OAuth → Stores in ~/.docjays/auth.json

# Per-project setup (in each project directory)
docjays init
# Auto-creates project + API key
# Stores in .docjays/config.json

# Optional: Connect GitHub for private repos
docjays connect github

# Add sources, sync, serve
docjays add-source ...
docjays sync
docjays serve
```

**File Structure:**
```
~/.docjays/
└── auth.json                    # Global user token

my-project/.docjays/
├── config.json                  # API key + config
└── sources/                     # Synced docs

other-project/.docjays/
├── config.json                  # Different API key
└── sources/                     # Different docs
```

---

## Implementation Priority

### Phase 1 (Week 1): MVP
- [ ] `docjays login` with OAuth
- [ ] `docjays init` auto-creates project + API key
- [ ] Store API key in config.json
- [ ] MCP server uses API key from config

### Phase 2 (Week 2): Validation
- [ ] API key validation on CLI operations
- [ ] API key validation on MCP server start
- [ ] Cloud API endpoints for validation
- [ ] Error handling & retry logic

### Phase 3 (Week 3): OAuth Integrations
- [ ] `docjays connect github`
- [ ] `docjays connect gitlab`
- [ ] Store OAuth tokens in cloud (encrypted)
- [ ] Auto-use OAuth tokens for sources

### Phase 4 (Week 4): Non-CLI MCP
- [ ] Cloud MCP server endpoint
- [ ] HTTPS MCP protocol support
- [ ] Rate limiting
- [ ] Usage analytics

### Phase 5 (Week 5): Offline Mode
- [ ] `docjays init --offline`
- [ ] Local-only operation
- [ ] Can sync to cloud later
- [ ] Graceful degradation

---

## Decision Matrix

| Question | Answer | Reasoning |
|----------|--------|-----------|
| Cloud required? | No (optional) | Support offline users |
| Manual API key entry? | No (auto-generate) | Reduce errors |
| OAuth for sources? | Yes (preferred) | Better UX & security |
| Multiple projects? | Yes (per-project keys) | Isolation & security |
| Non-CLI MCP? | Yes (cloud endpoint) | No installation needed |
| Global login? | Yes (one login) | Better UX |

---

## Conclusion

### What Works ✅
- API key as single auth token
- Cloud-first modern approach
- Non-CLI MCP support
- Clear validation & sync

### What Needs Improvement 🔧
- Remove manual API key entry → Auto-generate
- Add offline mode → Not cloud-dependent
- Add OAuth integrations → Easier private repos
- Global login + per-project keys → Better UX

### Final Verdict
**The proposed flow is 90% there!** With these improvements, it becomes the ideal authentication model:
- Simple for users
- Secure by default
- Flexible for different use cases
- Modern SaaS best practices

**Ready to implement?** Let's do Phase 1!
