/**
 * Namespaced, failure-proof browser storage primitives. Every key this site writes starts with
 * "uvcr:" and is listed on /privacy/. If storage throws (private mode, blocked site data), an
 * in-memory fallback keeps the site working for the current page. The only schema that uses these
 * is the case record (runtime/persistence.ts).
 */
export const NS = 'uvcr:';

export type Area = 'local' | 'session';

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

/** Remove every uvcr:* key in both areas. */
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
