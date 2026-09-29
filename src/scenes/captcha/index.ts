/** Verification on /verify/: DOM wiring for the pure reducer, plus the progress record. */
import {
  captchaReducer,
  initialCaptcha,
  type CaptchaEvent,
  type CaptchaState,
  type Copy,
} from './logic';
import {
  audio,
  cabbageTiles,
  captchaCopy as C,
  completion,
  progress as P,
  progressStatuses,
  rectangleTile,
  rounds,
  windowTiles,
  type CaptchaTile,
} from '../../content/copy/captcha';
import { readSession, writeSession } from '../../lib/storage';
import { bump } from '../../lib/threat';
import { announce } from '../../runtime/announce';
import { toast } from '../../lib/toast';
import { reducedMotion } from '../../runtime/modality';
import { makeRng } from '../../lib/rng';
import { runaway } from '../../lib/runaway';
import { Disposer } from '../../lib/scene';
import { url } from '../../lib/paths';
import { CAP, CONTINUE_AFTER_MS, nextProgress, STATUS_MS, TICK_MS } from '../progress/logic';

const root = document.querySelector<HTMLElement>('[data-captcha]');
// Licensed photos replace the cabbages only when the build shipped enough credited ones.
const photoTiles = ((): CaptchaTile[] | null => {
  const raw = document.querySelector<HTMLElement>('[data-cage-photos]')?.dataset.cagePhotos;
  try {
    return raw ? (JSON.parse(raw) as CaptchaTile[]) : null;
  } catch {
    return null;
  }
})();
const cageTiles = photoTiles ?? cabbageTiles;
const copy: Copy = {
  windows: { headlines: rounds.windows.headlines, sublines: rounds.windows.sublines },
  cage: {
    headlines: photoTiles ? rounds.cage.photo.headlines : rounds.cage.headlines,
    sublines: rounds.cage.sublines,
  },
  linux: { pass: rounds.linux.pass },
  audioPass: audio.result,
};
const ctx = { windowTiles, cageCount: cageTiles.length, copy };
const rng = makeRng();
const FEEDBACK_LOCK_MS = () => (reducedMotion() ? 300 : 900);

function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

let state: CaptchaState = initialCaptcha;
let order: CaptchaTile[] = shuffle(windowTiles);

function restore(): void {
  const snap = readSession().captcha;
  if (!snap) return;
  state = {
    ...initialCaptcha,
    round: snap.round,
    roundRejections: snap.roundRejections,
    totalRejections: snap.totalRejections,
    flipped: snap.round === 'cage' && snap.roundRejections > 0,
    promptVariant: snap.round === 'cage' && snap.roundRejections >= 2 ? 'B' : 'A',
    phase: snap.completed ? 'complete' : 'round',
    method: snap.method === 'audio' ? 'audio' : snap.completed ? 'linux' : null,
  };
  if (state.phase === 'complete')
    state.feedback = {
      headline: state.method === 'audio' ? audio.result : rounds.linux.pass,
      subline: '',
    };
  if (state.round === 'cage') order = shuffle(cageTiles);
}

function persist(): void {
  writeSession({
    captcha: {
      round: state.round,
      roundRejections: state.roundRejections,
      totalRejections: state.totalRejections,
      completed: state.phase === 'complete',
      method: state.phase === 'skipped' ? 'skipped' : state.method,
    },
  });
}

const $ = <T extends HTMLElement>(sel: string) => root?.querySelector<T>(sel) ?? null;

function setPrompt(parts: readonly string[], sub: string): void {
  const h = $('[data-cn-prompt]');
  if (h) {
    const strong = document.createElement('strong');
    strong.textContent = parts[1] ?? '';
    h.replaceChildren(
      document.createTextNode(parts[0] ?? ''),
      strong,
      document.createTextNode(parts[2] ?? ''),
    );
  }
  const s = $('[data-cn-sub]');
  if (s) s.textContent = sub;
}

