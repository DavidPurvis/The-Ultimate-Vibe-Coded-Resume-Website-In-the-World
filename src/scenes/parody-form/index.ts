/**
 * Parody forms: "submitting" reads nothing, stores nothing, sends nothing. It shows a receipt and
 * clears every field. That is the entire back end.
 */
import { announce } from '../../lib/announce';
import { reducedMotion } from '../../lib/motion';

function clear(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
    if (i.type === 'radio') i.checked = false;
    else if (i.type === 'range') i.value = i.defaultValue;
    else i.value = '';
  });
  root.querySelectorAll<HTMLSelectElement>('select').forEach((s) => (s.selectedIndex = 0));
}

document.querySelectorAll<HTMLElement>('[data-parody-form]').forEach((root) => {
  const submit = root.querySelector<HTMLButtonElement>('[data-pf-submit]');
  const again = root.querySelector<HTMLButtonElement>('[data-pf-again]');
  const status = root.querySelector<HTMLElement>('[data-pf-status]');
  const receipt = root.querySelector<HTMLElement>('[data-pf-receipt]');
  const fields = root.querySelector<HTMLElement>('[data-pf-fields]');
  const raw = root.querySelector<HTMLElement>('[data-pf-copy]')?.dataset.pfCopy;
  const copy = raw ? (JSON.parse(raw) as { processing: string }) : { processing: '' };
  if (!submit || !receipt || !fields) return;

  submit.addEventListener('click', () => {
    submit.disabled = true;
    if (status) status.textContent = copy.processing;
    window.setTimeout(
      () => {
        clear(root);
        fields.hidden = true;
        submit.hidden = true;
        if (status) status.textContent = '';
        receipt.hidden = false;
        receipt.focus();
        announce(receipt.querySelector('.receipt__title')?.textContent ?? '');
      },
      reducedMotion() ? 0 : 900,
    );
  });

  again?.addEventListener('click', () => {
    receipt.hidden = true;
    fields.hidden = false;
    submit.hidden = false;
    submit.disabled = false;
    root.querySelector<HTMLElement>('input, select')?.focus();
  });
});
