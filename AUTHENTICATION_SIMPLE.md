# Docjays Simple Authentication Model

**Version:** 3.0 - Simplified
**Date:** 2026-01-27
**Status:** 🟢 Brainstorming - Simple & Clean

---

## Core Concept

**Two-Layer Model:**

1. **Global User Auth** (`docjays login`) - Who you are
2. **Project Key** (`docjays init`) - Which project you're working with

That's it. No confusion, no multiple auth systems.

---

## How It Works

### Layer 1: Global User Authentication

```bash
# Login once, works everywhere
docjays login
# Opens browser → OAuth → Stores token in ~/.docjays/auth.json

# Check who you are
docjays whoami
# Output: Logged in as user@example.com

# Logout
docjays logout
```

**What it does:**
- Connects your CLI to your docjays.dev account
- Stores credentials globally in `~/.docjays/auth.json`
- One login for ALL your projects
- Like git config --global

**Storage:**
```
~/.docjays/
└── auth.json       # Global auth token
    {
      "userId": "user_abc123",
      "email": "user@example.com",
      "token": "jwt_token_here",
      "expiresAt": "2026-02-27"
    }
```

**When you need it:**
- ✅ Creating/syncing projects with cloud
- ✅ Managing API keys
- ✅ Accessing team workspaces
- ❌ Not needed for local-only usage

---

### Layer 2: Project Key

```bash
# Initialize project
docjays init
# Generates a unique project key automatically
# Stores in .docjays/config.json

# Output:
# ✓ Project initialized!
#
# Project ID: proj_abc123xyz789
# Project Key: djkey_proj_abc123xyz789_secretpart
#
# 🔐 This key is used for:
#   - MCP server authentication
#   - All operations on this project
#   - Cloud sync (if logged in)
#
# ⚠️  Keep this key secret!
```

**What the project key is:**
- **Unique identifier** for this specific project
- **Authentication token** for MCP access
- **Authorization** for all project operations
- Auto-generated on `docjays init`
- Stored locally in `.docjays/config.json`
- Can also be managed in cloud (if logged in)

**Storage:**
```
.docjays/
└── config.json
    {
      "version": "1.0.0",
      "projectId": "proj_abc123xyz789",
      "projectKey": "djkey_proj_abc123xyz789_secretpart",
      "name": "My Project",
      "sources": [...],
      "keystore": {
        "enabled": true,
        "credentials": {
          "github-token": {
            "type": "token",
            "encrypted": "..."
          }
        }
      }
    }
```

**When you need it:**
- ✅ Starting MCP server (`docjays serve`)
- ✅ All CLI operations (sync, add-source, etc.)
- ✅ Connecting AI assistants to this project
- ❌ Not needed globally (per-project only)

---

## Complete User Flows

### Flow 1: Local-Only (No Cloud)

**Scenario:** Solo dev, local-only, public docs

```bash
# 1. Install CLI
npm install -g docjays

# 2. Initialize project (generates project key)
cd my-project
docjays init
# Output:
# Project Key: djkey_proj_abc123xyz789_secretpart
# Stored in .docjays/config.json

# 3. Add documentation sources
docjays add-source --name react-docs --url https://github.com/reactjs/react.dev

# 4. Sync
docjays sync

# 5. Start MCP (uses project key from config)
docjays serve
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

**Authentication:**
- ❌ No global login needed
- ✅ Project key auto-used from config
- ✅ MCP validates project key locally

**Pros:**
- Works completely offline
- Zero cloud dependency
- Simplest possible setup

---

### Flow 2: Cloud-Connected (Recommended)

**Scenario:** Want cloud dashboard, team sharing, analytics

```bash
# 1. Login globally (once per machine)
docjays login
# Browser opens → Login → Done
# Token stored in ~/.docjays/auth.json

# 2. Initialize project
cd my-project
docjays init
# If logged in, project is automatically created in cloud
# Project key is synced to cloud

# 3. Add sources
docjays add-source --name company-docs --url https://github.com/company/docs

# 4. Sync to cloud
docjays sync --cloud
# Pushes config + project key to cloud
# Now accessible from web dashboard

