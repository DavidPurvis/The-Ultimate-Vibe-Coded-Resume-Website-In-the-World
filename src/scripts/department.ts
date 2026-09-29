/**
 * The Department's runtime, on every page except the sincere tribute. It starts nothing on its
 * own: no dialog opens, no focus moves and no media loads unless the visitor asks. What it does:
 * Direct access, display settings, the directory menu, the optional overlays the visitor switched
 * on, explicitly requested procedures (DOOM docked, cookie administration, advertising), and the
 * case record (this page's department, the status line and at most one notice).
 * Every procedure is loaded on request and dropped if the request went stale meanwhile.
 */
import { initMode, isChaos, onModeChange, setMode } from '../lib/mode';
import { disposeAll, request, stop } from '../lib/scene';
import { readPrefs, readSession, writePrefs, writeSession } from '../lib/storage';
import { installTestHooks } from '../lib/testHooks';
import { cleanupLegacy } from '../runtime/legacy';
import { initTheme } from '../scenes/theme';
import { initCaseRecord } from '../case/notices';

installTestHooks();
initMode();
cleanupLegacy();

/* ---------- Direct access (there may be one switch in the header and one in Facilities) ---------- */
function initDirectAccess(): void {
  const switches = [...document.querySelectorAll<HTMLButtonElement>('[data-mode-toggle]')];
  const sync = () => {
    for (const s of switches) s.setAttribute('aria-checked', String(!isChaos()));
  };
  sync();
  for (const s of switches)
    s.addEventListener('click', () => setMode(isChaos() ? 'recruiter' : 'chaos'));
  onModeChange(sync);
}

/* ---------- the directory menu: closes on an outside click or Escape ---------- */
function initMenus(): void {
  const menus = [...document.querySelectorAll<HTMLDetailsElement>('details[data-menu]')];
  document.addEventListener('click', (e) => {
    for (const m of menus) if (m.open && !m.contains(e.target as Node)) m.open = false;
  });
  for (const m of menus)
    m.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && m.open) {
        m.open = false;
        m.querySelector('summary')?.focus();
      }
    });
}

/* ---------- optional overlays: each a lazy chunk, loaded only while switched on ---------- */
function initOverlays(): void {
  interface Overlay {
    id: 'hud' | 'subway';
    on(): boolean;
    set(v: boolean): void;
    load(): Promise<{ startScene(fromClick?: boolean): Promise<unknown> }>;
  }
  const overlays: Overlay[] = [
    {
      id: 'hud',
      on: () => readPrefs().hud === 'overkill',
      set: (v) => writePrefs({ hud: v ? 'overkill' : 'off' }),
      load: () => import('../scenes/hud'),
    },
    {
      id: 'subway',
      on: () => readSession().subway.on,
      set: (v) => writeSession({ subway: { on: v, count: 0 } }),
      load: () => import('../scenes/subway'),
    },
  ];
  for (const o of overlays) {
    const sw = document.querySelector<HTMLButtonElement>(`[data-${o.id}-toggle]`);
    const sync = () => sw?.setAttribute('aria-checked', String(o.on()));
    const apply = (fromClick = false) => {
      sync();
      if (!o.on() || !isChaos()) return;
      let mod: Awaited<ReturnType<Overlay['load']>> | null = null;
      void request(
        o.id,
        async () => {
          mod = await o.load();
        },
        () => o.on(),
      ).then((started) => {
        // request() started the scene; the overlay's own entry adds what a click asked for.
        if (started && fromClick) void mod?.startScene(true);
      });
    };
    sw?.addEventListener('click', () => {
      o.set(!o.on());
      if (o.on()) apply(true);
      else stop(o.id, 'complete');
      sync();
    });
    document.addEventListener(`uvcr:${o.id}`, sync);
    onModeChange((m) => {
      if (m === 'chaos') apply();
    });
    apply();
  }
}

/* ---------- explicitly requested procedures ---------- */
function initRequests(): void {
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null;
    const dock = t?.closest<HTMLElement>('[data-doom-dock]');
    if (dock && isChaos())
      void request('doom-dock', async () => {
        (await import('../scenes/doom/dock')).setOpener(dock);
      });
    const skip = t?.closest<HTMLElement>('[data-ad-skip]');
    if (skip) void import('../scenes/ads').then((m) => m.skipAd(skip));
    const cookies = t?.closest<HTMLElement>('[data-cookie-admin]');
    if (cookies && isChaos())
      void request('cookie-banner', async () => {
        (await import('../scenes/cookie-banner')).setOpener(cookies);
      });
  });
}

initDirectAccess();
initCaseRecord();
initTheme();
initMenus();
initOverlays();
initRequests();
window.addEventListener('pagehide', (e) => {
  if (!(e as PageTransitionEvent).persisted) disposeAll('navigate');
});
