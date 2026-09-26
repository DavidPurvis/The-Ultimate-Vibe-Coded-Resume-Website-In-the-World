/** Scope clarification: the request for the request. Any answer is accepted; none is not. */
import { panel } from '../content/institution/case';
import { scope as C } from '../content/institution/scope';
import type { LaneChoice } from '../domain/events';
import { button, h } from './dom';
import type { StepContext } from './types';

export async function mount(ctx: StepContext): Promise<void> {
  const { root, scope } = ctx;
  ctx.setHeading(C.heading);
  const received = h('p', { class: 'case__lead' }, panel.received(ctx.caseNumber));
  root.replaceChildren(received, h('p', { class: 'case__processing' }, C.processing));
  await ctx.processing();

  const error = h('p', { class: 'case__error', id: 'scope-error', hidden: true }, C.empty);
  const options = C.options.map((o) =>
    h(
      'label',
      { class: 'case-choice' },
      h('input', { type: 'radio', name: 'scope', value: o.value }),
      h('span', {}, o.label),
    ),
  );
  const fieldset = h(
    'fieldset',
    { class: 'case-fieldset', 'aria-describedby': 'scope-error' },
    h('legend', {}, C.legend),
    ...options,
  );
  const submit = button(scope, C.submit, () => {
    const picked = fieldset.querySelector<HTMLInputElement>('input[name="scope"]:checked');
    if (!picked) {
      error.hidden = false;
      ctx.announce(C.empty);
      fieldset.querySelector<HTMLInputElement>('input[name="scope"]')?.focus();
      return;
    }
    ctx.announce(C.accepted);
    ctx.dispatch({ t: 'SCOPE_STATED', lane: picked.value as LaneChoice });
  });
  submit.classList.add('btn--primary');
  root.replaceChildren(
    received,
    h('p', {}, C.body),
    fieldset,
    error,
    h('div', { class: 'btn-row' }, submit),
  );
}
