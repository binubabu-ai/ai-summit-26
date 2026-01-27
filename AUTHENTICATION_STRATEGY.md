# Docjays Authentication Strategy

**Version:** 2.0
**Date:** 2026-01-27
**Status:** 🟡 Proposed Architecture

---

## Overview

Docjays has **THREE authentication contexts** that need to work together:

1. **Source Authentication** - Accessing private documentation sources
2. **User Authentication** - Connecting CLI to cloud account
3. **MCP Authentication** - AI assistants accessing documentation

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docjays Ecosystem                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  Local CLI   │◄────────┤  Web App     │                      │
│  │              │  Auth   │  docjays.dev │                      │
│  └──────┬───────┘  Token  └──────┬───────┘                      │
│         │                         │                              │
│         │                         │                              │
│    ┌────▼─────┐              ┌───▼────┐                         │
│    │  Source  │              │  API   │                         │
│    │  Keystore│              │  Keys  │                         │
│    └────┬─────┘              └───┬────┘                         │
│         │                        │                              │
│         │                        │                              │
│    ┌────▼─────────────────────────▼────┐                        │
│    │      MCP Server                   │                       │
│    │  (Local or Cloud)                 │                       │
│    └────┬──────────────────────────────┘                        │
│         │                                                        │
│         │  Authenticated Access                                │
│         │                                                        │
│    ┌────▼────────────────────────────────┐                      │
│    │  AI Assistants                      │                     │
│    │  Claude, Cursor, Windsurf, VS Code  │                     │
│    └─────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Contexts

### 1. Source Authentication (Private Docs Access)

**Purpose:** Access private documentation sources (GitHub, GitLab, private APIs)

**When needed:**
- Adding private git repositories
- Fetching from authenticated HTTP endpoints
- Using SSH for git operations

**How it works:**
```bash
# Initialize local keystore
docjays auth init
# Creates: .docjays/.keys/keystore.enc

# Add credentials
docjays auth add github-pat --type token
# Prompts for: Master password + token value
# Stores encrypted in keystore

# Use in sources
docjays add-source \
  --name private-docs \
  --url https://github.com/company/private-docs \
  --auth github-pat

# Sync (prompts for master password once per session)
docjays sync
```

**Storage:**
- **Location:** `.docjays/.keys/keystore.enc` (project-level)
- **Format:** AES-256-GCM encrypted JSON
- **Scope:** Per-project (each project has its own keystore)
- **Git:** Always ignored (auto-added to .gitignore)

**Supported credential types:**
- `token` - Personal Access Tokens (GitHub, GitLab, etc.)
- `ssh` - SSH private keys
- `api_key` - API keys
- `password` - Basic auth passwords
- `oauth` - OAuth tokens (future)

**Security:**
- Master password required (never stored)
- AES-256-GCM encryption
- File permissions: 0o600 (owner only)
- Session caching (optional, 15min TTL)

---

### 2. User Authentication (CLI ↔ Cloud Sync)

**Purpose:** Connect CLI to docjays.dev account for cloud features

**When needed:**
- Syncing projects with web app
- Generating API keys from CLI
- Accessing cloud-backed features
- Team collaboration
- Analytics and monitoring

**How it works:**
```bash
# Login to docjays.dev
docjays login
# Opens browser → OAuth flow → Stores token

# Check status
docjays whoami
# Output: Logged in as user@example.com

# Sync project with cloud
docjays sync --cloud
# Pushes local config to web app
# Enables web dashboard access

# Generate API key from CLI
docjays api-keys create --name "Claude Desktop"
# Creates key in web app
# Returns: djkey_proj_abc123_xyz789...

# Logout
docjays logout
```

**Storage:**
- **Location:** `~/.docjays/auth.json` (user-level, NOT project-level)
- **Format:**
  ```json
  {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "access_token": "jwt_token_here",
      "refresh_token": "refresh_token_here",
      "expires_at": "2026-02-27T10:00:00Z"
    }
  }
  ```
- **Scope:** User-level (same token across all projects)
- **Git:** Never committed (in home directory)

