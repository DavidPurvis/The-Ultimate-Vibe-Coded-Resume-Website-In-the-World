/** /doom/: the full-size player. Leaving the page disposes it (and the engine frame with it). */
import { mountPage } from '../runtime/lifecycle';
import { wirePlayer } from '../doom/player';

mountPage(({ scope }) => {
  const root = document.querySelector<HTMLElement>('[data-doom-page] [data-doom-player]');
  if (root) wirePlayer(scope, root);
});
