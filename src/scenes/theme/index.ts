/** Theme cycle + Lights Out flashlight. The default respects prefers-color-scheme. */
import { Disposer } from '../../lib/scene';
import { readPrefs, writePrefs, type ThemeName } from '../../lib/storage';
import { isChaos, onModeChange } from '../../lib/mode';
import { toast } from '../../lib/toast';
import { bump } from '../../lib/threat';
import { themes } from '../../content/copy/global';
import { nextTheme } from './logic';

const root = document.documentElement;
const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
let lights: Disposer | null = null;

function current(): ThemeName {
  return (root.getAttribute('data-theme') as ThemeName | null) ?? 'system';
}

function label(): void {
  const btn = document.querySelector<HTMLElement>('[data-theme-label]');
  const reset = document.querySelector<HTMLButtonElement>('[data-theme-reset]');
  const next = nextTheme(current(), prefersDark());
  if (btn) btn.textContent = `${themes.buttonPrefix} ${themes.labels[next]} →`;
  if (reset) reset.hidden = current() === 'system';
}

function stopLights(): void {
  lights?.run();
  lights = null;
}

function startLights(): void {
  stopLights();
  const d = new Disposer();
  lights = d;
  const overlay = document.createElement('div');
  overlay.className = 'lights-out';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.dataset.lightsOut = '';
  document.body.append(overlay);
  d.add(() => overlay.remove());
  let pending = false;
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  const paint = () => {
    pending = false;
    overlay.style.setProperty('--x', `${x}px`);
    overlay.style.setProperty('--y', `${y}px`);
  };
  const move = (nx: number, ny: number) => {
    x = nx;
    y = ny;
    if (!pending) {
      pending = true;
      requestAnimationFrame(paint);
    }
  };
  paint();
  d.on(
    window,
    'pointermove',
    (e) => move((e as PointerEvent).clientX, (e as PointerEvent).clientY),
    { passive: true },
  );
  d.on(document, 'focusin', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t?.getBoundingClientRect) return;
    const r = t.getBoundingClientRect();
    move(r.left + r.width / 2, r.top + r.height / 2);
  });
  d.on(document, 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && !document.querySelector('dialog[open]'))
      apply('light');
  });
}

export function apply(theme: ThemeName, o: { persist?: boolean } = {}): void {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (o.persist !== false) writePrefs({ theme });
  if (theme === 'lights-out') startLights();
  else stopLights();
  label();
}

export function initTheme(): void {
  const saved = readPrefs().theme;
  if (isChaos() && saved === 'lights-out') startLights();
  label();
  document.querySelector('[data-theme-cycle]')?.addEventListener('click', () => {
    const next = nextTheme(current(), prefersDark());
    apply(next);
    if (next === 'lights-out') {
      bump('lightsOut');
      toast(themes.lightsOutHint, { ms: 6000 });
    }
  });
  document.querySelector('[data-theme-reset]')?.addEventListener('click', () => apply('system'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  onModeChange((m) => {
    if (m === 'recruiter') {
      stopLights();
      root.removeAttribute('data-theme');
    }
    label();
  });
}
