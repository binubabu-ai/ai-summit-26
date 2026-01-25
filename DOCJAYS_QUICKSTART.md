# DocJays Enhancement - Quick Start Guide

**🚀 Get started with the DocJays implementation in 5 minutes**

## What is DocJays Enhancement?

DocJays is evolving from a basic document grounding system into a comprehensive **Knowledge Governance Layer** that:
- ✅ Enforces constraints during development (HARD vs SOFT)
- ✅ Detects architectural drift across features
- ✅ Extracts decisions automatically from PRs
- ✅ Monitors knowledge health and staleness
- ✅ Integrates with AI-assisted workflows

## Files You Need to Know

```
ai-summit/
├── DOCJAYS_IMPLEMENTATION_PLAN.md     # Detailed 12-week plan
├── DOCJAYS_QUICKSTART.md              # This file
├── .claude/commands/
│   ├── docjays-phase1.md              # Phase 1: Database
│   ├── docjays-phase2.md              # Phase 2: APIs
│   ├── docjays-phase3.md              # Phase 3: Compliance
│   ├── docjays-phase4.md              # Phase 4: Extraction
│   ├── docjays-phase5.md              # Phase 5: UI
│   ├── docjays-phase6.md              # Phase 6: MCP/CLI
│   └── docjays-phase7.md              # Phase 7: Deploy
└── scripts/
    ├── run-docjays-phases.py          # Orchestrator script
    └── README_ORCHESTRATOR.md         # Orchestrator docs
```

## Quick Start Options

### Option 1: Manual (Recommended for Learning)

Run each phase manually with Claude Code:

```bash
# Phase 1: Database Foundation
claude /docjays-phase1

# Phase 2: Lifecycle APIs
claude /docjays-phase2

# Phase 3: Compliance Checking
claude /docjays-phase3

# ... and so on
```

**Pros**: Full control, learn each step
**Cons**: Manual, requires monitoring

### Option 2: Automated (Recommended for Production)

Use the Python orchestrator:

```bash
# Run all phases
python scripts/run-docjays-phases.py --phase all

# Or one at a time
python scripts/run-docjays-phases.py --phase 1
python scripts/run-docjays-phases.py --phase 2
```

**Pros**: Automated, tracked, resumable
**Cons**: Less hands-on learning

### Option 3: Dry Run First (Recommended for Safety)

Preview what will happen:

```bash
python scripts/run-docjays-phases.py --phase all --dry-run
```

## 5-Minute Setup

### 1. Prerequisites Check (1 min)

```bash
# Check Node.js
node --version  # Should be 18+

# Check Python
python --version  # Should be 3.8+

# Check Claude Code
claude --version  # Should be installed

# Check database
npm run db:studio  # Should connect
```

### 2. Review the Plan (2 min)

```bash
# Read the overview
cat DOCJAYS_IMPLEMENTATION_PLAN.md | head -100

# Check phases
ls .claude/commands/docjays-*.md
```

### 3. Run Dry Run (1 min)

```bash
python scripts/run-docjays-phases.py --phase 1 --dry-run
```

### 4. Start Phase 1 (1 min)

```bash
python scripts/run-docjays-phases.py --phase 1
```

## Phase Timeline

| Week | Phase | What Gets Built |
|------|-------|-----------------|
| 1-2  | Phase 1 | Enhanced database schema |
| 3-4  | Phase 2 | Grounding APIs with metadata |
| 5-6  | Phase 3 | Compliance checking (HARD/SOFT) |
| 7-8  | Phase 4 | Decision extraction from PRs |
| 9-10 | Phase 5 | Governance dashboard & UI |
| 11-12| Phase 6 | MCP tools & CLI commands |
| 13-14| Phase 7 | Testing & deployment |

**Total**: 12-14 weeks to production

## Common Commands

### Run Specific Phase
```bash
python scripts/run-docjays-phases.py --phase 3
```

### Run Phase Range
```bash
python scripts/run-docjays-phases.py --phase 1-3
```

### Resume After Failure
```bash
python scripts/run-docjays-phases.py --resume-from 4
```

### Check Progress
```bash
cat scripts/docjays-progress.json | python -m json.tool
```

### View Logs
```bash
ls scripts/outputs/
cat scripts/outputs/phase1_*.log
```

## What Each Phase Does

### Phase 1: Database Foundation
**What**: Adds document taxonomy, constraint levels, lifecycle tracking
**Why**: Foundation for everything else
**Output**: 7 database migrations
**Time**: 1-2 weeks

### Phase 2: Lifecycle APIs
**What**: APIs to ground docs with metadata, track approvals
**Why**: Enable manual document governance
**Output**: 7 API endpoints
**Time**: 1-2 weeks

### Phase 3: Compliance Checking
**What**: Real-time constraint enforcement during coding
**Why**: Prevent violations before PR
**Output**: Compliance checker + MCP tool
**Time**: 1-2 weeks

