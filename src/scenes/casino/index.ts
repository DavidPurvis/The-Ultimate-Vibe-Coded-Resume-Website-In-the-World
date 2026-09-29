/**
 * Link Roulette. Pick a destination, place a chip, watch a decision that was already made:
 * outcome → wedge → angle (see logic.ts). The attempt is persisted before the wheel moves, the
 * Spin button locks until the result lands, and the third spin always pays.
 */
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { readPrefs, readSession, writePrefs, writeSession } from '../../lib/storage';
import { reducedMotion } from '../../runtime/modality';
import { announce } from '../../runtime/announce';
import { bump } from '../../lib/threat';
import { makeRng } from '../../lib/rng';
import { sample } from '../../lib/testHooks';
import { DEST, isDestId, type DestId } from '../../lib/destinations';
import { casinoCopy as C, WEDGES } from '../../content/copy/casino';
import { openRickroll } from '../rickroll';
import {
  chooseOutcome,
  pickWedge,
  targetRotation,
  wedgeAt,
  WEDGE_DEG,
  type Outcome,
} from './logic';

const table = document.querySelector<HTMLElement>('[data-casino]');
const wheel = document.querySelector<HTMLElement>('[data-wheel]');
const rotor = document.querySelector<SVGSVGElement>('[data-rotor]');
const spinBtn = document.querySelector<HTMLButtonElement>('[data-spin]');
const spinLabel = document.querySelector<HTMLElement>('[data-spin-label]');
const status = document.querySelector<HTMLElement>('[data-casino-status]');
const attempting = document.querySelector<HTMLElement>('[data-attempting]');
const result = document.querySelector<HTMLElement>('[data-casino-result]');
const readout = document.querySelector<HTMLElement>('[data-debug-readout]');
const tombTpl = document.querySelector<HTMLTemplateElement>('[data-tomb-template]');
const soundBtn = document.querySelector<HTMLButtonElement>('[data-sound]');
const cards = [...document.querySelectorAll<HTMLButtonElement>('[data-pick]')];

const rng = makeRng();
let dest: DestId | null = null;
let rotation = 0;
let spinning = false;
let pending: { outcome: Outcome; wedge: number; target: number; dest: DestId } | null = null;
let audio: AudioContext | null = null;

const mod360 = (r: number) => ((r % 360) + 360) % 360;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

function setLocked(locked: boolean): void {
  for (const c of cards) c.setAttribute('aria-disabled', String(locked));
  spinBtn?.setAttribute('aria-disabled', String(locked || !dest));
}

function attemptsFor(id: DestId): number {
  return readSession().casino[id] ?? 0;
}

function select(id: DestId): void {
  if (spinning) return;
  dest = id;
  for (const c of cards) c.setAttribute('aria-pressed', String(c.dataset.pick === id));
  if (attempting) attempting.textContent = C.attempting(DEST[id].label, DEST[id].display);
  if (spinLabel) spinLabel.textContent = attemptsFor(id) > 0 ? C.spinAgain : C.spin;
  if (result) {
    result.hidden = true;
    result.replaceChildren();
  }
  setLocked(false);
}

/* ---------- optional tick sound (off by default; WebAudio only after a click) ---------- */
function blip(): void {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'square';
  osc.frequency.value = 880;
  gain.gain.value = 0.03;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.012);
}

function currentAngle(): number {
  if (!rotor) return 0;
  const m = getComputedStyle(rotor).transform;
  const v = /matrix\(([^)]+)\)/.exec(m)?.[1]?.split(',').map(Number);
  if (!v || v.length < 2) return 0;
  return (Math.atan2(v[1] ?? 0, v[0] ?? 1) * 180) / Math.PI;
}

