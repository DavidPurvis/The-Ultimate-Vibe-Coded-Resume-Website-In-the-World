/** Header callback: "Welcome back, self-declared Clippy." */
import { readSession } from './storage';
import { callbacks } from '../content/copy/global';
import { callbackLabels, type IdentityId } from '../content/copy/identityLabels';

export function renderIdentityCallback(): void {
  const el = document.querySelector<HTMLElement>('[data-identity-callback]');
  if (!el) return;
  const id = readSession().identity;
  if (id?.refused) el.textContent = callbacks.refused;
  else if (id?.claimed && id.claimed in callbackLabels)
    el.textContent = callbacks.claimed(callbackLabels[id.claimed as IdentityId]);
  else el.textContent = callbacks.unknown;
}