**Security:**
- OAuth 2.0 flow (via browser)
- JWT tokens with expiration
- Refresh token rotation
- Automatic token refresh

**Cloud Features Enabled:**
- Web dashboard access to local projects
- API key management from CLI
- Team sharing and permissions
- Usage analytics
- Audit logs
- Backup and restore

---

### 3. MCP Authentication (AI Assistant Access)

**Purpose:** Authenticate AI assistants to access documentation via MCP

**Two deployment modes:**

#### Mode A: Local MCP Server (CLI-based)

**How it works:**
```bash
# Start local MCP server
docjays serve

# OR with API key validation (recommended)
DOCJAYS_API_KEY=djkey_proj_123 docjays serve
```

**AI Assistant Config (Claude Desktop):**
```json
{
  "mcpServers": {
    "docjays": {
      "command": "docjays",
      "args": ["serve"],
      "env": {
        "DOCJAYS_API_KEY": "djkey_proj_abc123_xyz789..."
      }
    }
  }
}
```

**Authentication Options:**

**Option 1: Trusted Local Process (No Auth)**
- MCP server runs as local process
- Trusts any local connection
- Suitable for: Single-user machines
- Risk: Any local process can access docs

**Option 2: API Key Required (Recommended)**
- MCP server validates API key from env var
- API key generated from web app
- Validates against cloud API
- Tracks usage and audit logs
- Can revoke keys anytime

**Implementation:**
```typescript
// On MCP server startup
const apiKey = process.env.DOCJAYS_API_KEY;

if (apiKey) {
  // Validate with cloud API
  const valid = await validateApiKey(apiKey);
  if (!valid) {
    throw new Error('Invalid API key');
  }
  console.error('✓ API key validated');
} else {
  // Warn but allow (for backward compatibility)
  console.error('⚠ Warning: Running without API key authentication');
  console.error('  Set DOCJAYS_API_KEY for enhanced security');
}
```

#### Mode B: Cloud MCP Server (Hosted)

**How it works:**
```bash
# No CLI needed - connects directly to cloud
```

**AI Assistant Config:**
```json
{
  "mcpServers": {
    "docjays-cloud": {
      "url": "https://mcp.docjays.dev/v1/projects/my-project",
      "headers": {
        "Authorization": "Bearer djkey_proj_abc123_xyz789..."
      }
    }
  }
}
```

**Authentication:**
- **Required:** API key in Authorization header
- **Validates:** Every request
- **Scope:** Per-project access
- **Features:**
  - No CLI installation needed
  - Works from any machine
  - Centralized access control
  - Rate limiting
  - Advanced analytics

---

## Complete User Journeys

### Journey 1: Solo Developer (Public Docs Only)

**Scenario:** Working with public documentation, single developer

```bash
# 1. Install CLI
npm install -g docjays

# 2. Initialize project
docjays init

# 3. Add public docs (NO AUTH NEEDED)
docjays add-source --name react-docs --url https://github.com/reactjs/react.dev

# 4. Sync
docjays sync

# 5. Start local MCP (NO AUTH NEEDED)
docjays serve
```

**AI Assistant Config:**
```json
{
  "mcpServers": {
    "docjays": {
      "command": "docjays",
      "args": ["serve"]
    }
  }
}
```

**Authentication used:**
- ❌ No source auth (public repos)
- ❌ No user auth (local-only)
- ❌ No MCP auth (trusted local)

**Pros:** Zero friction, works offline
**Cons:** No cloud features, no security

---

### Journey 2: Solo Developer (Private Docs)

**Scenario:** Working with private company docs, needs authentication

```bash
# 1. Install and init
npm install -g docjays
docjays init

# 2. Initialize keystore for private sources
docjays auth init
# Enter master password: ********

# 3. Add GitHub token
docjays auth add github-pat --type token
# Enter token: ghp_xxxxxxxxxxxx

# 4. Add private repo
docjays add-source \
  --name company-docs \
  --url https://github.com/company/private-docs \
  --auth github-pat

# 5. Sync (uses stored token)
docjays sync

# 6. Login to cloud (optional, for web dashboard)
docjays login

# 7. Generate API key
docjays api-keys create --name "Claude Desktop"
# Returns: djkey_proj_abc123_xyz789...

# 8. Start MCP with API key
DOCJAYS_API_KEY=djkey_proj_abc123 docjays serve
```

