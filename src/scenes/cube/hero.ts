/**
 * Wishlist hero: the drawing becomes a slowly turning tungsten cube, but only once it scrolls into
 * view, with WebGL, in Chaos Mode, and without reduced motion. three.js loads then, not before.
 */
import { register, start } from '../../lib/scene';
import { onModeChange } from '../../lib/mode';
import { reducedMotion } from '../../lib/motion';

const hero = document.querySelector<HTMLElement>('[data-cube-hero]');
const canvas = hero?.querySelector<HTMLCanvasElement>('canvas');
const fallback = hero?.querySelector<HTMLElement>('[data-cube-fallback]');

if (hero && canvas && fallback && !reducedMotion()) {
  register({
    id: 'cube-hero',
    major: false,
    start: async ({ d, stillActive }) => {
      const { mountCube } = await import('./scene');
      if (!stillActive()) return;
      const cube = mountCube(canvas, {
        mode: 'hero',
        calm: false,
        onReady: () => {
          canvas.hidden = false;
          fallback.hidden = true;
        },
      });
      if (!cube) return;
      d.add(() => {
        cube.dispose();
        canvas.hidden = true;
        fallback.hidden = false;
      });
    },
  });
  let seen = false;
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    seen = true;
    void start('cube-hero');
  });
  io.observe(hero);
  onModeChange((m) => {
    if (m === 'chaos' && seen) void start('cube-hero');
  });
}
