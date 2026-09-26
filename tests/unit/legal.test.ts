import { describe, expect, it } from 'vitest';
import { buildDetected, isWorkHours } from '../../src/scenes/legal/logic';

const env = (over: Partial<Parameters<typeof buildDetected>[0]> = {}) => ({
  cores: 8,
  now: new Date(2026, 8, 23, 10, 5), // Wednesday
  timeZone: 'America/Denver',
  language: 'en-US',
  reducedMotion: false,
  ...over,
});
const text = (lines: ReturnType<typeof buildDetected>, id: string) =>
  lines.find((l) => l.id === id)?.text ?? '';

describe('We have detected…', () => {
  it('work hours are Mon–Fri 09:00–17:00 local', () => {
    expect(isWorkHours(new Date(2026, 8, 23, 10))).toBe(true);
    expect(isWorkHours(new Date(2026, 8, 23, 22))).toBe(false);
    expect(isWorkHours(new Date(2026, 8, 26, 10))).toBe(false); // Saturday
    expect(isWorkHours(new Date(2026, 8, 23, 17))).toBe(false);
  });
  it('builds every line with a how-it-works note', () => {
    const lines = buildDetected(env());
    expect(lines).toHaveLength(7);
    expect(lines.every((l) => l.how.length > 5)).toBe(true);
    expect(text(lines, 'cores')).toContain('8 logical processors');
    expect(text(lines, 'time')).toContain('10:05 in America/Denver');
    expect(text(lines, 'time')).toContain('company time');
  });
  it('after hours and weekend copy', () => {
    expect(text(buildDetected(env({ now: new Date(2026, 8, 23, 22) })), 'time')).toContain(
      'After hours?',
    );
    expect(text(buildDetected(env({ now: new Date(2026, 8, 26, 10) })), 'time')).toContain(
      'After hours?',
    );
  });
  it('falls back gracefully when values are withheld', () => {
    const lines = buildDetected(
      env({ cores: undefined, timeZone: undefined, language: undefined, reducedMotion: true }),
    );
    expect(text(lines, 'cores')).toBe('CPU information withheld. Sensible.');
    expect(text(lines, 'time')).toBe('Time zone withheld. Mysterious.');
    expect(text(lines, 'language')).toBe('Language withheld. Also sarcasm.');
    expect(text(lines, 'motion')).toContain('less motion');
  });
});