function syncSound(): void {
  const on = readPrefs().sound;
  soundBtn?.setAttribute('aria-pressed', String(on));
  const label = soundBtn?.querySelector<HTMLElement>('[data-sound-label]');
  if (label) label.textContent = on ? C.sound.on : C.sound.off;
  soundBtn?.querySelectorAll<HTMLElement>('[data-sound-icon]').forEach((i) => {
    i.hidden = (i.dataset.soundIcon === 'on') !== on;
  });
}

/* ---------- the spin (a major scene: Direct access or navigation cancels it) ---------- */
register({
  id: 'casino-spin',
  major: true,
  async start(ctx: SceneCtx) {
    const p = pending;
    if (!p || !rotor) return;
    const reduce = reducedMotion();
    const anim = rotor.animate(
      [{ transform: `rotate(${rotation}deg)` }, { transform: `rotate(${p.target}deg)` }],
      {
        duration: reduce ? 400 : 4200,
        easing: reduce ? 'linear' : 'cubic-bezier(.12,.8,.12,1)',
        fill: 'forwards',
      },
    );
    ctx.d.add(() => anim.cancel());
    if (readPrefs().sound && audio) {
      let sector = Math.floor(mod360(currentAngle()) / WEDGE_DEG);
      ctx.d.raf(() => {
        const s = Math.floor(mod360(currentAngle()) / WEDGE_DEG);
        if (s !== sector) blip();
        sector = s;
        return true;
      });
    }
    try {
      await anim.finished;
    } catch {
      return; // cancelled by dispose
    }
    if (!ctx.stillActive()) return;
    rotation = p.target;
    rotor.style.transform = `rotate(${rotation}deg)`;
    stop('casino-spin', 'complete');
    land(p);
  },
  dispose(reason) {
    if (reason === 'complete') return;
    // Interrupted (mode switch, navigation): the wheel snaps back, the chip stays spent.
    spinning = false;
    pending = null;
    if (status) status.textContent = '';
    setLocked(false);
  },
});

function spin(): void {
  if (spinning) return;
  if (!dest) {
    if (status) status.textContent = C.picker;
    return;
  }
  spinning = true;
  setLocked(true);
  if (result) {
    result.hidden = true;
    result.replaceChildren();
  }

  const s = readSession();
  const attempt = (s.casino[dest] ?? 0) + 1;
  writeSession({ casino: { ...s.casino, [dest]: attempt } }); // persisted before the wheel moves
  bump('spin');

  const outcome = chooseOutcome(attempt, sample(rng));
  const wedge = pickWedge(outcome, rng());
  const turns = reducedMotion() ? 1 : 5 + Math.floor(rng() * 3);
  pending = { outcome, wedge, target: targetRotation(rotation, wedge, turns, rng()), dest };

  if (status)
    status.textContent = [
      C.attempt(attempt, DEST[dest].label),
      attempt === 1 ? C.accepted : '',
      C.spinning,
    ]
      .filter(Boolean)
      .join(' ');

  if (readPrefs().sound && !audio) {
    try {
      audio = new AudioContext();
    } catch {
      audio = null;
    }
  }
  void start('casino-spin').then((ok) => {
    if (!ok) {
      spinning = false;
      pending = null;
      setLocked(false);
    }
  });
}

function land(p: NonNullable<typeof pending>): void {
  spinning = false;
  pending = null;
  const landed = wedgeAt(rotation);
  if (landed !== p.wedge)
    console.error(`Wheel pointer shows wedge ${landed}; the house chose ${p.wedge}.`);
  if (wheel) {
    wheel.dataset.wedge = String(landed);
    wheel.dataset.outcome = p.outcome;
  }
  if (readout && !readout.hidden)
    readout.textContent = `rotation ${rotation.toFixed(1)}° · pointer on #${landed} (${WEDGES[landed]}) · house chose #${p.wedge} (${p.outcome})`;
  if (status) status.textContent = '';
  if (spinLabel) spinLabel.textContent = C.spinAgain;
  setLocked(false);
  announce(C.resultAnnounce(p.outcome));
  renderResult(p.outcome, p.dest);
}

