# Docjays Authentication Implementation Roadmap

**Version:** 1.0
**Date:** 2026-01-27
**Status:** 🟢 APPROVED - Ready for Implementation

---

## Overview

Implementing the optimized cloud-first authentication model with:
- Global OAuth login
- Auto-generated project API keys
- OAuth integrations for private sources
- Cloud MCP endpoints
- Offline mode support

---

## Phase 1: OAuth Login + Auto-Generated Keys (Week 1)

### Goals
- User can `docjays login` with OAuth
- User can `docjays init` to auto-create project + API key
- API keys stored in project config
- Basic cloud API endpoints

### Tasks

#### 1.1 Global Login Command
**File:** `packages/docjays-cli/src/cli/commands/login.ts`

```typescript
/**
 * Login Command
 * Authenticates user with docjays.dev via OAuth
 */
export class LoginCommand extends BaseCommand {
  async execute(): Promise<void> {
    // 1. Start local HTTP server to receive OAuth callback
    const server = createLocalServer();
    const port = 3737;
    const redirectUri = `http://localhost:${port}/callback`;

    // 2. Generate OAuth state token
    const state = crypto.randomBytes(32).toString('hex');

    // 3. Build OAuth URL
    const authUrl = new URL('https://docjays.dev/api/auth/cli/authorize');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    // 4. Open browser
    console.log('Opening browser for login...');
    await open(authUrl.toString());

    // 5. Wait for callback
    const { code } = await waitForCallback(server, state);

    // 6. Exchange code for token
    const { access_token, refresh_token, user } = await exchangeCode(code);

    // 7. Store in ~/.docjays/auth.json
    await this.saveAuth({
      userId: user.id,
      email: user.email,
      name: user.name,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    console.log(`✓ Logged in as ${user.email}`);
  }
}
```

**API Endpoint:** `POST /api/auth/cli/authorize`
- Starts OAuth flow
- Returns authorization code
- Redirects to localhost

**API Endpoint:** `POST /api/auth/cli/token`
- Exchanges code for access token
- Returns user info + tokens

#### 1.2 Whoami Command
**File:** `packages/docjays-cli/src/cli/commands/whoami.ts`

```typescript
export class WhoamiCommand extends BaseCommand {
  async execute(): Promise<void> {
    const auth = await this.loadAuth();

    if (!auth) {
      console.log('Not logged in. Run: docjays login');
      return;
    }

    console.log(`Logged in as: ${auth.email}`);
    console.log(`User ID: ${auth.userId}`);
    console.log(`Token expires: ${auth.expiresAt.toLocaleDateString()}`);
  }
}
```

#### 1.3 Logout Command
**File:** `packages/docjays-cli/src/cli/commands/logout.ts`

```typescript
export class LogoutCommand extends BaseCommand {
  async execute(): Promise<void> {
    const auth = await this.loadAuth();

    if (!auth) {
      console.log('Already logged out');
      return;
    }

    // Revoke token on server
    await this.revokeToken(auth.accessToken);

    // Delete local auth file
    await fs.remove(this.authPath);

    console.log('✓ Logged out successfully');
  }
}
```

#### 1.4 Enhanced Init Command
**File:** `packages/docjays-cli/src/cli/commands/init.ts`

```typescript
export class InitCommand extends BaseCommand {
  async execute(options: InitOptions): Promise<void> {
    // Check if already initialized
    if (await this.isInitialized()) {
      throw new Error('Project already initialized');
    }

    // Check if logged in
    const auth = await this.loadAuth();

    if (!auth && !options.offline) {
      console.log('Not logged in. Please run: docjays login');
      console.log('Or use: docjays init --offline');
      return;
    }

    if (options.offline) {
      await this.initOffline(options);
    } else {
      await this.initCloud(options, auth);
    }
  }

