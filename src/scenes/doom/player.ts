/**
 * Wires a DOOM player shell (DoomPlayer.astro). Play creates the engine frame; Stop, Recruiter
 * Mode or leaving the page removes it, which ends the WebAssembly runtime and its audio for good.
 * Messages are accepted only from that frame, on this origin.
 */
import { announce } from '../../lib/announce';
import { BASE } from '../../lib/paths';
import { readPrefs, writePrefs } from '../../lib/storage';
import { isActive, register, start, stop } from '../../lib/scene';
import * as L from './logic';

interface PlayerCopy {
  loading: string;
  progress: string;
  ready: string;
  stopped: string;
  escaped: string;
  error: string;
  soundNext: string;
  frameTitle: string;
}

export interface Player {
  id: string;
  play(): Promise<void>;
  root: HTMLElement;
}

export function wirePlayer(root: HTMLElement, id: string): Player | null {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s);
  const screen = q<HTMLElement>('[data-doom-screen]');
  const poster = q<HTMLElement>('[data-doom-poster]');
  const playBtn = q<HTMLButtonElement>('[data-doom-play]');
  const stopBtn = q<HTMLButtonElement>('[data-doom-stop]');
  const fullBtn = q<HTMLButtonElement>('[data-doom-full]');
  const soundSw = q<HTMLButtonElement>('[data-doom-sound]');
  const status = q<HTMLElement>('[data-doom-status]');
  const bar = q<HTMLProgressElement>('[data-doom-progress]');
  const raw = q<HTMLElement>('[data-doom-copy]')?.dataset.doomCopy;
  if (!screen || !poster || !playBtn || !stopBtn || !status || !raw) return null;
  const copy = JSON.parse(raw) as PlayerCopy;
  const say = (t: string) => (status.textContent = t);

  const syncSound = () => soundSw?.setAttribute('aria-checked', String(readPrefs().sound));
  syncSound();
  soundSw?.addEventListener('click', () => {
    writePrefs({ sound: !readPrefs().sound });
    syncSound();
    if (isActive(id)) say(copy.soundNext);
  });

  register({
    id,
    major: false,
    start: ({ d }) => {
      const frame = document.createElement('iframe');
      frame.className = 'doom-frame';
      frame.title = copy.frameTitle;
      frame.allow = 'fullscreen; autoplay';
      frame.src = L.engineSrc(BASE, readPrefs().sound);

      const onMsg = (e: MessageEvent) => {
        if (e.source !== frame.contentWindow || e.origin !== location.origin) return;
        const m = L.parseMessage(e.data);
        if (!m) return;
        if (m.type === 'doom:progress') {
          const pct = L.progressPct(m.left, m.total);
          if (bar) bar.value = pct;
          say(copy.progress.replace('{pct}', String(pct)));
        } else if (m.type === 'doom:ready') {
          if (bar) bar.hidden = true;
          say(copy.ready);
          // Only if they're still waiting on it: never pull focus from wherever they went next.
          const at = document.activeElement;
          if (at === playBtn || at === document.body || at === null) frame.focus();
        } else if (m.type === 'doom:escape') {
          stopBtn.focus();
          say(copy.escaped);
          announce(copy.escaped);
        } else {
          say(copy.error);
          stop(id, 'error');
        }
      };
      d.on(window, 'message', onMsg as EventListener);

      poster.hidden = true;
      screen.append(frame);
      stopBtn.disabled = false;
      if (fullBtn) fullBtn.disabled = false;
      if (bar) {
        bar.value = 0;
        bar.hidden = false;
      }
      say(copy.loading);
      d.add(() => {
        frame.remove();
        poster.hidden = false;
        stopBtn.disabled = true;
        if (fullBtn) fullBtn.disabled = true;
        if (bar) bar.hidden = true;
        if (document.fullscreenElement === screen) void document.exitFullscreen();
      });
    },
  });

  const play = async () => {
    if (isActive(id)) stop(id, 'replace');
    await start(id);
  };
  playBtn.addEventListener('click', () => void play());
  stopBtn.addEventListener('click', () => {
    stop(id, 'complete');
    say(copy.stopped);
    playBtn.focus();
  });
  fullBtn?.addEventListener('click', () => void screen.requestFullscreen?.());
  return { id, play, root };
}
