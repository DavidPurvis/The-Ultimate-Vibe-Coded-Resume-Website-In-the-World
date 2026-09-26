/** /doom/: the full-size player. */
import { wirePlayer } from './player';

const root = document.querySelector<HTMLElement>('[data-doom-page] [data-doom-player]');
if (root) wirePlayer(root, 'doom');
