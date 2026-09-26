/** Base-path-aware URLs. Nothing in the site hardcodes '/' — everything goes through url(). */

const rawBase: string = import.meta.env.BASE_URL ?? '/';
/** Always ends with exactly one '/'. */
export const BASE: string = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

/** url('/resume/') → '/The-…-World/resume/'. Keeps ?query and #hash. */
export function url(path: string): string {
  if (!path.startsWith('/')) throw new Error(`url() expects a leading slash, got "${path}"`);
  return `${BASE}${path.slice(1)}`;
}

/** Absolute URL using the configured site origin. */
export function absoluteUrl(
  path: string,
  site: string | URL | undefined = import.meta.env.SITE,
): string {
  return new URL(url(path), site ?? 'http://localhost').href;
}

/** Entity-encode every character (light scraper resistance, zero JS, renders normally). */
export function entityEncode(s: string): string {
  return [...s].map((c) => `&#${c.codePointAt(0)};`).join('');
}
