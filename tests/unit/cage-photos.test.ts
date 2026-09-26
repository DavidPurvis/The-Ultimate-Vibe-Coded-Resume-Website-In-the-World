import { describe, expect, it } from 'vitest';
import { cagePhotoTiles, MIN_CAGE_PHOTOS } from '../../src/content/cagePhotos';
import type { LedgerEntry } from '../../src/content/credits';

const photo = (i: number, file = `captcha/cage/cage-${i}.webp`): LedgerEntry => ({
  id: `photo-${i}`,
  name: `Nicolas Cage at an event, photo ${i}`,
  kind: 'licensed-photo',
  license: 'CC BY 2.0',
  author: `Photographer ${i}`,
  url: `https://example.org/${i}`,
  files: [file],
});

describe('licensed Cage photo drop-in', () => {
  it('ships cabbages today', () => {
    expect(cagePhotoTiles()).toBeNull();
  });
  it('needs nine credited photos before replacing the cabbages', () => {
    const eight = Array.from({ length: 8 }, (_, i) => photo(i));
    expect(cagePhotoTiles(eight)).toBeNull();
    const nine = [...eight, photo(8)];
    const tiles = cagePhotoTiles(nine);
    expect(tiles).toHaveLength(MIN_CAGE_PHOTOS);
    expect(tiles?.[0]).toMatchObject({ src: 'captcha/cage/cage-0.webp', creditId: 'photo-0' });
  });
  it('ignores files outside captcha/cage and non-photo entries', () => {
    const mixed = [
      ...Array.from({ length: 8 }, (_, i) => photo(i)),
      photo(8, 'illustrations/elsewhere.webp'),
      { ...photo(9), kind: 'original-art' as const },
    ];
    expect(cagePhotoTiles(mixed)).toBeNull();
  });
});
