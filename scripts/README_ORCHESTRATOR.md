# DocJays Implementation Orchestrator

Automated execution of DocJays enhancement phases using Claude Code CLI.

## Overview

The orchestrator systematically executes all 7 phases of the DocJays implementation plan, tracks progress, handles errors, and generates detailed reports.

## Prerequisites

1. **Claude Code CLI installed**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Python 3.8+**
   ```bash
   python --version  # Should be 3.8 or higher
   ```

3. **Claude Code commands created**
   - Commands should exist in `.claude/commands/` directory
   - Files: `docjays-phase1.md`, `docjays-phase2.md`, etc.

4. **Project setup**
   - Working directory is project root
   - `.claude/` directory exists
   - Database accessible

## Quick Start

### Run All Phases
```bash
python scripts/run-docjays-phases.py --phase all
```

### Run Single Phase
```bash
python scripts/run-docjays-phases.py --phase 1
```

### Run Phase Range
```bash
python scripts/run-docjays-phases.py --phase 1-3
```

### Dry Run (Preview)
```bash
python scripts/run-docjays-phases.py --phase all --dry-run
```

### Resume from Phase
```bash
python scripts/run-docjays-phases.py --resume-from 3
```

## Detailed Usage

### Command Options

```bash
python scripts/run-docjays-phases.py [OPTIONS]

Options:
  --phase PHASE          Phase to run: number (1), range (1-3), or "all"
  --resume-from PHASE    Resume execution from specified phase
  --dry-run              Preview commands without executing
  --project-root PATH    Project root directory (default: current)
  -h, --help             Show help message
```

### Phase Execution Flow

1. **Load Progress**: Checks `scripts/docjays-progress.json` for previous runs
2. **Validate Phase**: Ensures phase exists and hasn't completed
3. **Execute Command**: Runs `claude /docjays-phaseN`
4. **Stream Output**: Displays output in real-time and saves to file
5. **Track Results**: Saves status, duration, errors
6. **Save Progress**: Updates progress file after each phase
7. **Generate Report**: Creates summary report at end

### Output Files

All outputs are saved to `scripts/outputs/` directory:

```
scripts/
├── outputs/
│   ├── phase1_20260125_143022.log    # Phase execution logs
│   ├── phase2_20260125_150145.log
│   ├── report_20260125_153012.json   # Execution report
│   └── ...
└── docjays-progress.json              # Progress tracking
```

## Phase Definitions

| Phase | Name | Duration | Command |
|-------|------|----------|---------|
| 1 | Database Foundation | 1-2 weeks | `/docjays-phase1` |
| 2 | Lifecycle Management APIs | 1-2 weeks | `/docjays-phase2` |
| 3 | Compliance Checking | 1-2 weeks | `/docjays-phase3` |
| 4 | Decision Extraction | 1-2 weeks | `/docjays-phase4` |
| 5 | UI Enhancement | 1-2 weeks | `/docjays-phase5` |
| 6 | MCP & CLI Tools | 1-2 weeks | `/docjays-phase6` |
| 7 | Testing & Deployment | 1-2 weeks | `/docjays-phase7` |

## Progress Tracking

The orchestrator maintains a progress file at `scripts/docjays-progress.json`:

```json
{
  "last_updated": "2026-01-25T15:30:12",
  "results": [
    {
      "phase_number": 1,
      "phase_name": "Database Foundation",
      "status": "completed",
      "start_time": "2026-01-25T14:30:22",
      "end_time": "2026-01-25T15:12:45",
      "duration_seconds": 2543.12,
      "command_used": "/docjays-phase1",
      "output_file": "scripts/outputs/phase1_20260125_143022.log"
    }
  ]
}
```

### Progress States

- `pending`: Phase not yet started
- `in_progress`: Currently executing
- `completed`: Successfully finished
- `failed`: Encountered error
- `skipped`: Skipped (dry run or already completed)

## Error Handling

### Automatic Recovery

- Progress is saved after each phase
- If a phase fails, execution stops
- Resume from next phase using `--resume-from`

### Manual Intervention

If a phase fails:

1. **Review the log file**:
   ```bash
   cat scripts/outputs/phase2_*.log
   ```

2. **Fix the issue** (code, config, database)

3. **Resume execution**:
   ```bash
   python scripts/run-docjays-phases.py --resume-from 2
   ```

### Common Issues

**Issue**: Command not found
```
Error: /docjays-phase1 command not found
```
**Solution**: Ensure command file exists in `.claude/commands/docjays-phase1.md`

**Issue**: Permission denied
```
Error: Permission denied
```
**Solution**: Check file permissions and Claude Code authentication

**Issue**: Database locked
```
Error: Database is locked
```
**Solution**: Close other connections, wait, retry

## Monitoring Execution

### Real-time Monitoring

Output is streamed to console in real-time:

