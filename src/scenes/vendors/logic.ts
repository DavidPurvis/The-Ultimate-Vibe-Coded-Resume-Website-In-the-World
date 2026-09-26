/** 3,000 fictional partners: deterministic names, 50 per page, and neighbour-flipping switches. */
import { mulberry32 } from '../../lib/rng';

export const TOTAL = 3000;
export const PER_PAGE = 50;
export const PAGES = TOTAL / PER_PAGE;
export const SEED = 0xc00c1e;

export interface VendorWords {
  adjectives: readonly string[];
  nouns: readonly string[];
  suffixes: readonly string[];
  purposes: readonly string[];
}
export interface Vendor {
  name: string;
  purpose: string;
  detail?: string;
  lockedOff?: boolean;
}

/** Named partners first, then unique generated ones, deterministically. */
export function generateVendors(
  named: readonly Vendor[],
  words: VendorWords,
  total = TOTAL,
  seed = SEED,
): Vendor[] {
  const rng = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)] as T;
  const out: Vendor[] = [...named];
  const seen = new Set(out.map((v) => v.name));
  let guard = 0;
  while (out.length < total && guard++ < total * 20) {
    const name = `${pick(words.adjectives)} ${pick(words.nouns)} ${pick(words.suffixes)}`;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, purpose: pick(words.purposes) });
  }
  return out;
}

/** All switches start on — except locked-off partners (DAVID ANALYTICS). */
export function initialStates(vendors: readonly Vendor[]): boolean[] {
  return vendors.map((v) => !v.lockedOff);
}

/**
 * Toggling one partner flips it AND its neighbours on the same page (bounded to the page).
 * Locked partners never change.
 */
export function toggle(
  states: readonly boolean[],
  vendors: readonly Vendor[],
  i: number,
  perPage = PER_PAGE,
): boolean[] {
  const next = [...states];
  const pageStart = Math.floor(i / perPage) * perPage;
  const pageEnd = Math.min(states.length, pageStart + perPage) - 1;
  for (const j of [i - 1, i, i + 1]) {
    if (j < pageStart || j > pageEnd) continue;
    if (vendors[j]?.lockedOff) continue;
    next[j] = !next[j];
  }
  return next;
}

export function pageSlice<T>(items: readonly T[], page: number, perPage = PER_PAGE): T[] {
  const p = Math.min(Math.max(1, page), Math.ceil(items.length / perPage));
  return items.slice((p - 1) * perPage, p * perPage);
}