# 5. Start MCP
docjays serve
```

**Cloud Benefits:**
- Web dashboard shows this project
- Can regenerate project key from web
- Team members can access (if shared)
- Usage analytics and audit logs
- Backup and restore

---

### Flow 3: Private Documentation

**Scenario:** Need to access private repos

```bash
# 1. Login (if want cloud features)
docjays login

# 2. Initialize project
docjays init

# 3. Add credentials to project keystore
docjays auth add github-token --type token
# Enter token: ghp_xxxxxxxxxxxx
# Stored ENCRYPTED in .docjays/config.json under "keystore"

# 4. Add private source with auth
docjays add-source \
  --name private-docs \
  --url https://github.com/company/private-docs \
  --auth github-token

# 5. Sync (uses encrypted credential)
docjays sync

# 6. Start MCP
docjays serve
```

**Where credentials are stored:**
```json
// .docjays/config.json
{
  "projectId": "proj_abc123",
  "projectKey": "djkey_proj_abc123_secret",
  "keystore": {
    "version": "1.0.0",
    "salt": "random_salt",
    "credentials": {
      "github-token": {
        "type": "token",
        "encrypted": "aes_encrypted_value",
        "iv": "initialization_vector",
        "createdAt": "2026-01-27"
      }
    }
  }
}
```

**Encryption key:** Derived from project key + machine ID
- No master password needed!
- Credentials tied to this project
- Auto-decrypts when CLI runs (has project key)

---

### Flow 4: Team Collaboration

**Scenario:** Multiple devs working on same project

**Team Lead:**
```bash
# 1. Login
docjays login

# 2. Create project
docjays init
# Project created in cloud automatically

# 3. Add team members in web dashboard
# Go to: docjays.dev/projects/my-project/settings
# Add: alice@team.com (Admin), bob@team.com (Member)

# 4. Add sources with credentials
docjays auth add github-team-token --type token
docjays add-source --name company-docs --auth github-team-token

# 5. Push to cloud
docjays sync --cloud
# ⚠️  Credentials are NOT synced (security)
# Team members need to add their own credentials
```

**Team Member:**
```bash
# 1. Login
docjays login

# 2. Clone and pull project
git clone <repo>
cd <repo>
docjays init --cloud
# Detects existing project in cloud
# Downloads config (without credentials)

# 3. Add own credentials
docjays auth add github-token --type token
# OR: Import from team vault
docjays auth import --input team-keys.enc

# 4. Link credential to source
docjays sources update company-docs --auth github-token

# 5. Ready to work!
docjays sync
docjays serve
```

---

## Project Key Details

### Format

```
djkey_proj_{projectId}_{secretPart}

Examples:
djkey_proj_abc123xyz789_k9m2n4p5q6r7s8t9u0v1w2x3y4z5
djkey_proj_def456uvw012_a1b2c3d4e5f6g7h8i9j0k1l2m3n4
```

### Generation

```typescript
function generateProjectKey(projectId: string): string {
  const secretPart = crypto.randomBytes(24).toString('hex'); // 48 chars
  return `djkey_proj_${projectId}_${secretPart}`;
}
```

### Storage

**Local:**
- `.docjays/config.json` (project-level)
- Readable by CLI
- Git-ignored by default

**Cloud (optional):**
- Encrypted in database
- Associated with user account
- Can be rotated from web dashboard

### Usage

**CLI automatically uses it:**
```bash
# CLI reads project key from .docjays/config.json
docjays sync       # Uses project key
docjays serve      # Uses project key
docjays status     # Uses project key
```

**MCP server validates it:**
```typescript
// On startup
const config = await readConfig('.docjays/config.json');
const projectKey = config.projectKey;

// Validate locally or with cloud
if (await isValidProjectKey(projectKey)) {
  console.log('✓ Authenticated');
  startServer();
} else {
  throw new Error('Invalid project key');
}
```

**AI assistants can pass it explicitly (optional):**
```json
{
  "mcpServers": {
    "my-project": {
      "command": "docjays",
      "args": ["serve"],
      "env": {
        "DOCJAYS_PROJECT_KEY": "djkey_proj_abc123_secret"
      }
    }
  }
}
```

---

## Credential Storage (Simplified)

### Old Way (Too Complex)
- Separate keystore file
- Master password required
- Manual password entry every time

### New Way (Simple)
- Credentials stored IN project config
- Encrypted using project key
- Auto-decrypts (no password prompts!)

### Implementation

```typescript
// Encryption key derived from project key
const encryptionKey = deriveKey(projectKey, machineId);

