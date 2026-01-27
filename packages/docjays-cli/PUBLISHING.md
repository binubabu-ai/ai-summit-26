# Publishing DocJays CLI to npm

This guide explains how to publish DocJays CLI to the npm registry.

## Prerequisites

1. **npm Account**
   - Create an account at [npmjs.com](https://www.npmjs.com/)
   - Verify your email address
   - Enable 2FA (two-factor authentication) for publishing

2. **npm Authentication**
   ```bash
   npm login
   # Or for CI/CD
   npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}
   ```

3. **Package Name**
   - Verify `docjays` is available on npm
   - If not, update `name` in package.json

4. **GitHub Repository Access**
   - Push access to the repository
   - Ability to create releases and tags

## Publishing Methods

### Method 1: Manual Publishing (Recommended for First Release)

#### Step 1: Prepare the Release

```bash
cd packages/docjays-cli

# Run the preparation script
./scripts/prepare-release.sh

# Or manually:
npm run clean
npm install
npm run lint
npm test
npm run build
```

#### Step 2: Update Version

```bash
# For patch release (0.1.0 -> 0.1.1)
npm version patch

# For minor release (0.1.0 -> 0.2.0)
npm version minor

# For major release (0.1.0 -> 1.0.0)
npm version major

# Or specify exact version
npm version 0.2.0
```

This will:
- Update `package.json` version
- Create a git commit
- Create a git tag

#### Step 3: Update CHANGELOG

Edit `CHANGELOG.md` to document changes in the new version:

```markdown
## [0.2.0] - 2026-02-01

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description
```

#### Step 4: Commit and Tag

```bash
# If you used npm version, skip this (already done)
git add CHANGELOG.md package.json
git commit -m "chore: release v0.2.0"
git tag docjays-v0.2.0
```

#### Step 5: Publish to npm

```bash
# Dry run first to check what will be published
npm publish --dry-run

# Publish for real
npm publish --access public

# View the published package
npm view docjays
```

#### Step 6: Push to GitHub

```bash
git push origin main
git push --tags
```

#### Step 7: Create GitHub Release

1. Go to: https://github.com/techjays/ai-summit/releases/new
2. Choose tag: `docjays-v0.2.0`
3. Release title: `DocJays CLI v0.2.0`
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

---

### Method 2: GitHub Actions (Automated)

#### Option A: Triggered by GitHub Release

1. **Prepare the release locally**
   ```bash
   cd packages/docjays-cli
   ./scripts/prepare-release.sh
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit and push**
   ```bash
   git add .
   git commit -m "chore: prepare release v0.2.0"
   git push origin main
   ```

4. **Create GitHub Release**
   - Go to: https://github.com/techjays/ai-summit/releases/new
   - Create new tag: `docjays-v0.2.0`
   - Release title: `DocJays CLI v0.2.0`
   - Description: Copy from CHANGELOG
   - Click "Publish release"

5. **GitHub Actions will automatically:**
   - Run tests
   - Build the package
   - Publish to npm
   - Tag is already created by GitHub release

#### Option B: Manual Workflow Trigger

1. **Prepare the release**
   ```bash
   cd packages/docjays-cli
   ./scripts/prepare-release.sh
   ```

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Trigger workflow manually**
   - Go to: https://github.com/techjays/ai-summit/actions
   - Select "Publish DocJays CLI to npm"
   - Click "Run workflow"
   - Enter version: `0.2.0`
   - Click "Run workflow"

4. **GitHub Actions will:**
   - Run tests
   - Build the package
   - Update version in package.json
   - Publish to npm
   - Create GitHub release automatically

---

## GitHub Secrets Configuration

For GitHub Actions to work, you need to configure secrets:

1. **NPM_TOKEN**
   - Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token
   - Go to: https://github.com/techjays/ai-summit/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste your npm token
   - Click "Add secret"

2. **GITHUB_TOKEN**
   - Automatically provided by GitHub Actions
   - No manual configuration needed

---

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] README.md is up to date
- [ ] No uncommitted changes
- [ ] All changes pushed to main branch
- [ ] CLI binary works (`node bin/docjays.js --version`)
- [ ] Package size is reasonable (`npm pack --dry-run`)

---

## Post-Publishing Checklist

After publishing:

- [ ] Verify package on npm: https://www.npmjs.com/package/docjays
- [ ] Test installation: `npm install -g docjays@latest`
- [ ] Test CLI works: `docjays --version`
- [ ] GitHub release created
- [ ] Update any dependent projects
- [ ] Announce release (social media, blog, etc.)
- [ ] Update documentation website (if applicable)

---

## Troubleshooting

### "You must be logged in to publish packages"

Solution:
```bash
npm login
# Enter username, password, email, and 2FA code
```

### "Package name already taken"

Solution:
- Choose a different package name
- Or request transfer if you own the name
- Update `name` in `package.json`

### "Version already exists"

Solution:
```bash
# Increment version
npm version patch  # or minor, or major
```

### "403 Forbidden"

Possible causes:
- Not logged in: `npm login`
- No publish permission: Check npm package access
- 2FA required: Enable 2FA on npm account

### "Package size too large"

Solution:
```bash
# Check what's being included
npm pack --dry-run

# Update .npmignore to exclude unnecessary files
```

### GitHub Actions fails

Solution:
- Check NPM_TOKEN secret is set
- Verify token has publish permissions
- Check token hasn't expired
- Review workflow logs for specific error

---

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

### Pre-releases

For beta/alpha releases:

```bash
npm version 0.2.0-beta.1
npm publish --tag beta
```

Install with:
```bash
npm install -g docjays@beta
```

### Deprecating Versions

If a version has critical bugs:

```bash
npm deprecate docjays@0.1.0 "Critical bug, please upgrade to 0.1.1"
```

---

## Rollback

If something goes wrong after publishing:

### Option 1: Deprecate and Publish Fix

```bash
# Deprecate bad version
npm deprecate docjays@0.2.0 "Broken release, use 0.2.1 instead"

# Fix issues and publish new version
npm version patch
npm publish
```

### Option 2: Unpublish (within 72 hours)

```bash
# WARNING: Only works within 72 hours of publishing
npm unpublish docjays@0.2.0
```

**Note:** Unpublishing is discouraged by npm and should only be used in extreme cases.

---

## Support

If you encounter issues:

1. Check [npm documentation](https://docs.npmjs.com/)
2. Review GitHub Actions logs
3. Open an issue: https://github.com/techjays/ai-summit/issues
4. Contact npm support: support@npmjs.com

---

## References

- [npm publish documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [npm version documentation](https://docs.npmjs.com/cli/v10/commands/npm-version)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Last Updated:** 2026-01-27
