# Developer "Happy Path" Cheatsheet

Quick reference guide for using Claude Code with the Techjays AI Agent Standard.

## Workflow Commands

| Action | Command | Description |
|--------|---------|-------------|
| 1. One-time Setup | `/onboard` | Initialize repo, discover commands, setup docs structure |
| 2. Start Feature | `/feature-new <slug>` | Create feature branch and spec file |
| 3. Plan Work | `/plan <slug>` | Update feature spec with implementation plan |
| 4. Implement | `/execute <slug>` | Implement feature per spec |
| 5. Add Tests | `/tests <slug>` | Generate tests based on feature spec |
| 6. Refactor | `/refactor <slug>` | Safely refactor with test safety net |
| 7. Open PR | `/pr <slug>` | Create PR using gh CLI |
| 8. Fix PR Issues | `/pr-comments <slug>` | Address PR feedback |
| 9. Finalize | `/submit <slug>` | Final checks before merge |

## Quick Start

### First Time Setup
```bash
# In your repository
/onboard
```

### Starting a New Feature

#### Option A: Simple (one-liner)
```bash
/feature-new user-profile-export
```

#### Option B: With Metadata (YAML)
```bash
/feature-new
```
Then provide:
```yaml
slug: user-profile-export
title: User Profile Export
jira: PROJ-123
figma: https://figma.com/file/xyz
screenshots:
  - docs/assets/user-profile-export/mockup.png
notes: |
  Export user profile data in CSV and JSON formats
```

### Complete Feature Workflow
```bash
# 1. Create feature
/feature-new user-profile-export

# 2. Plan implementation
/plan user-profile-export

# 3. Implement
/execute user-profile-export

# 4. Add tests
/tests user-profile-export

# 5. Create PR
/pr user-profile-export

# 6. Address feedback (if any)
/pr-comments user-profile-export

# 7. Final checks and merge
/submit user-profile-export
```

## File Locations

### Feature Specs
- **Template**: `docs/features/_TEMPLATE.md`
- **Feature Files**: `docs/features/<slug>.md`
- **Feature Index**: `docs/features/README.md`
- **Assets**: `docs/assets/<slug>/`

### AI Context
- **Architecture**: `docs/ai/architecture.md`
- **Code Structure**: `docs/ai/codestructure.md`
- **Data Model**: `docs/ai/datamodel.md`
- **Integrations**: `docs/ai/integrations.md`
- **API Endpoints**: `docs/ai/api-endpoints.md`
- **Utilities**: `docs/ai/utilities.md`
- **Technical Debt**: `docs/ai/technical-debt.md`

### Configuration
- **Claude Config**: `CLAUDE.md`
- **Settings**: `.claude/settings.json`
- **Commands**: `.claude/commands/*.md`

## Branch Naming
Always use: `feature/<short-meaningful-name>`

Examples:
- `feature/user-profile-export`
- `feature/csv-import-fix`
- `feature/payment-integration`

## Commit Message Format
```
feat: add user profile export functionality
fix: resolve CSV parsing error
refactor: simplify authentication logic
test: add integration tests for exports
docs: update API documentation
chore: update dependencies
```

## GitHub CLI Commands (via Claude)
Claude will use these automatically, but you can also run them manually:

```bash
# Check auth
gh auth status

# List PRs
gh pr list

# View PR
gh pr view 123

# Check PR status
gh pr checks 123

# Add comment
gh pr comment 123 --body "LGTM"
```

## Feature Status Flow
```
Draft → Planned → In Progress → In Review → Done
```

## Quality Gates
Before creating a PR, ensure:
- [ ] Tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Feature spec is updated
- [ ] Documentation is current

## Tips

### Keep Feature Specs Current
The feature spec is the source of truth. Update it when:
- Scope changes during implementation
- New files/modules are impacted
- Data model changes
- Test plan evolves

### Use Small, Focused PRs
- One feature per PR
- Keep diffs manageable
- Reference the feature spec in PR description

### Security First
- Never commit `.env` files
- Store secrets in `./secrets/**` (git-ignored)
- Validate all external inputs
- Follow OWASP guidelines

## Getting Help
- Documentation issues: Update `docs/ai/*.md`
- Command issues: Check `.claude/commands/*.md`
- Permission issues: Review `.claude/settings.json`
- Workflow questions: See `CLAUDE.md`

## Common Scenarios

### Adding a Quick Fix
```bash
# For small fixes, you might skip /plan
/feature-new csv-parser-fix
/execute csv-parser-fix
/pr csv-parser-fix
```

### Large Feature with Research
```bash
/feature-new payment-gateway
/plan payment-gateway
# (Review and refine plan)
/execute payment-gateway
/tests payment-gateway
/pr payment-gateway
```

### Addressing Technical Debt
```bash
/refactor authentication-simplify
# Updates docs/ai/technical-debt.md automatically
```

## Best Practices

1. **Always start with a feature spec** - Even small changes benefit from documentation
2. **Plan before coding** - Use `/plan` to think through impacts
3. **Test as you go** - Don't wait until the end to add tests
4. **Keep PRs focused** - One feature or fix per PR
5. **Update docs** - Keep AI context files current for future features
6. **Use gh CLI** - Let Claude handle GitHub operations
7. **Review before submitting** - Use `/submit` for final validation

---

**Version**: 1.0
**Last Updated**: 2026-01-24
**Maintained By**: Engineering Team
