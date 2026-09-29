import { describe, expect, it } from 'vitest';
import {
  captchaReducer,
  categorizeCage,
  categorizeWindows,
  initialCaptcha,
  MAX_TOTAL_REJECTIONS,
  type CaptchaEvent,
  type CaptchaState,
  type Copy,
} from '../../../src/scenes/captcha/logic';
import { audio, cabbageTiles, rounds, windowTiles } from '../../../src/content/copy/captcha';

const copy: Copy = {
  windows: { headlines: rounds.windows.headlines, sublines: rounds.windows.sublines },
  cage: { headlines: rounds.cage.headlines, sublines: rounds.cage.sublines },
  linux: { pass: rounds.linux.pass },
  audioPass: audio.result,
};
const ctx = { windowTiles, cageCount: cabbageTiles.length, copy };
const step = (s: CaptchaState, e: CaptchaEvent) => captchaReducer(s, e, ctx);
const run = (evs: CaptchaEvent[], s = initialCaptcha) => evs.reduce(step, s);
const reject = (): CaptchaEvent[] => [{ t: 'SUBMIT' }, { t: 'FEEDBACK_DONE' }];

describe('categorisation', () => {
  it('windows', () => {
    expect(categorizeWindows([], windowTiles)).toBe('none');
    expect(categorizeWindows(['browser', 'terminal'], windowTiles)).toBe('software-only');
    expect(categorizeWindows(['house', 'car'], windowTiles)).toBe('physical-only');
    expect(
      categorizeWindows(
        windowTiles.map((t) => t.id),
        windowTiles,
      ),
    ).toBe('all');
    expect(categorizeWindows(['house', 'browser'], windowTiles)).toBe('mixed');
    expect(categorizeWindows(['opportunity'], windowTiles)).toBe('mixed');
  });
  it('cage', () => {
    expect(categorizeCage([], 9)).toBe('none');
    expect(categorizeCage(['a'], 9)).toBe('some');
    expect(
      categorizeCage(
        Array.from({ length: 9 }, (_, i) => `c${i}`),
        9,
      ),
    ).toBe('all');
  });
});

describe('CAPTCHAN’T reducer', () => {
  it('rejects windows with category + escalating sublines, then moves to cage after 3', () => {
    let s = run([{ t: 'TOGGLE', id: 'browser' }, { t: 'SUBMIT' }]);
    expect(s.feedback).toEqual({
      headline: rounds.windows.headlines['software-only'],
      subline: rounds.windows.sublines[0],
    });
    s = run([{ t: 'FEEDBACK_DONE' }, { t: 'SUBMIT' }], s);
    expect(s.feedback?.headline).toBe(rounds.windows.headlines.none);
    expect(s.feedback?.subline).toBe(rounds.windows.sublines[1]);
    s = run([{ t: 'FEEDBACK_DONE' }, { t: 'SUBMIT' }], s);
    expect(s.advanceTo).toBe('cage');
    s = step(s, { t: 'FEEDBACK_DONE' });
    expect(s).toMatchObject({
      round: 'cage',
      roundRejections: 0,
      totalRejections: 3,
      selected: [],
    });
  });

  it('SUBMIT during feedback is ignored (no multi-round jumps)', () => {
    const s = run([{ t: 'SUBMIT' }, { t: 'SUBMIT' }, { t: 'SUBMIT' }]);
    expect(s).toMatchObject({ roundRejections: 1, totalRejections: 1, phase: 'feedback' });
  });

  it('cage: first submit flips, second switches to prompt B, third hits the cap → linux', () => {
    let s = run([...reject(), ...reject(), ...reject()]);
    expect(s.round).toBe('cage');
    s = step(s, { t: 'SUBMIT' });
    expect(s.flipped).toBe(true);
    expect(s.feedback?.headline).toBe(rounds.cage.headlines.none);
    s = run([{ t: 'FEEDBACK_DONE' }, { t: 'SUBMIT' }], s);
    expect(s.promptVariant).toBe('B');
    s = run([{ t: 'FEEDBACK_DONE' }, { t: 'SUBMIT' }], s);
    expect(s.totalRejections).toBe(MAX_TOTAL_REJECTIONS);
    expect(s.feedback?.subline).toBe(rounds.cage.sublines[2]);
    expect(s.advanceTo).toBe('linux');
    s = step(s, { t: 'FEEDBACK_DONE' });
    expect(s.round).toBe('linux');
  });

  it('linux passes on the first submission, and nothing is selectable', () => {
    let s = run([...reject(), ...reject(), ...reject(), ...reject(), ...reject(), ...reject()]);
    expect(s.round).toBe('linux');
    s = step(s, { t: 'TOGGLE', id: 'house' });
    expect(s.selected).toEqual([]);
    s = step(s, { t: 'SUBMIT' });
    expect(s).toMatchObject({ phase: 'complete', method: 'linux' });
    expect(s.feedback?.headline).toBe(rounds.linux.pass);
  });

  it('audio passes from anywhere; skip ends the ceremony; completed state is final', () => {
    expect(step(initialCaptcha, { t: 'AUDIO_PASS' })).toMatchObject({
      phase: 'complete',
      method: 'audio',
    });
    const skipped = step(initialCaptcha, { t: 'SKIP' });
    expect(skipped.phase).toBe('skipped');
    expect(step(skipped, { t: 'SUBMIT' })).toBe(skipped);
  });

  it('never exceeds six rejections in total', () => {
    let s = initialCaptcha;
    for (let i = 0; i < 20; i++) s = run(reject(), s);
    expect(s.totalRejections).toBeLessThanOrEqual(MAX_TOTAL_REJECTIONS);
  });
});
