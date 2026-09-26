/**
 * Chaos ⇄ Recruiter Mode. Switching is a transaction: dispose every running scene, flip the
 * attribute, persist, let modules restore what they changed, announce, and rescue focus.
 */
import { disposeAll, setEnabledCheck } from './scene';
import { readPrefs, writePrefs, type Mode } from './storage';
import { announce } from './announce';
import { toast } from './toast';
import { modeToasts } from '../content/copy/global';

type Listener = (m: Mode) => void;
const listeners = new Set<Listener>();
let current: Mode = 'chaos';
let initialized = false;

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

export const getMode = (): Mode => current;
export const isChaos = (): boolean => current === 'chaos';

export function onModeChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMode(m: Mode, o: { announce?: boolean } = {}): void {
  if (m === current) return;
  const focusWasInside = document.activeElement;
  if (m === 'recruiter') disposeAll('mode');
  current = m;
  document.documentElement.setAttribute('data-mode', m);
  const patch: Parameters<typeof writePrefs>[0] = { mode: m };
  if (m === 'recruiter') patch.theme = 'system';
  writePrefs(patch);
  if (m === 'recruiter') document.documentElement.removeAttribute('data-theme');
  for (const l of listeners) {
    try {
      l(m);
    } catch (e) {
      console.error(e);
    }
  }
  if (o.announce !== false) {
    const msg = m === 'recruiter' ? modeToasts.recruiter : modeToasts.chaos;
    announce(msg);
    toast(msg);
  }
  if (focusWasInside instanceof HTMLElement && !document.contains(focusWasInside)) {
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