**AI Assistant Config:**
```json
{
  "mcpServers": {
    "docjays": {
      "command": "docjays",
      "args": ["serve"],
      "env": {
        "DOCJAYS_API_KEY": "djkey_proj_abc123_xyz789..."
      }
    }
  }
}
```

**Authentication used:**
- ✅ Source auth (for private repos)
- ✅ User auth (for cloud features)
- ✅ MCP auth (for audit logs)

**Pros:** Secure, full features, audit trail
**Cons:** More setup, requires cloud account

---

### Journey 3: Team Collaboration

**Scenario:** Multiple developers on a team project

**Team Admin:**
```bash
# 1. Setup project
docjays init
docjays login

# 2. Create team keystore
docjays auth init

# 3. Add shared credentials
docjays auth add github-team-token --type token

# 4. Export encrypted keystore
docjays auth export --output team-keys.enc
# Enter export password: ********

# 5. Share team-keys.enc securely (1Password, Vault, etc.)

# 6. Push config to cloud
docjays sync --cloud
```

**Team Members:**
```bash
# 1. Clone repo and init
git clone <repo>
docjays init

# 2. Login to cloud
docjays login

# 3. Pull config from cloud
docjays sync --cloud --pull

# 4. Import team keystore
docjays auth import --input team-keys.enc
# Enter export password: ********

# 5. Generate personal API key
docjays api-keys create --name "My Claude Desktop"

# 6. Start MCP with personal key
DOCJAYS_API_KEY=<my-key> docjays serve
```

**Authentication used:**
- ✅ Source auth (shared team keystore)
- ✅ User auth (individual accounts)
- ✅ MCP auth (personal API keys)

**Pros:** Team collaboration, individual tracking
**Cons:** Key management overhead

---

### Journey 4: Cloud-Only (No CLI)

**Scenario:** Using only hosted MCP, no local CLI

**Steps:**
1. Go to docjays.dev
2. Sign up / login
3. Create project
4. Connect private GitHub repos (OAuth)
5. Generate API key
6. Add to AI assistant config

**AI Assistant Config:**
```json
{
  "mcpServers": {
    "docjays": {
      "url": "https://mcp.docjays.dev/v1/projects/my-project",
      "headers": {
        "Authorization": "Bearer djkey_proj_abc123_xyz789..."
      }
    }
  }
}
```

**Authentication used:**
- ✅ GitHub OAuth (for private repos)
- ✅ User auth (web login)
- ✅ MCP auth (API key)

**Pros:** No CLI needed, works anywhere, easy setup
**Cons:** Requires internet, cloud dependency

---

## Decision Matrix: Which Auth Do I Need?

| Scenario | Source Auth | User Auth | MCP Auth |
|----------|-------------|-----------|----------|
| Public docs, local-only | ❌ | ❌ | ❌ |
| Private docs, local-only | ✅ | ❌ | ⚠️ Optional |
| Public docs + cloud features | ❌ | ✅ | ✅ |
| Private docs + cloud features | ✅ | ✅ | ✅ |
| Team collaboration | ✅ | ✅ | ✅ |
| Cloud-only (no CLI) | N/A | ✅ | ✅ |

**Legend:**
- ✅ Required
- ⚠️ Recommended but optional
- ❌ Not needed
- N/A - Not applicable

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Source authentication (keystore) ✅ Already implemented
- [x] Web API key generation ✅ Already implemented
- [ ] MCP server API key validation
- [ ] Update documentation

### Phase 2: User Authentication (Week 3-4)
- [ ] `docjays login` command (OAuth flow)
- [ ] `docjays whoami` command
- [ ] `docjays logout` command
- [ ] User-level token storage (`~/.docjays/auth.json`)
- [ ] Automatic token refresh

### Phase 3: Cloud Sync (Week 5-6)
- [ ] `docjays sync --cloud` (push/pull config)
- [ ] Cloud-backed project storage
- [ ] API endpoints for CLI ↔ Cloud sync