### Phase 4: Decision Extraction
**What**: Auto-extract decisions from PRs/commits
**Why**: Preserve knowledge automatically
**Output**: Decision extractor + API
**Time**: 1-2 weeks

### Phase 5: UI Enhancement
**What**: Governance dashboard, grounding modal
**Why**: Make system accessible to users
**Output**: 4 UI components + pages
**Time**: 1-2 weeks

### Phase 6: MCP & CLI
**What**: Enhanced MCP tools, CLI commands
**Why**: Enable agent + manual access
**Output**: 5 MCP tools + 7 CLI commands
**Time**: 1-2 weeks

### Phase 7: Testing & Deploy
**What**: Comprehensive testing, staged rollout
**Why**: Ensure quality & safe launch
**Output**: Test suite + deployment
**Time**: 1-2 weeks

## Key Concepts

### Document Types
- **ARCHITECTURE**: ADRs, system design
- **API_CONTRACT**: API specs
- **DOMAIN_MODEL**: Business logic
- **SECURITY**: Security policies
- **FEATURE_SPEC**: Feature docs
- **GENERAL**: Everything else

### Constraint Levels
- **HARD**: Must not violate (blocks execution)
- **SOFT**: Should comply (warns only)
- **INFO**: Informational (no enforcement)

### States
- **Grounding State**: ungrounded | grounded | deprecated
- **Editorial State**: draft | review | active | archived

## Integration with Workflows

### Techjays Integration
```bash
# Before planning
/feature-new user-export-v2

# DocJays checks for constraints
# Shows relevant grounded docs

# During planning
/plan user-export-v2
# DocJays provides constraint context

# During execution
/execute user-export-v2
# DocJays checks compliance real-time

# After PR
/submit user-export-v2
# DocJays extracts decisions
```

### Custom Workflow Integration
1. Create workflow in `.claude/workflows/`
2. Call DocJays commands at key points
3. Document integration patterns

## Troubleshooting

### "Command not found"
```bash
# Check command exists
ls .claude/commands/docjays-phase*.md

# If missing, they should exist (you just created them)
```

### "Database locked"
```bash
# Close all connections
npm run db:studio  # Close this

# Wait 30 seconds
# Retry
```

### "Python not found"
```bash
# Try python3
python3 scripts/run-docjays-phases.py --phase 1

# Or install Python
brew install python  # macOS
apt install python3  # Ubuntu
```

### "Claude Code not responding"
```bash
# Check if Claude is running
claude --version

# Restart if needed
```

## Success Metrics

You'll know it's working when:
- ✅ Documents can be grounded with types/constraints
- ✅ Compliance checks run during coding
- ✅ Violations are caught before PR
- ✅ Decisions are extracted automatically
- ✅ Dashboard shows health metrics
- ✅ Agents can query constraints

## Getting Help

1. **Read the plan**: `DOCJAYS_IMPLEMENTATION_PLAN.md`
2. **Check phase docs**: `.claude/commands/docjays-phaseN.md`
3. **Review logs**: `scripts/outputs/phaseN_*.log`
4. **Orchestrator docs**: `scripts/README_ORCHESTRATOR.md`
5. **Ask team lead**: For clarifications

## Next Steps

### Right Now
```bash
# Review the plan
cat DOCJAYS_IMPLEMENTATION_PLAN.md

# Dry run to see what happens
python scripts/run-docjays-phases.py --phase 1 --dry-run

# If looks good, start Phase 1
python scripts/run-docjays-phases.py --phase 1
```

### This Week
- Complete Phase 1 (Database Foundation)
- Review migrations
- Test in staging
- Deploy to production

### This Month
- Complete Phases 1-4
- Have compliance checking functional
- Start using for new features

### This Quarter
- Complete all 7 phases
- Full production rollout
- Measure impact metrics

## FAQs

**Q: Can I skip phases?**
A: No, each depends on previous phases.

**Q: How long does each phase take?**
A: 1-2 weeks, but can be faster with focused work.

**Q: What if something fails?**
A: Fix the issue, then use `--resume-from` to continue.

**Q: Do I need to run this on production?**
A: No, start with dev/staging, then production.

**Q: Is this compatible with Techjays?**
A: Yes, designed to integrate seamlessly.

**Q: What if I have custom workflows?**
A: DocJays is extensible. Adapt as needed.

## Resources

- **Implementation Plan**: Detailed specifications
- **Orchestrator Docs**: How to use automation
- **Phase Commands**: Individual phase details
- **Schema Diagrams**: Database design (TBD)
- **API Specs**: Endpoint documentation (TBD)

## Version

- **Plan Version**: 2.0
- **Created**: 2026-01-25
- **Status**: Ready to execute

---

**Ready to start? Run this:**
```bash
python scripts/run-docjays-phases.py --phase 1
```
