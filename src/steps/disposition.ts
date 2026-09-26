/** Case closed. The summary cites what actually happened; the link simply works. */
import { dispositionCopy as C, findingLines, laneLabels } from '../content/institution/case';
import { LANE_META } from '../content/laneIndex';
import { disposition } from '../domain/disposition';
import { url } from '../lib/paths';
import { h, nodes } from './dom';
import type { StepContext } from './types';

export function mount(ctx: StepContext): void {
  const d = disposition(ctx.state());
  if (!d) return;
  const lane = LANE_META[d.lane];
  ctx.setHeading(C.heading);
  const stamp = h('p', { class: 'stamp stamp--green case-stamp' }, C.stamp);
  const lines = [
    C.route[d.route],
    d.statedScope ? C.scope(laneLabels[d.statedScope]) : null,
    d.resistance.used ? C.resistance(d.resistance.used, d.resistance.permitted) : null,
    ...d.lines.map((l) => findingLines[l.finding].disposition(l.count)),
  ].filter((x): x is string => !!x);
  const open = h(
    'a',
    { class: 'btn btn--primary case-btn', href: url(lane.path), 'data-case-open': true },
    d.lane === 'gen' ? C.open : C.openFor(laneLabels[d.lane]),
  );
  const formats = h(
    'p',
    { class: 'fine' },
    `${C.formats}: `,
    h('a', { href: url(`/${lane.pdf}`) }, C.pdf),
    ' · ',
    h('a', { href: url('/resume.md') }, C.markdown),
  );
  ctx.root.replaceChildren(
    ...nodes(
      stamp,
      d.route === 'appeal-reconciled'
        ? h('p', { class: 'stamp stamp--ink case-stamp' }, C.stampAppeal)
        : null,
      h('p', { class: 'case__lead' }, C.summary),
      h('ul', { class: 'disposition' }, ...lines.map((l) => h('li', {}, l))),
      h('div', { class: 'btn-row' }, open),
      formats,
    ),
  );
  if (ctx.userInitiated) {
    ctx.announce(C.announce);
    open.focus();
  }
}