function tileButton(
  t: { id: string; src: string; alt: string },
  pressed: boolean,
): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cn__tile';
  b.dataset.tile = t.id;
  b.setAttribute('aria-pressed', String(pressed));
  const img = document.createElement('img');
  img.src = url(`/${t.src}`);
  img.alt = t.alt;
  img.width = 240;
  img.height = 240;
  img.decoding = 'async';
  const check = document.createElement('span');
  check.className = 'cn__check';
  check.setAttribute('aria-hidden', 'true');
  check.textContent = '✓';
  b.append(img, check);
  return b;
}

function renderGrid(stagger = false): void {
  const grid = $('[data-cn-grid]');
  const empty = $('[data-cn-empty]');
  if (!grid || !empty) return;
  if (state.round === 'linux') {
    grid.hidden = true;
    empty.hidden = false;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;
  const tiles =
    state.round === 'cage' && !state.flipped
      ? order.map((t) => ({ id: t.id, src: rectangleTile.src, alt: rectangleTile.alt }))
      : order;
  const buttons = tiles.map((t) => tileButton(t, state.selected.includes(t.id)));
  if (stagger && !reducedMotion()) {
    buttons.forEach((b, i) => {
      b.classList.add('is-fading');
      setTimeout(() => b.classList.remove('is-fading'), 60 * i + 30);
    });
  }
  grid.replaceChildren(...buttons);
}

function renderPrompt(): void {
  if (state.round === 'windows') setPrompt(rounds.windows.prompt, rounds.windows.sub);
  else if (state.round === 'cage') {
    const flippedSub = photoTiles ? rounds.cage.photo.flipped : rounds.cage.flipped;
    setPrompt(
      state.promptVariant === 'B' ? rounds.cage.promptB : rounds.cage.prompt,
      state.flipped ? flippedSub : rounds.cage.sub,
    );
  } else setPrompt(rounds.linux.prompt, rounds.linux.footnote);
  const caption = $('[data-cn-photo-caption]');
  if (caption) caption.hidden = state.round !== 'cage';
}

function renderFeedback(): void {
  const h = $('[data-cn-headline]');
  const s = $('[data-cn-subline]');
  if (h) h.textContent = state.feedback?.headline ?? '';
  if (s) s.textContent = state.feedback?.subline ?? '';
  const c = $('[data-cn-counter]');
  if (c) c.textContent = C.counter(state.totalRejections);
}

function showDone(): void {
  const challenge = $('[data-cn-challenge]');
  const done = $('[data-cn-done]');
  if (!challenge || !done) return;
  challenge.hidden = true;
  done.hidden = false;
  const title = $('[data-cn-done-headline]');
  if (title) title.textContent = state.feedback?.headline ?? rounds.linux.pass;
  const method = $('[data-cn-method]');
  if (method)
    method.textContent =
      state.method === 'audio' ? completion.method.audio : completion.method.linux;
  title?.focus({ preventScroll: true });
  announce(title?.textContent ?? '');
  runProgress();
}

function dispatch(e: CaptchaEvent): void {
  const prev = state;
  state = captchaReducer(state, e, ctx);
  if (state === prev) return;
  persist();
  if (e.t === 'SUBMIT' && state.phase === 'feedback') {
    bump('captchaReject');
    renderFeedback();
    announce(`${state.feedback?.headline ?? ''} ${state.feedback?.subline ?? ''}`);
    const verify = $<HTMLButtonElement>('[data-cn-verify]');
    verify?.setAttribute('aria-disabled', 'true');
    root?.querySelectorAll('.cn__tile').forEach((t) => t.classList.add('is-fading'));
    setTimeout(() => {
      const advancing = state.advanceTo;
      if (advancing === 'cage') order = shuffle(cageTiles);
      else if (!advancing) order = shuffle(order);
      dispatch({ t: 'FEEDBACK_DONE' });
      verify?.removeAttribute('aria-disabled');
    }, FEEDBACK_LOCK_MS());
    return;
  }
  if (e.t === 'FEEDBACK_DONE') {
    renderPrompt();
    renderGrid(true);
    return;
  }
  if (state.phase === 'complete') {
    renderFeedback();
    showDone();
    return;
  }
  if (e.t === 'TOGGLE' || e.t === 'FLIP') renderGrid();
}

/* ---------- Progress (Zeno) ---------- */
let progressD: Disposer | null = null;
function runProgress(): void {
  progressD?.run();
  const d = new Disposer();
  progressD = d;
  const bar = $<HTMLProgressElement>('[data-progress-bar]');
  const pct = $('[data-progress-pct]');
  const status = $('[data-progress-status]');
  const next = $<HTMLAnchorElement>('[data-cn-next]');
  const skip = $<HTMLButtonElement>('[data-progress-skip]');
  const fast = $<HTMLButtonElement>('[data-progress-skipfast]');
  const arena = $('[data-skipfast-arena]');
  let p = 0;
  let s = 0;
  const finish = () => {
    d.run();
    if (next) {
      next.hidden = false;
      next.textContent = completion.next;
    }
    next?.focus({ preventScroll: true });
  };
  const paint = () => {
    if (bar) bar.value = p;
    if (pct) pct.textContent = `${p.toFixed(1)}%`;
    bar?.setAttribute('aria-valuetext', `${p.toFixed(1)}%`);
  };
  if (reducedMotion()) {
    p = CAP;
    paint();
    if (status) status.textContent = P.final;
  } else {
    d.interval(() => {
      p = nextProgress(p);
      paint();
      if (p >= 99.3 && status) status.textContent = P.final;
    }, TICK_MS);
    d.interval(() => {
      if (p < 99.3 && status)
        status.textContent = progressStatuses[s++ % progressStatuses.length]?.text ?? '';
    }, STATUS_MS);
  }
  d.timeout(() => {
    if (skip) skip.textContent = P.continueAnyway;
  }, CONTINUE_AFTER_MS);
  skip?.addEventListener('click', finish, { once: true });
  fast?.addEventListener('click', finish, { once: true });
  if (fast && arena) {
    runaway(
      {
        id: 'skip-fast',
        el: fast,
        arena,
        mode: 'enter',
        maxDodges: 99,
        distance: 100,
        timeWindowMs: 2000,
        labels: P.skipFastLabels,
        finalLabel: P.skipFastFinal,
      },
      d,
    );
    d.timeout(() => {
      const label = fast.querySelector('[data-label]');
      if (label) label.textContent = P.skipFastFinal;
    }, 2000);
  }
}

/* ---------- Wiring ---------- */
if (root) {
  restore();
  renderPrompt();
  renderGrid();
  renderFeedback();
  if (state.phase === 'complete') showDone();

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tile = t.closest<HTMLElement>('[data-tile]');
    if (tile) {
      if (state.round === 'cage' && !state.flipped) dispatch({ t: 'FLIP' });
      dispatch({ t: 'TOGGLE', id: tile.dataset.tile ?? '' });
      root
        .querySelector<HTMLElement>(`[data-tile="${tile.dataset.tile}"]`)
        ?.focus({ preventScroll: true });
      return;
    }
    if (t.closest('[data-cn-verify]')) {
      if (t.closest('[aria-disabled="true"]')) return;
      dispatch({ t: 'SUBMIT' });
      return;
    }
    if (t.closest('[data-cn-new]')) {
      order = shuffle(order);
      renderGrid(true);
      toast(C.newChallengeToast);
      return;
    }
    if (t.closest('[data-cn-skip]')) {
      dispatch({ t: 'SKIP' });
      bump('captchaSkip');
      return; // the link navigates
    }
    if (t.closest('[data-cn-audio-play]')) {
      const cd = $('[data-cn-countdown]');
      const form = $('[data-cn-audio-form]');
      announce(audio.playing);
      let i = 0;
      const tick = () => {
        if (cd) cd.textContent = audio.countdown[i] ?? '';
        i += 1;
        if (i <= audio.countdown.length) setTimeout(tick, reducedMotion() ? 250 : 1000);
        else {
          if (cd) cd.textContent = audio.done;
          announce(audio.done);
          if (form) form.hidden = false;
          $('[data-cn-audio-input]')?.focus();
        }
      };
      if (cd) cd.textContent = audio.playing;
      setTimeout(tick, 400);
      return;
    }
    if (t.closest('[data-cn-audio-submit]')) dispatch({ t: 'AUDIO_PASS' });
  });
}
