# Team Setup Guide - DocJays CLI

Quick setup guide for TechJays team members to install and use DocJays CLI from GitHub Packages.

## For Team Members: Installing DocJays CLI

### Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it: "DocJays CLI"
4. Select scope: `read:packages`
5. Click "Generate token"
6. **Copy and save the token** (you won't see it again!)

### Step 2: Configure npm

```bash
# On macOS/Linux
echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc

# On Windows PowerShell
Add-Content -Path "$env:USERPROFILE\.npmrc" -Value "@binubabu-ai:registry=https://npm.pkg.github.com"
```

### Step 3: Authenticate

```bash
npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com
```

When prompted:
- **Username:** your-github-username
- **Password:** paste-your-personal-access-token
- **Email:** your-email@example.com

### Step 4: Install DocJays CLI

```bash
npm install -g @binubabu-ai/docjays
```

### Step 5: Verify Installation

```bash
docjays --version
docjays --help
```

That's it! You're ready to use DocJays CLI.

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
   gh release create vX.Y.Z --title "DocJays CLI vX.Y.Z" --notes "Release notes"
   ```

GitHub Actions will automatically build and publish to GitHub Packages.

### Manual Publishing

1. **Create PAT with `write:packages` scope**
   - Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
   - Select `write:packages` and `read:packages`

2. **Authenticate:**
   ```bash
   npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com
   ```

3. **Build and publish:**
   ```bash
   cd packages/docjays-cli
   npm run build
   npm publish
   ```

---

## Troubleshooting

### "401 Unauthorized"
Your PAT is expired or missing permissions. Create a new one with `read:packages` scope.

### "404 Package not found"
Check your `~/.npmrc`:
```bash
cat ~/.npmrc  # macOS/Linux
type %USERPROFILE%\.npmrc  # Windows
```
Should contain: `@binubabu-ai:registry=https://npm.pkg.github.com`

### npm login doesn't work
Manually add to `~/.npmrc`:
```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

---

## Quick Reference

- **Package Name:** `@binubabu-ai/docjays`
- **Registry:** GitHub Packages
- **Repository:** https://github.com/techjays/ai-summit
- **Package URL:** https://github.com/techjays/ai-summit/packages
- **Documentation:** https://docjays.dev/help/cli
- **Publishing Guide:** `packages/docjays-cli/PUBLISHING.md`

---

## CI/CD Integration

For GitHub Actions:
```yaml
- name: Install DocJays CLI
  run: npm install -g @binubabu-ai/docjays
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

For other CI/CD:
```yaml
- run: |
    echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_PAT }}" >> ~/.npmrc
    npm install -g @binubabu-ai/docjays
```

---

**Questions?** Open an issue at https://github.com/techjays/ai-summit/issues