  private async initCloud(options: InitOptions, auth: AuthData): Promise<void> {
    console.log('Creating project in cloud...');

    // 1. Get project name (from folder or prompt)
    const projectName = options.name || path.basename(process.cwd());

    // 2. Create project in cloud
    const { project, apiKey } = await this.createProject({
      name: projectName,
      description: options.description,
    }, auth.accessToken);

    console.log(`✓ Created project: "${project.name}"`);
    console.log(`✓ Project ID: ${project.id}`);
    console.log(`✓ API Key generated (stored securely)`);

    // 3. Initialize local structure
    await this.initializeStructure();

    // 4. Save config with API key
    await this.saveConfig({
      version: '1.0.0',
      projectId: project.id,
      projectKey: apiKey.key,
      name: project.name,
      slug: project.slug,
      sources: [],
      mcp: {
        enabled: true,
        transport: 'stdio',
      },
    });

    console.log('\n✓ Project initialized successfully!\n');
    console.log('📝 View in dashboard:');
    console.log(`   https://docjays.dev/projects/${project.slug}\n`);
    console.log('Next steps:');
    console.log('  1. Add documentation sources:');
    console.log('     docjays add-source --name docs --url <url>');
    console.log('  2. Sync documentation:');
    console.log('     docjays sync');
    console.log('  3. Start MCP server:');
    console.log('     docjays serve');
  }

  private async initOffline(options: InitOptions): Promise<void> {
    console.log('Initializing in offline mode...');

    const projectId = `proj_local_${crypto.randomBytes(8).toString('hex')}`;
    const projectKey = `djkey_${projectId}_${crypto.randomBytes(24).toString('hex')}`;

    await this.initializeStructure();

    await this.saveConfig({
      version: '1.0.0',
      projectId,
      projectKey,
      name: options.name || path.basename(process.cwd()),
      offline: true,
      sources: [],
      mcp: {
        enabled: true,
        transport: 'stdio',
      },
    });

    console.log('✓ Project initialized in offline mode');
    console.log('⚠️  Cloud features disabled');
    console.log('\nTo connect to cloud later:');
    console.log('  docjays login');
    console.log('  docjays sync --cloud');
  }
}
```

**API Endpoint:** `POST /api/projects`
- Creates new project
- Auto-generates API key
- Returns project + key

#### 1.5 Auth Storage Manager
**File:** `packages/docjays-cli/src/core/auth/storage.ts`

```typescript
interface AuthData {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class AuthStorage {
  private authPath: string;

  constructor() {
    this.authPath = path.join(os.homedir(), '.docjays', 'auth.json');
  }

  async save(auth: AuthData): Promise<void> {
    await fs.ensureDir(path.dirname(this.authPath));
    await fs.writeJson(this.authPath, auth, { mode: 0o600 });
  }

  async load(): Promise<AuthData | null> {
    if (!await fs.pathExists(this.authPath)) {
      return null;
    }

    const data = await fs.readJson(this.authPath);

    // Check if expired
    if (new Date(data.expiresAt) < new Date()) {
      // Try to refresh
      return await this.refresh(data.refreshToken);
    }

    return data;
  }

  async refresh(refreshToken: string): Promise<AuthData> {
    // Call refresh endpoint
    const response = await fetch('https://docjays.dev/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed. Please login again.');
    }

    const { access_token, refresh_token, user } = await response.json();

    const auth = {
      userId: user.id,
      email: user.email,
      name: user.name,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    await this.save(auth);
    return auth;
  }

  async remove(): Promise<void> {
    await fs.remove(this.authPath);
  }
}
```

#### 1.6 Backend API Endpoints

**File:** `app/api/auth/cli/authorize/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  // Generate authorization code
  const code = await generateAuthCode(redirectUri, state);

  // Redirect to login page with CLI context
  return NextResponse.redirect(
    `/api/auth/cli/login?code=${code}&redirect_uri=${redirectUri}&state=${state}`
  );
}
```

**File:** `app/api/auth/cli/token/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const { code, redirect_uri } = await request.json();

  // Validate code
  const { userId } = await validateAuthCode(code, redirect_uri);

  // Generate tokens
  const accessToken = await generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user,
  });
}
```

**File:** `app/api/projects/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const user = await validateAccessToken(accessToken);

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

  // Generate API key
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
      key, // ⚠️ Only returned once!
      keyPrefix,
    },
  });
}
```

### Deliverables

- [ ] `docjays login` command working
- [ ] `docjays whoami` command working
- [ ] `docjays logout` command working
- [ ] `docjays init` with cloud creation
- [ ] `docjays init --offline` for local-only
- [ ] Global auth storage in `~/.docjays/auth.json`
- [ ] Project config with API key in `.docjays/config.json`
- [ ] Backend OAuth endpoints
- [ ] Backend project creation endpoint
- [ ] Token refresh logic
- [ ] Documentation updated

### Testing

```bash
# Test login flow
docjays login
# Should open browser, complete OAuth, save token

