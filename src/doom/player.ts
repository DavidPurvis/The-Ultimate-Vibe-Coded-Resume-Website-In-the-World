/**
 * Wires a DOOM player shell (DoomPlayer.astro). Play creates the engine frame inside a child Scope;
 * Stop, a second Play, or leaving the page disposes it, which blanks and removes the frame and so
 * ends the WebAssembly runtime and its audio for good. Messages are accepted only from that frame,
 * on this origin. The sound switch lives in memory (default off) and applies on the next Play.
 */
import { announce } from '../runtime/announce';
import type { Scope } from '../runtime/lifecycle';
import { BASE } from '../lib/paths';
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

export function wirePlayer(scope: Scope, root: HTMLElement): boolean {
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
  if (!screen || !poster || !playBtn || !stopBtn || !status || !raw) return false;
  const copy = JSON.parse(raw) as PlayerCopy;
  const say = (t: string) => (status.textContent = t);

  let sound = false;
  let game: Scope | null = null;
  const syncSound = () => soundSw?.setAttribute('aria-checked', String(sound));
  syncSound();
  if (soundSw)
    scope.on(soundSw, 'click', () => {
      sound = !sound;
      syncSound();
      if (game) say(copy.soundNext);
    });

  const end = () => {
    game?.dispose();
    game = null;
  };

  const play = () => {
    end();
    const g = scope.child();
    game = g;
    const frame = document.createElement('iframe');
    frame.className = 'doom-frame';
    frame.title = copy.frameTitle;
    frame.allow = 'fullscreen; autoplay';
    frame.src = L.engineSrc(BASE, sound);

    g.on(window, 'message', (e) => {
      const m = e as MessageEvent;
      if (m.source !== frame.contentWindow || m.origin !== location.origin) return;
      const msg = L.parseMessage(m.data);
      if (!msg) return;
      if (msg.type === 'doom:progress') {
        const pct = L.progressPct(msg.left, msg.total);
        if (bar) bar.value = pct;
        say(copy.progress.replace('{pct}', String(pct)));
      } else if (msg.type === 'doom:ready') {
        if (bar) bar.hidden = true;
        say(copy.ready);
        // Only if they're still waiting on it: never pull focus from wherever they went next.
        const at = document.activeElement;
        if (at === playBtn || at === document.body || at === null) frame.focus();
      } else if (msg.type === 'doom:escape') {
        stopBtn.focus();
        say(copy.escaped);
        announce(copy.escaped);
      } else {
        say(copy.error);
        end();
      }
    });

    poster.hidden = true;
    stopBtn.disabled = false;
    if (fullBtn) fullBtn.disabled = false;
    if (bar) {
      bar.value = 0;
      bar.hidden = false;
    }
    say(copy.loading);
    g.add(() => {
      poster.hidden = false;
      stopBtn.disabled = true;
      if (fullBtn) fullBtn.disabled = true;
      if (bar) bar.hidden = true;
      if (document.fullscreenElement === screen) void document.exitFullscreen();
    });
    // Registered last so it runs first on dispose: blank the frame, then remove it.
    screen.append(frame);
    g.frame(frame);
  };

  scope.on(playBtn, 'click', play);
  scope.on(stopBtn, 'click', () => {
    end();
    say(copy.stopped);
    playBtn.focus();
  });
  if (fullBtn) scope.on(fullBtn, 'click', () => void screen.requestFullscreen?.());
  // Leaving ends the game even when the page is kept for back/forward: nothing runs unseen.
  scope.on(window, 'pagehide', end);
  return true;
}
