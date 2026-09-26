/**
 * One-shot beforeunload: after CAPTCHA completion, leaving the site (not navigating within it)
 * shows the browser's generic "leave site?" prompt — the on-page setup line is the joke.
 * Same-origin link clicks disarm first. Fires at most once. Never in Recruiter Mode.
 */
import { readSession, writeSession } from '../../lib/storage';
import { isChaos, onModeChange } from '../../lib/mode';

let handler: ((e: BeforeUnloadEvent) => void) | null = null;

export function disarm(): void {
  if (handler) window.removeEventListener('beforeunload', handler);
  handler = null;
}

export function arm(): void {
  if (!isChaos() || readSession().unload === 'fired' || handler) return;
  writeSession({ unload: 'armed' });
  handler = (e: BeforeUnloadEvent) => {
    writeSession({ unload: 'fired' });
    disarm();
    e.preventDefault();
  };
  window.addEventListener('beforeunload', handler);
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]');
      if (a && new URL(a.href, location.href).origin === location.origin) disarm();
    },
    { capture: true },
  );
  onModeChange((m) => {
    if (m === 'recruiter') disarm();
  });
}
