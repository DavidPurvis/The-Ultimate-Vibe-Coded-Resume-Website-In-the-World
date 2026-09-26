/**
 * Test-only seams, compiled in only when PUBLIC_TEST_HOOKS=1 (e2e builds). The production build
 * never contains window.__uvcr (scan-dist asserts this).
 */
const queue: number[] = [];
let armAll = false;
let subwayIds: string[] = [];

/** Next random sample: a forced one from the e2e test if queued, else from the rng. */
export function sample(rng: () => number): number {
  return queue.length ? (queue.shift() as number) : rng();
}
export function forcedArmAll(): boolean {
  return armAll;
}
/** Stub gameplay IDs for e2e (production has none until David supplies real ones). */
export const testSubwayVideos = (): string[] => subwayIds;

export function installTestHooks(): void {
  if (import.meta.env.PUBLIC_TEST_HOOKS !== '1') return;
  (globalThis as unknown as { __uvcr: unknown }).__uvcr = {
    forceSample: (...xs: number[]) => queue.push(...xs),
    armAllPlayful: () => {
      armAll = true;
    },
    resetSession: () => sessionStorage.removeItem('uvcr:session'),
    subwayVideos: (...ids: string[]) => {
      subwayIds = ids;
    },
  };
}
