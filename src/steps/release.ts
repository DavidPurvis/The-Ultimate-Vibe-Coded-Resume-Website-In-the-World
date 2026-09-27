/**
 * Behavioral review: the release control resists twice, then works. The reducer decides that (the
 * same three activations for everyone); this renderer only picks how the resistance *looks*:
 *
 *   mouse, fine pointer, motion allowed → it slides away from the pointer on approach
 *   touch or pen                        → it moves to its next fixed slot, always fully on screen
 *   keyboard, or reduced motion         → it stays put; the request is reassigned in words
 *
 * Nothing about the input is recorded. Focus never moves while the control resists.
 */
import { release as C } from '../content/institution/release';
import { releaseSlots } from '../domain/assessment';
import { BUDGET } from '../domain/steps';
import { inputOf, type Input } from '../runtime/modality';
import { button, h } from './dom';
import { nextPosition, type Rect } from './release-geometry';
import type { StepContext } from './types';

const DODGE_DISTANCE = 140;
const DODGE_RADIUS = 90;

const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

export function mount(ctx: StepContext): void {
  const { root, scope, modality } = ctx;
  ctx.setHeading(C.heading);

  const order = releaseSlots(ctx.state().seed);
  let visit = 0;
  let tx = 0;
  let ty = 0;

  const labelFor = (resisted: number) =>
    resisted === 0 ? C.label : (C.labels[resisted - 1] ?? C.label);
  const note = h('p', { class: 'release-status', id: 'release-status' });
  const arena = h('div', {
    class: 'release-arena',
    role: 'group',
    'aria-label': C.desk,
    'data-slot': String(order[0]),
  });
  const control = button(scope, labelFor(ctx.state().resisted), (e) => attempt(inputOf(e), e), {
    'aria-describedby': 'release-status',
    'data-release': true,
  });
  control.classList.add('btn--primary', 'release-btn');
  arena.append(control);

  const settle = () => {
    tx = 0;
    ty = 0;
    control.style.transform = '';
    visit = 0;
    arena.dataset.slot = String(order[0]);
  };

  const dodgeFrom = (x: number, y: number) => {
    const r = toRect(control.getBoundingClientRect());
    const natural = { x: r.x - tx, y: r.y - ty };
    const to = nextPosition(
      r,
      { x, y },
      toRect(arena.getBoundingClientRect()),
      DODGE_DISTANCE,
      DODGE_RADIUS,
    );
    tx = to.x - natural.x;
    ty = to.y - natural.y;
    control.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
  };

  const perform = (input: Input, resisted: number, e: Event) => {
    control.textContent = labelFor(resisted);
    const line = C.reassigned(resisted + 1);
    note.textContent = line;
    ctx.announce(line);
    if (modality.reducedMotion() || input === 'keyboard') return;
    if (input === 'mouse' && modality.finePointer()) {
      const pe = e as MouseEvent;
      dodgeFrom(pe.clientX, pe.clientY);
    } else {
      visit = Math.min(visit + 1, order.length - 1);
      arena.dataset.slot = String(order[visit]);
    }
  };

  const attempt = (input: Input, e: Event) => {
    const before = ctx.state().resisted;
    ctx.dispatch({ t: 'RELEASE_ATTEMPTED' });
    if (scope.disposed) return; // released: the kernel has moved on
    const after = ctx.state().resisted;
    if (after > before) perform(input, after, e);
  };

  // The approach itself counts as an attempt, but only for a mouse that can see the control move.
  scope.on(control, 'pointerenter', (e) => {
    const pe = e as PointerEvent;
    if (pe.pointerType !== 'mouse' || !modality.finePointer() || modality.reducedMotion()) return;
    if (ctx.state().resisted >= BUDGET.maxResisted) return;
    attempt('mouse', pe);
  });

  // Motion switched off mid-review: the control goes home and stays there.
  modality.onChange(scope, () => {
    if (modality.reducedMotion()) settle();
  });
  // A layout change can leave a displaced control outside its desk: bring it back.
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      if (tx || ty) settle();
    });
    ro.observe(arena);
    scope.observe(ro);
  }

  const resisted = ctx.state().resisted;
  if (resisted > 0) note.textContent = C.reassigned(resisted + 1);
  root.replaceChildren(h('p', {}, C.body), arena, note);
}
