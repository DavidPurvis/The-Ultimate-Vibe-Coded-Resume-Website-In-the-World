/**
 * Writes to the case record: the one place a reducer action meets storage. Unchanged records are
 * not rewritten, so repeat visits, reloads and duplicate activations cost nothing.
 */
import { readSession, writeSession } from '../lib/storage';
import { reduceCase, type CaseAction, type CaseFile } from './state';

export function updateCase(a: CaseAction): CaseFile {
  const before = readSession().caseFile;
  const after = reduceCase(before, a);
  if (after !== before) writeSession({ caseFile: after });
  return after;
}
