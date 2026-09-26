/**
 * The climax: eleven services review one real bullet of the résumé. Rows resolve one by one within
 * the climax budget (≤ 3.5 s in total); "Skip ceremony" is always the first control. Under reduced
 * motion every row is already resolved, and the delay is zero. Screen readers hear the result once,
 * not eleven rows.
 */
import { ceremony as C, jurisdiction, services } from '../content/institution/ceremony';
import { LANES } from '../content/lanes';
import { ceremonyIndex, serviceRows, type ServiceRow } from '../domain/assessment';
import { isAbort } from '../runtime/lifecycle';
import { button, h } from './dom';
import type { StepContext } from './types';

export async function mount(ctx: StepContext): Promise<void> {
  const { root, scope, modality } = ctx;
  const s = ctx.state();
  ctx.setHeading(C.heading);

  const lane = LANES[s.lane && s.lane !== 'unspecified' ? s.lane : 'gen'];
  const bullets = lane.experience.flatMap((r) => r.bullets);
  const bullet = bullets[ceremonyIndex(s.seed, bullets.length)];
  const rows = serviceRows(s);
  const today = new Date().getDay();

  const verdictOf = (row: ServiceRow): string => {
    const svc = services[row.id];
    if (row.id === 'jurisdiction') return jurisdiction(today);
    return row.cites && svc.cited ? svc.cited : svc.verdict;
  };

  const skip = button(scope, C.skip, () => ctx.dispatch({ t: 'STEP_SKIPPED', step: 'ceremony' }));
  const cells = rows.map(() => ({
    verdict: h('td', {}, C.pending),
    time: h('td', { class: 'service-table__ms' }, '—'),
  }));
  const table = h(
    'table',
    { class: 'service-table' },
    h('caption', { class: 'sr-only' }, C.caption),
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { scope: 'col' }, C.columns.service),
        h('th', { scope: 'col' }, C.columns.verdict),
        h('th', { scope: 'col' }, C.columns.time),
      ),
    ),
    h(
      'tbody',
      {},
      ...rows.map((row, i) =>
        h(
          'tr',
          { 'data-service': row.id },
          h('th', { scope: 'row' }, services[row.id].name),
          cells[i]?.verdict ?? null,
          cells[i]?.time ?? null,
        ),
      ),
    ),
  );
  const motionNote = h('p', { class: 'fine', hidden: true }, C.motion);
  const outcome = h('div', { class: 'ceremony-outcome' });

  root.setAttribute('aria-busy', 'true');
  scope.add(() => root.removeAttribute('aria-busy'));
  root.replaceChildren(
    h('div', { class: 'btn-row' }, skip),
    h('p', {}, C.body),
    h(
      'div',
      { class: 'case-extract', 'data-evidence': 'resume' },
      h('p', { class: 'case__label' }, C.subject),
      bullet ? h('p', {}, bullet.text) : null,
    ),
    table,
    motionNote,
    outcome,
  );

  const resolve = (i: number) => {
    const row = rows[i];
    const cell = cells[i];
    if (!row || !cell) return;
    cell.verdict.textContent = verdictOf(row);
    cell.time.textContent = C.ms(row.latencyMs);
  };

  // Pacing lives in its own scope so a mid-review switch to reduced motion can cut it short.
  const pace = scope.child();
  let rushed = modality.reducedMotion();
  const rush = () => {
    rushed = true;
    motionNote.hidden = false;
    pace.dispose();
  };
  if (rushed) motionNote.hidden = false;
  modality.onChange(scope, () => {
    if (modality.reducedMotion() && !rushed) rush();
  });

  for (let i = 0; i < rows.length; i++) {
    if (!rushed) {
      try {
        await ctx.wait(rows[i]?.latencyMs ?? 0, pace);
      } catch (err) {
        if (!isAbort(err) || scope.disposed) throw err;
      }
    }
    if (scope.disposed) return;
    resolve(i);
  }
  pace.dispose();

  root.removeAttribute('aria-busy');
  const result = h('p', { class: 'case__lead', id: 'ceremony-result', tabindex: '-1' }, C.result);
  const next = button(scope, C.continue, () =>
    ctx.dispatch({ t: 'STEP_COMPLETED', step: 'ceremony' }),
  );
  next.classList.add('btn--primary');
  outcome.replaceChildren(result, h('div', { class: 'btn-row' }, next));
  ctx.announce(C.result);
  // Move focus to the result only if the visitor hasn't moved it since the step began.
  const active = document.activeElement;
  const heading = document.getElementById('case-heading');
  if (ctx.userInitiated && (!active || active === document.body || active === heading))
    result.focus();
}
