/** 404: "Go home (fast)" runs from the mouse three times, then gives up. The other two links never move. */
import { runaway } from '../../lib/runaway';
import { Disposer } from '../../lib/scene';
import { isChaos, onModeChange } from '../../lib/mode';
import { bump } from '../../lib/threat';
import { notFoundCopy as N } from '../../content/copy/errors';

const el = document.querySelector<HTMLElement>('[data-nf-fast]');
const arena = document.querySelector<HTMLElement>('[data-nf-arena]');
let d: Disposer | null = null;

function mount(): void {
  d?.run();
  d = new Disposer();
  if (!el || !arena || !isChaos()) return;
  runaway(
    {
      id: 'not-found',
      el,
      arena,
      mode: 'proximity',
      maxDodges: 3,
      radius: 80,
      distance: 120,
      labels: N.fastLabels,
      onDodge: () => bump('dodge'),
    },
    d,
  );
}

mount();
onModeChange(mount);
window.addEventListener('pagehide', () => d?.run());
