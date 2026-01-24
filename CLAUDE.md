# Claude Code Project Configuration

This file contains project-specific instructions and conventions for Claude Code.

## Project Overview
This project follows the Techjays AI Agent Standard for feature development and code quality.

## Stack
- **Runtime**: [To be filled during onboarding]
- **Framework**: [To be filled during onboarding]
- **Package Manager**: [To be filled during onboarding]
- **Testing**: [To be filled during onboarding]

## Commands
[To be filled during onboarding with actual discovered commands]

### Installation
```bash
# [To be filled]
```

### Development
```bash
# [To be filled]
```

### Testing
```bash
# [To be filled]
```

### Build
```bash
# [To be filled]
```

### Linting
```bash
# [To be filled]
```

## Feature-First Workflow (Mandatory)

### Documentation First
Every change must be tied to a Feature Spec located at `docs/features/<feature-slug>.md`.

### Planning Phase
The Planning phase must involve creating or updating the Feature Spec with:
- **Objective**: Clear problem statement and success criteria
- **Scope**: Explicit in-scope and out-of-scope items
- **Impacted Files**: List of files and modules that will change
- **Data Model**: Database/schema changes required
- **Test Plan**: Unit, integration, and E2E test requirements
- **Rollout**: Deployment strategy and rollback plan

### Execution Phase
Code generation and test creation must:
- Explicitly reference requirements defined in the Feature Spec
- Update the Feature Spec if scope changes during implementation
- Add tests that align with the Feature Spec test plan
- Run quality gates (lint, test, build) before PR creation

### Branching Strategy
- Use the naming convention: `feature/<short_meaningful_name>`
- Branch names should match feature slugs when possible
- Example: `feature/user-ledger-export`

### Git Operations
- Use the `gh` CLI for all GitHub operations:
  - PR creation: `gh pr create`
  - View PR: `gh pr view`
  - PR status checks: `gh pr checks`
  - PR comments: `gh pr comment`
  - List PRs: `gh pr list`

### Commit Messages
Follow conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code refactoring
- `test:` for test additions/changes
- `docs:` for documentation changes
- `chore:` for maintenance tasks

## Code Quality Standards
- All features must have tests
- Tests must pass before PR creation
- Lint checks must pass
- No secrets in code (use environment variables)
- Keep diffs focused and small

## Documentation
- Feature specs: `docs/features/<feature-slug>.md`
- AI context: `docs/ai/*.md`
- Use the feature template: `docs/features/_TEMPLATE.md`

## Security
- Never commit secrets, API keys, or credentials
- Use `.env` files for local development (not committed)
- Store secrets in `./secrets/**` (git-ignored)
- Validate all external inputs
- Follow OWASP security guidelines
