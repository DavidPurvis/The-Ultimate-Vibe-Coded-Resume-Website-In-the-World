import { describe, expect, it } from 'vitest';
import { BUDGET, OPENING_ACTIONS, PIPELINE, STEPS, isStepId } from '../../../src/domain/steps';

describe('the pipeline catalog', () => {
  it('lists every step exactly once, in a fixed order', () => {
    expect([...PIPELINE].sort()).toEqual(Object.keys(STEPS).sort());
    expect(new Set(PIPELINE).size).toBe(PIPELINE.length);
    expect(PIPELINE.every(isStepId)).toBe(true);
    expect(isStepId('disposition')).toBe(false);
  });

  it('reaches authorization in at most 11 intent events (A2)', () => {
    const total = OPENING_ACTIONS + PIPELINE.reduce((n, id) => n + STEPS[id].maxActions, 0);
    expect(total).toBe(11);
  });

  it('never runs more than two hostile steps in a row, and has four in all (C1)', () => {
    let run = 0;
    let max = 0;
    for (const id of PIPELINE) {
      run = STEPS[id].hostile ? run + 1 : 0;
      max = Math.max(max, run);
    }
    expect(max).toBeLessThanOrEqual(BUDGET.maxConsecutiveHostile);
    expect(PIPELINE.filter((id) => STEPS[id].hostile)).toHaveLength(4);
  });

  it('every climax is skippable, and the release step budget matches resistance', () => {
    for (const id of PIPELINE)
      if (STEPS[id].delay === 'climax') expect(STEPS[id].skippable).toBe(true);
    expect(STEPS.release.maxActions).toBe(BUDGET.maxResisted + 1);
    expect(STEPS.acknowledgment.maxActions).toBe(BUDGET.maxAckScreens);
  });

  it('keeps total fake waiting within 6.5 s (A2)', () => {
    const wait = PIPELINE.reduce((n, id) => {
      const d = STEPS[id].delay;
      return (
        n + (d === 'processing' ? BUDGET.processingMs.max : d === 'climax' ? BUDGET.climaxMaxMs : 0)
      );
    }, 0);
    expect(wait).toBeLessThanOrEqual(6500);
    expect(BUDGET.processingMs.min).toBeGreaterThanOrEqual(400);
    expect(BUDGET.climaxMaxMs).toBeLessThanOrEqual(4000);
  });
});
