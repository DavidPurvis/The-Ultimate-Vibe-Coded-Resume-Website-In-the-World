/**
 * The recorded facts the case policy may cite, read from the stored session and preferences.
 * Only explicit, completed actions count: closing classification without declaring is not a
 * refusal, an unfinished verification is not a skip, an interrupted spin is not a loss.
 */
import type { Prefs, SessionState } from '../lib/storage';
import type { Evidence } from './policy';

export function evidenceOf(s: SessionState, p: Pick<Prefs, 'cookieBanner'>): Evidence {
  const verification =
    s.captcha?.method === 'skipped' ? 'skipped' : s.captcha?.completed ? 'complete' : null;
  return {
    classification: s.identity?.declared ?? null,
    verification,
    allocationLosses: s.casinoLosses,
    appendixOpened: s.appendixOpened,
    cookiePending: p.cookieBanner === 'pending',
  };
}
