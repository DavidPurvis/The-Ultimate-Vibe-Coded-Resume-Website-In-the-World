/**
 * The docked DOOM player: opened from the Departments menu on any gag page, built from the
 * player template in the layout, one at a time. Closing it ends the game and returns focus.
 */
import '../../styles/doom.css';
import { stop } from '../../lib/scene';
import { url } from '../../lib/paths';
import { wirePlayer } from './player';
import * as L from './logic';

let dock: HTMLElement | null = null;

export function openDock(opener: HTMLElement): void {
  // On /doom/ itself, the full-size player is right there.
  const pagePlayer = document.querySelector<HTMLElement>('[data-doom-page] [data-doom-play]');
  if (pagePlayer) {
    opener.closest('details')?.removeAttribute('open');
    pagePlayer.scrollIntoView({ block: 'center' });
    pagePlayer.focus();
    return;
  }
  if (dock) {
    dock.querySelector<HTMLElement>('[data-doom-play]')?.focus();
    return;
  }
  const tpl = document.querySelector<HTMLTemplateElement>('template[data-doom-template]');
  const raw = document.querySelector<HTMLElement>('[data-doom-dock-copy]')?.dataset.doomDockCopy;
  if (!tpl || !raw) return;
  const copy = JSON.parse(raw) as { title: string; close: string; size: string; full: string };

  const el = document.createElement('section');
  el.className = 'doom-dock chaos-only';
  el.setAttribute('aria-label', copy.title);
  const bar = document.createElement('div');
  bar.className = 'doom-dock__bar';
  const title = document.createElement('strong');
  title.textContent = copy.title;
  let size = 0;
  const sizeBtn = document.createElement('button');
  sizeBtn.type = 'button';
  sizeBtn.className = 'btn btn--small';
  const setSize = () => {
    el.style.setProperty('--doom-dock-w', L.DOCK_SIZES[size] ?? '22rem');
    sizeBtn.textContent = copy.size.replace('{size}', 'SML'[size] ?? 'S');
  };
  sizeBtn.addEventListener('click', () => {
    size = L.nextSize(size);
    setSize();
  });
  const full = document.createElement('a');
  full.className = 'btn btn--small btn--ghost';
  full.href = url('/doom/');
  full.textContent = copy.full;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn btn--small';
  close.textContent = '×';
  close.setAttribute('aria-label', copy.close);
  bar.append(title, sizeBtn, full, close);
  el.append(bar, tpl.content.cloneNode(true));
  document.body.append(el);
  dock = el;
  setSize();

  const root = el.querySelector<HTMLElement>('[data-doom-player]');
  if (root) wirePlayer(root, 'doom-dock');
  close.addEventListener('click', () => {
    stop('doom-dock', 'complete');
    el.remove();
    dock = null;
    const summary = opener.closest('details')?.querySelector<HTMLElement>('summary');
    (summary ?? opener).focus();
  });
  opener.closest('details')?.removeAttribute('open');
  el.querySelector<HTMLElement>('[data-doom-play]')?.focus();
}
