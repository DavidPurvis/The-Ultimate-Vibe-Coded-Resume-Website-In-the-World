/**
 * Keys an earlier version of this site left in browsers. The Recruiter Verification case record
 * ("uvcr:case") is gone; preferences and the session record are in use again and are kept.
 */
import { listKeys, removeRaw } from '../lib/storage';

const RETIRED = new Set(['uvcr:case']);

export function cleanupLegacy(): void {
  for (const { area, key } of listKeys()) if (RETIRED.has(key)) removeRaw(area, key);
}
