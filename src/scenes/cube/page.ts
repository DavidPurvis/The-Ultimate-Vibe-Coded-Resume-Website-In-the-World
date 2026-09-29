/**
 * /cube/: loads three.js (a lazy chunk) only here, and only with JavaScript and WebGL. The drawing
 * stays until the first frame is ready; Direct access puts it back and stops rendering.
 */
import { register, start } from '../../lib/scene';
import { onModeChange } from '../../lib/mode';
import { reducedMotion } from '../../runtime/modality';
import { makeRng } from '../../lib/rng';
import { announce } from '../../runtime/announce';
import type { CubeHandle } from './scene';
import { webgl2 } from './support';

const stage = document.querySelector<HTMLElement>('[data-cube-stage]');
const canvas = stage?.querySelector<HTMLCanvasElement>('canvas');
const fallback = stage?.querySelector<HTMLElement>('[data-cube-fallback]');
const raw = document.querySelector<HTMLElement>('[data-cube-copy]')?.dataset.cubeCopy;

if (stage && canvas && fallback && raw) {
  const copy = JSON.parse(raw) as {
    summon: string;
    full: string;
    thud: string;
    calmThud: string;
    noWebgl: string;
    onFloor: string;
    max: number;
  };
  const heftBtn = document.querySelector<HTMLButtonElement>('[data-cube-heft]');
  const summonBtn = document.querySelector<HTMLButtonElement>('[data-cube-summon]');
  const clearBtn = document.querySelector<HTMLButtonElement>('[data-cube-clear]');
  const status = document.querySelector<HTMLElement>('[data-cube-status]');
  const count = document.querySelector<HTMLElement>('[data-cube-count]');
  const buttons = [heftBtn, summonBtn, clearBtn];
  const fmt = (n: number) => n.toLocaleString('en-US');
  const rng = makeRng();
  const calm = reducedMotion();
  let cube: CubeHandle | null = null;
  let total = 0;

  const sync = () => {
    if (summonBtn) {
      summonBtn.textContent =
        total >= copy.max
          ? copy.full
          : copy.summon.replace('{n}', fmt(total)).replace('{max}', fmt(copy.max));
      summonBtn.disabled = !cube || total >= copy.max;
    }
    if (heftBtn) heftBtn.disabled = !cube;
    if (clearBtn) clearBtn.disabled = !cube || total === 0;
    if (count) count.textContent = copy.onFloor.replace('{n}', fmt(total));
  };

  register({
    id: 'cube',
    major: false,
    start: async ({ d, stillActive }) => {
      if (!webgl2()) {
        if (status) status.textContent = copy.noWebgl;
        return;
      }
      const { mountCube } = await import('./scene');
      if (!stillActive()) return;
      cube = mountCube(canvas, {
        mode: 'full',
        calm,
        onReady: () => {
          canvas.hidden = false;
          fallback.hidden = true;
        },
      });
      if (!cube) {
        if (status) status.textContent = copy.noWebgl;
        return;
      }
      total = 0;
      sync();
      d.add(() => {
        cube?.dispose();
        cube = null;
        canvas.hidden = true;
        fallback.hidden = false;
        sync();
      });
    },
  });

  heftBtn?.addEventListener('click', () => {
    cube?.heft();
    announce(calm ? copy.calmThud : copy.thud);
  });
  summonBtn?.addEventListener('click', () => {
    if (!cube) return;
    total = cube.summon(1000, rng);
    sync();
  });
  clearBtn?.addEventListener('click', () => {
    cube?.clear();
    total = 0;
    sync();
    summonBtn?.focus();
  });

  for (const b of buttons) if (b) b.disabled = true;
  void start('cube');
  onModeChange((m) => {
    if (m === 'chaos') void start('cube');
  });
}
