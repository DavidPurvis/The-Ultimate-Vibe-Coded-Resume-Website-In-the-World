/**
 * The docked DOOM player: requested from Recreation, built from the player template in the
 * shell, one at a time. It is a scene like any other: closing it, Direct access or leaving the
 * page disposes it, which ends the game (the engine frame is blanked and removed) and returns
 * focus to whatever opened it.
 */
import '../../styles/doom.css';
import { register, start, stop } from '../../lib/scene';
import { url } from '../../lib/paths';
import { wirePlayer } from '../../doom/player';
import { DOCK_SIZES, nextSize } from '../../doom/logic';

let opener: HTMLElement | null = null;

/** Remember what asked for the dock (focus returns there when it closes). */
export function setOpener(el: HTMLElement): void {
  opener = el;
}

register({
  id: 'doom-dock',
  major: false,
  start({ d }) {
    const from = opener;
    // On /doom/ itself, the full-size player is right there.
    const pagePlayer = document.querySelector<HTMLElement>('[data-doom-page] [data-doom-play]');
    if (pagePlayer) {
      from?.closest('details')?.removeAttribute('open');
      pagePlayer.scrollIntoView({ block: 'center' });
      pagePlayer.focus();
      queueMicrotask(() => stop('doom-dock', 'complete'));
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
      el.style.setProperty('--doom-dock-w', DOCK_SIZES[size] ?? '22rem');
      sizeBtn.textContent = copy.size.replace('{size}', 'SML'[size] ?? 'S');
    };
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
    document.body.append(d.node(el));
    setSize();

    d.on(sizeBtn, 'click', () => {
      size = nextSize(size);
      setSize();
    });
    d.on(close, 'click', () => stop('doom-dock', 'complete'));
    // Escape closes the dock from its own controls (keys inside the game's frame stay in the game).
    d.on(el, 'keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') stop('doom-dock', 'complete');
    });
    const root = el.querySelector<HTMLElement>('[data-doom-player]');
    if (root) wirePlayer(d, root);
    d.add(() => {
      const summary = from?.closest('details')?.querySelector<HTMLElement>('summary');
      const back = summary ?? from;
      // Never pull focus away from something else that has since taken it.
      if (back?.isConnected && (!document.activeElement || el.contains(document.activeElement)))
        back.focus();
    });
    from?.closest('details')?.removeAttribute('open');
    el.querySelector<HTMLElement>('[data-doom-play]')?.focus();
  },
});

/** Open the dock from a control (used when the chunk is already loaded). */
export function openDock(from: HTMLElement): Promise<boolean> {
  opener = from;
  return start('doom-dock');
}
