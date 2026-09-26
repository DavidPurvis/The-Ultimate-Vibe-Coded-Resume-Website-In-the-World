/** /about/ — stamps reveal evidence (progressive enhancement), skip receipt, appendix threat. */
import { readSession, writeSession } from '../../lib/storage';
import { bump } from '../../lib/threat';

// Evidence is visible without JS; with JS, stamps become the reveal control.
document.querySelectorAll<HTMLButtonElement>('[data-flag-toggle]').forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
  if (!panel) return;
  panel.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  });
});

if (new URLSearchParams(location.search).get('skipped') === '1') {
  const r = document.querySelector<HTMLElement>('[data-skipped-receipt]');
  if (r) r.hidden = false;
}

document.querySelector<HTMLDetailsElement>('[data-appendix]')?.addEventListener('toggle', (e) => {
  const d = e.currentTarget as HTMLDetailsElement;
  if (d.open && !readSession().appendixOpened) {
    writeSession({ appendixOpened: true });
    bump('appendix');
  }
});
