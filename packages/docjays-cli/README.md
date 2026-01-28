# Docjays CLI

> Documentation management for AI-assisted development

Docjays is a CLI tool that helps you manage documentation sources in your projects while keeping them separate from your main codebase. Perfect for client projects where you want to maintain company standards, API docs, and architecture references without committing them to the client's repository.

## Prerequisites

Before installing Docjays CLI, you need:

1. **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
2. **A Docjays Account** - Visit [docjays.vercel.app](https://docjays.vercel.app) to sign up
   - Currently available exclusively for Techjays organization members
   - Requires a @techjays.com email address

## Features

- 📦 **Clone & Sync** - Pull documentation from Git repos, HTTP URLs, or local paths
- 🤖 **MCP Integration** - Expose docs to Claude via Model Context Protocol
- 🔄 **Auto-Sync** - Keep documentation up-to-date automatically
- 🎯 **Multi-Source** - Manage multiple documentation sources
- 🚫 **Git-Ignored** - Keeps `.docjays/` out of your repository
- 📝 **Feature Specs** - Built-in support for feature-first development
- 🎓 **AI Skills** - Auto-generated `skills.md` teaches AI agents Docjays workflows

## Installation

### npm (Recommended)

Install globally using npm:

```bash
npm install -g docjays
```

Verify installation:

```bash
docjays --version
```

**Or use without installing:**

```bash
npx docjays login
npx docjays init
```

### GitHub Packages (For Techjays Team)

For internal team use with GitHub Packages:

```bash
# Configure npm
echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Authenticate (requires GitHub PAT with read:packages scope)
npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com

# Install
npm install -g @binubabu-ai/docjays
```

## Getting Started in Your Repository

### Step 1: Install and Login

```bash
# Install Docjays CLI
npm install -g docjays

# Login with your Docjays account
docjays login
```

This opens your browser to authenticate. Use your @techjays.com email.

### Step 2: Initialize in Your Project

```bash
# Navigate to your project
cd /path/to/your-project

# Initialize Docjays
docjays init
```

This will:
- ✅ Create `.docjays/` folder
- ✅ Auto-generate project API key
- ✅ Prompt to create `skills.md` for AI agents
- ✅ Update `.gitignore`

### Step 2.5: Migrate Existing Docs (Optional)

If your project already has documentation, migrate it to `.docjays`:

```bash
# Scan and interactively select docs to migrate
docjays migrate

# Or auto-migrate everything
docjays migrate --auto
```

This discovers and copies existing docs (README, docs/, wiki/, etc.) to `.docjays/sources/local-migration/` while keeping originals in place.

### Step 3: Add Documentation Sources

```bash
# Add your company's documentation
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs

# Add API documentation
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs
```

### Step 4: Sync and Use

```bash
# Pull all documentation
docjays sync

# Start MCP server for AI assistants
docjays serve
```

**Done!** Your documentation is now available to Claude and other AI assistants.

---

## Quick Reference

```bash
# Authentication
docjays login              # Authenticate with Docjays
docjays whoami             # Show current user
docjays logout             # Remove credentials

# Project Setup
docjays init               # Initialize in current directory
docjays link               # Link to existing cloud project (or create new)
docjays unlink             # Disconnect from cloud project
docjays migrate            # Migrate existing docs to .docjays
docjays create-skills      # Create skills.md for AI agents

# Documentation Management
docjays add-source [opts]  # Add a documentation source
docjays sync               # Sync all documentation
docjays push               # Push local docs to cloud
docjays status             # Show sync status
docjays list-sources       # List all sources

# AI Integration
docjays serve              # Start MCP server
docjays watch              # Auto-sync in background
```

---

## Local-Only Mode (No Account Required)

Work completely offline without authentication:

```bash
docjays init --offline
docjays add-source --name docs --url https://github.com/public/docs
docjays sync
docjays serve
```

## Command Reference

### Authentication Commands

#### Login

```bash
docjays login [options]

Options:
  -f, --force    Force re-authentication even if already logged in
  -h, --help     Display help
```

Authenticate with your Docjays account via browser:

1. Opens browser to [docjays.vercel.app/cli/auth](https://docjays.vercel.app/cli/auth)
2. Sign in with your @techjays.com account (or create one)
3. Returns to CLI automatically
4. Token saved to `~/.docjays/auth.json` (60-day expiry)

**Example:**

```bash
$ docjays login

📱 Opening browser for authentication...
⏳ Waiting for authentication...
✓ Authentication successful!

Logged in as: user@techjays.com
Token expires: 2026-03-28 (60 days remaining)
```

#### Check Login Status

```bash
docjays whoami [options]

Options:
  --json    Output as JSON
  -h, --help  Display help
```

Shows your current authentication status.

**Example:**

```bash
$ docjays whoami

Authentication Status

  Logged in as: user@techjays.com
  User ID:      user_abc123
  Token expires: 2026-03-28 (60 days remaining)
  Config file:  ~/.docjays/auth.json
```

#### Logout

```bash
docjays logout [options]

Options:
  -f, --force    Skip confirmation prompt
  -h, --help     Display help
```

Removes your authentication credentials.

**Example:**

```bash
$ docjays logout

Currently logged in as: user@techjays.com

? Are you sure you want to logout? (y/N) y

✓ Logged out successfully
```

### Initialize Project

```bash
docjays init [options]

Options:
  -n, --name <name>  Project name (default: folder name)
  --offline          Initialize without cloud (local-only)
  -y, --yes          Skip prompts and use defaults
  --no-gitignore     Skip updating .gitignore
  -h, --help         Display help
```

Creates a new project. If logged in, automatically creates project in cloud and generates API key.

**Note:** During initialization, you'll be prompted to create a `skills.md` file for AI agent instructions. This file helps AI assistants like Claude Code understand Docjays workflows and best practices.

### Create Skills File

```bash
docjays create-skills [options]

Options:
  -o, --output <file>  Output to specific file (default: skills.md)
  -f, --force          Overwrite if exists
  -m, --merge          Append to existing file
  -p, --print          Just print template without creating file
  -h, --help           Display help
```

Creates a `skills.md` file that provides AI agents with instructions on how to work with Docjays workflows. This includes:
- Creating feature specifications
- Adding external documentation sources
- Grounding responses with documentation
- Maintaining documentation

**When to use:**
- Skip this during `docjays init` but want to add it later
- Project already has `skills.md` and you want to add Docjays skills
- Want to create with a different filename (e.g., `docjays-skills.md`)

**Examples:**

```bash
# Create skills.md in current directory
docjays create-skills

# Create with custom filename (if skills.md already exists)
docjays create-skills --output docjays-skills.md

# Merge with existing skills.md
docjays create-skills --merge

# Overwrite existing skills.md
docjays create-skills --force

# Just preview the template
docjays create-skills --print
```

**Benefits:**
- ✅ Claude Code automatically reads `skills.md`
- ✅ Consistent documentation workflows across team
- ✅ AI agents understand Docjays best practices
- ✅ Grounded responses based on actual documentation

**Conflict handling:** If `skills.md` exists, you'll be prompted with options:
- Create as `docjays-skills.md` instead (recommended)
- Overwrite existing file
- Merge/append to existing
- Cancel

### Link to Cloud Project

```bash
docjays link [options]

Options:
  -p, --project <id>  Project ID to link to directly
  -h, --help          Display help
```

Links your local `.docjays` folder to a cloud project. This enables:
- Syncing documentation to the cloud
- Team collaboration
- Web dashboard access
- API key management

**Examples:**

```bash
# Interactive mode - shows your projects and lets you choose
docjays link

# Example output:
📡 Cloud Project Linking
Fetching your projects...

? Select a project to link:
  ❯ ai-summit (owner)
    my-other-project (editor)
    ── Create new project ──

✓ Linked to project: ai-summit
  Project ID: clx123...
  API Key: dj_proj_abc123...

# Link directly to a specific project
docjays link --project clx123abc

# Create a new project and link
docjays link
# Then select "Create new project"
```

**What happens when you link:**
- Fetches your available projects from cloud
- Creates new project if needed
- Saves project ID and API key to `.docjays/config.json`
- Auto-joins you as a member if not already

### Unlink from Cloud

```bash
docjays unlink [options]

Options:
  -f, --force    Skip confirmation prompt
  -h, --help     Display help
```

Disconnects your local `.docjays` from the cloud project and switches to local-only mode.

**Examples:**

```bash
# Interactive mode
docjays unlink

# Example output:
Currently linked to: ai-summit (clx123...)

? Are you sure you want to unlink? This will:
  - Remove cloud connection
  - Switch to local-only mode
  - Keep local files intact

(y/N) y

✓ Unlinked from cloud project
  Mode: local-only
  Your local documentation is preserved.

# Skip confirmation
docjays unlink --force
```

**Notes:**
- Local files are preserved
- Cloud project is not deleted
- You can re-link anytime with `docjays link`

### Push to Cloud

```bash
docjays push [options]

Options:
  -n, --dry-run  Preview what would be pushed without making changes
  -f, --force    Push all files even if unchanged
  -h, --help     Display help
```

Pushes all documentation from `.docjays/sources/` to your linked cloud project. This backs up your local docs and makes them available in the web UI.

**Supported file types:**
- `.md`, `.mdx` (Markdown)
- `.txt` (Plain text)
- `.rst` (reStructuredText)
- `.adoc` (AsciiDoc)

**Examples:**

```bash
# Preview what would be pushed
docjays push --dry-run

# Example output:
📤 Push to Cloud
Project: ai-summit
Logged in as: user@techjays.com

Documents to push:

  • company-docs/README.md (2.4 KB)
  • company-docs/api/endpoints.md (8.1 KB)
  • api-specs/openapi.md (12.3 KB)

Total: 3 files (22.8 KB)

🔍 Dry run mode - no changes will be made

# Actually push documents
docjays push

# Example output:
✓ Push completed!

Summary:
  Created: 2
  Updated: 1
  Unchanged: 0

View your documents at https://docjays.vercel.app/projects/ai-summit
```

**What happens when you push:**
- Scans `.docjays/sources/` for documentation files
- Creates new documents in cloud if they don't exist
- Updates existing documents if content has changed
- Skips documents that haven't changed
- Creates version history for each update

### Migrate Existing Documentation

```bash
docjays migrate [options]

Options:
  --auto    Automatically migrate all found documentation without prompts
  --move    Move files instead of copying (default: copy)
  --dry     Dry run - show what would be migrated without making changes
  -h, --help  Display help
```

Discovers and migrates existing documentation in your project to `.docjays/sources/local-migration/`. This is perfect for:
- Onboarding existing projects with documentation
- Consolidating scattered docs into Docjays
- Keeping original docs while making them AI-accessible

**What it scans for:**

**Common documentation folders:**
- `docs/`, `doc/`, `documentation/`
- `wiki/`, `guides/`, `examples/`
- `.github/` (for GitHub templates)

**Common documentation files:**
- `README.md`, `CONTRIBUTING.md`
- `CHANGELOG.md`, `CODE_OF_CONDUCT.md`
- `SECURITY.md`, `LICENSE.md`, `ARCHITECTURE.md`

**Automatically skips:**
- Dependencies: `node_modules`, `vendor`, `bower_components`
- Build outputs: `dist`, `build`, `out`, `target`, `bin`
- Caches: `.cache`, `.parcel-cache`, `coverage`
- Version control: `.git`, `.svn`
- IDE folders: `.vscode`, `.idea`
- The `.docjays` folder itself

**Examples:**

```bash
# Interactive migration (recommended for first time)
docjays migrate

# Example output:
📦 Documentation Migration
Scanning your project for existing documentation...

✓ Found 3 documentation location(s)

Found documentation:

  📁 docs/ (12 .md files)
  📁 .github/ (4 .md files)
  📄 README.md (8.4 KB)

? Select documentation to migrate: (Space to select, Enter to confirm)
  ◉ docs/ (12 files)
  ◉ .github/ (4 files)
  ◉ README.md

✓ Successfully copied 3 item(s)!

Migration complete:
  .docjays/sources/local-migration/

Your documentation is now organized and ready for AI assistants.

# Auto-migrate everything found
docjays migrate --auto

# Move files instead of copying
docjays migrate --move

# Preview what would be migrated
docjays migrate --dry
```

**After migration:**
- Original docs remain in place (unless `--move` flag used)
- Migrated docs available at `.docjays/sources/local-migration/`
- Automatically registered as a source in config
- AI assistants can now access all documentation

**Best practices:**
- Use `--dry` first to preview what will be migrated
- Default copy mode is safer (preserves originals)
- Use `--move` only if you want to fully consolidate into `.docjays`
- Run `docjays status` after migration to verify

### Add Documentation Source

```bash
docjays add-source [options]

Options:
  -n, --name <name>     Source name (required)
  -t, --type <type>     Source type: git, http, local (required)
  -u, --url <url>       Source URL or path (required)
  -b, --branch <name>   Git branch (default: main)
  --no-sync            Don't sync after adding
  -h, --help           Display help
```

### Sync Documentation

```bash
docjays sync [options]

Options:
  -s, --source <name>  Sync specific source only
  -f, --force          Force re-clone (delete and clone fresh)
  -h, --help           Display help
```

### Start MCP Server

```bash
docjays serve [options]

Options:
  --stdio              Use stdio transport (default)
  -p, --port <port>    Port for HTTP transport (future)
  -h, --help           Display help
```

### Status

```bash
docjays status [options]

Options:
  --json      Output as JSON
  -h, --help  Display help
```

Shows Docjays status including:
- Initialization status
- MCP configuration
- Configured sources
- Content statistics (features, contexts)
- Authentication status

### List Sources

```bash
docjays list-sources [options]
# or
docjays ls [options]

Options:
  --enabled   Show only enabled sources
  --disabled  Show only disabled sources
  --json      Output as JSON
  -h, --help  Display help
```

### Clean

```bash
docjays clean [options]

Options:
  --cache      Clean cache only
  --logs       Clean logs only
  --all        Remove entire .docjays folder
  -f, --force  Skip confirmation prompt
  -h, --help   Display help
```

Examples:
```bash
docjays clean --cache          # Clean cache only
docjays clean --logs           # Clean logs only
docjays clean --all --force    # Remove everything without confirmation
```

### Watch Mode

```bash
docjays watch [options]

Options:
  -i, --interval <time>  Sync interval (e.g., 1h, 30m, 5m) (default: 30m)
  --sync-now             Sync immediately on start
  -h, --help             Display help
```

Examples:
```bash
docjays watch                    # Watch with 30m interval
docjays watch -i 1h --sync-now   # Watch with 1h interval, sync immediately
```

## Authentication

DocJays uses a simple OAuth-based authentication:

### How It Works

1. **One-Time Login** - Run `docjays login` once to authenticate
2. **Browser Opens** - Automatically opens [docjays.vercel.app/cli/auth](https://docjays.vercel.app/cli/auth)
3. **Sign In** - Login with your @techjays.com account (or create one)
4. **Auto-Return** - CLI automatically receives your token
5. **Done** - Token saved to `~/.docjays/auth.json` (valid for 60 days)

### Usage

```bash
# Login (opens browser)
docjays login

# Check your status
docjays whoami

# Logout when done
docjays logout
```

**Key Features:**
- ✅ Secure OAuth flow via browser
- ✅ Token stored locally in `~/.docjays/auth.json`
- ✅ 60-day token expiry
- ✅ Works across all your projects
- ✅ No passwords stored in CLI

### Project API Keys (Auto-Generated)

Each project gets its own API key automatically:

```bash
# Initialize project (generates API key automatically)
cd my-project
docjays init
# ✓ Project created
# ✓ API Key generated: djkey_proj_abc123_xyz
# ✓ Saved to .docjays/config.json
```

**What happens:**
- Project created in cloud
- API key auto-generated
- Key stored locally in `.docjays/config.json`
- Used for MCP server authentication
- Visible in web dashboard

### Authenticated Sources

For private repositories or authenticated sources, store credentials locally:

```bash
docjays auth add my-token --type token
# Encrypted and stored in project config

docjays add-source \
  --name other-docs \
  --url https://custom-api.com/docs \
  --auth my-token
```

**Security:**
- Encrypted with project key
- Stored in `.docjays/config.json`
- No master password needed
- Auto-decrypts when needed

### File Structure

```
Global (~/.docjays/)
└── auth.json              # Your login token

Project (.docjays/)
└── config.json            # Project ID + API key + encrypted credentials
```

### Summary

**Simple Flow:**
1. `docjays login` → Connects to your account (once)
2. `docjays init` → Auto-generates project API key
3. `docjays serve` → Works automatically!

**Benefits:**
- ✅ Auto-generated API keys
- ✅ Secure token storage
- ✅ Works across all projects
- ✅ Zero configuration needed

## MCP Integration with AI Assistants

Docjays exposes your documentation to AI assistants via Model Context Protocol (MCP).

### Setup (Automatic)

After `docjays init`, your project is automatically MCP-ready:

```bash
cd my-project
docjays serve
# ✓ MCP server started
# ✓ API key validated
# ✓ Ready for AI assistants!
```

### Configure Your AI Assistant

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
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

**Cursor** (`.cursor/mcp_config.json` in project root):
```json
{
  "mcpServers": {
    "my-project": {
      "command": "npx",
      "args": ["-y", "docjays", "serve"]
    }
  }
}
```

**Windsurf, Claude Code CLI, VS Code:** See [complete setup guide](https://docjays/help/api/mcp).

**Note:** API key is automatically read from `.docjays/config.json` - no manual configuration needed!

### Cloud MCP (No CLI Required)

Use Docjays MCP without installing CLI:

```json
{
  "mcpServers": {
    "my-project": {
      "url": "https://mcp.docjays/v1/projects/my-project",
      "headers": {
        "Authorization": "Bearer djkey_proj_abc123_xyz"
      }
    }
  }
}
```

Get your API key from [docjays/projects/my-project/connect](https://docjays)

## Configuration

Docjays creates a `.docjays/config.json` file:

```json
{
  "version": "1.0.0",
  "sources": [
    {
      "name": "company-docs",
      "type": "git",
      "url": "https://github.com/myorg/docs",
      "branch": "main",
      "path": "sources/company-docs",
      "enabled": true
    }
  ],
  "mcp": {
    "enabled": true,
    "transport": "stdio",
    "resources": ["sources", "features", "context"]
  },
  "sync": {
    "auto": false,
    "interval": "1h",
    "onStart": false
  }
}
```

## Folder Structure

```
project-root/
├── skills.md                # AI agent instructions (optional, created during init)
└── .docjays/
    ├── config.json          # Configuration
    ├── README.md            # Auto-generated guide
    ├── sources/             # Cloned documentation
    │   ├── company-docs/
    │   └── api-specs/
    ├── features/           # Feature specifications
    │   └── my-feature.md
    ├── context/            # AI context files
    │   └── architecture.md
    ├── cache/              # Cached data
    └── logs/               # Operation logs
```

## Real-World Workflows

### Client Project Setup

```bash
# In client project directory
cd /path/to/client-project

# Initialize Docjays
docjays init

# Add your company's documentation
docjays add-source --name standards --type git \
  --url https://github.com/mycompany/coding-standards

docjays add-source --name api-specs --type git \
  --url https://github.com/mycompany/api-documentation

# Sync everything
docjays sync

# Start MCP for Claude
docjays serve
```

Now Claude can reference all your company docs without them being in the client's repo!

### Keeping Docs Updated

```bash
# Check what needs syncing
docjays status

# Sync latest changes
docjays sync

# Or use auto-sync
docjays watch
```

## Why Docjays?

**Problem**: When working on client projects, you need access to your company's documentation, coding standards, and API specs. But you can't (and shouldn't) commit these to the client's repository.

**Solution**: Docjays creates a `.docjays/` folder (automatically git-ignored) that contains all your documentation sources. Claude can access this documentation via MCP without it being in the main codebase.

**Benefits**:
- Clean separation of client code and company docs
- Always have latest docs available
- Claude can reference docs without bloating context
- Works across all your projects
- Zero impact on client repository

## Requirements

- Node.js 18 or higher
- Git (for git sources)

## Development

```bash
# Clone repository
git clone https://github.com/techjays/ai-summit.git
cd ai-summit/packages/docjays-cli

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Run tests
npm test
```

## Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md).

## License

MIT

## Roadmap

The following features are planned for upcoming releases:

### Project Management Commands (Coming Soon)

```bash
# List all your projects
docjays projects list
docjays projects ls

# Show current project details
docjays projects info
docjays projects info --json

# Switch to a different project
docjays projects switch <project-id-or-slug>
```

### API Key Management (Coming Soon)

```bash
# List API keys for current project
docjays api-keys list

# Create a new API key
docjays api-keys create "CI/CD Pipeline"

# Revoke an API key
docjays api-keys revoke <key-id>
```

### Team Visibility (Coming Soon)

```bash
# List team members
docjays team list
docjays team list --json
```

See [Feature Spec](../../docs/features/cli-project-management.md) for full details.

## Support

- [Documentation](https://docjays.vercel.app)
- [GitHub Issues](https://github.com/techjays/ai-summit/issues)
- [Discussions](https://github.com/techjays/ai-summit/discussions)

---

Made with ❤️ by Techjays
