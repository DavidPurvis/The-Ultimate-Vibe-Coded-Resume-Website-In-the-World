/** Approved in principle: relief, with real résumé content (the chosen cut's summary and highlights). */
import { preview as C } from '../content/institution/case';
import { LANES } from '../content/lanes';
import { button, h } from './dom';
import type { StepContext } from './types';

export function mount(ctx: StepContext): void {
  const { root, scope } = ctx;
  const s = ctx.state();
  const lane = LANES[s.lane && s.lane !== 'unspecified' ? s.lane : 'gen'];
  ctx.setHeading(C.heading);
  const highlights = lane.experience.flatMap((r) => r.bullets).slice(0, 3);
  const extract = h(
    'div',
    { class: 'case-extract', 'data-evidence': 'resume' },
    h('p', { class: 'case__label' }, C.extract),
    lane.summary ? h('p', {}, lane.summary.text) : null,
    h('ul', {}, ...highlights.map((b) => h('li', {}, b.text))),
  );
  const more = button(scope, C.request, () =>
    ctx.dispatch({ t: 'RESUME_REQUESTED', via: 'full-document' }),
  );
  more.classList.add('btn--primary');
  root.replaceChildren(h('p', {}, C.body), extract, h('div', { class: 'btn-row' }, more));
}
