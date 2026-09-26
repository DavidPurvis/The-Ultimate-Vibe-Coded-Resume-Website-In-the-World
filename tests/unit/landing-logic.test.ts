import { describe, expect, it } from 'vitest';
import {
  generateVendors,
  initialStates,
  pageSlice,
  PAGES,
  toggle,
  TOTAL,
} from '../../src/scenes/vendors/logic';
import { makeBiscotti } from '../../src/scenes/cookie-banner/logic';
import { biscotti, namedPartners, vendorWords } from '../../src/content/copy/cookies';

describe('3,000 fictional partners', () => {
  const vendors = generateVendors(namedPartners, vendorWords);
  it('are exactly 3,000, unique, named partners first, deterministic', () => {
    expect(vendors).toHaveLength(TOTAL);
    expect(new Set(vendors.map((v) => v.name)).size).toBe(TOTAL);
    expect(vendors.slice(0, 6).map((v) => v.name)).toEqual(namedPartners.map((p) => p.name));
    expect(generateVendors(namedPartners, vendorWords)[1234]).toEqual(vendors[1234]);
    expect(PAGES).toBe(60);
  });
  it('start all on except DAVID ANALYTICS', () => {
    const s = initialStates(vendors);
    expect(s[0]).toBe(false);
    expect(s.slice(1).every(Boolean)).toBe(true);
  });
  it('toggling flips neighbours within the page only, never locked ones', () => {
    const s = initialStates(vendors);
    const mid = toggle(s, vendors, 10);
    expect([mid[9], mid[10], mid[11]]).toEqual([false, false, false]);
    expect(mid[8]).toBe(true);
    const first = toggle(s, vendors, 50); // first row of page 2
    expect(first[49]).toBe(true);
    expect([first[50], first[51]]).toEqual([false, false]);
    const locked = toggle(s, vendors, 1);
    expect(locked[0]).toBe(false); // DAVID ANALYTICS stays off
  });
  it('page slices are clamped', () => {
    expect(pageSlice(vendors, 1)).toHaveLength(50);
    expect(pageSlice(vendors, 999)[0]).toEqual(vendors[2950]);
  });
});

describe('biscotti', () => {
  it('50 namespaced keys, 6 kinds cycled', () => {
    const bs = makeBiscotti(biscotti.names, biscotti.kinds);
    expect(bs).toHaveLength(50);
    expect(bs[0]?.key).toBe('uvcr:biscotti:01');
    expect(bs[49]?.key).toBe('uvcr:biscotti:50');
    expect(new Set(bs.map((b) => b.kind)).size).toBe(6);
    expect(bs.every((b) => b.art.split('\n').length <= 6)).toBe(true);
  });
});
