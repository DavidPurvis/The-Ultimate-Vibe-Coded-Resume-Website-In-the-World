/**
 * Namespaced, validated, failure-proof browser storage. Every key this site writes starts with
 * "uvcr:" and is listed on /privacy/. If storage throws (private mode, blocked site data), an
 * in-memory fallback keeps the site working for the current page.
 *
 * Two records: preferences (localStorage) and this tab's session (sessionStorage). Both are
 * validated field by field, so an old or partly malformed record keeps every value that is still
 * valid. No timestamps, visit logs, click logs or free text are ever stored.
 */
import { emptyCaseFile, validateCaseFile, type CaseFile } from '../case/state';

export const NS = 'uvcr:';
export const PREFS_KEY = `${NS}prefs`;
export const SESSION_KEY = `${NS}session`;
export const BISCOTTI_PREFIX = `${NS}biscotti:`;

export type Area = 'local' | 'session';

export type ThemeName = 'system' | 'light' | 'dark' | 'darker' | 'lights-out' | 'comic';
export const THEMES: readonly ThemeName[] = [
  'system',
  'light',
  'dark',
  'darker',
  'lights-out',
  'comic',
];
/** 'recruiter' is shown to visitors as "Direct access". */
export type Mode = 'chaos' | 'recruiter';
export type BannerState = 'pending' | 'accepted' | 'rejected' | 'managed';

export interface Prefs {
  v: 1;
  mode: Mode;
  theme: ThemeName;
  cookieBanner: BannerState;
  sound: boolean;
  /** Overkill HUD (edge-crowding overlay). */
  hud: 'off' | 'overkill';
}

/** Hyperlink allocation destinations. */
export const DEST_IDS = ['github', 'linkedin', 'email', 'pdf', 'repo'] as const;
export type DestId = (typeof DEST_IDS)[number];

/** What the visitor declared at classification. The transcription text itself is never kept. */
export interface IdentitySnapshot {
  declared: 'human' | 'automated' | 'withheld';
  /** The model chosen under "Automated system", if any. */
  model: string | null;
  transcription: 'done' | 'skipped' | null;
}
export interface CaptchaSnapshot {
  round: 'windows' | 'cage' | 'linux';
  roundRejections: number;
  totalRejections: number;
  completed: boolean;
  method: 'persistence' | 'audio' | 'linux' | 'skipped' | null;
}
export interface SubwayState {
  on: boolean;
  count: number;
}
export interface SessionState {
  v: 1;
  identity: IdentitySnapshot | null;
  captcha: CaptchaSnapshot | null;
  /** Allocation attempts per destination (the third attempt is guaranteed). */
  casino: Partial<Record<DestId, number>>;
  /** Completed spins that rendered an unsuccessful allocation. */
  casinoLosses: number;
  threat: number;
  dodges: Record<string, number>;
  appendixOpened: boolean;
  loadBearingShown: boolean;
  subway: SubwayState;
  caseFile: CaseFile;
}

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  mode: 'chaos',
  theme: 'system',
  cookieBanner: 'pending',
  sound: false,
  hud: 'off',
};

export const defaultSession = (): SessionState => ({
  v: 1,
  identity: null,
  captcha: null,
  casino: {},
  casinoLosses: 0,
  threat: 0,
  dodges: {},
  appendixOpened: false,
  loadBearingShown: false,
  subway: { on: false, count: 0 },
  caseFile: emptyCaseFile(),
});

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

export interface KeyInfo {
  area: Area;
  key: string;
  bytes: number;
}
/** Every uvcr:* key currently stored (for the /privacy/ table). */
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

