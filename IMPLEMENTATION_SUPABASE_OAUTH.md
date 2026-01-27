# Docjays CLI Authentication with Supabase OAuth

**Version:** 5.0 - Supabase Edition
**Date:** 2026-01-27
**Status:** 🟢 APPROVED - Using Existing Supabase Setup

---

## Overview

Using **Supabase OAuth** for CLI authentication - much simpler since you already have Supabase Auth!

### Benefits

✅ **Already Set Up** - Use existing Supabase project
✅ **Same User Accounts** - CLI uses web app accounts
✅ **Built-in Token Refresh** - Supabase handles it
✅ **PKCE Flow** - More secure for CLI
✅ **No Custom OAuth** - Less code to maintain

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Auth                        │
│  (Already running for your web app)                     │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼─────┐      ┌─────▼────┐
   │ Web App  │      │   CLI    │
   │          │      │          │
   │ Cookies  │      │ Tokens   │
   └──────────┘      └────┬─────┘
                          │
                     ┌────▼─────┐
                     │ Projects │
                     │ API Keys │
                     └──────────┘
```

---

## Authentication Flow

### Web App (Current - Already Working)
```typescript
// User logs in → Supabase session → Cookies
const supabase = createClient();
await supabase.auth.signInWithPassword({ email, password });
// Session stored in cookies
```

### CLI (New - Using PKCE)
```bash
docjays login
# 1. CLI generates PKCE challenge
# 2. Opens browser to Supabase Auth
# 3. User logs in with existing account
# 4. Redirects to localhost with code
# 5. CLI exchanges code for session
# 6. Stores session in ~/.docjays/auth.json
```

---

## Implementation

### Phase 1: CLI Login with Supabase (Week 1)

#### 1.1 Install Supabase Client in CLI

```bash
cd packages/docjays-cli
npm install @supabase/supabase-js
```

#### 1.2 Login Command Implementation

**File:** `packages/docjays-cli/src/cli/commands/login.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import http from 'http';
import open from 'open';

export class LoginCommand extends BaseCommand {
  private supabase: any;

  constructor(program: Command) {
    super(program);

    // Initialize Supabase client (same as web app)
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async execute(): Promise<void> {
    console.log('Opening browser to login...\n');

    // 1. Generate PKCE challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // 2. Start local server for callback
    const server = await this.startCallbackServer();
    const port = 3737;
    const redirectUri = `http://localhost:${port}/callback`;

    // 3. Get Supabase Auth URL
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github', // or 'google', 'email', etc.
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        scopes: 'read:user user:email',
        // PKCE parameters
        queryParams: {
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
      },
    });

    if (error) {
      throw new Error(`Failed to start auth flow: ${error.message}`);
    }

    // 4. Open browser
    await open(data.url);

    // 5. Wait for callback
    const { code } = await this.waitForCallback(server);

    // 6. Exchange code for session
    const { data: sessionData, error: sessionError } =
      await this.supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    // 7. Store session locally
    await this.saveAuth({
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: new Date(sessionData.session.expires_at! * 1000),
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email!,
        name: sessionData.user.user_metadata?.full_name || sessionData.user.email,
      },
    });

    console.log('\n✓ Logged in successfully!');
    console.log(`✓ User: ${sessionData.user.email}`);
    console.log('\nRun: docjays init');
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }

  private async startCallbackServer(): Promise<http.Server> {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.listen(3737, () => resolve(server));
    });
  }

  private async waitForCallback(server: http.Server): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.close();
        reject(new Error('Login timeout'));
      }, 5 * 60 * 1000); // 5 minutes

      server.on('request', (req, res) => {
        const url = new URL(req.url!, `http://localhost:3737`);
        const code = url.searchParams.get('code');

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>✓ Login Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);

          clearTimeout(timeout);
          server.close();
          resolve({ code });
        }
      });
    });
  }

  private async saveAuth(auth: AuthData): Promise<void> {
    const authPath = path.join(os.homedir(), '.docjays', 'auth.json');
    await fs.ensureDir(path.dirname(authPath));
    await fs.writeJson(authPath, auth, { mode: 0o600 });
  }
}
```

#### 1.3 Simplified Init Command

**File:** `packages/docjays-cli/src/cli/commands/init.ts`

```typescript
export class InitCommand extends BaseCommand {
  async execute(options: InitOptions): Promise<void> {
    // Load auth
    const auth = await this.loadAuth();

    if (!auth && !options.offline) {
      console.log('❌ Not logged in');
      console.log('\nPlease login first:');
      console.log('  docjays login');
      console.log('\nOr use offline mode:');
      console.log('  docjays init --offline');
      return;
    }

    if (options.offline) {
      await this.initOffline(options);
      return;
    }

    // Initialize with cloud
    await this.initCloud(options, auth!);
  }