# Test whoami
docjays whoami
# Should show user email and expiration

# Test init (cloud)
mkdir test-project && cd test-project
docjays init
# Should create project in cloud, save API key

# Test init (offline)
mkdir test-offline && cd test-offline
docjays init --offline
# Should work without cloud

# Test logout
docjays logout
# Should remove auth file
```

---

## Phase 2: API Key Validation + Cloud Sync (Week 2)

### Goals
- MCP server validates API keys
- CLI operations validate API keys
- Cloud sync for project config
- Usage tracking and analytics

### Tasks

#### 2.1 API Key Validation in MCP Server
**File:** `packages/docjays-cli/src/mcp/server.ts`

```typescript
export class MCPServer {
  private projectKey: string;

  async start(): Promise<void> {
    // 1. Load project config
    const config = await this.loadConfig();
    this.projectKey = config.projectKey;

    if (!this.projectKey) {
      throw new Error('No project key found. Run: docjays init');
    }

    // 2. Validate key (local or cloud)
    if (!config.offline) {
      await this.validateKey(this.projectKey);
    }

    // 3. Start server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is for MCP protocol)
    console.error('✓ MCP server started');
    console.error(`✓ Project: ${config.name}`);
    console.error(`✓ API key validated`);
  }

  private async validateKey(key: string): Promise<void> {
    const response = await fetch('https://docjays.dev/api/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid or expired API key');
    }

    const { project, permissions } = await response.json();

    if (!permissions.mcp) {
      throw new Error('API key does not have MCP permissions');
    }

    console.error(`✓ Connected to project: ${project.name}`);
  }
}
```

#### 2.2 API Key Validation in CLI Operations
**File:** `packages/docjays-cli/src/core/auth/validator.ts`

```typescript
export class ApiKeyValidator {
  async validate(key: string, operation: string): Promise<boolean> {
    const response = await fetch('https://docjays.dev/api/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ operation }),
    });

    if (!response.ok) {
      return false;
    }

    const { permissions } = await response.json();

    // Check operation-specific permissions
    switch (operation) {
      case 'read':
        return permissions.read;
      case 'write':
        return permissions.write;
      case 'sync':
        return permissions.write;
      default:
        return false;
    }
  }
}
```

#### 2.3 Cloud Sync Commands
**File:** `packages/docjays-cli/src/cli/commands/sync.ts`

```typescript
export class SyncCommand extends BaseCommand {
  async execute(options: SyncOptions): Promise<void> {
    const config = await this.loadConfig();

    if (options.cloud) {
      await this.syncCloud(config);
    } else {
      await this.syncSources(config);
    }
  }

  private async syncCloud(config: Config): Promise<void> {
    console.log('Syncing with cloud...');

    // Push local config to cloud
    await this.pushConfig(config);

    // Pull latest from cloud
    const cloudConfig = await this.pullConfig(config.projectKey);

    // Merge configs
    const merged = this.mergeConfigs(config, cloudConfig);

    await this.saveConfig(merged);

    console.log('✓ Synced with cloud');
  }