/** Remove every key this site ever wrote, in both areas. */
export function clearAll(): void {
  for (const { area, key } of listKeys()) safeRemove(area, key);
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

/* ---------- schemas ---------- */

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
const count = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;

/** Each field on its own: one bad value never costs the others. */
export function validatePrefs(o: Record<string, unknown> | null): Prefs {
  if (!o) return { ...DEFAULT_PREFS };
  return {
    v: 1,
    mode: oneOf(o.mode, ['chaos', 'recruiter'] as const, DEFAULT_PREFS.mode),
    theme: oneOf(o.theme, THEMES, DEFAULT_PREFS.theme),
    cookieBanner: oneOf(
      o.cookieBanner,
      ['pending', 'accepted', 'rejected', 'managed'] as const,
      DEFAULT_PREFS.cookieBanner,
    ),
    sound: bool(o.sound, DEFAULT_PREFS.sound),
    hud: oneOf(o.hud, ['off', 'overkill'] as const, DEFAULT_PREFS.hud),
  };
}

function validateCasino(v: unknown): Partial<Record<DestId, number>> {
  const out: Partial<Record<DestId, number>> = {};
  if (!v || typeof v !== 'object') return out;
  for (const k of DEST_IDS) {
    const n = (v as Record<string, unknown>)[k];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0) out[k] = n;
  }
  return out;
}

const MODELS = ['chatgpt', 'claude', 'gemini', 'clippy', 'other'] as const;

function validateIdentity(v: unknown): IdentitySnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const t = o.transcription === 'done' || o.transcription === 'skipped' ? o.transcription : null;
  if (o.declared === 'human' || o.declared === 'automated' || o.declared === 'withheld') {
    const model =
      o.declared === 'automated' && typeof o.model === 'string'
        ? oneOf(o.model, MODELS, 'other')
        : null;
    return { declared: o.declared, model, transcription: t };
  }
  // The previous site's shape: { claimed, refused }.
  if (o.refused === true) return { declared: 'withheld', model: null, transcription: null };
  if (o.claimed === 'human') return { declared: 'human', model: null, transcription: null };
  if (typeof o.claimed === 'string' && (MODELS as readonly string[]).includes(o.claimed))
    return { declared: 'automated', model: o.claimed, transcription: null };
  return null;
}

function validateCaptcha(v: unknown): CaptchaSnapshot | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return {
    round: oneOf(o.round, ['windows', 'cage', 'linux'] as const, 'windows'),
    roundRejections: count(o.roundRejections),
    totalRejections: count(o.totalRejections),
    completed: bool(o.completed, false),
    method:
      o.method === null || o.method === undefined
        ? null
        : oneOf(o.method, ['persistence', 'audio', 'linux', 'skipped'] as const, 'persistence'),
  };
}

/** Subway players are capped (see scenes/subway/logic.ts); anything else resets to none. */
export const SUBWAY_MAX = 12;
function validateSubway(v: unknown): SubwayState {
  const o = v && typeof v === 'object' ? (v as { on?: unknown; count?: unknown }) : {};
  const on = bool(o.on, false);
  // Players only exist while the mode is on.
  return { on, count: on ? Math.min(SUBWAY_MAX, count(o.count)) : 0 };
}

export function validateSession(o: Record<string, unknown> | null): SessionState {
  if (!o) return defaultSession();
  const dodges: Record<string, number> = {};
  if (o.dodges && typeof o.dodges === 'object' && !Array.isArray(o.dodges))
    for (const [k, n] of Object.entries(o.dodges as Record<string, unknown>))
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) dodges[k] = Math.floor(n);
  return {
    v: 1,
    identity: validateIdentity(o.identity),
    captcha: validateCaptcha(o.captcha),
    casino: validateCasino(o.casino),
    casinoLosses: count(o.casinoLosses),
    threat: typeof o.threat === 'number' && Number.isFinite(o.threat) ? Math.max(0, o.threat) : 0,
    dodges,
    appendixOpened: bool(o.appendixOpened, false),
    loadBearingShown: bool(o.loadBearingShown, false),
    subway: validateSubway(o.subway),
    caseFile: validateCaseFile(o.caseFile),
  };
}

export function readPrefs(): Prefs {
  return validatePrefs(parse(safeGet('local', PREFS_KEY)));
}
export function writePrefs(patch: Partial<Omit<Prefs, 'v'>>): Prefs {
  const next = validatePrefs({ ...readPrefs(), ...patch });
  safeSet('local', PREFS_KEY, JSON.stringify(next));
  return next;
}
export function readSession(): SessionState {
  return validateSession(parse(safeGet('session', SESSION_KEY)));
}
export function writeSession(patch: Partial<Omit<SessionState, 'v'>>): SessionState {
  const next = validateSession({ ...readSession(), ...patch });
  safeSet('session', SESSION_KEY, JSON.stringify(next));
  return next;
}
