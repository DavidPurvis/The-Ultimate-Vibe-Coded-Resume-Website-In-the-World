/**
 * Asset & license ledger. Every non-code asset shipped by this site is listed here.
 * credits.test.ts fails if a favicon or other public asset lacks an entry, and Icon.astro refuses
 * icons that aren't in ICON_MANIFEST.
 */

export type IconSet = 'lucide';

/** The only icons the site may render. Icon.astro throws at build for anything else. */
export const ICON_MANIFEST: Record<IconSet, readonly string[]> = {
  lucide: ['download', 'printer', 'triangle-alert'],
};

export interface LedgerEntry {
  id: string;
  name: string;
  kind: 'font' | 'icons' | 'original-art' | 'library' | 'media' | 'licensed-photo';
  license: string;
  author: string;
  url?: string;
  /** Files (relative to public/) covered by this entry. */
  files?: readonly string[];
  note?: string;
}

export const LEDGER: LedgerEntry[] = [
  {
    id: 'font-plex-sans',
    name: 'IBM Plex Sans',
    kind: 'font',
    license: 'SIL Open Font License 1.1',
    author: 'IBM (Mike Abbink, Bold Monday)',
    url: 'https://github.com/IBM/plex',
  },
  {
    id: 'font-plex-mono',
    name: 'IBM Plex Mono',
    kind: 'font',
    license: 'SIL Open Font License 1.1',
    author: 'IBM (Mike Abbink, Bold Monday)',
    url: 'https://github.com/IBM/plex',
  },
  {
    id: 'font-fraunces',
    name: 'Fraunces',
    kind: 'font',
    license: 'SIL Open Font License 1.1',
    author: 'Undercase Type (Phaedra Charles, Flavia Zimbardi)',
    url: 'https://github.com/undercasetype/Fraunces',
  },
  {
    id: 'icons-lucide',
    name: 'Lucide',
    kind: 'icons',
    license: 'ISC',
    author: 'Lucide Contributors',
    url: 'https://lucide.dev/',
  },
  {
    id: 'art-og-card',
    name: 'Open Graph card: stamp ring and paper texture',
    kind: 'original-art',
    license: 'Public domain (Unlicense), like the code',
    author: 'Made for this site',
    files: ['illustrations/stamp-ring.svg', 'illustrations/paper-noise.svg'],
  },
  {
    id: 'art-favicon',
    name: 'DRV rubber-stamp favicon',
    kind: 'original-art',
    license: 'Public domain (Unlicense), like the code',
    author: 'Made for this site',
    files: ['favicon.svg'],
  },
  {
    id: 'lib-astro',
    name: 'Astro',
    kind: 'library',
    license: 'MIT',
    author: 'The Astro Technology Company',
    url: 'https://astro.build/',
  },
  {
    id: 'lib-chocolate-doom',
    name: 'Chocolate Doom',
    kind: 'library',
    license: 'GPL-2.0',
    author: 'Simon Howard and contributors',
    url: 'https://github.com/chocolate-doom/chocolate-doom',
    note: 'The DOOM engine on /doom/, compiled to WebAssembly. Source at the link, as the GPL asks.',
  },
  {
    id: 'lib-doom-wasm',
    name: 'doom-wasm',
    kind: 'library',
    license: 'GPL-2.0',
    author: 'Cloudflare',
    url: 'https://github.com/cloudflare/doom-wasm',
    note: 'The WebAssembly port of Chocolate Doom that runs here, via the @nicejsisverycool/tizendoom npm package (ISC), pinned and hash-checked.',
  },
  {
    id: 'media-doom-shareware',
    name: 'DOOM shareware, episode 1 (doom1.wad)',
    kind: 'media',
    license: 'id Software shareware licence: free to copy and share, unmodified',
    author: 'id Software',
    url: 'https://github.com/cloudflare/doom-wasm',
    note: 'Unmodified. Downloaded from this site only when you press Play. Please don’t sue me.',
  },
];

export const INSPIRATION = [
  'User Inyerface by Bagaar — a frustration machine that ends at a jobs page',
  'Philippe Dubost’s Amazon-listing résumé — total commitment to one metaphor',
  'r/badUIbattles — fully working implementations of terrible ideas',
  'Robby Leonardi’s interactive résumé — the gimmick is the portfolio piece',
  'Bruno Simon’s portfolio — spectacle with a plain-HTML fallback',
];

export const creditsCopy = {
  kicker: 'Credits',
  h1: 'Credits',
  sub: 'Everything here that someone else made, and the licenses they made it under.',
  sections: {
    fonts: 'Fonts',
    icons: 'Icons',
    art: 'Original art',
    libraries: 'Libraries',
    media: 'Media',
    inspiration: 'Inspiration',
  },
  iconsUsed: 'Icons used from this set:',
  footer: 'No endorsement is implied by anyone listed here.',
};