// Encrypt credential
const encrypted = encrypt(tokenValue, encryptionKey);

// Store in config
config.keystore.credentials['github-token'] = {
  type: 'token',
  encrypted: encrypted.data,
  iv: encrypted.iv,
  createdAt: new Date().toISOString()
};

// Later: Auto-decrypt when needed
const token = decrypt(
  config.keystore.credentials['github-token'].encrypted,
  encryptionKey
);
```

**Security:**
- AES-256-GCM encryption
- Key derived from: project key + machine ID
- Different machine = can't decrypt (good for security)
- Same project on different machines needs re-add credentials (or import)

---

## Configuration Files

### Global Config (`~/.docjays/`)

```
~/.docjays/
├── auth.json              # Global login token
│   {
│     "userId": "user_abc123",
│     "email": "user@example.com",
│     "token": "jwt_here",
│     "expiresAt": "2026-02-27"
│   }
└── preferences.json       # User preferences
    {
      "defaultEditor": "vscode",
      "theme": "dark"
    }
```

### Project Config (`.docjays/`)

```
.docjays/
├── config.json            # ALL project config
│   {
│     "version": "1.0.0",
│     "projectId": "proj_abc123",
│     "projectKey": "djkey_proj_abc123_secret",
│     "name": "My Project",
│     "sources": [
│       {
│         "name": "company-docs",
│         "url": "https://github.com/company/docs",
│         "auth": "github-token"
│       }
│     ],
│     "keystore": {
│       "credentials": {
│         "github-token": {
│           "type": "token",
│           "encrypted": "...",
│           "iv": "..."
│         }
│       }
│     }
│   }
├── sources/              # Cloned docs
├── cache/                # Cache
└── logs/                 # Logs
```

**Everything in ONE file!**
- No separate keystore.enc
- No separate master-key
- Just config.json with encrypted credentials

---

## Commands Overview

### Global Commands

```bash
docjays login              # Login to cloud (global)
docjays whoami             # Check login status
docjays logout             # Logout
docjays projects list      # List all your projects (from cloud)
docjays projects select    # Switch context to a project
```

### Project Commands

```bash
# Initialization
docjays init               # Create project + generate key
docjays init --cloud       # Pull existing project from cloud

# Credentials
docjays auth add <name>    # Add encrypted credential to THIS project
docjays auth list          # List credentials for THIS project
docjays auth remove <name> # Remove credential

# Sources
docjays add-source [options]
docjays list-sources
docjays sync

# MCP
docjays serve              # Start MCP (uses project key from config)
docjays status             # Show project status

# Cloud
docjays push               # Push config to cloud
docjays pull               # Pull config from cloud
docjays sync --cloud       # Bidirectional sync
```

---

## Security Model

### Threat Model

**Protected against:**
- ✅ Credential theft (encrypted in config)
- ✅ Unauthorized MCP access (project key validation)
- ✅ Cross-project access (each project has unique key)
- ✅ Machine theft (credentials tied to machine ID)

**Not protected against:**
- ❌ Attacker with access to running process (can read decrypted)
- ❌ Attacker with project key + machine access (can decrypt)
- ❌ Local privilege escalation

**Risk acceptance:**
- If attacker has local access, they can run `docjays` commands anyway
- This model prioritizes UX over paranoid security
- For enterprise: Use cloud-only mode with SSO

### Security Levels

**Level 1: Local-Only + Public Docs**
- No credentials stored
- Project key is just an identifier
- Minimal security needed

**Level 2: Local + Private Docs**
- Credentials encrypted in config
- Project key as encryption key
- Good for solo developers

**Level 3: Cloud-Connected**
- Cloud validates project key
- Audit logs
- Can revoke from web
- Good for teams

**Level 4: Enterprise (Future)**
- SSO integration
- Hardware key support
- Advanced audit logging
- Compliance features

---

## Migration Path

### From Current System

**What changes:**
```bash
# OLD: Separate keystore
docjays auth init          # ❌ Remove
docjays auth add <name>    # ✅ Keep (but simpler)

# NEW: Just works
docjays init               # Generates project key
docjays auth add <name>    # Encrypts using project key (no password!)
```

**Migration script:**
```bash
# Automatic migration
docjays migrate

