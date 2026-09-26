/**
 * Gravity collapse: the cause cards fall (matter-js, lazy-loaded) while the DOM never moves —
 * only CSS transforms change — so Rebuild restores the page exactly by clearing them.
 */
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { reducedMotion } from '../../lib/motion';
import { isChaos, onModeChange } from '../../lib/mode';
import { announce } from '../../lib/announce';
import { toast } from '../../lib/toast';
import { bump } from '../../lib/threat';

const trigger = document.querySelector<HTMLButtonElement>('[data-gravity-trigger]');
const rebuild = document.querySelector<HTMLButtonElement>('[data-gravity-rebuild]');
const note = document.querySelector<HTMLElement>('[data-gravity-note]');
const copy = JSON.parse(
  document.querySelector<HTMLElement>('[data-gravity-copy]')?.dataset.gravityCopy ?? '{}',
) as Record<string, string>;
const MAX_BODIES = 40;

function setLabel(t: string): void {
  const l = trigger?.querySelector('[data-label]');
  if (l) l.textContent = t;
}

register({
  id: 'gravity',
  major: true,
  async start(ctx: SceneCtx) {
    const { d } = ctx;
    // Only cards currently on screen become bodies (the floor is the bottom of the viewport).
    const cards = [...document.querySelectorAll<HTMLElement>('[data-gravity]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      })
      .slice(0, MAX_BODIES);
    if (!cards.length || !trigger || !rebuild) return;
    setLabel(copy.gravityPressing ?? '');
    let Matter: typeof import('matter-js');
    try {
      Matter = (await import('matter-js')).default as unknown as typeof import('matter-js');
    } catch {
      if (note) note.textContent = copy.gravityFailed ?? '';
      setLabel(copy.gravityButton ?? '');
      return;
    }
    if (!ctx.stillActive()) return; // switched to Recruiter Mode while loading

    const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
    const W = innerWidth;
    const H = innerHeight;
    const originals = cards.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
    });
    const bodies = originals.map((o) =>
      Bodies.rectangle(o.cx, o.cy, o.w, o.h, {
        restitution: 0.25,
        friction: 0.5,
        frictionAir: 0.01,
        chamfer: { radius: 10 },
      }),
    );
    const walls = [
      Bodies.rectangle(W / 2, H + 25, W * 3, 50, { isStatic: true }),
      Bodies.rectangle(-25, H / 2, 50, H * 4, { isStatic: true }),
      Bodies.rectangle(W + 25, H / 2, 50, H * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, [...bodies, ...walls]);
    // A little institutional instability.
    bodies.forEach((b, i) => {
      Body.setAngularVelocity(b, (i % 2 ? 1 : -1) * (0.01 + (i % 3) * 0.006));
      Body.setVelocity(b, { x: (i % 2 ? 1 : -1) * (1 + (i % 4)), y: -2 - (i % 3) });
    });

    const overlay = document.createElement('div');
    overlay.className = 'gravity-overlay';
    Object.assign(overlay.style, { position: 'fixed', inset: '0', zIndex: '60', cursor: 'grab' });
    document.body.append(overlay);
    const mouse = Mouse.create(overlay);
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Composite.add(engine.world, mc);

    document.documentElement.classList.add('gravity-lock');
    // matter-js 0.20 runners always step with a fixed delta (frame-rate independent).
    const runner = Runner.create({ delta: 1000 / 60 });
    Events.on(engine, 'afterUpdate', () => {
      bodies.forEach((b, i) => {
        const o = originals[i];
        if (!o) return;
        o.el.style.transform = `translate(${(b.position.x - o.cx).toFixed(1)}px, ${(b.position.y - o.cy).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`;
      });
    });
    Runner.run(runner, engine);

    rebuild.hidden = false;
    rebuild.focus({ preventScroll: true });
    setLabel(copy.gravityPressed ?? '');
    announce(copy.gravityAnnounce ?? '');
    bump('gravity');

    d.add(() => {
      Runner.stop(runner);
      Events.off(engine, 'afterUpdate');
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      overlay.remove();
      for (const o of originals) o.el.style.transform = '';
      document.documentElement.classList.remove('gravity-lock');
      rebuild.hidden = true;
      setLabel(copy.gravityButton ?? '');
    });
  },
});

trigger?.addEventListener('click', () => {
  if (reducedMotion()) {
    if (note) note.textContent = copy.gravityReduced ?? '';
    return;
  }
  void start('gravity');
});

rebuild?.addEventListener('click', () => {
  stop('gravity', 'complete');
  toast(copy.gravityRestored ?? '');
  trigger?.focus({ preventScroll: true });
});

onModeChange(() => {
  if (!isChaos()) stop('gravity', 'mode');
});

/* Kevin: the nomination form accepts nothing and always returns the same result. */
document.querySelector('[data-kevin]')?.addEventListener('click', () => {
  const out = document.querySelector<HTMLElement>('[data-kevin-result]');
  if (out) out.textContent = copy.kevinResult ?? '';
});
