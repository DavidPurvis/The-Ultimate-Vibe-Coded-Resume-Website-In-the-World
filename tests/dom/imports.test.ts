// @vitest-environment happy-dom
/**
 * No module-scope side effects: importing any runtime, step or domain module adds no listeners,
 * timers or DOM. Only the page entry scripts (src/scripts/*.ts) may start anything.
 */
import { readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const modules = ['src/runtime', 'src/steps', 'src/domain'].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `../../${dir}/${f}`),
);

describe('module side effects', () => {
  it('importing every runtime, step and domain module starts nothing', async () => {
    vi.useFakeTimers();
    const listen = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const before = document.body.innerHTML;
    for (const m of modules) await import(/* @vite-ignore */ m);
    expect(listen).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(document.body.innerHTML).toBe(before);
    listen.mockRestore();
    vi.useRealTimers();
    expect(modules.length).toBeGreaterThan(15);
  });
});
