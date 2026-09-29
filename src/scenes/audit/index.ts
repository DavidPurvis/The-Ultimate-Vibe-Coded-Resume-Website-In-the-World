/**
 * /about/: the committee finding and the stamps reveal their evidence on request (visible without
 * JavaScript); the appendix is recorded only when it is actually opened.
 */
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

// The committee finding: evidence on request (visible without JS).
const findingBtn = document.querySelector<HTMLButtonElement>('[data-finding-toggle]');
const findingPanel = document.getElementById('finding-evidence');
if (findingBtn && findingPanel) {
  findingPanel.hidden = true;
  findingBtn.setAttribute('aria-expanded', 'false');
  findingBtn.addEventListener('click', () => {
    const open = findingBtn.getAttribute('aria-expanded') !== 'true';
    findingBtn.setAttribute('aria-expanded', String(open));
    findingPanel.hidden = !open;
  });
}

document.querySelector<HTMLDetailsElement>('[data-appendix]')?.addEventListener('toggle', (e) => {
  const d = e.currentTarget as HTMLDetailsElement;
  if (d.open && !readSession().appendixOpened) {
    writeSession({ appendixOpened: true });
    bump('appendix');
  }
});
