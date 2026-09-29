/**
 * Department ⇄ Direct access. Internally the values are still 'chaos' and 'recruiter' (and
 * ?mode=chaos|recruiter still works), so old links keep their meaning. Switching to Direct
 * access is a transaction: every running procedure is disposed, every open dialog closes, the
 * novelty theme steps aside, and focus is rescued if its element went away.
 */
import { disposeAll, setEnabledCheck } from './scene';
import { readPrefs, writePrefs, type Mode } from './storage';
import { announce } from '../runtime/announce';

type Listener = (m: Mode) => void;
const listeners = new Set<Listener>();
let current: Mode = 'chaos';
let initialized = false;

export const MODE_ANNOUNCEMENTS: Readonly<Record<Mode, string>> = {
  recruiter: 'Direct access on. Procedures are suspended; every page is available as is.',
  chaos: 'Direct access off. Departmental procedures have resumed.',
};

export function parseModeParam(search: string): Mode | null {
  const q = new URLSearchParams(search).get('mode');
  return q === 'recruiter' || q === 'chaos' ? q : null;
}

export function initMode(): Mode {
  if (initialized) return current;
  initialized = true;
  const fromQuery = parseModeParam(location.search);
  if (fromQuery) writePrefs({ mode: fromQuery });
  current = fromQuery ?? readPrefs().mode;
  document.documentElement.setAttribute('data-mode', current);
  setEnabledCheck(() => current === 'chaos');
  return current;
}

/** Before initMode() runs (page scripts run before the shell's), the boot script's attribute rules. */
export const getMode = (): Mode =>
  initialized || typeof document === 'undefined'
    ? current
    : document.documentElement.getAttribute('data-mode') === 'recruiter'
      ? 'recruiter'
      : 'chaos';
export const isChaos = (): boolean => getMode() === 'chaos';
export const isDirectAccess = (): boolean => getMode() === 'recruiter';

export function onModeChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMode(m: Mode, o: { announce?: boolean } = {}): void {
  if (m === current) return;
  const focused = document.activeElement;
  if (m === 'recruiter') {
    disposeAll('mode');
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close('mode'));
    document.documentElement.removeAttribute('data-theme');
  }
  current = m;
  document.documentElement.setAttribute('data-mode', m);
  writePrefs(m === 'recruiter' ? { mode: m, theme: 'system' } : { mode: m });
  for (const l of listeners) {
    try {
      l(m);
    } catch (e) {
      console.error(e);
    }
  }
  if (o.announce !== false) announce(MODE_ANNOUNCEMENTS[m]);
  if (focused instanceof HTMLElement && !document.contains(focused))
    document.getElementById('main')?.focus({ preventScroll: true });
}

/** Test seam. */
export function _resetMode(): void {
  listeners.clear();
  current = 'chaos';
  initialized = false;
}