### Phase 4: API Key Management from CLI (Week 7-8)
- [ ] `docjays api-keys list`
- [ ] `docjays api-keys create`
- [ ] `docjays api-keys revoke`
- [ ] `docjays api-keys rotate`

### Phase 5: Team Features (Week 9-10)
- [ ] Team workspaces
- [ ] Shared keystores
- [ ] Role-based access control
- [ ] Audit logs UI

### Phase 6: Cloud MCP Server (Week 11-12)
- [ ] Hosted MCP server endpoints
- [ ] Direct AI assistant connection
- [ ] Rate limiting and quotas
- [ ] Advanced analytics

---

## Security Best Practices

### For Source Authentication:
1. Use strong master passwords (16+ characters)
2. Rotate credentials regularly
3. Use separate tokens per project
4. Enable 2FA on source systems (GitHub, etc.)
5. Never commit keystore to git

### For User Authentication:
1. Use OAuth (never store passwords)
2. Rotate tokens automatically
3. Revoke unused sessions
4. Monitor login activity
5. Enable 2FA on docjays.dev account

### For MCP Authentication:
1. Always use API keys (even for local MCP)
2. Create separate keys per AI assistant
3. Rotate keys periodically
4. Revoke keys when not needed
5. Monitor usage and set alerts

---

## Configuration Files

### Project-Level (`.docjays/`)
```
.docjays/
├── config.json           # Project configuration
├── .keys/
│   └── keystore.enc      # Encrypted source credentials
├── sources/              # Cloned documentation
├── cache/                # Temporary cache
└── logs/                 # Operation logs
```

### User-Level (`~/.docjays/`)
```
~/.docjays/
├── auth.json             # User authentication tokens
├── preferences.json      # User preferences
└── cache/                # Global cache
```

---

## FAQ

### Q: Do I need all three auth systems?
**A:** No. Most users only need MCP authentication (API keys). Source authentication is only needed for private documentation.

### Q: Can I use CLI without logging in?
**A:** Yes! CLI works completely offline for local-only workflows.

### Q: What happens if I lose my master password?
**A:** You'll need to recreate the keystore and re-add all credentials. Export your keystore regularly!

### Q: Can I share API keys with teammates?
**A:** Not recommended. Each person should have their own API key for audit purposes.

### Q: How do I revoke access?
**A:**
- **Source credentials:** `docjays auth remove <name>`
- **API keys:** Revoke in web dashboard or `docjays api-keys revoke`
- **User session:** `docjays logout`

### Q: Is the CLI required?
**A:** No! You can use cloud-only mode without installing CLI.

---

## Migration Guide (Current → Proposed)

### For Existing Users:

**Current state:** You may have:
- Local keystore (`.docjays/.keys/`)
- API keys generated from web

**No breaking changes!** Everything continues to work.

**New features available:**
1. Add `DOCJAYS_API_KEY` to MCP server (optional but recommended)
2. Use `docjays login` for cloud features (optional)
3. Manage API keys from CLI (optional)

**Recommended migration:**
```bash
# 1. Login to cloud (new)
docjays login

# 2. Regenerate API keys with names
docjays api-keys create --name "Claude Desktop"

# 3. Add API key to MCP config
# Edit your IDE config to include DOCJAYS_API_KEY

# 4. Test
docjays serve  # Should validate API key
```

---

## Conclusion

This strategy provides:
- ✅ **Flexibility:** Works local-only OR cloud-connected
- ✅ **Security:** Multiple layers of authentication
- ✅ **Simplicity:** Each auth system has clear purpose
- ✅ **Scalability:** Supports solo devs → enterprise teams
- ✅ **Backward Compatible:** No breaking changes

**Recommended Default:**
- Solo devs: Local MCP + API keys (optional)
- Teams: Cloud sync + individual API keys
- Enterprise: Full auth stack + audit logs

---

**Status:** 🟡 Proposed - Pending review and approval
**Next Steps:** Review → Implement Phase 1 → Iterate based on feedback
