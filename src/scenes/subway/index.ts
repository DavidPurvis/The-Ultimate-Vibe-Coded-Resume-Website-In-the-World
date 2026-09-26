/**
 * Attention-Span Mode: summonable floating gameplay players. YouTube (privacy-enhanced) iframes
 * are created only after the visitor has switched the mode on or pressed Summon; on later pages
 * they come back until dismissed. Until David supplies video IDs, players are placeholder tiles
 * and nothing third-party loads. A non-major scene: Recruiter Mode and navigation tear it down.
 */
import './subway.css';
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { readSession, writeSession, type SubwayState } from '../../lib/storage';
import { bump } from '../../lib/threat';
import { announce } from '../../lib/announce';
import { reducedMotion } from '../../lib/motion';
import { testSubwayVideos } from '../../lib/testHooks';
import { shownAll } from '../../content/pending';
import { SUBWAY_VIDEOS, subwayCopy as C } from '../../content/copy/subway';
import * as L from './logic';

interface DocPiP {
  requestWindow(o: { width: number; height: number }): Promise<Window>;
}
const pip = (): DocPiP | undefined =>
  (window as unknown as { documentPictureInPicture?: DocPiP }).documentPictureInPicture;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

let summonFromClick: (() => void) | null = null;

function mount({ d }: SceneCtx): void {
  if (document.body.hasAttribute('data-sincere')) return;
  const calm = reducedMotion();
  const ids = [...testSubwayVideos(), ...shownAll(SUBWAY_VIDEOS).map((v) => v.text.trim())];
  const state = (): SubwayState => readSession().subway;
  const dispatch = (a: L.SubwayAction) => writeSession({ subway: L.subwayReducer(state(), a) });

  /* ----- layer + dock ----- */
  const layer = el('div', 'subway-layer');
  layer.setAttribute('role', 'region');
  layer.setAttribute('aria-label', C.region);
  const dock = el('div', 'subway-dock');
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', C.dock);
  const summonBtn = el('button', 'btn btn--small btn--primary');
  summonBtn.type = 'button';
  const allBtn = el('button', 'btn btn--small', C.dismissAll);
  allBtn.type = 'button';
  const note = el('p', 'subway-dock__note');
  dock.append(summonBtn, allBtn, note);
  document.body.append(layer, dock);

  const players: HTMLElement[] = [];
  let popped: { win: Window; player: HTMLElement } | null = null;

  const insets = () => {
    const header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const dockTop = dock.getBoundingClientRect().top;
    return {
      w: innerWidth,
      h: innerHeight,
      top: Math.max(0, header),
      bottom: dockTop > 0 ? innerHeight - dockTop : 0,
    };
  };

  const syncDock = () => {
    const n = state().count;
    summonBtn.textContent = C.summon(n, L.SUBWAY_MAX);
    const kind = L.summonNote(n);
    note.textContent =
      kind === 'unreasonable' ? C.unreasonable : kind === 'reasonable' ? C.reasonable : '';
    summonBtn.disabled = kind === 'unreasonable';
    allBtn.disabled = n === 0;
  };

  /** A fresh screen: the embed for player `i`, or the placeholder tile. */
  const screen = (i: number): HTMLElement => {
    const id = L.videoFor(ids, i);
    if (!id) {
      const tile = el('div', 'subway-pending');
      tile.append(el('strong', '', C.pending), el('span', '', C.pendingSub));
      return tile;
    }
    const f = el('iframe', 'subway-frame');
    f.src = L.embedUrl(id, i, !calm);
    f.title = C.iframeTitle;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    return f;
  };

  // Positions live here, not in layout: reading offsetLeft mid-transition would undo moves.
  const where = new WeakMap<HTMLElement, L.Pos>();
  const at = (p: HTMLElement): L.Pos => where.get(p) ?? { x: 0, y: 0 };
  const place = (p: HTMLElement, pos: L.Pos) => {
    where.set(p, pos);
    p.style.left = `${pos.x}px`;
    p.style.top = `${pos.y}px`;
  };

  const addPlayer = (i: number): HTMLElement => {
    const n = i + 1;
    const size = L.playerSize(innerWidth);
    const p = el('div', 'subway-player');
    p.dataset.subwayPlayer = String(n);
    p.style.width = `${size.w}px`;
    const bar = el('div', 'subway-player__bar');
    const handle = el('button', 'subway-player__handle', `⠿ ${n}`);
    handle.type = 'button';
    handle.setAttribute('aria-label', C.handle(n));
    const out = el('button', 'subway-player__btn', '⧉');
    out.type = 'button';
    out.setAttribute('aria-label', C.popOut(n));
    out.hidden = !pip();
    const close = el('button', 'subway-player__btn', '×');
    close.type = 'button';
    close.setAttribute('aria-label', C.close(n));
    bar.append(handle, out, close);
    const body = el('div', 'subway-player__screen');
    body.append(screen(i));
    p.append(bar, body);
    layer.append(p);
    place(p, L.slot(i, insets(), size));
    players.push(p);

    /* drag by pointer */
    let drag: { dx: number; dy: number } | null = null;
    handle.addEventListener('pointerdown', (e) => {
      drag = { dx: e.clientX - at(p).x, dy: e.clientY - at(p).y };
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      place(
        p,
        L.clamp({ x: e.clientX - drag.dx, y: e.clientY - drag.dy }, insets(), {
          w: p.offsetWidth,
          h: p.offsetHeight,
        }),
      );
    });
    const end = () => (drag = null);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    /* …or by keyboard */
    handle.addEventListener('keydown', (e) => {
      const m = L.nudge(e.key, e.shiftKey);
      if (!m) return;
      e.preventDefault();
      place(
        p,
        L.clamp({ x: at(p).x + m.x, y: at(p).y + m.y }, insets(), {
          w: p.offsetWidth,
          h: p.offsetHeight,
        }),
      );
    });

    close.addEventListener('click', () => removePlayer(p, true));
    out.addEventListener('click', () => void popOut(p, i));
    return p;
  };

  const removePlayer = (p: HTMLElement, byVisitor: boolean) => {
    if (popped?.player === p) popped.win.close();
    const at = players.indexOf(p);
    if (at >= 0) players.splice(at, 1);
    p.remove();
    if (byVisitor) {
      dispatch({ type: 'dismiss' });
      syncDock();
      (players.at(-1)?.querySelector<HTMLElement>('.subway-player__handle') ?? summonBtn).focus();
    }
  };

  /** Document Picture-in-Picture: a fresh screen in its own window; the tile waits here. */
  const popOut = async (p: HTMLElement, i: number) => {
    const api = pip();
    if (!api) return;
    popped?.win.close();
    const win = await api.requestWindow({ width: 480, height: 270 });
    for (const link of document.querySelectorAll('link[rel="stylesheet"]'))
      win.document.head.append(link.cloneNode());
    win.document.body.className = 'subway-pip';
    win.document.body.append(screen(i));
    const body = p.querySelector<HTMLElement>('.subway-player__screen');
    body?.replaceChildren(el('p', 'subway-pending', C.poppedOut));
    popped = { win, player: p };
    win.addEventListener('pagehide', () => {
      if (popped?.win === win) popped = null;
      if (p.isConnected) body?.replaceChildren(screen(i));
    });
  };

  const summon = () => {
    const before = state().count;
    dispatch({ type: 'summon' });
    const n = state().count;
    if (n === before) return syncDock();
    addPlayer(n - 1);
    bump('summon');
    syncDock();
    announce(C.summoned(n));
  };
  summonFromClick = summon;

  summonBtn.addEventListener('click', summon);
  allBtn.addEventListener('click', () => {
    for (const p of [...players]) removePlayer(p, false);
    dispatch({ type: 'dismissAll' });
    syncDock();
    announce(C.dismissedAll);
    summonBtn.focus();
  });

  d.on(window, 'resize', () => {
    for (const p of players)
      place(
        p,
        L.clamp(at(p), insets(), {
          w: p.offsetWidth,
          h: p.offsetHeight,
        }),
      );
  });
  d.add(() => {
    summonFromClick = null;
    popped?.win.close();
    layer.remove();
    dock.remove();
  });

  /* ----- restore players summoned on earlier pages (staggered, unless motion is reduced) ----- */
  syncDock();
  const count = state().count;
  for (let i = 0; i < count; i++) {
    if (calm) addPlayer(i);
    else d.timeout(() => addPlayer(i), 150 * i);
  }
}

register({ id: 'subway', major: false, start: mount });

/** Start the mode; `summonNow` when the visitor just switched it on (their click summons one). */
export async function startScene(summonNow = false): Promise<void> {
  const ok = await start('subway');
  if (ok && summonNow && readSession().subway.count === 0) summonFromClick?.();
}

/** Switched off: dismiss everything and forget the players. */
export function stopScene(): void {
  stop('subway', 'complete');
}
