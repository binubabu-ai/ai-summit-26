# Publishing Docjays CLI to npm

This guide covers how to publish the Docjays CLI to the npm public registry.

## Prerequisites

- npm account with publish access to the `docjays` package
- Node.js 18+

## Publishing (Maintainers Only)

### Option 1: Automated Publishing via GitHub Actions (Recommended)

The CLI is automatically published to npm when you create a new release:

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
   gh release create docjays-cli-vX.Y.Z --title "Docjays CLI vX.Y.Z" --notes "Release notes here"

   # Or via GitHub web UI: https://github.com/techjays/ai-summit/releases/new
   ```

4. **GitHub Actions will automatically build and publish** the package to npm.

### Option 2: Manual Publishing

If you need to publish manually:

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

## Installing

```bash
# Install globally
npm install -g docjays

# Verify installation
docjays --version

# Or use without installing
npx docjays --help
```

## Version Management

We follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.3.2 → 0.3.3): Bug fixes, minor changes
- **Minor** (0.3.2 → 0.4.0): New features, backward compatible
- **Major** (0.3.2 → 1.0.0): Breaking changes

Update version with:

```bash
cd packages/docjays-cli
npm version patch  # or minor, or major
```

## Package Information

- **Package Name:** `docjays`
- **Registry:** npm (https://www.npmjs.com/package/docjays)
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

- [ ] Verify package on npm: https://www.npmjs.com/package/docjays
- [ ] Test installation: `npm install -g docjays@latest`
- [ ] Test CLI works: `docjays --version`
- [ ] GitHub release created
- [ ] Notify team members

## Support

If you encounter issues:

1. Check [npm documentation](https://docs.npmjs.com/)
2. Review GitHub Actions logs
3. Open an issue: https://github.com/techjays/ai-summit/issues

---

**Last Updated:** 2026-01-28
