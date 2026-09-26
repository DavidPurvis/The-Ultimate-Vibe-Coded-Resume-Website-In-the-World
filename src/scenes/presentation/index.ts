/**
 * Résumé.ppt: slides take their transition as they scroll in, and cartoon ad-libs pop from the
 * edges (at most three at once, gone after three seconds, click to pop). Optional whoosh.
 */
import { readPrefs, writePrefs } from '../../lib/storage';
import { reducedMotion } from '../../lib/motion';
import { isChaos } from '../../lib/mode';
import { BURST_MS, overflow, type BurstSpec } from './logic';

const slides = [...document.querySelectorAll<HTMLElement>('[data-slide]')];
const soundBtn = document.querySelector<HTMLButtonElement>('[data-ppt-sound]');
const raw = document.querySelector<HTMLElement>('[data-ppt-copy]')?.dataset.pptCopy;
const copy = raw ? (JSON.parse(raw) as { sound: { on: string; off: string } }) : null;
const live: HTMLElement[] = [];
let audio: AudioContext | null = null;

function whoosh(): void {
  if (!readPrefs().sound) return;
  try {
    audio ??= new AudioContext();
    const len = Math.floor(audio.sampleRate * 0.35);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, audio.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, audio.currentTime + 0.3);
    gain.gain.value = 0.08;
    src.buffer = buf;
    src.connect(filter).connect(gain).connect(audio.destination);
    src.start();
  } catch {
    /* no audio, no whoosh */
  }
}

function removeBurst(b: HTMLElement, immediately = false): void {
  const i = live.indexOf(b);
  if (i >= 0) live.splice(i, 1);
  if (immediately) {
    b.remove();
    return;
  }
  b.classList.add('is-leaving');
  window.setTimeout(() => b.remove(), 320);
}

function pop(slide: HTMLElement): void {
  if (reducedMotion() || !isChaos()) return;
  const specs = JSON.parse(slide.dataset.bursts ?? '[]') as BurstSpec[];
  for (let n = overflow(live.length, specs.length); n > 0; n--) {
    const oldest = live[0];
    if (oldest) removeBurst(oldest, true); // evicted: gone now, so there are never more than three
  }
  for (const s of specs) {
    const b = document.createElement('div');
    b.className = `burst burst--${s.side}`;
    b.setAttribute('aria-hidden', 'true');
    b.textContent = s.text;
    b.style.top = `${Math.round(s.y * 100)}%`;
    b.style.setProperty('--burst-rot', `${s.rotate}deg`);
    b.addEventListener('click', () => removeBurst(b));
    slide.append(b);
    live.push(b);
    window.setTimeout(() => {
      if (b.isConnected) removeBurst(b);
    }, BURST_MS);
  }
}

function reveal(slide: HTMLElement): void {
  if (slide.classList.contains('is-in')) return;
  slide.classList.add('is-in');
  pop(slide);
  whoosh();
}

if (reducedMotion() || !('IntersectionObserver' in window)) {
  for (const s of slides) s.classList.add('is-in');
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          reveal(e.target as HTMLElement);
          io.unobserve(e.target);
        }
    },
    { threshold: 0.2 },
  );
  for (const s of slides) io.observe(s);
  // Printing, or jumping around with find-in-page, should never leave a slide invisible.
  window.addEventListener('beforeprint', () => slides.forEach((s) => s.classList.add('is-in')));
}

function syncSound(): void {
  if (!soundBtn || !copy) return;
  const on = readPrefs().sound;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? copy.sound.on : copy.sound.off;
}
soundBtn?.addEventListener('click', () => {
  writePrefs({ sound: !readPrefs().sound });
  syncSound();
});
syncSound();
