# Documentation Index

This directory contains all project documentation following the Techjays AI Agent Standard.

## Directory Structure

```
docs/
├── ai/                     # AI context maps
│   ├── architecture.md     # System architecture overview
│   ├── codestructure.md    # Directory and module organization
│   ├── datamodel.md        # Database schema and entities
│   ├── integrations.md     # External services and APIs
│   ├── api-endpoints.md    # API endpoint documentation
│   ├── utilities.md        # Common utilities and helpers
│   └── technical-debt.md   # Known technical debt items
├── features/               # Feature specifications
│   ├── _TEMPLATE.md        # Template for new features
│   └── README.md           # Feature index
├── assets/                 # Screenshots, mockups, diagrams
│   └── <feature-slug>/     # Assets organized by feature
└── DEVELOPER_CHEATSHEET.md # Quick reference guide
```

## Quick Links

### For Developers
- [Developer Cheatsheet](./DEVELOPER_CHEATSHEET.md) - Quick reference for daily workflow
- [Feature Template](./features/_TEMPLATE.md) - Template for new feature specs
- [Feature Index](./features/README.md) - List of all features

### For AI Context
- [Architecture](./ai/architecture.md) - System design and components
- [Code Structure](./ai/codestructure.md) - How code is organized
- [Data Model](./ai/datamodel.md) - Database schema and relationships
- [Integrations](./ai/integrations.md) - External services
- [API Endpoints](./ai/api-endpoints.md) - API documentation
- [Utilities](./ai/utilities.md) - Helper functions and tools
- [Technical Debt](./ai/technical-debt.md) - Known issues and improvements

## Getting Started

### First Time Setup
Run the onboarding command to populate AI context files:
```bash
/onboard
```

### Creating a New Feature
```bash
/feature-new <feature-slug>
```

### Understanding the Codebase
1. Start with [Architecture](./ai/architecture.md)
2. Review [Code Structure](./ai/codestructure.md)
3. Check [Data Model](./ai/datamodel.md) for database info
4. See [API Endpoints](./ai/api-endpoints.md) for API details

## Documentation Standards

### Feature Specifications
- All features must have a spec in `features/<slug>.md`
- Use the template in `features/_TEMPLATE.md`
- Keep specs updated as implementation evolves
- Link to Jira, Figma, and other resources

### AI Context Files
- Updated during `/onboard` command
- Maintained throughout project lifecycle
- Provides high-level context for AI agents
- Should be reviewed and updated quarterly

### Assets
- Store screenshots, mockups, and diagrams in `assets/<feature-slug>/`
- Use descriptive filenames
- Reference from feature specs

## Maintenance

### When to Update
- **AI Context Files**: During `/onboard` or when major architectural changes occur
- **Feature Specs**: Throughout feature lifecycle (Draft → Done)
- **Technical Debt**: When issues are identified or resolved
- **Developer Cheatsheet**: When workflows or commands change

### Review Schedule
- **Weekly**: Feature specs for active features
- **Monthly**: Technical debt priorities
- **Quarterly**: AI context files and architecture docs
- **As Needed**: Developer cheatsheet and templates

## Contributing

### Adding Documentation
1. Use existing templates when available
2. Follow the established structure
3. Keep documentation concise and actionable
4. Include examples where helpful
5. Update indexes (like this file) when adding major sections

### Documentation Style
- Use clear, simple language
- Include code examples
- Add diagrams for complex concepts
- Keep it up-to-date
- Reference related documents

## Support

### Questions?
- Check the [Developer Cheatsheet](./DEVELOPER_CHEATSHEET.md)
- Review [CLAUDE.md](../CLAUDE.md) in project root
- Check `.claude/commands/` for command documentation
- Ask in team channels

---

**Standard**: Techjays AI Agent Standard v1.0
**Last Updated**: 2026-01-24