  private async pushConfig(config: Config): Promise<void> {
    await fetch(`https://docjays.dev/api/projects/${config.projectId}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.projectKey}`,
      },
      body: JSON.stringify({
        sources: config.sources,
        mcp: config.mcp,
      }),
    });
  }

  private async pullConfig(projectKey: string): Promise<Partial<Config>> {
    const response = await fetch(`https://docjays.dev/api/projects/config`, {
      headers: {
        'Authorization': `Bearer ${projectKey}`,
      },
    });

    return await response.json();
  }
}
```

#### 2.4 Backend Validation Endpoint
**File:** `app/api/validate-key/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 401 });
  }

  // Hash the key for lookup
  const keyHash = await bcrypt.hash(apiKey, 10);

  // Find key in database
  const key = await prisma.apiKey.findFirst({
    where: {
      keyPrefix: apiKey.substring(0, 20),
      isActive: true,
    },
    include: {
      project: true,
    },
  });

  if (!key) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  // Verify full key
  const valid = await bcrypt.compare(apiKey, key.key);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: key.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return NextResponse.json({
    project: {
      id: key.project.id,
      name: key.project.name,
      slug: key.project.slug,
    },
    permissions: key.permissions,
  });
}
```

### Deliverables

- [ ] MCP server validates API key on startup
- [ ] CLI operations validate API key
- [ ] `docjays sync --cloud` command
- [ ] Backend validation endpoint
- [ ] Usage tracking (request count, last used)
- [ ] Graceful offline mode (skip validation)
- [ ] Error handling for invalid/expired keys

---

## Phase 3: OAuth Integrations (Week 3)

### Goals
- Connect GitHub account via OAuth
- Connect GitLab account via OAuth
- Auto-use OAuth tokens for private sources
- No manual token management

### Tasks

#### 3.1 Connect GitHub Command
**File:** `packages/docjays-cli/src/cli/commands/connect.ts`

```typescript
export class ConnectCommand extends BaseCommand {
  async execute(provider: string): Promise<void> {
    const config = await this.loadConfig();

    switch (provider) {
      case 'github':
        await this.connectGitHub(config);
        break;
      case 'gitlab':
        await this.connectGitLab(config);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async connectGitHub(config: Config): Promise<void> {
    console.log('Connecting GitHub account...');

    // 1. Start OAuth flow
    const { url, state } = await this.startOAuthFlow('github', config.projectKey);

    // 2. Open browser
    await open(url);

    // 3. Wait for callback
    const { access_token } = await this.waitForOAuth(state);

    // 4. Store token in cloud (encrypted)
    await this.storeOAuthToken('github', access_token, config.projectKey);

    console.log('✓ GitHub connected successfully');
    console.log('\nPrivate GitHub repos will now work automatically!');
  }
}
```

#### 3.2 Auto-Use OAuth Tokens in Sources
**File:** `packages/docjays-cli/src/core/cloner.ts`

```typescript
export class Cloner {
  async clone(source: Source, config: Config): Promise<void> {
    // Check if source needs authentication
    if (this.isPrivateGitHub(source.url)) {
      // Try to get GitHub OAuth token
      const token = await this.getOAuthToken('github', config.projectKey);

      if (token) {
        // Use OAuth token automatically
        const authUrl = this.injectToken(source.url, token);
        await simpleGit().clone(authUrl, source.path);
        console.log('✓ Cloned using GitHub OAuth');
        return;
      }
    }

    // Fall back to manual auth if configured
    if (source.auth) {
      const credential = await this.getCredential(source.auth, config);
      const authUrl = this.injectCredential(source.url, credential);
      await simpleGit().clone(authUrl, source.path);
      return;
    }

    // Public source
    await simpleGit().clone(source.url, source.path);
  }

  private async getOAuthToken(provider: string, projectKey: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://docjays.dev/api/oauth/token?provider=${provider}`,
        {
          headers: {
            'Authorization': `Bearer ${projectKey}`,
          },
        }
      );

      if (!response.ok) return null;

      const { token } = await response.json();
      return token;
    } catch {
      return null;
    }
  }
}
```

### Deliverables

- [ ] `docjays connect github` command
- [ ] `docjays connect gitlab` command
- [ ] OAuth flow with browser redirect
- [ ] Store OAuth tokens in cloud (encrypted)
- [ ] Auto-use OAuth tokens for git operations
- [ ] Fallback to manual credentials
- [ ] Backend OAuth endpoints

---

## Phase 4: Cloud MCP Endpoint (Week 4)

### Goals
- Direct HTTPS connection to cloud MCP
- No CLI installation needed
- Works from any machine
- Rate limiting and analytics

### Tasks

#### 4.1 Cloud MCP Server
**File:** `app/api/mcp/v1/[projectId]/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Validate API key
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  const { project, permissions } = await validateApiKey(apiKey);

  if (project.id !== params.projectId) {
    return NextResponse.json({ error: 'Invalid project' }, { status: 403 });
  }

  if (!permissions.mcp) {
    return NextResponse.json({ error: 'MCP not allowed' }, { status: 403 });
  }

  // Get MCP request
  const mcpRequest = await request.json();

  // Handle MCP protocol
  const response = await handleMCPRequest(mcpRequest, project);

  // Track usage
  await trackMCPRequest(project.id, apiKey);

  return NextResponse.json(response);
}
```

#### 4.2 MCP Protocol Handler
**File:** `lib/mcp/handler.ts`

```typescript
export async function handleMCPRequest(
  request: any,
  project: Project
): Promise<any> {
  const { method, params } = request;

  switch (method) {
    case 'resources/list':
      return await listResources(project);

    case 'resources/read':
      return await readResource(project, params.uri);

    case 'tools/list':
      return await listTools(project);

    case 'tools/call':
      return await callTool(project, params.name, params.arguments);

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function listResources(project: Project): Promise<any> {
  // Fetch project sources from database
  const sources = await prisma.source.findMany({
    where: { projectId: project.id },
  });

  const resources = sources.map(source => ({
    uri: `source://${source.name}`,
    name: source.name,
    mimeType: 'text/plain',
  }));

  return { resources };
}

async function readResource(project: Project, uri: string): Promise<any> {
  // Parse URI: source://name/path
  const [, sourceName, ...pathParts] = uri.split('/');
  const path = pathParts.join('/');

  // Get source content from storage
  const content = await getSourceContent(project.id, sourceName, path);

  return {
    contents: [{
      uri,
      mimeType: 'text/plain',
      text: content,
    }],
  };
}
```

### Deliverables

- [ ] Cloud MCP HTTP endpoint
- [ ] MCP protocol handler
- [ ] Resource listing from cloud storage
- [ ] Resource reading from cloud storage
- [ ] Rate limiting per API key
- [ ] Usage tracking and analytics
- [ ] Error handling
- [ ] Documentation for direct MCP connection

---

## Phase 5: Documentation & Polish (Week 5)

### Goals
- Complete documentation overhaul
- Migration guide for existing users
- Security audit
- Performance optimization
- User testing

### Tasks

#### 5.1 Documentation Updates
- [ ] Update README with new auth flow
- [ ] Update CLI help page (web)
- [ ] Update MCP integration page
- [ ] Create authentication guide page
- [ ] Update FAQ with new questions
- [ ] Create video tutorials

#### 5.2 Migration Guide
**File:** `docs/MIGRATION.md`

```markdown
# Migration Guide: v1 → v2 Authentication

## What Changed

### Before (v1)
- Manual keystore with master password
- Separate API keys from web
- No global login

### After (v2)
- Global OAuth login
- Auto-generated API keys
- OAuth integrations
- Cloud sync

## Migration Steps

### Step 1: Login
```bash
docjays login
```

### Step 2: Migrate Existing Projects
```bash
cd my-project
docjays migrate
# Converts old keystore to new format
# Creates project in cloud
# Generates API key
```

### Step 3: Test
```bash
docjays sync
docjays serve
```

## Troubleshooting
...
```

#### 5.3 Security Audit
- [ ] Review token storage security
- [ ] Review API key generation entropy
- [ ] Review OAuth flow for vulnerabilities
- [ ] Penetration testing
- [ ] Dependency audit

### Deliverables

- [ ] Complete documentation
- [ ] Migration guide
- [ ] Security audit report
- [ ] Performance benchmarks
- [ ] User testing feedback
- [ ] Video tutorials

---

## Timeline

| Week | Phase | Status |
|------|-------|--------|
| Week 1 | Phase 1: OAuth + Auto Keys | 🔵 Ready |
| Week 2 | Phase 2: Validation + Sync | 🔵 Ready |
| Week 3 | Phase 3: OAuth Integrations | 🔵 Ready |
| Week 4 | Phase 4: Cloud MCP | 🔵 Ready |
| Week 5 | Phase 5: Docs + Polish | 🔵 Ready |

---

## Success Criteria

### Phase 1
- [ ] User can login with OAuth
- [ ] User can create project with auto-generated key
- [ ] Offline mode works
- [ ] Tests pass

### Phase 2
- [ ] MCP server validates keys
- [ ] Invalid keys are rejected
- [ ] Cloud sync works
- [ ] Usage tracked correctly

### Phase 3
- [ ] GitHub OAuth works
- [ ] GitLab OAuth works
- [ ] Private repos clone automatically
- [ ] No manual token needed

### Phase 4
- [ ] Direct MCP connection works
- [ ] Rate limiting works
- [ ] Analytics tracking works
- [ ] Performance is acceptable

### Phase 5
- [ ] Documentation complete
- [ ] Migration guide tested
- [ ] Security audit passed
- [ ] User testing positive

---

## Next Steps

1. **Start Phase 1 implementation** (NOW)
2. **Set up backend OAuth endpoints** (Day 1-2)
3. **Implement CLI login command** (Day 3-4)
4. **Implement init with auto-gen** (Day 5-7)
5. **Testing and iteration** (Ongoing)

---

**Status:** 🟢 APPROVED - Implementation Starting
**Assigned:** Claude & Team
**Start Date:** 2026-01-27