# Converts:
# - .docjays/.keys/keystore.enc → .docjays/config.json (keystore section)
# - Removes master password requirement
# - Re-encrypts with project key
```

---

## Comparison

### Before (Complex)

```
Authentication layers:
1. Source Auth → Master password → .keys/keystore.enc
2. User Auth → ? (not implemented)
3. MCP Auth → API key (separate from everything)

User experience:
- docjays auth init → enter password
- docjays auth add github-token → enter password again
- docjays sync → enter password again!
- Generate API key from web → copy to IDE config
- Too many steps, too much confusion
```

### After (Simple)

```
Authentication layers:
1. User Auth → docjays login (optional)
2. Project Key → Auto-generated, used for everything

User experience:
- docjays login (optional, once per machine)
- docjays init → project key auto-generated
- docjays auth add github-token → no password! (uses project key)
- docjays serve → just works! (uses project key from config)
- Done!
```

---

## Implementation Checklist

### Phase 1: Core (Week 1)
- [ ] Project key generation in `docjays init`
- [ ] Store project key in config.json
- [ ] CLI reads project key automatically
- [ ] MCP server validates project key (local mode)

### Phase 2: Credentials (Week 2)
- [ ] Move keystore INTO config.json
- [ ] Encrypt using project key (no master password)
- [ ] Auto-decrypt when CLI runs
- [ ] Migration script for existing keystores

### Phase 3: Global Auth (Week 3)
- [ ] `docjays login` command (OAuth)
- [ ] `docjays whoami` command
- [ ] Store token in `~/.docjays/auth.json`
- [ ] Auto-refresh tokens

### Phase 4: Cloud Sync (Week 4)
- [ ] `docjays init --cloud` (pull from cloud)
- [ ] `docjays push/pull` commands
- [ ] Cloud API endpoints
- [ ] Project key validation via cloud

### Phase 5: Polish (Week 5)
- [ ] Update all documentation
- [ ] Migration guide
- [ ] Security audit
- [ ] User testing

---

## Decision Points

### Q1: Should project key be required for MCP?

**Option A: Always required (Recommended)**
```bash
docjays serve
# Reads project key from config
# Validates locally or with cloud
# Requires .docjays/config.json to exist
```
✅ Pros: Secure, trackable, consistent
❌ Cons: None (you're in project directory anyway)

**Option B: Optional (fallback to no auth)**
```bash
docjays serve
# If no project key found → warn but continue
# Less secure but more forgiving
```
✅ Pros: More forgiving for beginners
❌ Cons: Security gap, inconsistent behavior

**Recommendation:** Option A

---

### Q2: Should credentials sync to cloud?

**Option A: Never sync (Recommended)**
- Credentials stay local only
- Each team member adds their own
- More secure

**Option B: Encrypted sync**
- Credentials sync encrypted
- Decrypted only by authorized team members
- Convenience vs security tradeoff

**Recommendation:** Option A (never sync)

---

### Q3: Machine ID for encryption?

**Include machine ID in encryption key?**
- Yes → Can't copy config to another machine (better security)
- No → Can copy config freely (better UX)

**Recommendation:** Yes, but provide `docjays auth export/import` for legitimate transfers

---

## Conclusion

### What Makes This Simple

1. **One global login** - Just `docjays login`, works everywhere
2. **One project key** - Auto-generated, used for everything
3. **No master passwords** - Credentials encrypted with project key
4. **No separate API keys** - Project key IS the API key
5. **Everything in config.json** - No separate files

### What This Enables

- ✅ Quick start: `docjays init` → `docjays serve` → done!
- ✅ Cloud optional: Works offline, cloud is additive
- ✅ Team friendly: Share project, add own credentials
- ✅ Secure: Encrypted credentials, validated keys
- ✅ Familiar: Like git (global config + project config)

### User Mental Model

```
User (global)
  └─ Login: docjays login

Projects (many)
  ├─ Project A: has own key + credentials
  ├─ Project B: has own key + credentials
  └─ Project C: has own key + credentials

AI Assistants
  └─ Connect to projects using project key
```

**Simple!**

---

**Status:** 🟢 Ready for implementation
**Next:** Get approval → Start Phase 1
