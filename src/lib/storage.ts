/**
 * Namespaced, validated, failure-proof browser storage. Every key this site writes starts with
 * "uvcr:" and is disclosed on /legal/. If storage throws (private mode, blocked site data), an
 * in-memory fallback keeps the site working for the current page.
 */
import type { DestId } from '../content/types';

export const NS = 'uvcr:';
export const PREFS_KEY = `${NS}prefs`;
export const SESSION_KEY = `${NS}session`;
export const BISCOTTI_PREFIX = `${NS}biscotti:`;

export type ThemeName = 'system' | 'light' | 'dark' | 'darker' | 'lights-out' | 'comic';
export const THEMES: readonly ThemeName[] = [
  'system',
  'light',
  'dark',
  'darker',
  'lights-out',
  'comic',
];
export type Mode = 'chaos' | 'recruiter';
export type BannerState = 'pending' | 'accepted' | 'rejected' | 'managed';

export interface Prefs {
  v: 1;
  mode: Mode;
  theme: ThemeName;
  cookieBanner: BannerState;
  notified: boolean;
  sound: boolean;
}

export interface IdentitySnapshot {
  claimed: string | null;
  refused: boolean;
  confirmation: string | null;
}
export interface CaptchaSnapshot {
  round: 'windows' | 'cage' | 'linux';
  roundRejections: number;
  totalRejections: number;
  completed: boolean;
  method: 'persistence' | 'audio' | 'linux' | 'skipped' | null;
}

export interface SessionState {
  v: 1;
  identity: IdentitySnapshot | null;
  captcha: CaptchaSnapshot | null;
  casino: Partial<Record<DestId, number>>;
  lastPlayfulWasRick: boolean;
  threat: number;
  unload: 'idle' | 'armed' | 'fired';
  guiltIndex: number;
  dodges: Record<string, number>;
  appendixOpened: boolean;
  identityPrompted: boolean;
  loadBearingShown: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  mode: 'chaos',
  theme: 'system',
  cookieBanner: 'pending',
  notified: false,
  sound: false,
};

export const DEFAULT_SESSION: SessionState = {
  v: 1,
  identity: null,
  captcha: null,
  casino: {},
  lastPlayfulWasRick: false,
  threat: 0,
  unload: 'idle',
  guiltIndex: 0,
  dodges: {},
  appendixOpened: false,
  identityPrompted: false,
  loadBearingShown: false,
};

type Area = 'local' | 'session';

/** Minimal Storage-like interface so tests can inject fakes. */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  key(i: number): string | null;
  readonly length: number;
}

class MemoryKV implements KV {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  get length() {
    return this.m.size;
  }
}

const memory: Record<Area, MemoryKV> = { local: new MemoryKV(), session: new MemoryKV() };
const injected: Partial<Record<Area, KV>> = {};
const broken: Record<Area, boolean> = { local: false, session: false };

/** Test seam: inject fake storages (pass undefined to restore the real ones). */
export function _setBackends(b: Partial<Record<Area, KV | undefined>>): void {
  for (const area of ['local', 'session'] as const) {
    if (area in b) {
      if (b[area]) injected[area] = b[area];
      else delete injected[area];
      broken[area] = false;
      memory[area] = new MemoryKV();
    }
  }
}

