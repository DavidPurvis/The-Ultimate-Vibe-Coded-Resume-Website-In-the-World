/** The résumé's only script: the Print button. No case, no storage, nothing else. */
import { mountPage } from '../runtime/lifecycle';

mountPage(({ root, scope }) => {
  const print = root.querySelector('[data-print]');
  if (print) scope.on(print, 'click', () => window.print());
});
