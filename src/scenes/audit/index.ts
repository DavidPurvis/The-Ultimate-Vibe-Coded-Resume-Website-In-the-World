/**
 * /about/: the committee finding and the stamps reveal their evidence on request (visible without
 * JavaScript); the appendix is recorded only when it is actually opened.
 */
import { readSession, writeSession } from '../../lib/storage';
import { bump } from '../../lib/threat';
import { isActive, register, start, stop } from '../../lib/scene';
import { isChaos, onModeChange } from '../../lib/mode';
import { reducedMotion } from '../../runtime/modality';
import { Scope } from '../../runtime/lifecycle';

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

// The evidence stays available if enhancement fails, and Direct access reveals it immediately.
const findingBtn = document.querySelector<HTMLButtonElement>('[data-finding-toggle]');
const findingPanel = document.getElementById('finding-evidence');
const findingRoot = document.querySelector<HTMLElement>('[data-finding]');
const routing = document.querySelector<HTMLElement>('[data-finding-routing]');
const status = document.querySelector<HTMLElement>('[data-finding-status]');
const findingPage = new Scope();
if (findingBtn && findingPanel && findingRoot && routing) {
  const hide = () => {
    routing.hidden = true;
    findingPanel.hidden = true;
    findingBtn.setAttribute('aria-expanded', 'false');
    findingRoot.dataset.processing = 'idle';
  };
  const reveal = (focus = true) => {
    stop('evidence', 'complete');
    routing.hidden = true;
    findingPanel.hidden = false;
    findingBtn.setAttribute('aria-expanded', 'true');
    findingRoot.dataset.processing = 'complete';
    if (focus) findingPanel.focus({ preventScroll: true });
  };
  if (isChaos()) hide();
  register({
    id: 'evidence',
    major: true,
    start({ d }) {
      routing.hidden = false;
      findingBtn.setAttribute('aria-expanded', 'true');
      const stage = (value: string, text: string) => {
        findingRoot.dataset.processing = value;
        if (status) status.textContent = text;
        routing.querySelectorAll<HTMLElement>('[data-route-step]').forEach((step) => {
          step.toggleAttribute('data-current', step.dataset.routeStep === value);
        });
      };
      stage('received', 'Request received by the issuing office.');
      d.timeout(
        () => stage('referred', 'Referred to the issuing office by the issuing office.'),
        700,
      );
      d.timeout(
        () => stage('returned', 'Finding returned. No further circulation required.'),
        1400,
      );
      d.timeout(
        () =>
          reveal(document.activeElement === findingBtn || routing.contains(document.activeElement)),
        2100,
      );
      d.on(document, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Escape') {
          stop('evidence', 'replace');
          findingBtn.focus();
        }
      });
    },
    dispose(reason) {
      if (reason !== 'complete') hide();
    },
  });
  findingPage.on(findingBtn, 'click', () => {
    if (isActive('evidence')) {
      stop('evidence', 'replace');
      return;
    }
    if (!findingPanel.hidden) {
      hide();
      return;
    }
    if (reducedMotion() || !isChaos()) reveal();
    else void start('evidence');
  });
  const now = routing.querySelector('[data-finding-reveal]');
  const cancel = routing.querySelector('[data-finding-cancel]');
  if (now) findingPage.on(now, 'click', () => reveal());
  if (cancel)
    findingPage.on(cancel, 'click', () => {
      stop('evidence', 'replace');
      findingBtn.focus();
    });
  findingPage.add(
    onModeChange((mode) => {
      if (mode === 'recruiter') reveal(false);
    }),
  );
}
findingPage.on(window, 'pagehide', (event) => {
  stop('evidence', 'navigate');
  if (!(event as PageTransitionEvent).persisted) findingPage.dispose();
});

document.querySelector<HTMLDetailsElement>('[data-appendix]')?.addEventListener('toggle', (e) => {
  const d = e.currentTarget as HTMLDetailsElement;
  if (d.open && !readSession().appendixOpened) {
    writeSession({ appendixOpened: true });
    bump('appendix');
  }
});
