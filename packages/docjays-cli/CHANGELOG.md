# Changelog

All notable changes to Docjays CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-27

### Added

#### Core Features
- **Documentation Source Management**
  - Clone documentation from Git repositories, HTTP URLs, and local paths
  - Support for multiple documentation sources
  - Source validation and health checks
  - Enable/disable sources without removing them

- **Authentication System**
  - Encrypted keystore with AES-256-GCM encryption
  - Master password protection
  - Support for multiple credential types (tokens, SSH keys, API keys, passwords)
  - Secure credential storage separate from git
  - Password rotation support
  - Keystore export/import for backup and migration

- **MCP (Model Context Protocol) Integration**
  - Full MCP server implementation for Claude Desktop
  - Expose documentation as MCP resources
  - Search, read, and list documentation via MCP tools
  - Stdio transport for seamless Claude integration

- **CLI Commands**
  - `init` - Initialize Docjays in a project
  - `add-source` - Add documentation sources
  - `sync` - Sync documentation sources
  - `status` - Show Docjays status and information
  - `list-sources` (alias: `ls`) - List all sources
  - `clean` - Clean cache/logs or remove .docjays folder
  - `watch` - Auto-sync sources at intervals
  - `serve` - Start MCP server for Claude
  - `auth` - Full authentication management (init, add, list, remove, update, rotate-password, export, import, destroy)

#### Developer Experience
- Beautiful CLI output with colors, spinners, and progress indicators
- Interactive prompts for configuration
- Comprehensive error messages
- JSON output support for scripting
- Git-ignore integration (automatic .gitignore updates)

#### Documentation
- Complete README with quick start and examples
- Comprehensive USAGE guide with workflows
- Feature specifications template
- Auto-generated documentation in `.docjays/` folder

#### Security
- No secrets in configuration files
- Encrypted credential storage
- Memory sanitization
- PBKDF2 key derivation (100k iterations)
- Auth tokens injected at runtime only

### Technical Details
- TypeScript implementation with strict mode
- Monorepo structure (npm workspaces)
- Comprehensive test suite (66+ tests)
- Node.js 18+ required
- ESM and CommonJS support

### Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `simple-git` - Git operations
- `node-fetch` - HTTP source support
- `fs-extra` - Enhanced file operations
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `ora` - Elegant spinners
- `chalk` - Terminal colors
- `boxen` - Terminal boxes
- `chokidar` - File watching
- `ajv` - JSON schema validation

### Known Issues
- Some edge case test failures (18 out of 84 tests)
- ES module compatibility in tests needs refinement
- Large repository clones may be slow (shallow clones used by default)

### Breaking Changes
N/A - Initial release

---

## Future Plans

### [0.2.0] - Planned
- Web UI for documentation browsing
- Plugin system for custom processors
- Better sync conflict resolution
- Incremental sync support
- Documentation search indexing
- Claude API direct integration (non-MCP)

### [0.3.0] - Planned
- Team collaboration features
- Centralized documentation registry
- Version pinning for sources
- Dependency resolution between docs
- Documentation analytics

---

## How to Upgrade

### From Pre-Release to 0.1.0
First release - no upgrade path needed.

### Future Upgrades
```bash
npm update -g docjays
```

For major version upgrades, check the release notes for breaking changes.

---

## Support

- [GitHub Issues](https://github.com/techjays/ai-summit/issues)
- [Discussions](https://github.com/techjays/ai-summit/discussions)
- [Documentation](https://docjays.dev)

---

## Contributors

- TechJays Team
- Claude Sonnet 4.5 (AI Assistant)

---

[0.1.0]: https://github.com/techjays/ai-summit/releases/tag/docjays-v0.1.0
