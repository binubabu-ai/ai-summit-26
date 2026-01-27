# Publishing Docjays CLI to GitHub Packages

This guide covers how to publish and install the Docjays CLI using GitHub Packages (Option C - recommended for internal team use).

## Prerequisites

- GitHub account with access to the `techjays/ai-summit` repository
- Personal Access Token (PAT) with `write:packages` and `read:packages` permissions

## Publishing (Maintainers Only)

### Option 1: Automated Publishing via GitHub Actions (Recommended)

The CLI is automatically published to GitHub Packages when you create a new release:

1. **Update version in package.json:**
   ```bash
   cd packages/docjays-cli
   npm version patch  # or minor, or major
   ```

2. **Commit and push:**
   ```bash
   git add packages/docjays-cli/package.json
   git commit -m "chore: bump docjays-cli version to X.Y.Z"
   git push
   ```

3. **Create a GitHub release:**
   ```bash
   # Using GitHub CLI
   gh release create v0.1.0 --title "Docjays CLI v0.1.0" --notes "Release notes here"

   # Or via GitHub web UI: https://github.com/techjays/ai-summit/releases/new
   ```

4. **GitHub Actions will automatically build and publish** the package to GitHub Packages.

### Option 2: Manual Publishing

If you need to publish manually:

1. **Authenticate with GitHub Packages:**
   ```bash
   npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com
   # Username: your-github-username
   # Password: your-github-personal-access-token (with write:packages scope)
   # Email: your-email@example.com
   ```

2. **Build and publish:**
   ```bash
   cd packages/docjays-cli
   npm run build
   npm publish
   ```

## Creating a Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "Docjays CLI - GitHub Packages"
4. Select scopes:
   - ✓ `write:packages` (to publish packages)
   - ✓ `read:packages` (to download packages)
   - ✓ `repo` (if repo is private)
5. Click "Generate token" and **save it securely** (you won't see it again)

## Installing (Team Members)

### One-Time Setup

1. **Create or edit `~/.npmrc`:**
   ```bash
   # On macOS/Linux
   echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc

   # On Windows PowerShell
   Add-Content -Path "$env:USERPROFILE\.npmrc" -Value "@binubabu-ai:registry=https://npm.pkg.github.com"
   ```

2. **Authenticate with GitHub Packages:**
   ```bash
   npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com
   # Username: your-github-username
   # Password: your-github-personal-access-token (with read:packages scope)
   # Email: your-email@example.com
   ```

### Install Docjays CLI

```bash
# Install globally
npm install -g @binubabu-ai/docjays

# Verify installation
docjays --version

# Test it works
docjays --help
```

### Update to Latest Version

```bash
npm update -g @binubabu-ai/docjays
```

### Uninstall

```bash
npm uninstall -g @binubabu-ai/docjays
```

## Alternative: Install from GitHub URL (No Registry Setup)

For quick testing or CI/CD environments without registry configuration:

```bash
# Clone the repo and install locally
git clone https://github.com/techjays/ai-summit.git
cd ai-summit/packages/docjays-cli
npm install
npm run build
npm link

# Now `docjays` command is available globally
```

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** Your Personal Access Token may be expired or missing permissions.

**Solution:**
1. Create a new PAT with `read:packages` (and `write:packages` for publishing)
2. Re-run `npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com`
3. Enter your new PAT when prompted for password

### Error: 404 Package not found

**Possible causes:**
1. The package hasn't been published yet
2. Your `~/.npmrc` is not configured correctly
3. You're not authenticated
4. You don't have access to the `techjays/ai-summit` repository

**Solution:**
```bash
# Check your .npmrc configuration
cat ~/.npmrc  # macOS/Linux
type %USERPROFILE%\.npmrc  # Windows

# Should contain:
# @binubabu-ai:registry=https://npm.pkg.github.com
```

### Error: Permission denied

**Cause:** PAT missing required scopes.

**Solution:** Ensure your PAT has:
- `read:packages` for installing
- `write:packages` for publishing
- `repo` if the repository is private

### npm login fails

If `npm login` doesn't work, manually add authentication to `~/.npmrc`:

```bash
# Add this line to ~/.npmrc
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your actual Personal Access Token.

## CI/CD Integration

### GitHub Actions

Use the built-in `GITHUB_TOKEN` (no manual PAT needed):

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@binubabu-ai'

- name: Install Docjays CLI
  run: npm install -g @binubabu-ai/docjays
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Other CI/CD Platforms (GitLab, Jenkins, etc.)

Add your GitHub PAT as a secret and configure `.npmrc`:

```yaml
- name: Install Docjays CLI
  run: |
    echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_PAT }}" >> ~/.npmrc
    npm install -g @binubabu-ai/docjays
```

## Version Management

We follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor changes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

Update version with:

```bash
cd packages/docjays-cli
npm version patch  # or minor, or major
```

## Package Information

- **Package Name:** `@binubabu-ai/docjays`
- **Registry:** GitHub Packages
- **Package URL:** https://github.com/techjays/ai-summit/packages
- **Repository:** https://github.com/techjays/ai-summit
- **Documentation:** https://docjays.dev/help/cli

## Pre-Publishing Checklist

Before publishing:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Version number updated in `package.json`
- [ ] No uncommitted changes
- [ ] CLI binary works (`node bin/docjays.js --version`)

## Post-Publishing Checklist

After publishing:

- [ ] Verify package on GitHub: https://github.com/techjays/ai-summit/packages
- [ ] Test installation: `npm install -g @binubabu-ai/docjays@latest`
- [ ] Test CLI works: `docjays --version`
- [ ] GitHub release created
- [ ] Update any dependent projects
- [ ] Notify team members

## Support

If you encounter issues:

1. Check [GitHub Packages documentation](https://docs.github.com/en/packages)
2. Review GitHub Actions logs
3. Open an issue: https://github.com/techjays/ai-summit/issues
4. Check package page: https://github.com/techjays/ai-summit/packages

---

**Last Updated:** 2026-01-27
