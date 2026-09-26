/** "Inspect me": one visible state change (no flashing), announced, reverting after 6 seconds. */
import { announce } from '../../lib/announce';
import { onModeChange } from '../../lib/mode';
import { howBuiltCopy as H } from '../../content/copy/howBuilt';

const btn = document.querySelector<HTMLButtonElement>('[data-inspect-me]');
let timer = 0;

function set(on: boolean): void {
  document.documentElement.classList.toggle('inspected', on);
  btn?.setAttribute('aria-pressed', String(on));
  clearTimeout(timer);
  if (on) {
    announce(H.inspectAnnounce);
    timer = window.setTimeout(() => set(false), 6000);
  }
}

btn?.addEventListener('click', () =>
  set(!document.documentElement.classList.contains('inspected')),
);
window.addEventListener('pagehide', () => set(false));
onModeChange((m) => {
  if (m === 'recruiter') set(false);
});
