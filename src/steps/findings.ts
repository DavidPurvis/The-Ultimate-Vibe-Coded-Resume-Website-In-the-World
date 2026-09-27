/** Preliminary determination: the risk score, the evidence on file, and what was never sent. */
import { findingLines } from '../content/institution/case';
import { findingsCopy as C, primaryLabel } from '../content/institution/findings';
import { credentials } from '../content/institution/credentials';
import { riskScore } from '../domain/assessment';
import { selectCallbacks } from '../domain/findings';
import { privacySignal } from '../runtime/signals';
import { button, h, nodes } from './dom';
import type { StepContext } from './types';

export async function mount(ctx: StepContext): Promise<void> {
  const { root, scope } = ctx;
  ctx.setHeading(C.heading);
  root.replaceChildren(h('p', { class: 'case__processing' }, C.processing));
  await ctx.processing();

  const s = ctx.state();
  const risk = riskScore(s);
  const evidence = selectCallbacks(s, 'findings');
  const list = h('dl', { class: 'evidence' });
  list.append(
    h('dt', {}, C.risk(risk.value)),
    h('dd', {}, risk.primary ? `${C.primary}: ${primaryLabel[risk.primary]}` : C.none),
  );
  if (evidence.length) {
    list.append(
      h('dt', {}, C.evidence),
      ...evidence.map((id) => h('dd', {}, findingLines[id].findings(s.findings[id]?.count ?? 0))),
    );
  }
  const telemetry = h(
    'div',
    { class: 'telemetry' },
    h('p', { class: 'case__label' }, C.telemetryHeading),
    h('ul', {}, ...C.telemetry(s.index).map((line) => h('li', {}, line))),
  );
  const proceed = button(scope, C.proceed, () =>
    ctx.dispatch({ t: 'STEP_COMPLETED', step: 'findings' }),
  );
  proceed.classList.add('btn--primary');
  root.replaceChildren(
    ...nodes(
      h('p', {}, C.body),
      list,
      h('p', {}, C.credential(credentials.goldfish.title)),
      privacySignal() ? h('p', { class: 'fine' }, C.gpc) : null,
      telemetry,
      h('div', { class: 'btn-row' }, proceed),
    ),
  );
}