function realLink(id: DestId): HTMLAnchorElement {
  const d = DEST[id];
  const a = el('a', {
    className: 'btn btn--casino',
    href: d.href,
    textContent: `${C.outcomes.HYPERLINK.button(d.label)}${d.external ? ' ↗' : ''}`,
  });
  if (d.external) a.rel = 'noopener noreferrer';
  a.dataset.realLink = id;
  return a;
}

function renderResult(outcome: Outcome, id: DestId): void {
  if (!result) return;
  const badge = el('p', { className: 'result__badge', textContent: `RESULT: ${outcome}` });
  const after = el('p', { className: 'result__after' });
  after.setAttribute('aria-live', 'polite');
  const row = el('div', { className: 'btn-row' });
  const again = () =>
    el('button', {
      type: 'button',
      className: 'btn btn--ghost',
      textContent: C.spinAgain,
      onclick: spin,
    });
  let title = '';

  if (outcome === 'RICKROLL') {
    title = C.outcomes.RICKROLL.title;
    const go = el('button', {
      type: 'button',
      className: 'btn btn--casino',
      textContent: C.outcomes.RICKROLL.button,
    });
    go.addEventListener('click', () =>
      openRickroll({
        opener: go,
        onClose: () => {
          after.textContent = C.outcomes.RICKROLL.after;
        },
      }),
    );
    row.append(go, again());
    result.replaceChildren(
      badge,
      el('p', { className: 'result__title', textContent: title }),
      row,
      after,
    );
  } else if (outcome === 'RIP') {
    title = C.outcomes.RIP.title;
    const tomb = tombTpl?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    const path = tomb?.querySelector<HTMLElement>('[data-tomb-path]');
    if (path) path.textContent = C.outcomes.RIP.engraving(DEST[id].tombstonePath);
    const f = el('button', {
      type: 'button',
      className: 'btn btn--casino',
      textContent: C.outcomes.RIP.button,
    });
    let paid = false;
    const payRespects = () => {
      if (paid) return;
      paid = true;
      f.hidden = true;
      after.textContent = C.outcomes.RIP.after;
      const link = realLink(id);
      row.prepend(link);
      link.focus();
    };
    f.addEventListener('click', payRespects);
    result.onkeydown = (e) => {
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) payRespects();
    };
    row.append(f, again());
    result.replaceChildren(
      badge,
      ...(tomb ? [tomb] : []),
      el('p', { className: 'result__title', textContent: title }),
      row,
      after,
    );
  } else if (outcome === 'HYPERLINK') {
    title = C.outcomes.HYPERLINK.title;
    row.append(realLink(id));
    result.replaceChildren(badge, el('p', { className: 'result__title', textContent: title }), row);
  } else {
    title = C.outcomes['DOUBLE OR NOTHING'].title;
    const b = again();
    b.className = 'btn btn--casino';
    row.append(b);
    result.replaceChildren(badge, el('p', { className: 'result__title', textContent: title }), row);
  }
  if (outcome !== 'RIP') result.onkeydown = null;
  result.hidden = false;
  result.focus();
}

/* ---------- wiring ---------- */
if (table && rotor) {
  const params = new URLSearchParams(location.search);
  if (params.get('debug') === 'wedges') {
    wheel?.classList.add('wheel--debug');
    if (readout) readout.hidden = false;
  }
  for (const c of cards) {
    c.addEventListener('click', () => {
      if (c.getAttribute('aria-disabled') === 'true') return;
      const id = c.dataset.pick;
      if (isDestId(id)) select(id);
    });
  }
  spinBtn?.addEventListener('click', () => {
    if (spinBtn.getAttribute('aria-disabled') === 'true' && dest) return;
    spin();
  });
  soundBtn?.addEventListener('click', () => {
    writePrefs({ sound: !readPrefs().sound });
    syncSound();
  });
  syncSound();
  const q = params.get('dest');
  if (isDestId(q)) select(q);
}
