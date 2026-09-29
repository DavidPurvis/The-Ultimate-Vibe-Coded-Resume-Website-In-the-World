import { describe, expect, it } from 'vitest';
import {
  currentChar,
  DRUM_CHARS,
  drumReducer,
  MAX_EMAIL,
  type DrumEvent,
  type DrumState,
} from '../../../src/scenes/contact/logic';

const run = (events: DrumEvent[], s: DrumState = { index: 0, composed: '' }) =>
  events.reduce(drumReducer, s);

describe('email drum', () => {
  it('has 40 unique characters including the milestone @', () => {
    expect(DRUM_CHARS).toHaveLength(40);
    expect(new Set(DRUM_CHARS).size).toBe(40);
    expect(DRUM_CHARS).toContain('@');
  });
  it('wraps both ways', () => {
    expect(currentChar(run([{ t: 'UP' }]))).toBe('-');
    expect(run(Array.from({ length: 40 }, () => ({ t: 'DOWN' }) as const)).index).toBe(0);
  });
  it('composes an address one painful character at a time', () => {
    const at = DRUM_CHARS.indexOf('@');
    const s = run([
      { t: 'ADD' },
      ...Array.from({ length: at }, () => ({ t: 'DOWN' }) as const),
      { t: 'ADD' },
      { t: 'ADD' },
      { t: 'DELETE' },
    ]);
    expect(s.composed).toBe('a@');
    expect(run([{ t: 'DELETE' }]).composed).toBe('');
  });
  it('stops at a sane length', () => {
    const full = { index: 0, composed: 'a'.repeat(MAX_EMAIL) };
    expect(drumReducer(full, { t: 'ADD' })).toBe(full);
  });
});
