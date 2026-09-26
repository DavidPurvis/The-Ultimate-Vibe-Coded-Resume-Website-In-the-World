/**
 * Optional licensed Nicolas Cage photos for CAPTCHAN'T round 2. Round 2 uses them only when at
 * least nine credited files exist — one `licensed-photo` ledger entry per file under
 * public/captcha/cage/ (credits.test.ts enforces license + author for every file there).
 * Until then, Nicolas Cabbage holds the line.
 */
import { LEDGER, type LedgerEntry } from './credits';
import type { CaptchaTile } from './copy/captcha';

export const MIN_CAGE_PHOTOS = 9;

export function cagePhotoTiles(ledger: readonly LedgerEntry[] = LEDGER): CaptchaTile[] | null {
  const tiles = ledger
    .filter((e) => e.kind === 'licensed-photo')
    .flatMap((e) =>
      (e.files ?? [])
        .filter((f) => f.startsWith('captcha/cage/'))
        .map((f, i) => ({
          id: `cage-${e.id}-${i}`,
          src: f,
          alt: e.name,
          tags: ['cabbage'] as const,
          creditId: e.id,
        })),
    );
  return tiles.length >= MIN_CAGE_PHOTOS ? tiles.slice(0, MIN_CAGE_PHOTOS) : null;
}
