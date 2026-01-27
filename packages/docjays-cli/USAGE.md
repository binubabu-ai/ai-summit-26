# DocJays CLI - Complete Usage Guide

This guide covers all features and workflows for DocJays CLI.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Commands Reference](#commands-reference)
- [Authentication](#authentication)
- [Workflows](#workflows)
- [MCP Integration](#mcp-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

Install globally:
```bash
npm install -g docjays
```

Or use with npx (no installation):
```bash
npx docjays init
```

### First-Time Setup

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize DocJays (interactive)
docjays init

# Or use defaults
docjays init -y
```

This creates:
- `.docjays/` folder (automatically git-ignored)
- `.docjays/config.json` configuration file
- `.docjays/README.md` usage guide
- Folder structure for sources, features, and context

## Core Concepts

### Documentation Sources

DocJays supports three types of documentation sources:

1. **Git Repositories**
   - Clone entire repos or specific branches
   - Supports public and private repos (with authentication)
   - Auto-sync with remote changes

2. **HTTP URLs**
   - Download files from HTTP/HTTPS endpoints
   - Supports authentication headers
   - Useful for API documentation, PDF files, etc.

3. **Local Paths**
   - Copy from local directories
   - Useful for offline docs or local development

### Authentication System

DocJays uses a **keystore** to securely manage credentials:
- Credentials encrypted with AES-256-GCM
- Protected by master password
- Never stored in plain text
- Separate from git credentials

### MCP Integration

Model Context Protocol (MCP) exposes your documentation to Claude:
- Claude can search and read docs
- No need to paste docs into conversation
- Reduces context window usage
- Works with Claude Desktop

## Commands Reference

### `docjays init`

Initialize DocJays in your project.

**Usage:**
```bash
docjays init [options]
```

**Options:**
- `-y, --yes` - Skip prompts, use defaults
- `--no-gitignore` - Don't update .gitignore
- `-h, --help` - Show help

**Interactive Prompts:**
1. Project name (default: directory name)
2. Enable MCP? (default: yes)
3. Enable auto-sync? (default: no)
4. Sync interval if auto-sync enabled (default: 1h)
5. Initialize keystore? (optional)

**Example:**
```bash
# Interactive setup
docjays init

# Quick setup with defaults
docjays init -y

# Skip keystore initialization
docjays init --no-keystore
```

### `docjays add-source`

Add a new documentation source.

**Usage:**
```bash
docjays add-source [options]
```

**Options:**
- `-n, --name <name>` - Source name (required)
- `-t, --type <type>` - Type: git, http, local (required)
- `-u, --url <url>` - URL or path (required)
- `-b, --branch <name>` - Git branch (default: main)
- `-a, --auth <key>` - Authentication key name
- `--no-sync` - Don't sync after adding
- `-h, --help` - Show help

**Examples:**

Git repository (public):
```bash
docjays add-source \
  --name company-docs \
  --type git \
  --url https://github.com/myorg/docs
```

Git repository (private with auth):
```bash
# First, add auth token
docjays auth add github-token

# Then add source
docjays add-source \
  --name private-docs \
  --type git \
  --url https://github.com/myorg/private-docs \
  --auth github-token
```

Specific branch:
```bash
docjays add-source \
  --name api-v2-docs \
  --type git \
  --url https://github.com/myorg/api-docs \
  --branch v2
```

HTTP URL:
```bash
docjays add-source \
  --name api-spec \
  --type http \
  --url https://api.example.com/openapi.json
```

Local path:
```bash
docjays add-source \
  --name local-docs \
  --type local \
  --url /path/to/docs
```

### `docjays sync`

Sync documentation sources.

**Usage:**
```bash
docjays sync [options]
```

**Options:**
- `-s, --source <name>` - Sync specific source only
- `-f, --force` - Force re-clone (delete and clone fresh)
- `--no-progress` - Disable progress indicators
- `-h, --help` - Show help

**Examples:**

Sync all enabled sources:
```bash
docjays sync
```

Sync specific source:
```bash
docjays sync --source company-docs
```

Force re-clone (fixes corruption):
```bash
docjays sync --force
```

Force re-clone specific source:
```bash
docjays sync --source company-docs --force
```

**Sync Summary:**
After syncing, you'll see:
- Number of successful syncs
- Number of failed syncs
- Total sync time
- Detailed error messages if any failed

### `docjays status`

Show DocJays status and information.

**Usage:**
```bash
docjays status [options]
```

**Options:**
- `--json` - Output as JSON
- `-h, --help` - Show help

**Information Shown:**
- Initialization status
- MCP server configuration
- Number of configured sources
- Content statistics (features, context files)
- Keystore status

**Examples:**

Human-readable output:
```bash
docjays status
```

JSON output:
```bash
docjays status --json
```

### `docjays list-sources` (alias: `ls`)

List all configured documentation sources.

**Usage:**
```bash
docjays list-sources [options]
docjays ls [options]
```

**Options:**
- `--enabled` - Show only enabled sources
- `--disabled` - Show only disabled sources
- `--json` - Output as JSON
- `-h, --help` - Show help

**Examples:**

List all sources:
```bash
docjays list-sources
```

List only enabled sources:
```bash
docjays ls --enabled
```

JSON output for scripting:
```bash
docjays ls --json
```

### `docjays clean`

Clean cache, logs, or remove .docjays folder.

**Usage:**
```bash
docjays clean [options]
```

**Options:**
- `--cache` - Clean cache only
- `--logs` - Clean logs only
- `--all` - Remove entire .docjays folder (destructive)
- `-f, --force` - Skip confirmation prompt
- `-h, --help` - Show help

**Examples:**

Clean cache only:
```bash
docjays clean --cache
```

Clean logs only:
```bash
docjays clean --logs
```

Remove everything (with confirmation):
```bash
docjays clean --all
```

Remove everything (no confirmation):
```bash
docjays clean --all --force
```

### `docjays watch`

Auto-sync documentation sources at intervals.

**Usage:**
```bash
docjays watch [options]
```

**Options:**
- `-i, --interval <time>` - Sync interval (default: 30m)
  - Format: `<number><unit>` where unit is `m` (minutes) or `h` (hours)
  - Examples: `5m`, `30m`, `1h`, `2h`
- `--sync-now` - Sync immediately on start
- `-h, --help` - Show help

**Examples:**

Watch with default 30m interval:
```bash
docjays watch
```

Watch with custom interval:
```bash
docjays watch -i 1h
```

Watch with immediate sync:
```bash
docjays watch -i 30m --sync-now
```

**Stop Watching:**
Press `Ctrl+C` to stop watching. The process will shut down gracefully.

### `docjays serve`

Start MCP server for Claude integration.

**Usage:**
```bash
docjays serve [options]
```

**Options:**
- `--stdio` - Use stdio transport (default)
- `-h, --help` - Show help

**Example:**
```bash
docjays serve
```

This command is typically not run directly. Instead, configure Claude Desktop to run it automatically (see [MCP Integration](#mcp-integration)).

## Authentication

### Keystore Overview

The keystore securely stores credentials for accessing private documentation sources.

**Key Features:**
- AES-256-GCM encryption
- Master password protection
- Encrypted export/import
- Memory sanitization

### Initialize Keystore

```bash
docjays auth init
```

You'll be prompted to create a master password. This password:
- Encrypts all credentials
- Is required for all keystore operations
- Should be strong and memorable
- Is NOT stored anywhere

### Add Credentials

```bash
docjays auth add <name>
```

**Example:**
```bash
# Add GitHub token
docjays auth add github-token

# You'll be prompted for:
# 1. Master password
# 2. Credential type (token, password, api-key, ssh-key, custom)
# 3. Credential value
# 4. Optional description
```

**Credential Types:**
- `token` - OAuth tokens, PATs
- `password` - Passwords
- `api-key` - API keys
- `ssh-key` - SSH private keys
- `custom` - Other types

### List Credentials

```bash
docjays auth list
```

Shows:
- Credential name
- Type
- Description
- Creation date
- Last used date

**Note:** Does NOT show actual credential values (for security).

### Update Credentials

```bash
docjays auth update <name>
```

Updates the value of an existing credential.

### Remove Credentials

```bash
docjays auth remove <name>
```

Permanently deletes a credential.

### Rotate Master Password

```bash
docjays auth rotate-password
```

Changes the master password. All credentials are re-encrypted with the new password.

### Export Keystore

```bash
docjays auth export [file]
```

Exports keystore to an encrypted file. Useful for:
- Backup
- Migration to another machine
- Sharing with team (with caution)

**Example:**
```bash
docjays auth export backup.json
```

### Import Keystore

```bash
docjays auth import <file>
```

Imports keystore from an exported file.

**Example:**
```bash
docjays auth import backup.json
```

### Destroy Keystore

```bash
docjays auth destroy
```

**WARNING:** This permanently deletes all credentials. Use with caution.

## Workflows

### Workflow 1: Client Project Setup

You're working on a client project and need access to your company docs.

```bash
# 1. Navigate to client project
cd /path/to/client-project

# 2. Initialize DocJays
docjays init -y

# 3. Initialize keystore (if using private repos)
docjays auth init
docjays auth add github-token

# 4. Add company documentation sources
docjays add-source \
  --name coding-standards \
  --type git \
  --url https://github.com/mycompany/coding-standards

docjays add-source \
  --name api-docs \
  --type git \
  --url https://github.com/mycompany/api-docs \
  --auth github-token

# 5. Sync all docs
docjays sync

# 6. Configure Claude Desktop MCP (see MCP Integration section)

# 7. Start coding with Claude!
```

### Workflow 2: Keeping Docs Updated

Periodically update your documentation.

```bash
# Check what's configured
docjays status

# Update all docs
docjays sync

# Or just one source
docjays sync --source api-docs
```

### Workflow 3: Team Onboarding

Help new team member set up.

```bash
# Team member clones project
git clone https://github.com/mycompany/client-project
cd client-project

# They initialize DocJays
docjays init -y

# Import shared keystore (if applicable)
docjays auth import team-keystore.json

# Sync docs
docjays sync

# Done!
```

### Workflow 4: Multiple Projects

You work on multiple client projects.

```bash
# Project A
cd /path/to/project-a
docjays init -y
docjays add-source --name company-docs --type git --url ...
docjays sync

# Project B
cd /path/to/project-b
docjays init -y
docjays add-source --name company-docs --type git --url ...
docjays sync

# Each project has its own .docjays folder
# But they can share the same keystore (export/import)
```

### Workflow 5: Offline Development

Work with local documentation.

```bash
# Copy docs locally first
cp -r /network/share/docs /tmp/local-docs

# Add as local source
docjays add-source \
  --name offline-docs \
  --type local \
  --url /tmp/local-docs

# Sync (copies to .docjays)
docjays sync

# Now available even when offline
```

## MCP Integration

### Setup for Claude Desktop

1. **Ensure DocJays is installed:**
   ```bash
   npm install -g docjays
   ```

2. **Find your MCP config file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. **Edit config file:**
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

4. **Restart Claude Desktop**

5. **Test in Claude:**
   ```
   Can you search the docjays documentation for authentication examples?
   ```

### Available MCP Tools

Claude can use these tools with your documentation:

1. **search_docs**
   - Search documentation content
   - Supports query string and optional source filter
   - Case-sensitive option

2. **list_sources**
   - List all configured sources
   - Shows enabled/disabled status

3. **read_doc**
   - Read specific document
   - Requires source name and document path

4. **list_features**
   - List all feature specs
   - From `.docjays/features/`

5. **list_resources**
   - List all available resources
   - Shows resource URIs and types

### MCP Resources

Claude can access these resources:

- `docjays://config` - Current configuration
- `docjays://source/<name>/<path>` - Source documents
- `docjays://feature/<name>` - Feature specifications
- `docjays://context/<name>` - Context files

## Troubleshooting

### DocJays not initialized

**Error:** `DocJays not initialized in this directory`

**Solution:**
```bash
docjays init
```

### Git clone failed

**Error:** `Failed to clone repository`

**Possible causes:**
1. Invalid URL
2. Network issues
3. Authentication required
4. Branch doesn't exist

**Solutions:**
```bash
# Verify URL is correct
docjays list-sources

# Add authentication if private repo
docjays auth add github-token
# Then update source with auth
# (edit .docjays/config.json and add "auth": "github-token")

# Try force re-clone
docjays sync --source <name> --force
```

### Keystore password forgotten

**Error:** `Invalid master password`

**Unfortunately:** There's no way to recover keystore without the master password.

**Solution:**
1. Destroy old keystore: `docjays auth destroy`
2. Initialize new keystore: `docjays auth init`
3. Re-add all credentials

**Prevention:** Export keystore regularly as backup

### MCP not working with Claude

**Claude can't see DocJays docs**

**Checklist:**
1. Is DocJays initialized? `docjays status`
2. Are sources synced? `docjays sync`
3. Is MCP enabled in config? Check `.docjays/config.json`
4. Is Claude Desktop config correct? Check `claude_desktop_config.json`
5. Did you restart Claude Desktop after config change?

**Test MCP manually:**
```bash
docjays serve
# Should start without errors
```

### Sync taking too long

**Large repos slowing down sync**

**Solution:**
```bash
# Use shallow clones (default)
# DocJays already uses --depth 1

# Or sync specific sources only
docjays sync --source small-repo
```

### Permission denied errors

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Check directory permissions
ls -la .docjays

# Ensure you own the directory
sudo chown -R $USER:$USER .docjays

# Or remove and reinitialize
docjays clean --all
docjays init
```

### Out of disk space

**Error:** `ENOSPC: no space left on device`

**Solution:**
```bash
# Check .docjays size
docjays status

# Clean cache and logs
docjays clean --cache
docjays clean --logs

# Remove unused sources
# Edit .docjays/config.json or
docjays clean --all
docjays init
```

## Advanced Topics

### Custom Source Paths

By default, sources are cloned to `.docjays/sources/<source-name>`. You can customize this in `.docjays/config.json`:

```json
{
  "sources": [
    {
      "name": "api-docs",
      "type": "git",
      "url": "https://github.com/myorg/api-docs",
      "path": "sources/custom-path/api-docs",
      "enabled": true
    }
  ]
}
```

### Disabling Sources

Temporarily disable a source without removing it:

```json
{
  "sources": [
    {
      "name": "old-docs",
      "enabled": false,
      ...
    }
  ]
}
```

Disabled sources are skipped during `docjays sync`.

### Auto-Sync Configuration

Enable auto-sync in `.docjays/config.json`:

```json
{
  "sync": {
    "auto": true,
    "interval": "1h",
    "onStart": true
  }
}
```

Or use `docjays watch` for manual control.

### HTTP Authentication

For HTTP sources requiring authentication:

```bash
# Add bearer token
docjays auth add api-token

# Add source with auth
docjays add-source \
  --name api-spec \
  --type http \
  --url https://api.example.com/docs \
  --auth api-token
```

The token is sent as: `Authorization: Bearer <token>`

### Environment Variables

DocJays respects these environment variables:

- `DEBUG=1` - Enable debug logging
- `DOCJAYS_HOME` - Override .docjays location (default: `$PWD/.docjays`)

**Example:**
```bash
DEBUG=1 docjays sync
```

## Best Practices

### Security

1. **Never commit `.docjays/` to git** - It's git-ignored by default
2. **Use strong master password** - At least 16 characters
3. **Export keystore for backup** - Store securely (password manager)
4. **Rotate credentials regularly** - Use `docjays auth update`
5. **Audit credentials** - Run `docjays auth list` periodically

### Organization

1. **Use descriptive source names** - e.g., `api-v2-docs` not `docs`
2. **Group related sources** - Use prefixes like `company-*`, `client-*`
3. **Document your sources** - Add descriptions in config
4. **Keep config.json clean** - Remove disabled sources you'll never use

### Performance

1. **Use shallow clones** - DocJays does this by default
2. **Sync selectively** - Use `--source` flag for large projects
3. **Clean cache regularly** - Run `docjays clean --cache` weekly
4. **Disable unused sources** - Set `enabled: false`

### Team Collaboration

1. **Share keystore securely** - Use encrypted export
2. **Document source requirements** - In project README
3. **Standardize across projects** - Same source names, structure
4. **Automate onboarding** - Script `docjays init` and `auth import`

## Further Reading

- [README.md](./README.md) - Quick start and installation
- [Feature Specs](../../docs/features/) - Feature documentation
- [GitHub Issues](https://github.com/techjays/ai-summit/issues) - Report bugs
- [Discussions](https://github.com/techjays/ai-summit/discussions) - Ask questions

---

**Questions or feedback?** Open an issue on GitHub!