  private async initCloud(options: InitOptions, auth: AuthData): Promise<void> {
    console.log('Creating project...\n');

    const projectName = options.name || path.basename(process.cwd());

    // Call your backend API with Supabase token
    const response = await fetch('https://docjays.dev/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        name: projectName,
        description: options.description,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const { project, apiKey } = await response.json();

    // Save config locally
    await this.initializeStructure();
    await this.saveConfig({
      version: '1.0.0',
      projectId: project.id,
      projectKey: apiKey.key, // Auto-generated API key
      name: project.name,
      slug: project.slug,
      sources: [],
      mcp: {
        enabled: true,
        transport: 'stdio',
      },
    });

    console.log('✓ Project created successfully!\n');
    console.log(`📝 Project: ${project.name}`);
    console.log(`🔑 API Key: ${apiKey.keyPrefix}... (stored securely)`);
    console.log(`\n🌐 Dashboard: https://docjays.dev/projects/${project.slug}\n`);
    console.log('Next steps:');
    console.log('  1. Add sources: docjays add-source --name docs --url <url>');
    console.log('  2. Sync: docjays sync');
    console.log('  3. Start MCP: docjays serve');
  }
}
```

#### 1.4 Auth Storage Helper

**File:** `packages/docjays-cli/src/core/auth/storage.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthStorage {
  private authPath: string;
  private supabase: any;

  constructor() {
    this.authPath = path.join(os.homedir(), '.docjays', 'auth.json');

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async load(): Promise<AuthData | null> {
    if (!await fs.pathExists(this.authPath)) {
      return null;
    }

    const auth = await fs.readJson(this.authPath);

    // Check if token is expired
    if (new Date(auth.expiresAt) < new Date()) {
      // Auto-refresh using Supabase
      return await this.refresh(auth.refreshToken);
    }

    return auth;
  }

  async save(auth: AuthData): Promise<void> {
    await fs.ensureDir(path.dirname(this.authPath));
    await fs.writeJson(this.authPath, auth, { mode: 0o600 });
  }

  async refresh(refreshToken: string): Promise<AuthData> {
    // Supabase handles token refresh automatically!
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error('Token refresh failed. Please login again: docjays login');
    }

    const auth: AuthData = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date(data.session.expires_at! * 1000),
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.email,
      },
    };

    await this.save(auth);
    return auth;
  }

  async remove(): Promise<void> {
    // Revoke session on Supabase
    const auth = await this.load();
    if (auth) {
      await this.supabase.auth.signOut();
    }

    // Remove local file
    await fs.remove(this.authPath);
  }
}
```

---

### Backend Integration

#### Update API Routes to Use Supabase Auth

**File:** `app/api/projects/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-keys';

export async function POST(request: NextRequest) {
  // Get Supabase user from token
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description } = await request.json();

  // Create project
  const project = await prisma.project.create({
    data: {
      name,
      description,
      slug: slugify(name),
      ownerId: user.id,
    },
  });

  // Auto-generate API key
  const { key, keyPrefix, keyHash } = generateApiKey(project.id);

  const apiKey = await prisma.apiKey.create({
    data: {
      projectId: project.id,
      name: 'CLI Auto-generated',
      key: keyHash,
      keyPrefix,
      permissions: {
        read: true,
        write: true,
        admin: true,
        mcp: true,
      },
    },
  });

  return NextResponse.json({
    project,
    apiKey: {
      id: apiKey.id,
      key, // Only returned once!
      keyPrefix,
    },
  });
}
```

---

## CLI Environment Variables

**File:** `packages/docjays-cli/.env.example`

```bash
# Supabase (same as your web app)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Note:** These should be the SAME values as your web app's Supabase config!

---

## User Flow Comparison

### Before (Custom OAuth)
```bash
# More code to maintain
docjays login
# Opens browser → Custom OAuth → Localhost callback
# Custom token generation
# Custom token refresh logic
# Custom session management
```

### After (Supabase OAuth)
```bash
# Much simpler!
docjays login
# Opens browser → Supabase Auth → Localhost callback
# ✓ Supabase handles everything
# ✓ Built-in token refresh
# ✓ Same user accounts as web
# ✓ Less code to maintain
```

---

## OAuth Providers

You can support multiple OAuth providers through Supabase:

```typescript
// In LoginCommand, user can choose:
docjays login           // Default (GitHub)
docjays login --github  // GitHub
docjays login --google  // Google
docjays login --email   // Email/Password
```