```
================================================================================
Phase 1: Database Foundation
Description: Enhanced schema with taxonomy, lifecycle tracking, usage metadata
Estimated Duration: 1-2 weeks
================================================================================

Executing: claude /docjays-phase1
Output will be saved to: scripts/outputs/phase1_20260125_143022.log

Starting execution...

[Claude Code output appears here in real-time]
```

### Check Progress

View current progress:
```bash
cat scripts/docjays-progress.json | python -m json.tool
```

### Tail Output

Monitor active execution:
```bash
tail -f scripts/outputs/phase*.log
```

## Reports

### Execution Report

Generated at end of run, saved to `scripts/outputs/report_*.json`:

```json
{
  "generated_at": "2026-01-25T18:45:12",
  "summary": {
    "total": 7,
    "completed": 5,
    "failed": 1,
    "skipped": 1
  },
  "results": [...]
}
```

### Console Summary

```
================================================================================
EXECUTION REPORT
================================================================================

Total Phases: 7
Completed: 5
Failed: 1
Skipped: 1

✅ COMPLETED:
  Phase 1: Database Foundation
    Duration: 2543.12s
    Completed: 2026-01-25T15:12:45

  Phase 2: Lifecycle Management APIs
    Duration: 1823.45s
    Completed: 2026-01-25T16:45:30

  ...

❌ FAILED:
  Phase 6: MCP & CLI Tools
    Error: Command exited with code 1
    Output: scripts/outputs/phase6_20260125_173022.log

Total execution time: 12543.67s (209.06 minutes)
```

## Best Practices

### Before Starting

1. **Review the plan**: Read `DOCJAYS_IMPLEMENTATION_PLAN.md`
2. **Check prerequisites**: Database, APIs, access
3. **Backup data**: Create database backup
4. **Dry run first**: Use `--dry-run` to preview
5. **Clear schedule**: Phases take 1-2 weeks each

### During Execution

1. **Monitor progress**: Keep terminal visible
2. **Don't interrupt**: Let phases complete
3. **Review logs**: Check outputs for issues
4. **Test incrementally**: Verify each phase

### After Completion

1. **Review reports**: Check execution summary
2. **Verify functionality**: Run integration tests
3. **Document learnings**: Update docs with issues found
4. **Clean up**: Archive old logs if needed

## Advanced Usage

### Custom Project Root

```bash
python scripts/run-docjays-phases.py \
  --phase 1 \
  --project-root /path/to/project
```

### Continue on Failure

By default, execution stops on failure. To continue:

1. Fix the issue
2. Resume from failed phase:
   ```bash
   python scripts/run-docjays-phases.py --resume-from <failed-phase>
   ```

### Selective Re-run

To re-run a completed phase:

1. Remove phase from progress file:
   ```bash
   # Edit scripts/docjays-progress.json manually
   # Remove the phase entry from "results"
   ```

2. Run the phase again:
   ```bash
   python scripts/run-docjays-phases.py --phase 3
   ```

### Parallel Execution

**Not recommended**. Phases have dependencies:
- Phase 2 requires Phase 1 (schema)
- Phase 3 requires Phase 2 (APIs)
- etc.

Run sequentially to avoid issues.

## Troubleshooting

### Claude Code Not Found

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Command File Missing

```bash
# Check if command exists
ls .claude/commands/docjays-phase*.md

# If missing, create from templates
```

### Permission Issues

```bash
# Make script executable
chmod +x scripts/run-docjays-phases.py

# Or run with python explicitly
python scripts/run-docjays-phases.py --phase 1
```

### Python Version

```bash
# Check Python version
python --version

# Use python3 if needed
python3 scripts/run-docjays-phases.py --phase 1
```

## FAQ

**Q: Can I run multiple phases in parallel?**
A: No, phases must run sequentially due to dependencies.

**Q: How long does the full implementation take?**
A: Approximately 12-14 weeks for all 7 phases.

**Q: What if Claude Code asks for confirmation?**
A: Phase execution may pause for user input. Respond as needed.

**Q: Can I skip a phase?**
A: Not recommended. Each phase builds on the previous.

**Q: How do I clean up and start over?**
A: Delete `scripts/docjays-progress.json` and `scripts/outputs/*`

**Q: Are there checkpoints within phases?**
A: Yes, Claude Code uses internal checkpoints. See command files for details.

## Support

For issues:
1. Check phase-specific command file (`.claude/commands/docjays-phaseN.md`)
2. Review phase logs (`scripts/outputs/phaseN_*.log`)
3. Check implementation plan (`DOCJAYS_IMPLEMENTATION_PLAN.md`)
4. Consult team lead or tech lead

## Version History

- **v1.0.0** (2026-01-25): Initial orchestrator release
  - All 7 phases defined
  - Progress tracking
  - Error handling
  - Reporting

## License

Internal tool for DocJays implementation. Not for external distribution.
