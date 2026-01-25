#!/usr/bin/env python3
"""
DocJays Implementation Orchestrator

This script automates the execution of DocJays enhancement phases using Claude Code CLI.
It runs each phase systematically, tracks progress, handles errors, and generates reports.

Usage:
    python scripts/run-docjays-phases.py --phase 1
    python scripts/run-docjays-phases.py --phase all
    python scripts/run-docjays-phases.py --phase 1-3
    python scripts/run-docjays-phases.py --dry-run
    python scripts/run-docjays-phases.py --resume-from 2
"""

import subprocess
import sys
import os
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

# Fix Unicode encoding on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class PhaseStatus(Enum):
    """Status of a phase execution"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class PhaseResult:
    """Result of a phase execution"""
    phase_number: int
    phase_name: str
    status: PhaseStatus
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    command_used: Optional[str] = None
    output_file: Optional[str] = None


class DocJaysOrchestrator:
    """Orchestrates the execution of DocJays implementation phases"""

    # Phase definitions
    PHASES = {
        1: {
            "name": "Database Foundation",
            "command": "docjays-phase1",
            "duration_estimate": "1-2 weeks",
            "description": "Enhanced schema with taxonomy, lifecycle tracking, usage metadata"
        },
        2: {
            "name": "Lifecycle Management APIs",
            "command": "docjays-phase2",
            "duration_estimate": "1-2 weeks",
            "description": "Grounding API with metadata, approval workflow, lifecycle operations"
        },
        3: {
            "name": "Compliance Checking",
            "command": "docjays-phase3",
            "duration_estimate": "1-2 weeks",
            "description": "Real-time constraint enforcement, LLM-based compliance analysis"
        },
        4: {
            "name": "Decision Extraction",
            "command": "docjays-phase4",
            "duration_estimate": "1-2 weeks",
            "description": "Auto-extract decisions from PRs, commits, documents"
        },
        5: {
            "name": "UI Enhancement",
            "command": "docjays-phase5",
            "duration_estimate": "1-2 weeks",
            "description": "Governance dashboard, grounding modal, compliance UI"
        },
        6: {
            "name": "MCP & CLI Tools",
            "command": "docjays-phase6",
            "duration_estimate": "1-2 weeks",
            "description": "Enhanced MCP tools, CLI commands, workflow integration"
        },
        7: {
            "name": "Testing & Deployment",
            "command": "docjays-phase7",
            "duration_estimate": "1-2 weeks",
            "description": "Comprehensive testing, gradual rollout, monitoring"
        }
    }

    def __init__(self, project_root: str, dry_run: bool = False):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.results: List[PhaseResult] = []
        self.progress_file = self.project_root / "scripts" / "docjays-progress.json"
        self.output_dir = self.project_root / "scripts" / "outputs"
        self.output_dir.mkdir(exist_ok=True)

        # Load progress if exists
        self.load_progress()

    def load_progress(self):
        """Load previous progress from file"""
        if self.progress_file.exists():
            with open(self.progress_file, 'r') as f:
                data = json.load(f)
                self.results = [
                    PhaseResult(
                        phase_number=r['phase_number'],
                        phase_name=r['phase_name'],
                        status=PhaseStatus(r['status']),
                        start_time=r.get('start_time'),
                        end_time=r.get('end_time'),
                        duration_seconds=r.get('duration_seconds'),
                        error_message=r.get('error_message'),
                        command_used=r.get('command_used'),
                        output_file=r.get('output_file')
                    )
                    for r in data.get('results', [])
                ]

    def save_progress(self):
        """Save current progress to file"""
        data = {
            'last_updated': datetime.now().isoformat(),
            'results': [
                {
                    'phase_number': r.phase_number,
                    'phase_name': r.phase_name,
                    'status': r.status.value,
                    'start_time': r.start_time,
                    'end_time': r.end_time,
                    'duration_seconds': r.duration_seconds,
                    'error_message': r.error_message,
                    'command_used': r.command_used,
                    'output_file': r.output_file
                }
                for r in self.results
            ]
        }

        with open(self.progress_file, 'w') as f:
            json.dump(data, f, indent=2)

    def execute_phase(self, phase_number: int) -> PhaseResult:
        """Execute a single phase"""
        phase_info = self.PHASES.get(phase_number)
        if not phase_info:
            raise ValueError(f"Invalid phase number: {phase_number}")

        result = PhaseResult(
            phase_number=phase_number,
            phase_name=phase_info['name'],
            status=PhaseStatus.IN_PROGRESS
        )

        print(f"\n{'='*80}")
        print(f"Phase {phase_number}: {phase_info['name']}")
        print(f"Description: {phase_info['description']}")
        print(f"Estimated Duration: {phase_info['duration_estimate']}")
        print(f"{'='*80}\n")

        if self.dry_run:
            print("[DRY RUN] Would execute command:")
            print(f"  claude /{phase_info['command']}")
            result.status = PhaseStatus.SKIPPED
            result.command_used = f"/{phase_info['command']}"
            return result

        # Prepare output file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = self.output_dir / f"phase{phase_number}_{timestamp}.log"

        # Execute Claude Code command
        command = f"claude /{phase_info['command']}"
        result.command_used = command
        result.start_time = datetime.now().isoformat()

        print(f"Executing: {command}")
        print(f"Output will be saved to: {output_file}")
        print("\nStarting execution...\n")

        try:
            # Run claude command
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=str(self.project_root),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            # Stream output to console and file
            with open(output_file, 'w') as f:
                f.write(f"Command: {command}\n")
                f.write(f"Start Time: {result.start_time}\n")
                f.write(f"{'='*80}\n\n")

                for line in process.stdout:
                    print(line, end='')
                    f.write(line)

                # Write stderr if any
                stderr = process.stderr.read()
                if stderr:
                    print(f"\nSTDERR:\n{stderr}")
                    f.write(f"\n\nSTDERR:\n{stderr}")

            # Wait for completion
            return_code = process.wait()

            result.end_time = datetime.now().isoformat()
            start = datetime.fromisoformat(result.start_time)
            end = datetime.fromisoformat(result.end_time)
            result.duration_seconds = (end - start).total_seconds()
            result.output_file = str(output_file)

            if return_code == 0:
                result.status = PhaseStatus.COMPLETED
                print(f"\n✅ Phase {phase_number} completed successfully!")
                print(f"Duration: {result.duration_seconds:.2f} seconds")
            else:
                result.status = PhaseStatus.FAILED
                result.error_message = f"Command exited with code {return_code}"
                print(f"\n❌ Phase {phase_number} failed with return code {return_code}")

        except Exception as e:
            result.status = PhaseStatus.FAILED
            result.error_message = str(e)
            result.end_time = datetime.now().isoformat()
            print(f"\n❌ Phase {phase_number} failed with exception: {e}")

        return result

    def run_phases(self, phase_range: str):
        """Run specified phases

        Args:
            phase_range: "all", single number "1", or range "1-3"
        """
        if phase_range.lower() == "all":
            phases_to_run = list(self.PHASES.keys())
        elif "-" in phase_range:
            start, end = map(int, phase_range.split("-"))
            phases_to_run = list(range(start, end + 1))
        else:
            phases_to_run = [int(phase_range)]

        print(f"\n🚀 DocJays Implementation Orchestrator")
        print(f"Project: {self.project_root}")
        print(f"Phases to run: {phases_to_run}")
        print(f"Dry run: {self.dry_run}")
        print(f"\n")

        for phase_num in phases_to_run:
            if phase_num not in self.PHASES:
                print(f"⚠️  Warning: Phase {phase_num} not found, skipping")
                continue

            # Check if phase already completed
            existing = next((r for r in self.results if r.phase_number == phase_num), None)
            if existing and existing.status == PhaseStatus.COMPLETED:
                print(f"\n✓ Phase {phase_num} already completed, skipping")
                print(f"  Completed at: {existing.end_time}")
                print(f"  Duration: {existing.duration_seconds:.2f}s")
                continue

            # Execute phase
            result = self.execute_phase(phase_num)

            # Update results
            if existing:
                self.results.remove(existing)
            self.results.append(result)

            # Save progress after each phase
            self.save_progress()

            # Stop if phase failed (unless continuing on error)
            if result.status == PhaseStatus.FAILED:
                print(f"\n❌ Stopping execution due to failure in Phase {phase_num}")
                print(f"Error: {result.error_message}")
                print(f"\nTo resume from next phase, run:")
                print(f"  python scripts/run-docjays-phases.py --resume-from {phase_num + 1}")
                break

            # Pause between phases
            if phase_num < max(phases_to_run):
                print(f"\n⏸️  Pausing for 5 seconds before next phase...")
                time.sleep(5)

        # Generate final report
        self.generate_report()

    def generate_report(self):
        """Generate execution report"""
        print(f"\n{'='*80}")
        print("EXECUTION REPORT")
        print(f"{'='*80}\n")

        completed = [r for r in self.results if r.status == PhaseStatus.COMPLETED]
        failed = [r for r in self.results if r.status == PhaseStatus.FAILED]
        skipped = [r for r in self.results if r.status == PhaseStatus.SKIPPED]

        print(f"Total Phases: {len(self.results)}")
        print(f"Completed: {len(completed)}")
        print(f"Failed: {len(failed)}")
        print(f"Skipped: {len(skipped)}")
        print()

        if completed:
            print("✅ COMPLETED:")
            for r in completed:
                print(f"  Phase {r.phase_number}: {r.phase_name}")
                print(f"    Duration: {r.duration_seconds:.2f}s")
                print(f"    Completed: {r.end_time}")

        if failed:
            print("\n❌ FAILED:")
            for r in failed:
                print(f"  Phase {r.phase_number}: {r.phase_name}")
                print(f"    Error: {r.error_message}")
                print(f"    Output: {r.output_file}")

        if skipped:
            print("\n⏭️  SKIPPED:")
            for r in skipped:
                print(f"  Phase {r.phase_number}: {r.phase_name}")

        # Total time
        if completed:
            total_time = sum(r.duration_seconds for r in completed if r.duration_seconds)
            print(f"\nTotal execution time: {total_time:.2f}s ({total_time/60:.2f} minutes)")

        # Save detailed report
        report_file = self.output_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'total': len(self.results),
                    'completed': len(completed),
                    'failed': len(failed),
                    'skipped': len(skipped)
                },
                'results': [asdict(r) for r in self.results]
            }, f, indent=2, default=str)

        print(f"\nDetailed report saved to: {report_file}")
        print(f"Progress file: {self.progress_file}")

    def resume_from(self, phase_number: int):
        """Resume execution from a specific phase"""
        remaining_phases = [p for p in self.PHASES.keys() if p >= phase_number]
        print(f"\n🔄 Resuming from Phase {phase_number}")
        print(f"Remaining phases: {remaining_phases}")
        self.run_phases(f"{phase_number}-{max(self.PHASES.keys())}")


def main():
    parser = argparse.ArgumentParser(
        description="DocJays Implementation Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run single phase
  python scripts/run-docjays-phases.py --phase 1

  # Run all phases
  python scripts/run-docjays-phases.py --phase all

  # Run phase range
  python scripts/run-docjays-phases.py --phase 1-3

  # Dry run (preview commands)
  python scripts/run-docjays-phases.py --phase all --dry-run

  # Resume from phase 3
  python scripts/run-docjays-phases.py --resume-from 3
        """
    )

    parser.add_argument(
        '--phase',
        type=str,
        help='Phase to run: number (1), range (1-3), or "all"'
    )

    parser.add_argument(
        '--resume-from',
        type=int,
        metavar='PHASE',
        help='Resume execution from specified phase'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview commands without executing'
    )

    parser.add_argument(
        '--project-root',
        type=str,
        default='.',
        help='Project root directory (default: current directory)'
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.phase and not args.resume_from:
        parser.error("Either --phase or --resume-from must be specified")

    # Get project root
    project_root = Path(args.project_root).resolve()
    if not (project_root / '.claude').exists():
        print(f"❌ Error: .claude directory not found in {project_root}")
        print("   Make sure you're running from the project root")
        sys.exit(1)

    # Create orchestrator
    orchestrator = DocJaysOrchestrator(str(project_root), dry_run=args.dry_run)

    try:
        if args.resume_from:
            orchestrator.resume_from(args.resume_from)
        else:
            orchestrator.run_phases(args.phase)
    except KeyboardInterrupt:
        print("\n\n⚠️  Execution interrupted by user")
        orchestrator.save_progress()
        orchestrator.generate_report()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        orchestrator.save_progress()
        sys.exit(1)


if __name__ == "__main__":
    main()