**Supabase Config:**
```typescript
await this.supabase.auth.signInWithOAuth({
  provider: options.provider || 'github', // github, google, gitlab, etc.
  options: {
    redirectTo: redirectUri,
    skipBrowserRedirect: true,
  },
});
```

---

## File Structure

```
~/.docjays/
└── auth.json                    # Supabase session
    {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresAt": "2026-02-27",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe"
      }
    }

project/.docjays/
└── config.json                  # Project config + API key
    {
      "projectId": "proj_abc123",
      "projectKey": "djkey_proj_abc123_xyz",
      "name": "My Project",
      "sources": [...]
    }
```

---

## Benefits Summary

### ✅ What You Get

1. **Use Existing Setup**
   - Same Supabase project
   - Same user accounts
   - Same authentication rules

2. **Simpler Implementation**
   - Supabase SDK handles OAuth
   - Built-in PKCE support
   - Auto token refresh
   - Less code to maintain

3. **Better Security**
   - PKCE flow (more secure than client secret)
   - Supabase handles token storage
   - Built-in rate limiting
   - Automatic token rotation

4. **Consistent UX**
   - CLI users = Web users
   - One account, all features
   - Same login providers

---

## Updated Timeline

### Week 1: Supabase OAuth Integration
- [x] Install @supabase/supabase-js in CLI
- [ ] Implement login command with PKCE
- [ ] Implement token storage & refresh
- [ ] Update init command
- [ ] Test OAuth flow

**Simplified vs Original:**
- **Before:** 7 days (custom OAuth)
- **After:** 3 days (using Supabase!)

### Week 2: API Key + Validation
- [ ] Auto-generate API keys on project creation
- [ ] MCP server validation
- [ ] Cloud sync commands
- [ ] Usage tracking

**No change** - Still 7 days

### Week 3: OAuth Integrations (GitHub/GitLab)
- [ ] Connect GitHub (via Supabase)
- [ ] Connect GitLab (via Supabase)
- [ ] Store OAuth tokens
- [ ] Auto-use for private repos

**Simplified:**
- **Before:** 7 days (custom integrations)
- **After:** 5 days (Supabase providers!)

### Week 4: Cloud MCP
- [ ] Direct HTTPS MCP endpoint
- [ ] Rate limiting
- [ ] Analytics

**No change** - Still 7 days

### Week 5: Documentation
- [ ] Update all docs
- [ ] Migration guide
- [ ] Security audit

**No change** - Still 7 days

---

## Quick Start Script

```bash
# 1. Add Supabase env vars to CLI
cd packages/docjays-cli
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "SUPABASE_ANON_KEY=your-anon-key" >> .env

# 2. Install Supabase client
npm install @supabase/supabase-js

# 3. Build
npm run build

# 4. Test login
npm link
docjays login
```

---

## Security Notes

### PKCE (Proof Key for Code Exchange)

Why PKCE for CLI:
- No client secret needed
- More secure for public clients
- Prevents authorization code interception
- Supabase supports it out of the box

### Token Storage

```
~/.docjays/auth.json
- File permissions: 0o600 (owner only)
- Contains Supabase session
- Auto-refreshed when expired
- Revoked on logout
```

---

## Comparison: Custom OAuth vs Supabase

| Aspect | Custom OAuth | Supabase OAuth |
|--------|-------------|----------------|
| **Implementation** | ~500 lines | ~200 lines |
| **Dependencies** | Custom backend | Supabase SDK |
| **Token refresh** | Manual | Automatic |
| **User accounts** | Separate | Shared with web |
| **OAuth providers** | Manual setup | Built-in |
| **Security** | Manual PKCE | Built-in PKCE |
| **Maintenance** | High | Low |
| **Time to implement** | 7 days | 3 days |

---

## Next Steps

1. **Verify Supabase Setup**
   - Confirm Supabase URL
   - Confirm anon key
   - Test auth works in web app

2. **Add OAuth Provider**
   - Enable GitHub in Supabase Dashboard
   - Configure callback URLs
   - Test OAuth flow

3. **Implement CLI Login**
   - Add Supabase client to CLI
   - Implement PKCE flow
   - Test token storage

4. **Test End-to-End**
   ```bash
   docjays login    # Opens browser
   docjays whoami   # Shows user
   docjays init     # Creates project
   docjays serve    # Starts MCP
   ```

---

## Questions?

- Need help with Supabase OAuth setup?
- Want to add more OAuth providers?
- Questions about PKCE flow?
- Ready to start implementation?

**This is much simpler than custom OAuth!** 🎉

**Status:** 🟢 Ready to implement with Supabase
**Estimated time:** 3 days for Phase 1 (vs 7 days custom)
