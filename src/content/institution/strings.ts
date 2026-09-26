/**
 * Every distinctive institutional sentence, for boundary checks: none of these may appear in a
 * résumé page, a PDF (text or metadata) or resume.md. Short labels and the role-family names
 * (which are also ordinary résumé words) are excluded.
 */
import * as institution from './case';

const MIN_LENGTH = 20;
const EXCLUDED = new Set<string>([
  ...Object.values(institution.laneLabels),
  ...institution.scope.options.map((o) => o.label),
]);

function collect(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (value.length >= MIN_LENGTH && !EXCLUDED.has(value)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collect(v, out);
  }
}

export function institutionStrings(): string[] {
  const out = new Set<string>();
  collect(institution, out);
  return [...out];
}
