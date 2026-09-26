/** /rick/ and /r/*: "Begin due diligence" creates the player only on click; Continue goes where the page says. */
import { url } from '../../lib/paths';
import { openRickroll } from '.';

document.querySelectorAll<HTMLButtonElement>('[data-rick-begin]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.continue;
    openRickroll({ opener: btn, continueHref: next ? url(next) : null });
  });
});
