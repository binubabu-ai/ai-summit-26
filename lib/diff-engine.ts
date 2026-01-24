import * as Diff from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export interface DiffResult {
  original: DiffLine[];
  modified: DiffLine[];
  hasChanges: boolean;
}

/**
 * Generate a detailed diff between two texts
 */
export function generateDiff(original: string, modified: string): DiffResult {
  const changes = Diff.diffLines(original, modified);

  const originalLines: DiffLine[] = [];
  const modifiedLines: DiffLine[] = [];

  let originalLineNum = 1;
  let modifiedLineNum = 1;

  changes.forEach((part) => {
    const lines = part.value.split('\n');
    // Remove last empty line if present
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    lines.forEach((line) => {
      if (part.added) {
        modifiedLines.push({
          type: 'added',
          content: line,
          lineNumber: modifiedLineNum++,
        });
      } else if (part.removed) {
        originalLines.push({
          type: 'removed',
          content: line,
          lineNumber: originalLineNum++,
        });
      } else {
        originalLines.push({
          type: 'unchanged',
          content: line,
          lineNumber: originalLineNum++,
        });
        modifiedLines.push({
          type: 'unchanged',
          content: line,
          lineNumber: modifiedLineNum++,
        });
      }
    });
  });

  return {
    original: originalLines,
    modified: modifiedLines,
    hasChanges: changes.some((part) => part.added || part.removed),
  };
}

/**
 * Generate word-level diff for inline display
 */
export function generateInlineDiff(
  original: string,
  modified: string
): Array<{ type: 'added' | 'removed' | 'unchanged'; value: string }> {
  const changes = Diff.diffWords(original, modified);

  return changes.map((part) => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value,
  }));
}

/**
 * Calculate similarity percentage between two texts
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const changes = Diff.diffChars(text1, text2);

  let unchanged = 0;
  let total = 0;

  changes.forEach((part) => {
    total += part.value.length;
    if (!part.added && !part.removed) {
      unchanged += part.value.length;
    }
  });

  return total === 0 ? 1 : unchanged / total;
}

/**
 * Get statistics about the changes
 */
export function getDiffStats(diff: DiffResult): {
  linesAdded: number;
  linesRemoved: number;
  linesUnchanged: number;
} {
  const linesAdded = diff.modified.filter((l) => l.type === 'added').length;
  const linesRemoved = diff.original.filter((l) => l.type === 'removed').length;
  const linesUnchanged = diff.original.filter((l) => l.type === 'unchanged').length;

  return {
    linesAdded,
    linesRemoved,
    linesUnchanged,
  };
}

/**
 * Format diff for unified diff view (like git diff)
 */
export function formatUnifiedDiff(
  original: string,
  modified: string,
  filename: string = 'document.md'
): string {
  const patch = Diff.createPatch(filename, original, modified, '', '');
  return patch;
}
