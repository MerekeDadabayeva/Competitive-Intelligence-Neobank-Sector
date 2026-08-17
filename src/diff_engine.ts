import * as Diff from 'diff';
import { DiffResult } from './types.js';
import { extractNumericTokens } from './normalizer.js';

export function computeDiff(contentBefore: string, contentAfter: string, filename = 'pricing.md'): DiffResult {
  const normBefore = contentBefore.trim();
  const normAfter = contentAfter.trim();

  if (normBefore === normAfter) {
    return {
      has_change: false,
      is_meaningful: false,
      added_lines: [],
      removed_lines: [],
      unified_diff: '',
      detected_numbers_before: [],
      detected_numbers_after: []
    };
  }

  const lineDiff = Diff.diffLines(normBefore, normAfter);
  const addedLines: string[] = [];
  const removedLines: string[] = [];

  for (const part of lineDiff) {
    const cleanLines = part.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (part.added) {
      addedLines.push(...cleanLines);
    } else if (part.removed) {
      removedLines.push(...cleanLines);
    }
  }

  const patch = Diff.createTwoFilesPatch(
    `a/${filename}`,
    `b/${filename}`,
    normBefore,
    normAfter,
    'prior_snapshot',
    'current_snapshot'
  );

  const numbersBefore = extractNumericTokens(removedLines.join(' '));
  const numbersAfter = extractNumericTokens(addedLines.join(' '));

  // Determine if change is substantive
  const hasAdded = addedLines.length > 0;
  const hasRemoved = removedLines.length > 0;
  const hasMeaningfulText = addedLines.some(l => l.replace(/[^a-zA-Z0-9]/g, '').length > 0);

  return {
    has_change: hasAdded || hasRemoved,
    is_meaningful: hasMeaningfulText,
    added_lines: addedLines,
    removed_lines: removedLines,
    unified_diff: patch,
    detected_numbers_before: numbersBefore,
    detected_numbers_after: numbersAfter
  };
}
