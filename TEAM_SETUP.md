# Team Setup Guide - Docjays CLI

Quick setup guide for team members to install and use Docjays CLI.

## Installing Docjays CLI

### Option 1: Install Globally (Recommended)

```bash
npm install -g docjays
```

### Option 2: Use Without Installing

```bash
npx docjays --help
```

### Verify Installation

```bash
docjays --version
docjays --help
```

That's it! You're ready to use Docjays CLI.

---

## Quick Start

```bash
# 1. Login to Docjays (one-time)
docjays login

# 2. Initialize in your project
cd your-project
docjays init

# 3. Link to cloud project
docjays link

# 4. Add documentation sources
docjays add-source --name docs --type git --url https://github.com/org/docs

# 5. Sync documentation
docjays sync

# 6. Start MCP server
docjays serve
```

---

## For Maintainers: Publishing New Versions

### Automated Publishing (Recommended)

1. **Update version:**
   ```bash
   cd packages/docjays-cli
   npm version patch  # or minor, or major
   ```

2. **Commit and push:**
   ```bash
   git add packages/docjays-cli/package.json
   git commit -m "chore: bump docjays-cli to vX.Y.Z"
   git push
   ```

3. **Create GitHub release:**
   ```bash
   gh release create docjays-cli-vX.Y.Z --title "Docjays CLI vX.Y.Z" --notes "Release notes"
   ```

GitHub Actions will automatically build and publish to npm.

### Manual Publishing

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Build and publish:**
   ```bash
   cd packages/docjays-cli
   npm run build
   npm publish
   ```

---

## Quick Reference

- **Package Name:** `docjays`
- **Registry:** npm (https://www.npmjs.com/package/docjays)
- **Repository:** https://github.com/techjays/ai-summit
- **Documentation:** https://docjays.dev/help/cli
- **Publishing Guide:** `packages/docjays-cli/PUBLISHING.md`

---

## CI/CD Integration

```yaml
- name: Install Docjays CLI
  run: npm install -g docjays
```

---

**Questions?** Open an issue at https://github.com/techjays/ai-summit/issues
