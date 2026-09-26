/**
 * Overkill HUD: a fixed layer that crowds every edge with gaming UI while the page stays readable
 * in the middle (html.hud-on reserves the gutters). Decoration is aria-hidden; the only controls
 * (HUD off, refill, the hotbar's real links) stay reachable. It's a non-major scene, so Recruiter
 * Mode and leaving the page tear it down.
 */
import './hud.css';
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { level, onThreat } from '../../lib/threat';
import { readPrefs, readSession, writePrefs } from '../../lib/storage';
import { reducedMotion } from '../../lib/motion';
import { makeRng } from '../../lib/rng';
import { url } from '../../lib/paths';
import {
  chatHandles,
  chatLines,
  donationLine,
  donations,
  feedLines,
  feedSeed,
  hotbar,
  hudCopy as C,
} from '../../content/copy/hud';
import * as L from './logic';

const FEED_MAX = 5;
const CHAT_MAX = 6;

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

/** A labelled meter bar; returns a setter taking 0–100. */
function bar(parent: HTMLElement, label: string, kind: string): (v: number) => void {
  const row = el('div', `hud-bar hud-bar--${kind}`);
  const fill = el('span', 'hud-bar__fill');
  row.append(el('span', 'hud-bar__label', label), el('span', 'hud-bar__track'));
  row.lastElementChild?.append(fill);
  parent.append(row);
  return (v) => {
    fill.style.width = `${Math.round(v)}%`;
  };
}

