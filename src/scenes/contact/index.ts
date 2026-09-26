/** Contact (Theoretically): a ten-billion-step phone slider and an email drum. Nothing is sent. */
import { contactCopy as C } from '../../content/copy/contact';
import { formatPhone } from '../../lib/format';
import { toast } from '../../lib/toast';
import {
  currentChar,
  DRUM_CHARS,
  DRUM_STEP_DEG,
  drumReducer,
  type DrumEvent,
  type DrumState,
} from './logic';

/* ---------- phone slider ---------- */
const phone = document.querySelector<HTMLInputElement>('[data-phone]');
const phoneOut = document.querySelector<HTMLOutputElement>('[data-phone-out]');
const syncPhone = () => {
  if (!phone) return;
  const f = formatPhone(Number(phone.value));
  phone.setAttribute('aria-valuetext', f);
  if (phoneOut) phoneOut.value = f;
};
phone?.addEventListener('input', syncPhone);
syncPhone();
document.querySelector('[data-phone-done]')?.addEventListener('click', () => {
  const r = document.querySelector<HTMLElement>('[data-phone-result]');
  if (r) r.textContent = C.phone.result;
});

/* ---------- email drum ---------- */
const section = document.querySelector<HTMLElement>('[data-drum-section]');
const drum = document.querySelector<HTMLElement>('[data-drum]');
const ring = document.querySelector<HTMLElement>('[data-drum-ring]');
const out = document.querySelector<HTMLOutputElement>('[data-drum-out]');
const faces = [...(ring?.children ?? [])] as HTMLElement[];
let state: DrumState = { index: 0, composed: '' };

if (section && drum && ring) {
  const radius = (2.6 * 16) / Math.tan(Math.PI / DRUM_CHARS.length); // px, keeps faces edge to edge
  faces.forEach((f, i) => {
    f.style.transform = `rotateX(${-i * DRUM_STEP_DEG}deg) translateZ(${radius.toFixed(1)}px)`;
  });

  const render = (prev: DrumState | null) => {
    ring.style.transform = `translateZ(${(-radius).toFixed(1)}px) rotateX(${state.index * DRUM_STEP_DEG}deg)`;
    faces.forEach((f, i) => f.classList.toggle('is-current', i === state.index));
    const ch = currentChar(state);
    drum.setAttribute('aria-valuenow', String(state.index));
    drum.setAttribute('aria-valuetext', ch);
    if (out) out.value = state.composed;
    if (prev && prev.index !== state.index && ch === '@') toast(C.drum.milestone);
  };
  const dispatch = (e: DrumEvent) => {
    const prev = state;
    state = drumReducer(state, e);
    render(prev);
  };
  render(null);

  document.querySelector('[data-drum-up]')?.addEventListener('click', () => dispatch({ t: 'UP' }));
  document
    .querySelector('[data-drum-down]')
    ?.addEventListener('click', () => dispatch({ t: 'DOWN' }));
  document
    .querySelector('[data-drum-add]')
    ?.addEventListener('click', () => dispatch({ t: 'ADD' }));
  document
    .querySelector('[data-drum-del]')
    ?.addEventListener('click', () => dispatch({ t: 'DELETE' }));
  drum.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') dispatch({ t: 'UP' });
    else if (e.key === 'ArrowDown') dispatch({ t: 'DOWN' });
    else if (e.key === 'Enter' || e.key === ' ') dispatch({ t: 'ADD' });
    else if (e.key === 'Backspace') dispatch({ t: 'DELETE' });
    else return;
    e.preventDefault();
  });
  document.querySelector('[data-drum-send]')?.addEventListener('click', () => {
    const r = document.querySelector<HTMLElement>('[data-drum-result]');
    if (r) r.textContent = C.drum.result;
  });
}
