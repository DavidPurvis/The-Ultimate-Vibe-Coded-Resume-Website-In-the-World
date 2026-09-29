/**
 * Evasive controls, politely: mouse-only, fine pointer, motion allowed, standard mode, bounded
 * budget, then surrender. Keyboard never triggers movement; touch gets an ordinary control;
 * reduced motion gets text-only escalation.
 */
import type { Scope } from '../runtime/lifecycle';
import { finePointer, reducedMotion } from '../runtime/modality';
import { isChaos } from './mode';
import { readSession, writeSession } from './storage';
import { center, dist, nextPosition, shouldDodge, type Rect } from '../scenes/runaway/logic';

export interface RunawayOpts {
  id: string;
  el: HTMLElement;
  arena: HTMLElement;
  mode: 'proximity' | 'enter';
  maxDodges: number;
  radius?: number;
  distance?: number;
  labels?: readonly string[];
  cooldownMs?: number;
  /** Only dodge within this many ms after mount (e.g. the 2-second "Skip (fast)"). */
  timeWindowMs?: number;
  finalLabel?: string;
  onDodge?(n: number): void;
  onSurrender?(): void;
}

const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

function setLabel(el: HTMLElement, text: string): void {
  const slot = el.querySelector<HTMLElement>('[data-label]');
  if (slot) slot.textContent = text;
  else el.textContent = text;
}

export function runaway(o: RunawayOpts, d: Scope): { surrendered(): boolean; reset(): void } {
  const radius = o.radius ?? 90;
  const distance = o.distance ?? 140;
  const cooldown = o.cooldownMs ?? 250;
  const mountedAt = performance.now();
  let dodges = readSession().dodges[o.id] ?? 0;
  let tx = 0;
  let ty = 0;
  let wasIn = false;
  let lastAt = -Infinity;

  const done = () => dodges >= o.maxDodges;
  const persist = () => writeSession({ dodges: { ...readSession().dodges, [o.id]: dodges } });
  const applyLabel = () => {
    const label = done()
      ? (o.finalLabel ?? o.labels?.[o.labels.length - 1])
      : o.labels?.[dodges - 1];
    if (label && dodges > 0) setLabel(o.el, label);
  };
  applyLabel();

  o.el.classList.add('runaway');
  d.add(() => {
    o.el.classList.remove('runaway');
    o.el.style.transform = '';
  });

  const eligible = () =>
    !done() &&
    isChaos() &&
    finePointer() &&
    (o.timeWindowMs === undefined || performance.now() - mountedAt < o.timeWindowMs);

  const escalateText = () => {
    dodges += 1;
    persist();
    applyLabel();
    o.onDodge?.(dodges);
    if (done()) o.onSurrender?.();
  };

  const dodge = (px: number, py: number) => {
    if (reducedMotion()) {
      escalateText();
      return;
    }
    const r = toRect(o.el.getBoundingClientRect());
    const natural = { x: r.x - tx, y: r.y - ty };
    const target = nextPosition(
      r,
      { x: px, y: py },
      toRect(o.arena.getBoundingClientRect()),
      distance,
      radius,
    );
    tx = target.x - natural.x;
    ty = target.y - natural.y;
    o.el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
    lastAt = performance.now();
    escalateText();
  };

  if (o.mode === 'enter') {
    d.on(o.el, 'pointerenter', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType !== 'mouse' || !eligible()) return;
      dodge(pe.clientX, pe.clientY);
    });
  } else {
    d.on(o.arena, 'pointermove', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType !== 'mouse') return;
      const inZone =
        dist(center(toRect(o.el.getBoundingClientRect())), { x: pe.clientX, y: pe.clientY }) <
        radius;
      if (eligible() && shouldDodge(wasIn, inZone, lastAt, performance.now(), cooldown)) {
        dodge(pe.clientX, pe.clientY);
        wasIn = false; // after moving away, the next entry is a new approach
        return;
      }
      wasIn = inZone;
    });
    d.on(o.arena, 'pointerleave', () => {
      wasIn = false;
    });
  }

  // Keep the control reachable when the layout changes.
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      const a = o.arena.getBoundingClientRect();
      const r = o.el.getBoundingClientRect();
      if (r.left < a.left || r.top < a.top || r.right > a.right || r.bottom > a.bottom) {
        tx = 0;
        ty = 0;
        o.el.style.transform = '';
      }
    });
    ro.observe(o.arena);
    d.observe(ro);
  }

  return {
    surrendered: done,
    reset: () => {
      tx = 0;
      ty = 0;
      o.el.style.transform = '';
    },
  };
}