function mount({ d }: SceneCtx): void {
  if (document.body.hasAttribute('data-sincere')) return;
  const calm = reducedMotion();
  const rng = makeRng();
  const html = document.documentElement;
  const root = el('div', 'hud');
  root.dataset.hud = '';

  /* ----- header offset: the HUD starts below the sticky header ----- */
  const header = document.querySelector<HTMLElement>('.site-header');
  const syncHeader = () =>
    html.style.setProperty('--hud-header', `${header?.getBoundingClientRect().height ?? 0}px`);
  syncHeader();
  if (header && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(syncHeader);
    ro.observe(header);
    d.observe(ro);
  }

  /* ----- left gutter: player card, kill feed, chat, sponsor ----- */
  const left = el('div', 'hud__panel hud__left');
  left.setAttribute('aria-hidden', 'true');
  const card = el('div', 'hud-card hud-player');
  const lvl = el('span', 'hud-player__lvl');
  const name = el('p', 'hud-player__name');
  name.append(el('strong', '', C.player), ' · ', lvl, ` · ${C.role}`);
  const xpLabel = el('span', 'hud-player__xp');
  card.append(name);
  const setXp = bar(card, '', 'xp');
  card.querySelector('.hud-bar--xp .hud-bar__label')?.append(xpLabel);
  const setCaffeine = bar(card, C.caffeine, 'caffeine');
  const setStamina = bar(card, C.stamina, 'stamina');

  const feed = el('div', 'hud-card hud-feed');
  const feedList = el('ul', 'hud-list');
  feed.append(el('p', 'hud-card__title', C.feedTitle), feedList);

  const chat = el('div', 'hud-card hud-chat');
  const chatList = el('ul', 'hud-list');
  chat.append(el('p', 'hud-card__title', C.chatTitle), chatList);

  const sponsor = el('div', 'hud-card hud-sponsor');
  const ads = JSON.parse(
    document.querySelector<HTMLElement>('[data-parody-ads]')?.dataset.parodyAds ?? '[]',
  ) as { text: string }[];
  const ad = ads[Math.floor(rng() * ads.length)];
  sponsor.append(
    el('p', 'hud-card__title', C.sponsor),
    el('p', 'hud-sponsor__ad', ad?.text ?? 'Ad'),
  );
  left.append(card, feed, chat, sponsor);

  /* ----- right gutter: minimap + stats, quests, live/ammo ----- */
  const right = el('div', 'hud__panel hud__right');
  const mapCard = el('div', 'hud-card hud-map');
  mapCard.setAttribute('aria-hidden', 'true');
  const canvas = el('canvas', 'hud-map__canvas');
  const stats = el('p', 'hud-stats');
  const fpsEl = el('span', '', C.fps(0));
  const clockEl = el('span');
  stats.append(fpsEl, el('span', '', C.ping), clockEl);
  mapCard.append(el('p', 'hud-card__title', C.minimap), canvas, stats);

  const quests = el('div', 'hud-card hud-quests');
  quests.setAttribute('aria-hidden', 'true');
  const questList = el('ul', 'hud-list');
  quests.append(el('p', 'hud-card__title', C.questsTitle), questList);

  const status = el('div', 'hud-card hud-status');
  status.setAttribute('aria-hidden', 'true');
  status.append(el('p', 'hud-live', `● ${C.live} · ${C.viewers}`), el('p', 'hud-ammo', C.ammo));
  right.append(mapCard, quests, status);

  /* ----- bottom band: level strip (small screens), compass, hotbar, controls ----- */
  const bottom = el('div', 'hud__bottom');
  const compassEl = el('p', 'hud-compass');
  compassEl.setAttribute('aria-hidden', 'true');
  const mini = el('p', 'hud-mini');
  mini.setAttribute('aria-hidden', 'true');
  const nav = el('nav', 'hud-hotbar');
  nav.setAttribute('aria-label', C.hotbarLabel);
  const slots = L.slotNumbers(hotbar.length);
  const ul = el('ul');
  hotbar.forEach((h, i) => {
    const li = el('li');
    const a = el('a');
    a.href = url(h.path);
    a.append(el('span', 'hud-hotbar__n', String(slots[i])), el('span', '', h.label));
    li.append(a);
    ul.append(li);
  });
  nav.append(ul);
  const controls = el('div', 'hud-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', C.controlsLabel);
  const refill = el('button', 'hud-btn', C.refill);
  refill.type = 'button';
  const off = el('button', 'hud-btn hud-btn--off', C.offButton);
  off.type = 'button';
  controls.append(refill, off);
  bottom.append(mini, compassEl, nav, controls);

  const vignette = el('div', 'hud-vignette');
  vignette.setAttribute('aria-hidden', 'true');
  const toastEl = el('p', 'hud-toast');
  toastEl.setAttribute('aria-hidden', 'true');

  root.append(left, right, bottom, vignette, toastEl);
  document.body.append(root);
  html.classList.add('hud-on');
  d.add(() => {
    root.remove();
    html.classList.remove('hud-on');
    html.style.removeProperty('--hud-header');
  });

  /* ----- state ----- */
  let caffeine = 100;
  let stamina = 100;
  let lastY = scrollY;
  let bottomed = false;
  let feedItems: [string, string][] = [...feedSeed];
  let chatItems: [string, string][] = L.chatSchedule(rng, chatHandles, chatLines, CHAT_MAX);
  let chatTick = 0;

  const toast = (title: string, text: string) => {
    toastEl.textContent = `${title}: ${text}`;
    toastEl.classList.remove('is-on');
    if (calm) {
      toastEl.classList.add('is-on', 'is-static');
      d.timeout(() => toastEl.classList.remove('is-on', 'is-static'), 4000);
      return;
    }
    void toastEl.offsetWidth; // restart the animation
    toastEl.classList.add('is-on');
  };

  const renderFeed = () => {
    feedList.replaceChildren(
      ...feedItems.map(([a, b]) => {
        const li = el('li');
        li.append(el('strong', '', a), ' ⌖ ', b);
        return li;
      }),
    );
  };
  const renderChat = () => {
    chatList.replaceChildren(
      ...chatItems.map(([h, t]) => {
        const li = el('li', h === '$' ? 'hud-donation' : '');
        if (h === '$') li.textContent = t;
        else li.append(el('strong', '', `${h}: `), t);
        return li;
      }),
    );
  };
  const renderQuests = () => {
    const s = readSession();
    const p = readPrefs();
    const rows: [string, boolean | string][] = [
      [C.quests.hire, '0/1'],
      [C.quests.read, lastY > 0 || bottomed],
      [C.quests.banner, p.cookieBanner !== 'pending'],
      [C.quests.human, Boolean(s.captcha?.completed)],
      [C.quests.grass, '0/1'],
    ];
    questList.replaceChildren(
      ...rows.map(([label, v]) => {
        const li = el('li', v === true ? 'is-done' : '');
        li.append(el('span', '', label), el('span', '', v === true ? '✓' : v === false ? '·' : v));
        return li;
      }),
    );
  };
  const renderLevel = () => {
    const n = L.playerLevel(readSession().threat);
    lvl.textContent = C.level(n);
    mini.textContent = `${C.level(n)} · ${xpLabel.textContent}`;
  };

  /* ----- minimap ----- */
  const drawMap = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(root);
    const blocks = [...document.querySelectorAll<HTMLElement>('main .container > *')].map((b) => {
      const r = b.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
    const m = L.minimap(
      blocks,
      { height: document.documentElement.scrollHeight, scrollY, viewport: innerHeight },
      { w, h, pad: 4 },
    );
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = cs.getPropertyValue('--hud-dim').trim() || '#6b7280';
    for (const b of m.blocks) ctx.fillRect(b.x, b.y, b.w, Math.max(1, b.h - 1));
    ctx.strokeStyle = cs.getPropertyValue('--hud-accent').trim() || '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(m.view.x + 0.75, m.view.y + 0.75, m.view.w - 1.5, m.view.h - 1.5);
  };
  d.on(canvas, 'click', (e) => {
    const ev = e as MouseEvent;
    const r = canvas.getBoundingClientRect();
    scrollTo({
      top: L.minimapTarget(
        ev.clientY - r.top,
        { height: document.documentElement.scrollHeight, viewport: innerHeight },
        { h: r.height, pad: 4 },
      ),
      behavior: calm ? 'auto' : 'smooth',
    });
  });

  /* ----- scroll: XP, compass, stamina, minimap ----- */
  let pending = false;
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const y = scrollY;
      stamina = Math.max(0, stamina - Math.min(20, Math.abs(y - lastY) / 40));
      lastY = y;
      const pct = L.xpPercent(y, document.documentElement.scrollHeight, innerHeight);
      setXp(pct);
      xpLabel.textContent = C.xp(pct);
      const c = L.compass(y);
      compassEl.textContent = C.heading(c.deg, c.dir);
      renderLevel();
      drawMap();
      if (pct >= 100 && !bottomed) {
        bottomed = true;
        toast(C.achievement, C.achievements.bottom);
        renderQuests();
      }
    });
  };
  d.on(window, 'scroll', onScroll, { passive: true });
  d.on(window, 'resize', onScroll, { passive: true });

  /* ----- clock, meters, FPS ----- */
  const tickSecond = () => {
    clockEl.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    caffeine = L.drain(caffeine, 1000, 0.5);
    stamina = Math.min(100, stamina + 4);
    setCaffeine(caffeine);
    setStamina(stamina);
  };
  tickSecond();
  d.interval(tickSecond, 1000);

  const frames: number[] = [];
  let sinceFps = 0;
  d.raf((_t, dt) => {
    if (dt > 0) frames.push(dt);
    if (frames.length > 30) frames.shift();
    sinceFps += dt;
    if (sinceFps >= 500) {
      sinceFps = 0;
      fpsEl.textContent = C.fps(L.fps(frames));
    }
    return true;
  });

  /* ----- chat (static under reduced motion) ----- */
  if (!calm)
    d.interval(() => {
      chatTick++;
      const donation = donations[chatTick % donations.length];
      const next: [string, string] =
        chatTick % 8 === 0 && donation
          ? ['$', donationLine(donation)]
          : (L.chatSchedule(rng, chatHandles, chatLines, 1)[0] ?? ['', '']);
      chatItems = L.pushCapped(chatItems, next, CHAT_MAX);
      renderChat();
    }, 2800);

  /* ----- Department events → kill feed, level, vignette, achievements ----- */
  d.add(
    onThreat((score, _idx, changed, reason) => {
      feedItems = L.pushCapped(feedItems, feedLines[reason], FEED_MAX);
      renderFeed();
      renderLevel();
      renderQuests();
      if (changed) toast(C.achievement, C.achievements.threat(level(score)));
      if (reason === 'dodge' && !calm) {
        vignette.classList.remove('is-hit');
        void vignette.offsetWidth;
        vignette.classList.add('is-hit');
      }
    }),
  );

  /* ----- controls ----- */
  d.on(refill, 'click', () => {
    caffeine = 100;
    setCaffeine(caffeine);
    feedItems = L.pushCapped(feedItems, ['You', 'Fatigue'], FEED_MAX);
    renderFeed();
  });
  d.on(off, 'click', () => {
    writePrefs({ hud: 'off' });
    stop('hud', 'complete');
    document.dispatchEvent(new Event('uvcr:hud'));
    document.querySelector<HTMLElement>('[data-dept-menu] summary')?.focus();
  });

  renderFeed();
  renderChat();
  renderQuests();
  onScroll();
  toast(C.achievement, C.achievements.hud);
}

register({ id: 'hud', major: false, start: mount });

export const startHud = (): Promise<boolean> => start('hud');
