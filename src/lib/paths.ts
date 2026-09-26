/** Base-path-aware URLs. Nothing in the site hardcodes '/' — everything goes through url(). */
import type { DestId } from '../content/types';
import { EMAIL } from '../content/resume';

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

export interface Dest {
  label: string;
  href: string;
  display: string;
  tombstonePath: string;
  external: boolean;
}

export const DEST: Record<DestId, Dest> = {
  github: {
    label: 'GitHub',
    href: 'https://github.com/DavidPurvis',
    display: 'github.com/DavidPurvis',
    tombstonePath: '/DavidPurvis',
    external: true,
  },
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/dgp0',
    display: 'linkedin.com/in/dgp0',
    tombstonePath: '/in/dgp0',
    external: true,
  },
  email: {
    label: 'Email',
    href: `mailto:${EMAIL}`,
    display: EMAIL,
    tombstonePath: '/mailto',
    external: true,
  },
  pdf: {
    label: 'Résumé PDF',
    href: url('/resume.pdf'),
    display: 'resume.pdf',
    tombstonePath: '/resume.pdf',
    external: false,
  },
  repo: {
    label: 'This website’s source code',
    href: 'https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World',
    display: 'github.com/DavidPurvis/The-Ultimate-…',
    tombstonePath: '/source',
    external: true,
  },
};

export const DEST_IDS = Object.keys(DEST) as DestId[];

export function isDestId(v: unknown): v is DestId {
  return typeof v === 'string' && v in DEST;
}

/** Entity-encode every character (light scraper resistance, zero JS, renders normally). */
export function entityEncode(s: string): string {
  return [...s].map((c) => `&#${c.codePointAt(0)};`).join('');
}
