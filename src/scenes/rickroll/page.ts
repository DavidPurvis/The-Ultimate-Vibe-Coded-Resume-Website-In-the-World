/**
 * /rick/ and /r/*: "Begin due diligence" loads and creates the player only on click; Continue goes
 * where the page says.
 */
import { url } from '../../lib/paths';

document.querySelectorAll<HTMLButtonElement>('[data-rick-begin]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.continue;
    void import('.').then((m) =>
      m.openRickroll({ opener: btn, continueHref: next ? url(next) : null }),
    );
  });
});
