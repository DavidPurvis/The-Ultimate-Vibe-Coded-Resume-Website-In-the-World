/**
 * Keys the previous version of this site left in browsers (prefs, gag session, cookie-banner
 * biscotti). Removed by the home page and /privacy/; kept apart so /privacy/ needn't load the case.
 */
import { listKeys, removeRaw } from '../lib/storage';

export function cleanupLegacy(): void {
  for (const { area, key } of listKeys()) {
    if (key === 'uvcr:prefs' || key === 'uvcr:session' || key.startsWith('uvcr:biscotti:'))
      removeRaw(area, key);
  }
}
