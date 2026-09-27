/** The first strange signal: a restrained notice that asks for nothing. */
import { notice as C } from '../content/institution/case';
import { button, h } from './dom';
import type { StepContext } from './types';

export function mount(ctx: StepContext): void {
  const { root, scope } = ctx;
  const aside = scope.node(
    h('aside', { class: 'notice', role: 'status', 'aria-label': 'Notice' }, h('p', {}, C.text)),
  );
  aside.append(button(scope, C.dismiss, () => ctx.dispatch({ t: 'NOTICE_DISMISSED' })));
  root.append(aside);
}
