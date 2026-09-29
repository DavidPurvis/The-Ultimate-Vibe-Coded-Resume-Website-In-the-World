/**
 * Every distinctive Department sentence, for boundary checks: none may appear on a résumé page,
 * in a PDF (text or metadata) or in resume.md. Short labels that are also ordinary words
 * ("Résumé", "Close", "Confirm") are excluded by length.
 */
import * as caseCopy from './case';
import * as shellCopy from './shell';

const MODULES: readonly unknown[] = [caseCopy, shellCopy];
const MIN_LENGTH = 20;

function collect(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (value.length >= MIN_LENGTH) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collect(v, out);
  }
}

export function departmentStrings(): string[] {
  const out = new Set<string>();
  for (const m of MODULES) collect(m, out);
  return [...out];
}
