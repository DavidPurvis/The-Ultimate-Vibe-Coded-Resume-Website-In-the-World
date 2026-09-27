/** Approved in principle: relief, with real résumé content (the chosen cut's summary and highlights). */
import { preview as C } from '../content/institution/preview';
import { experienceLines, summaryLine } from '../content/resume/lines';
import { button, h } from './dom';
import type { StepContext } from './types';

export function mount(ctx: StepContext): void {
  const { root, scope } = ctx;
  const s = ctx.state();
  const lane = s.lane && s.lane !== 'unspecified' ? s.lane : 'gen';
  const summary = summaryLine(lane);
  ctx.setHeading(C.heading);
  const highlights = experienceLines(lane).slice(0, 3);
  const extract = h(
    'div',
    { class: 'case-extract', 'data-evidence': 'resume' },
    h('p', { class: 'case__label' }, C.extract),
    summary ? h('p', {}, summary) : null,
    h('ul', {}, ...highlights.map((b) => h('li', {}, b))),
  );
  const more = button(scope, C.request, () =>
    ctx.dispatch({ t: 'RESUME_REQUESTED', via: 'full-document' }),
  );
  more.classList.add('btn--primary');
  root.replaceChildren(h('p', {}, C.body), extract, h('div', { class: 'btn-row' }, more));
}
