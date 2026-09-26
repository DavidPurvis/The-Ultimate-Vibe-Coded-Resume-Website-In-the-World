/**
 * The global chaos layer for every gag page: Recruiter Mode, Konami, themes, threat meter,
 * tab guilt, escape hatch, identity callback, console greeting, playful-link rickrolls.
 * Everything is bounded and switchable off; nothing here is required to read the résumé.
 */
import { initMode, isChaos, onModeChange, setMode } from '../lib/mode';
import { disposeAll, Disposer } from '../lib/scene';
import { trackModality } from '../lib/motion';
import { readPrefs, readSession, writeSession } from '../lib/storage';
import { announce } from '../lib/announce';
import { level, levelIndex, onThreat, bump } from '../lib/threat';
import { runaway } from '../lib/runaway';
import { armPlayful, isPlainActivation } from '../lib/links';
import { makeRng } from '../lib/rng';
import { forcedArmAll, installTestHooks, sample } from '../lib/testHooks';
import { initTheme } from '../scenes/theme';
import { isEditableTarget, matches, pushKey } from '../scenes/konami/logic';
import { openRickroll } from '../scenes/rickroll';
import { exits, tabGuilt, threat as threatCopy } from '../content/copy/global';
import { renderIdentityCallback } from '../lib/identityCallback';
import { consoleGreeting } from '../content/copy/memos';
import { absoluteUrl } from '../lib/paths';

installTestHooks();
trackModality();
initMode();

/* ---------- Recruiter Mode switch ---------- */
function initModeToggle(): void {
  const sw = document.querySelector<HTMLButtonElement>('[data-mode-toggle]');
  const sync = () => sw?.setAttribute('aria-checked', String(!isChaos()));
  sync();
  sw?.addEventListener('click', () => setMode(isChaos() ? 'recruiter' : 'chaos'));
  onModeChange(sync);
}

/* ---------- Konami ---------- */
function initKonami(): void {
  let buf: string[] = [];
  window.addEventListener('keydown', (e) => {
    if (isEditableTarget(e.target as HTMLElement | null)) return;
    buf = pushKey(buf, e.key);
    if (matches(buf)) {
      buf = [];
      const next = isChaos() ? 'recruiter' : 'chaos';
      if (next === 'recruiter') bump('konami');
      setMode(next);
    }
  });
}

/* ---------- Threat meter ---------- */
function initThreat(): void {
  const meter = document.querySelector<HTMLElement>('[data-threat]');
  const value = meter?.querySelector<HTMLElement>('[data-threat-value]');
  const render = (score: number) => {
    if (!meter || !value) return;
    meter.dataset.level = String(levelIndex(score));
    value.textContent = level(score);
  };
  render(readSession().threat);
  onThreat((score, _idx, changed) => {
    render(score);
    if (changed && isChaos()) announce(threatCopy.announce(level(score)));
  });
}

/* ---------- Tab guilt ---------- */
function initTabGuilt(): void {
  const original = document.title;
  const fav = document.querySelector<HTMLLinkElement>('link[data-favicon]');
  const favOriginal = fav?.href ?? '';
  const favCrying = favOriginal.replace(/favicon\.svg$/, 'favicon-crying.svg');
  let backTimer = 0;
  const restore = () => {
    clearTimeout(backTimer);
    document.title = original;
    if (fav) fav.href = favOriginal;
  };
  document.addEventListener('visibilitychange', () => {
    if (!isChaos()) return restore();
    if (document.hidden) {
      clearTimeout(backTimer);
      const s = readSession();
      document.title = tabGuilt.away[s.guiltIndex % tabGuilt.away.length] ?? original;
      writeSession({ guiltIndex: s.guiltIndex + 1 });
      if (fav) fav.href = favCrying;
    } else {
      document.title = tabGuilt.back;
      if (fav) fav.href = favOriginal;
      backTimer = window.setTimeout(restore, 2000);
    }
  });
  onModeChange(restore);
  window.addEventListener('pagehide', restore);
}

/* ---------- Escape hatch (footer) ---------- */
let hatchD: Disposer | null = null;
function initHatch(): void {
  const el = document.querySelector<HTMLElement>('[data-hatch]');
  const arena = document.querySelector<HTMLElement>('[data-hatch-arena]');
  if (!el || !arena) return;
  const mount = () => {
    hatchD?.run();
    hatchD = new Disposer();
    runaway(
      {
        id: 'hatch',
        el,
        arena,
        mode: 'enter',
        maxDodges: 2,
        distance: 120,
        labels: exits.hatchLabels,
        onDodge: () => bump('dodge'),
      },
      hatchD,
    );
  };
  mount();
  onModeChange((m) => {
    if (m === 'recruiter') hatchD?.run();
    else mount();
  });
}

/* ---------- Departments menu ---------- */
function initDeptMenu(): void {
  const menu = document.querySelector<HTMLDetailsElement>('[data-dept-menu]');
  if (!menu) return;
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}

/* ---------- Console greeting ---------- */
function greet(): void {
  if (!isChaos()) return;
  console.log(
    `%c${consoleGreeting.title}%c\n${consoleGreeting.line1}\n${consoleGreeting.line2(absoluteUrl('/how-it-was-built/'))}\n${consoleGreeting.line3(absoluteUrl('/resume/'))}`,
    'font: 700 20px Georgia, serif; color: #A8201A; letter-spacing: .04em;',
    'font: 13px ui-monospace, monospace; color: #44506B;',
  );
}

/* ---------- Playful links → consensual rickroll ---------- */
function initPlayful(): void {
  const rng = makeRng();
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-playful]')];
  const armed = new Set(
    forcedArmAll()
      ? links.filter((a) => !a.hasAttribute('data-escape'))
      : armPlayful(links, () => sample(rng), readSession().lastPlayfulWasRick),
  );
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-playful]');
    if (!a) return;
    if (!isChaos() || !isPlainActivation(e) || !armed.has(a)) {
      writeSession({ lastPlayfulWasRick: false });
      return;
    }
    e.preventDefault();
    writeSession({ lastPlayfulWasRick: true });
    armed.clear(); // never twice in a row
    openRickroll({ continueHref: a.href, opener: a });
  });
}

initModeToggle();
initKonami();
initTheme();
initThreat();
initTabGuilt();
initHatch();
renderIdentityCallback();
initDeptMenu();
initPlayful();
greet();
// The banner (and its copy) only downloads for visitors who haven't dealt with it yet.
if (readPrefs().cookieBanner === 'pending' && isChaos())
  void import('../scenes/cookie-banner').then((m) => m.maybeStartBanner());

window.addEventListener('pagehide', () => disposeAll('navigate'));
