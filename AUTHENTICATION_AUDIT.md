# Docjays Authentication Audit

**Date:** 2026-01-27
**Status:** ✅ Complete System Audit

## Executive Summary

Docjays has **TWO SEPARATE authentication systems** that serve different purposes. Documentation currently does not clearly distinguish between them, which may cause user confusion.

## Authentication Systems

### 1. CLI Local Keystore (For Private Documentation Sources)

**Purpose:** Securely store credentials needed to access PRIVATE documentation sources (git repos, HTTP endpoints, etc.)

**Location:** `.docjays/.keys/keystore.enc` (on user's local machine)

**Commands:**
```bash
docjays auth init              # Initialize keystore with master password
docjays auth add <name>        # Add a credential
docjays auth list              # List stored credentials
docjays auth update <name>     # Update a credential
docjays auth remove <name>     # Remove a credential
docjays auth rotate-password   # Change master password
docjays auth export            # Export keys (encrypted)
docjays auth import            # Import keys from export
docjays auth destroy           # Delete all keys
```

**Supported Key Types:**
- `token` - Personal Access Tokens (GitHub, GitLab, etc.)
- `ssh` - SSH private keys
- `api_key` - API keys
- `password` - Passwords

**Security:**
- AES-256-GCM encryption
- Master password protected
- File permissions: 0o600 (owner read/write only)
- Passwords hashed with scrypt
- Keys stored in `.docjays/.keys/` (git-ignored)

**Usage Example:**
```bash
# 1. Initialize keystore
docjays auth init

# 2. Add GitHub token for private repos
docjays auth add github-token --type token

# 3. Use in source configuration
docjays add-source \
  --name private-docs \
  --type git \
  --url https://github.com/company/private-docs \
  --auth github-token
```

**When to Use:**
- Accessing private GitHub/GitLab repositories
- Fetching docs from authenticated HTTP endpoints
- Cloning repos with SSH keys
- Any source that requires authentication

---

### 2. Web API Keys (For AI Assistant Authentication)

**Purpose:** Authenticate AI assistants (Claude, Cursor, Windsurf, VS Code) to access the MCP server

**Location:** Database (Prisma/Supabase) - managed through web UI

**Creation:** Through web UI at `https://docjays.dev/projects/{slug}/connect`

**Format:** `djkey_proj_{projectId}_{random32chars}`

**Security:**
- Generated using cryptographically secure random bytes
- Stored as bcrypt hash in database (plaintext shown only once)
- Key prefix stored for identification
- Per-project scoping
- Can be activated/deactivated
- Can be deleted
- Tracks usage (request count, last used)

**Permissions:**
```typescript
{
  read: true,      // Read documentation
  search: true,    // Search content
  propose: true,   // Propose changes
}
```

**Usage Example:**
```json
{
  "mcpServers": {
    "docjays": {
      "command": "npx",
      "args": ["-y", "docjays", "serve"],
      "env": {
        "DOCJAYS_API_KEY": "djkey_proj_abc123_xyz789..."
      }
    }
  }
}
```

**When to Use:**
- Connecting Claude Desktop to MCP server
- Connecting Cursor to MCP server
- Connecting Windsurf to MCP server
- Connecting VS Code with Continue extension
- Connecting Claude Code CLI

---

## User Journey: Complete Flow

### Scenario A: Public Documentation Only

**Goal:** Access public documentation through AI assistant

```bash
# 1. Install CLI
npm install -g docjays

# 2. Initialize project
docjays init

# 3. Add public docs
docjays add-source \
  --name react-docs \
  --type git \
  --url https://github.com/reactjs/react.dev

# 4. Sync docs
docjays sync

# 5. Go to web UI: https://docjays.dev
# 6. Create project, link to local docs
# 7. Generate API key in Connect tab
# 8. Add API key to IDE config
# 9. Start using in AI assistant
```

**Authentication Required:**
- ❌ No CLI keystore needed (public sources)
- ✅ Web API key needed (for AI assistant → MCP)

---

### Scenario B: Private Documentation

**Goal:** Access private company docs through AI assistant

```bash
# 1. Install CLI
npm install -g docjays

# 2. Initialize project
docjays init

# 3. Initialize keystore
docjays auth init
# Enter master password: ********

# 4. Add GitHub token
docjays auth add github-token --type token
# Enter token value: ghp_xxxxxxxxxxxx

# 5. Add private repo with auth
docjays add-source \
  --name company-docs \
  --type git \
  --url https://github.com/company/private-docs \
  --auth github-token

# 6. Sync docs (will use stored token)
docjays sync

# 7. Go to web UI: https://docjays.dev
# 8. Create project, link to local docs
# 9. Generate API key in Connect tab
# 10. Add API key to IDE config
# 11. Start using in AI assistant
```

**Authentication Required:**
- ✅ CLI keystore needed (private sources)
- ✅ Web API key needed (for AI assistant → MCP)

---

## Critical Findings

### ✅ Strengths

1. **Secure CLI Keystore:**
   - AES-256-GCM encryption
   - Master password protection
   - Proper file permissions (0o600)
   - Sanitizes sensitive data from memory

2. **Secure Web API Keys:**
   - Bcrypt hashed in database
   - Only shown once upon creation
   - Per-project scoping
   - Request tracking and auditing
   - Ability to revoke

3. **Separation of Concerns:**
   - CLI auth for source access
   - Web auth for AI assistant access
   - No credential leakage between systems

### ⚠️ Gaps and Issues

1. **Documentation Confusion:**
   - README mentions CLI auth but doesn't explain when to use it
   - Web docs show API key generation but don't explain the distinction
   - No clear "which auth system do I need?" guidance
   - Missing end-to-end setup guide

2. **CLI Keystore UX:**
   - Master password required for every operation
   - No session/caching (security vs convenience tradeoff)
   - No indication of which sources use which keys
   - Export/import documented but no team sharing guidance

3. **Web API Key UX:**
   - Shown only once (good for security, but users might miss it)
   - No way to regenerate if lost
   - No scoped permissions per AI assistant
   - No rate limiting configuration

4. **Missing Features:**
   - No CLI command to generate web API keys
   - No programmatic API key management
   - No key rotation workflow for web API keys
   - No audit log for key usage
   - No alerts for suspicious activity

5. **MCP Server Authentication:**
   - Currently NO authentication check in MCP server code
   - `DOCJAYS_API_KEY` environment variable not validated
   - Any process can read local `.docjays/` directory
   - No verification that API key matches project

---

## Recommendations

### High Priority

1. **Update Documentation:**
   - Add "Authentication Guide" to web docs
   - Clearly explain both systems and when to use each
   - Add flowchart: "Do I need CLI auth?"
   - Add complete setup guides for both scenarios

2. **Implement MCP Server Authentication:**
   ```typescript
   // In MCP server startup
   const apiKey = process.env.DOCJAYS_API_KEY;
   if (!apiKey) {
     throw new Error('DOCJAYS_API_KEY required');
   }
   // Validate with backend API
   await validateApiKey(apiKey);
   ```

3. **Add CLI Command for API Key Management:**
   ```bash
   docjays api-keys list
   docjays api-keys create --name "Claude Desktop"
   docjays api-keys revoke <key-id>
   ```

### Medium Priority

4. **CLI Keystore Session Cache:**
   - Optional session caching with timeout
   - Controlled by `DOCJAYS_AUTH_CACHE_TTL` env variable
   - Improves UX without sacrificing security

5. **Web API Key Scoping:**
   - Add permission levels: read-only, full-access
   - Add rate limiting configuration
   - Add IP allowlist

6. **Audit Logging:**
   - Log all API key usage
   - Log authentication failures
   - Export logs for compliance

### Low Priority

7. **Team Key Sharing:**
   - Encrypted key sharing between team members
   - Organization-level keystore
   - SSO integration

8. **Key Rotation Automation:**
   - Scheduled key rotation
   - Grace period for old keys
   - Automated notification

---

## Security Checklist

### CLI Keystore
- [x] AES-256-GCM encryption
- [x] Master password protected
- [x] File permissions restricted (0o600)
- [x] Passwords hashed (scrypt)
- [x] Memory sanitization after use
- [x] Export encryption
- [ ] Session timeout/caching
- [ ] Brute-force protection
- [ ] Audit logging

### Web API Keys
- [x] Bcrypt hashing in database
- [x] Shown only once
- [x] Per-project scoping
- [x] Can be revoked
- [x] Request count tracking
- [ ] API key validation in MCP server
- [ ] Rate limiting
- [ ] Scoped permissions
- [ ] Expiration enforcement
- [ ] IP allowlist
- [ ] Audit logging

---

## Updated Documentation Needed

### Files to Update:

1. **packages/docjays-cli/README.md**
   - Add "Authentication" section explaining both systems
   - Add "When do I need CLI auth?" FAQ
   - Add complete setup examples

2. **app/help/cli/page.tsx**
   - Add "Authentication" section
   - Explain CLI keystore in detail
   - Add security best practices

3. **app/help/faq/page.tsx**
   - Add "What's the difference between CLI auth and API keys?" question
   - Add "When do I need CLI authentication?" question
   - Add "How do API keys work?" question

4. **New File: app/help/authentication/page.tsx**
   - Complete authentication guide
   - Both systems explained
   - Flowchart diagram
   - Security best practices
   - Troubleshooting

5. **New File: docs/AUTHENTICATION.md**
   - Technical deep-dive
   - Architecture diagrams
   - Security model
   - Developer guide

---

## Conclusion

Docjays has implemented two separate, secure authentication systems. However, the lack of clear documentation about when to use each system creates potential confusion. The main technical gap is the missing API key validation in the MCP server, which should be addressed for production use.

**Overall Security Rating:** 🟡 Good (with documentation and MCP validation needed)

**Recommended Next Steps:**
1. Update all documentation to explain both systems
2. Implement API key validation in MCP server
3. Add CLI commands for API key management
4. Create comprehensive authentication guide
