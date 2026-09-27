/** Conditional approval: acknowledge, confirm, or appeal. Three screens at most. */
import { acknowledgment as C } from '../content/institution/acknowledgment';
import { button, h } from './dom';
import type { StepContext } from './types';

export function mount(ctx: StepContext): void {
  const { root, scope } = ctx;
  const render = () => {
    const ack = ctx.state().ack;
    const screen = C[ack];
    ctx.setHeading(screen.heading);
    const actions = h('div', { class: 'btn-row' });
    const yes = button(scope, screen.yes, () => ctx.dispatch({ t: 'ACKNOWLEDGED' }));
    yes.classList.add('btn--primary');
    actions.append(yes);
    if ('appeal' in screen)
      actions.append(button(scope, screen.appeal, () => ctx.dispatch({ t: 'APPEAL_REQUESTED' })));
    root.replaceChildren(h('p', {}, screen.body), actions);
  };
  render();
  ctx.subscribe((next, prev) => {
    if (next.ack === prev.ack) return;
    render();
    ctx.focusHeading();
    ctx.announce(C[next.ack].heading);
  });
}
