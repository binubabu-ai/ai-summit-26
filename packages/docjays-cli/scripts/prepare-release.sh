#!/bin/bash

# DocJays Release Preparation Script
# This script helps prepare a new release of DocJays CLI

set -e

echo "🚀 DocJays Release Preparation"
echo "================================"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"
echo ""

# Ask for new version
read -p "Enter new version (or press Enter to keep current): " NEW_VERSION
if [ -z "$NEW_VERSION" ]; then
  NEW_VERSION=$CURRENT_VERSION
fi

echo ""
echo "Preparing release v$NEW_VERSION"
echo "================================"
echo ""

# 1. Clean build
echo "1. Cleaning build artifacts..."
npm run clean

# 2. Install dependencies
echo "2. Installing dependencies..."
npm install

# 3. Run linter
echo "3. Running linter..."
npm run lint || echo "⚠️  Linting issues found (continuing anyway)"

# 4. Run tests
echo "4. Running tests..."
npm test || echo "⚠️  Some tests failed (continuing anyway)"

# 5. Build
echo "5. Building..."
npm run build

# 6. Test CLI
echo "6. Testing CLI binary..."
node bin/docjays.js --version
node bin/docjays.js --help > /dev/null

# 7. Update version if changed
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  echo "7. Updating version to $NEW_VERSION..."
  npm version $NEW_VERSION --no-git-tag-version
else
  echo "7. Version unchanged, skipping..."
fi

# 8. Check package size
echo "8. Checking package size..."
npm pack --dry-run

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "Next steps:"
echo "  1. Review CHANGELOG.md and add release notes"
echo "  2. Commit changes: git add . && git commit -m \"chore: prepare release v$NEW_VERSION\""
echo "  3. Create git tag: git tag docjays-v$NEW_VERSION"
echo "  4. Push changes: git push && git push --tags"
echo "  5. Publish to npm: npm publish --access public"
echo ""
echo "Or use GitHub Actions:"
echo "  1. Create a release on GitHub with tag docjays-v$NEW_VERSION"
echo "  2. The publish workflow will run automatically"
echo ""