function real(area: Area): KV | null {
  if (injected[area]) return injected[area] ?? null;
  try {
    const s = area === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

function backend(area: Area): KV {
  if (broken[area]) return memory[area];
  return real(area) ?? memory[area];
}

export function storageAvailable(area: Area): boolean {
  const s = real(area);
  if (!s) return false;
  try {
    const k = `${NS}__probe`;
    s.setItem(k, '1');
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function safeGet(area: Area, key: string): string | null {
  try {
    return backend(area).getItem(key);
  } catch {
    broken[area] = true;
    return memory[area].getItem(key);
  }
}

function safeSet(area: Area, key: string, value: string): void {
  try {
    backend(area).setItem(key, value);
  } catch {
    broken[area] = true;
    memory[area].setItem(key, value);
  }
}

function safeRemove(area: Area, key: string): void {
  try {
    backend(area).removeItem(key);
  } catch {
    /* ignore */
  }
  memory[area].removeItem(key);
}

function parse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : d;
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function validatePrefs(o: Record<string, unknown> | null): Prefs {
  if (!o || o.v !== 1) return { ...DEFAULT_PREFS };
  return {
    v: 1,
    mode: oneOf(o.mode, ['chaos', 'recruiter'] as const, DEFAULT_PREFS.mode),
    theme: oneOf(o.theme, THEMES, DEFAULT_PREFS.theme),
    cookieBanner: oneOf(
      o.cookieBanner,
      ['pending', 'accepted', 'rejected', 'managed'] as const,
      'pending',
    ),
    notified: bool(o.notified, false),
    sound: bool(o.sound, false),
  };
}

function validateCasino(v: unknown): Partial<Record<DestId, number>> {
  const out: Partial<Record<DestId, number>> = {};
  if (!v || typeof v !== 'object') return out;
  for (const k of ['github', 'linkedin', 'email', 'pdf', 'repo'] as const) {
    const n = (v as Record<string, unknown>)[k];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0) out[k] = n;
  }
  return out;
}

function validateIdentity(v: unknown): IdentitySnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return {
    claimed: typeof o.claimed === 'string' ? o.claimed : null,
    refused: bool(o.refused, false),
    confirmation: typeof o.confirmation === 'string' ? o.confirmation : null,
  };
}

function validateCaptcha(v: unknown): CaptchaSnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return {
    round: oneOf(o.round, ['windows', 'cage', 'linux'] as const, 'windows'),
    roundRejections: Math.max(0, Math.floor(num(o.roundRejections, 0))),
    totalRejections: Math.max(0, Math.floor(num(o.totalRejections, 0))),
    completed: bool(o.completed, false),
    method:
      o.method === null
        ? null
        : oneOf(o.method, ['persistence', 'audio', 'linux', 'skipped'] as const, 'persistence'),
  };
}

export function validateSession(o: Record<string, unknown> | null): SessionState {
  if (!o || o.v !== 1) return structuredClone(DEFAULT_SESSION);
  const dodges: Record<string, number> = {};
  if (o.dodges && typeof o.dodges === 'object') {
    for (const [k, n] of Object.entries(o.dodges as Record<string, unknown>)) {
      if (typeof n === 'number' && Number.isFinite(n)) dodges[k] = n;
    }
  }
  return {
    v: 1,
    identity: validateIdentity(o.identity),
    captcha: validateCaptcha(o.captcha),
    casino: validateCasino(o.casino),
    lastPlayfulWasRick: bool(o.lastPlayfulWasRick, false),
    threat: Math.max(0, num(o.threat, 0)),
    unload: oneOf(o.unload, ['idle', 'armed', 'fired'] as const, 'idle'),
    guiltIndex: Math.max(0, Math.floor(num(o.guiltIndex, 0))),
    dodges,
    appendixOpened: bool(o.appendixOpened, false),
    identityPrompted: bool(o.identityPrompted, false),
    loadBearingShown: bool(o.loadBearingShown, false),
  };
}

export function readPrefs(): Prefs {
  return validatePrefs(parse(safeGet('local', PREFS_KEY)));
}
export function writePrefs(patch: Partial<Omit<Prefs, 'v'>>): Prefs {
  const next = { ...readPrefs(), ...patch, v: 1 as const };
  safeSet('local', PREFS_KEY, JSON.stringify(next));
  return next;
}
export function readSession(): SessionState {
  return validateSession(parse(safeGet('session', SESSION_KEY)));
}
export function writeSession(patch: Partial<Omit<SessionState, 'v'>>): SessionState {
  const next = { ...readSession(), ...patch, v: 1 as const };
  safeSet('session', SESSION_KEY, JSON.stringify(next));
  return next;
}

export interface KeyInfo {
  area: Area;
  key: string;
  bytes: number;
}
/** Every uvcr:* key currently stored (for the /legal/ disclosure table). */
export function listKeys(): KeyInfo[] {
  const out: KeyInfo[] = [];
  for (const area of ['local', 'session'] as const) {
    const s = backend(area);
    try {
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (key?.startsWith(NS)) {
          const v = s.getItem(key) ?? '';
          out.push({ area, key, bytes: new TextEncoder().encode(key + v).length });
        }
      }
    } catch {
      /* ignore */
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

/** Remove every uvcr:* key in both areas. */
export function clearAll(): void {
  for (const { area, key } of listKeys()) safeRemove(area, key);
  for (const area of ['local', 'session'] as const) {
    for (const k of [PREFS_KEY, SESSION_KEY]) safeRemove(area, k);
  }
}

export function writeRaw(area: Area, key: string, value: string): void {
  if (!key.startsWith(NS)) throw new Error(`Refusing to write non-namespaced key ${key}`);
  safeSet(area, key, value);
}
export function readRaw(area: Area, key: string): string | null {
  return safeGet(area, key);
}
export function removeRaw(area: Area, key: string): void {
  safeRemove(area, key);
}
