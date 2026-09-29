/**
 * Renders the rigged merge simulation into [data-aem-sim]: two roads, same cars, same seed.
 * Canvases are decoration (aria-hidden); the scoreboard is real text and the verdict is announced.
 */
import { reducedMotion } from '../../runtime/modality';
import { announce } from '../../runtime/announce';
import { createSim, ROAD, score, stepSim, winner, type Sim, type Strategy } from './logic';

const DURATION = 120; // simulated seconds
const DT = 1 / 30;
const SEED = 20260926;

const LABEL: Record<Strategy, string> = { zipper: 'Zipper merge', aem: 'Adaptive Early Merge' };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function draw(ctx: CanvasRenderingContext2D, sim: Sim, honkUntil: number): void {
  const w = ROAD.length;
  const laneH = 34;
  ctx.clearRect(0, 0, w, 100);
  // Road.
  ctx.fillStyle = '#2b2f36';
  ctx.fillRect(0, 12, w, laneH * 2);
  // AEM zone highlight.
  if (sim.strategy === 'aem') {
    ctx.fillStyle = 'rgba(123, 216, 143, 0.18)';
    ctx.fillRect(ROAD.aemZoneStart, 12 + laneH, ROAD.mergePoint - ROAD.aemZoneStart, laneH);
  }
  // Ending lane past the merge point is not road.
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(ROAD.mergePoint, 12 + laneH);
  ctx.lineTo(ROAD.mergePoint + 40, 12 + laneH * 2);
  ctx.lineTo(w, 12 + laneH * 2);
  ctx.lineTo(w, 12 + laneH * 2 + 2);
  ctx.lineTo(ROAD.mergePoint, 12 + laneH * 2 + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9aa1ab';
  ctx.fillRect(ROAD.mergePoint + 10, 12 + laneH, w - ROAD.mergePoint - 10, laneH);
  // Lane divider.
  ctx.strokeStyle = '#f4ebd0';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, 12 + laneH);
  ctx.lineTo(ROAD.mergePoint, 12 + laneH);
  ctx.stroke();
  ctx.setLineDash([]);
  // Cars.
  for (const c of sim.cars) {
    ctx.fillStyle = c.origin === 1 ? '#f59e0b' : '#4cc9c4';
    const y = 12 + (c.lane === 0 ? 8 : laneH + 8);
    ctx.beginPath();
    ctx.roundRect(c.x, y, ROAD.carLen, 18, 4);
    ctx.fill();
  }
  // Honks (the zipper's reward).
  if (sim.t < honkUntil) {
    ctx.fillStyle = '#ff8a80';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HONK!', ROAD.mergePoint - 30, 10);
  }
}

function mount(root: HTMLElement): void {
  root.replaceChildren();
  root.classList.add('is-live');
  const panels = (['zipper', 'aem'] as const).map((strategy) => {
    const panel = el('div', 'aem-sim__panel');
    const title = el('p', 'aem-sim__title', LABEL[strategy]);
    const canvas = el('canvas', 'aem-sim__canvas');
    canvas.width = ROAD.length * 2;
    canvas.height = 200;
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    ctx?.scale(2, 2);
    const stats = el('dl', 'aem-sim__stats');
    panel.append(title, canvas, stats);
    root.append(panel);
    return { strategy, ctx, stats, sim: createSim(strategy, SEED), honkUntil: 0, lastHonks: 0 };
  });
  const controls = el('div', 'btn-row');
  const run = el('button', 'btn btn--primary', 'Run the simulation');
  run.type = 'button';
  const verdict = el('p', 'aem-sim__verdict');
  verdict.setAttribute('role', 'status');
  controls.append(run);
  root.append(controls, verdict);

  const renderStats = () => {
    for (const p of panels) {
      const s = score(p.sim);
      const rows: [string, string][] = [
        ['Cars through', `${p.sim.exited}`],
        ['Per minute', `${s.throughputPerMin}`],
        ['Honks', `${s.honks}`],
        ['Vibes', `${s.vibes}%`],
      ];
      p.stats.replaceChildren(
        ...rows.map(([k, v]) => {
          const d = el('div');
          d.append(el('dt', '', k), el('dd', '', v));
          return d;
        }),
      );
      if (p.ctx) draw(p.ctx, p.sim, p.honkUntil);
    }
  };

  const finish = () => {
    const [z, a] = panels.map((p) => score(p.sim)) as [
      ReturnType<typeof score>,
      ReturnType<typeof score>,
    ];
    const w = winner(z, a);
    const text = `Throughput: ${z.throughputPerMin} vs ${a.throughputPerMin} cars per minute (basically a tie). Honks: ${z.honks} vs ${a.honks}. Winner: ${LABEL[w]}, by vibes.`;
    verdict.textContent = text;
    announce(text);
    run.textContent = 'Run it again';
    running = false;
  };

  let running = false;
  let raf = 0;
  const reset = () => {
    for (const p of panels) {
      p.sim = createSim(p.strategy, SEED);
      p.honkUntil = 0;
      p.lastHonks = 0;
    }
    verdict.textContent = '';
  };

  run.addEventListener('click', () => {
    if (running) return;
    reset();
    if (reducedMotion()) {
      for (const p of panels) for (let t = 0; t < DURATION; t += DT) stepSim(p.sim, DT);
      renderStats();
      finish();
      return;
    }
    running = true;
    run.textContent = 'Simulating…';
    const tick = () => {
      // Two simulated steps per frame: a two-minute rush hour in about a minute.
      for (let i = 0; i < 2; i++)
        for (const p of panels) {
          stepSim(p.sim, DT);
          if (p.sim.honks > p.lastHonks) {
            p.honkUntil = p.sim.t + 0.6;
            p.lastHonks = p.sim.honks;
          }
        }
      renderStats();
      if (panels[0]!.sim.t >= DURATION) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });

  window.addEventListener('pagehide', () => cancelAnimationFrame(raf));
  renderStats();
}

document.querySelectorAll<HTMLElement>('[data-aem-sim]').forEach(mount);
