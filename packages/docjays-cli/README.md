# DocJays CLI

> Documentation management for AI-assisted development

DocJays is a CLI tool that helps you manage documentation sources in your projects while keeping them separate from your main codebase. Perfect for client projects where you want to maintain company standards, API docs, and architecture references without committing them to the client's repository.

## Features

- 📦 **Clone & Sync** - Pull documentation from Git repos, HTTP URLs, or local paths
- 🤖 **MCP Integration** - Expose docs to Claude via Model Context Protocol
- 🔄 **Auto-Sync** - Keep documentation up-to-date automatically
- 🎯 **Multi-Source** - Manage multiple documentation sources
- 🚫 **Git-Ignored** - Keeps `.docjays/` out of your repository
- 📝 **Feature Specs** - Built-in support for feature-first development

## Installation

```bash
npm install -g docjays
```

Or use without installation:

```bash
npx docjays init
```

## Quick Start

```bash
# Initialize DocJays in your project
docjays init

# Add documentation sources
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs

# Sync all documentation
docjays sync

# Start MCP server for Claude
docjays serve
```

## Usage

### Initialize Project

```bash
docjays init [options]

Options:
  -y, --yes          Skip prompts and use defaults
  --no-gitignore     Skip updating .gitignore
  -h, --help         Display help
```

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

Shows DocJays status including:
- Initialization status
- MCP configuration
- Configured sources
- Content statistics (features, contexts)
- Keystore status

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

### Authentication Management

```bash
docjays auth <action> [options]

Actions:
  init                          Initialize keystore with master password
  add <name>                    Add a new credential
  list                          List all stored credentials
  remove <name>                 Remove a credential
  update <name>                 Update a credential
  rotate-password               Change master password
  export [file]                 Export keystore (encrypted)
  import <file>                 Import keystore
  destroy                       Delete keystore (destructive)
```

Example workflow with authentication:
```bash
# Initialize keystore
docjays auth init

# Add GitHub token
docjays auth add github-token

# Add source with authentication
docjays add-source --name private-docs \
  --type git \
  --url https://github.com/myorg/private-docs \
  --auth github-token

# Sync (will prompt for keystore password)
docjays sync
```

## MCP Integration with Claude

To use DocJays with Claude Desktop, add to your MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "docjays": {
      "command": "docjays",
      "args": ["serve", "--stdio"]
    }
  }
}
```

Then restart Claude Desktop. Claude can now access all your documentation!

## Configuration

DocJays creates a `.docjays/config.json` file:

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
.docjays/
├── config.json              # Configuration
├── README.md                # Auto-generated guide
├── sources/                 # Cloned documentation
│   ├── company-docs/
│   └── api-specs/
├── features/               # Feature specifications
│   └── my-feature.md
├── context/                # AI context files
│   └── architecture.md
├── cache/                  # Cached data
└── logs/                   # Operation logs
```

## Real-World Workflows

### Client Project Setup

```bash
# In client project directory
cd /path/to/client-project

# Initialize DocJays
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

## Why DocJays?

**Problem**: When working on client projects, you need access to your company's documentation, coding standards, and API specs. But you can't (and shouldn't) commit these to the client's repository.

**Solution**: DocJays creates a `.docjays/` folder (automatically git-ignored) that contains all your documentation sources. Claude can access this documentation via MCP without it being in the main codebase.

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

## Support

- [Documentation](https://docjays.dev)
- [GitHub Issues](https://github.com/techjays/ai-summit/issues)
- [Discussions](https://github.com/techjays/ai-summit/discussions)

---

Made with ❤️ by TechJays
