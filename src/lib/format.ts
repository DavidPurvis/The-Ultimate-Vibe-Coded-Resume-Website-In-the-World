export const PHONE_MAX = 9_999_999_999;

/** (000) 000-0000 — zero-padded, clamped. */
export function formatPhone(n: number): string {
  const v = Math.min(PHONE_MAX, Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)));
  const s = String(v).padStart(10, '0');
  return `(${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6)}`;
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export function formatTimeLocal(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
