/** /resume/ — the only JS on the reward page: print, the Hire chain, and "re-enable chaos". */
import { initMode, setMode } from '../lib/mode';
import { closeDialog, focusIn, openDialog } from '../lib/dialog';
import { announce } from '../lib/announce';
import { trackModality } from '../lib/motion';

trackModality();
initMode();

document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

document.querySelector('[data-reenable-chaos]')?.addEventListener('click', () => {
  setMode('chaos');
});

const dialog = document.getElementById('hire') as HTMLDialogElement | null;
const copyEl = document.querySelector<HTMLElement>('[data-hire-copy]');
if (dialog && copyEl) {
  const copy = JSON.parse(copyEl.dataset.hireCopy ?? '{}') as {
    steps: string[];
    final: string;
    consulting: string;
    declined: string;
  };
  const title = dialog.querySelector<HTMLElement>('h2');
  const steps = [...dialog.querySelectorAll<HTMLElement>('.hire-step')];

  const show = (key: string, heading: string) => {
    for (const s of steps) s.hidden = s.dataset.step !== key;
    if (title) title.textContent = heading;
    focusIn(dialog, title);
    announce(heading);
  };

  const go = (i: number) => show(String(i), copy.steps[i] ?? '');

  dialog.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    const step = btn?.closest<HTMLElement>('.hire-step');
    if (!btn || !step) return;
    const i = Number(step.dataset.step);
    if (Number.isNaN(i)) return;
    if (btn.hasAttribute('data-yes') || (i === 2 && btn.hasAttribute('data-no'))) {
      if (i === 2 && btn.hasAttribute('data-no')) {
        // "No, I'm a professional" — the Department consults Claude on your behalf.
        announce(copy.consulting);
      }
      if (i + 1 < copy.steps.length) go(i + 1);
      else show('final', copy.final);
    } else if (btn.hasAttribute('data-no')) {
      show('declined', copy.declined);
    }
  });

  document.querySelector('[data-hire]')?.addEventListener('click', (e) => {
    openDialog(dialog, { opener: e.currentTarget as HTMLElement });
    go(0);
  });

  dialog.querySelector('[data-hire-mail]')?.addEventListener('click', () => {
    setTimeout(() => closeDialog(dialog), 50);
  });
}
