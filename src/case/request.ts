/**
 * Request résumé, progressively enhanced. The anchor is always a real link to /resume/. Only a
 * plain activation is intercepted, and only when departmental procedures are on, the release has
 * not already been approved this session, and native <dialog> is available. Modified clicks, new
 * tabs, downloads, Direct access and every later request after approval navigate as usual.
 *
 * The procedure itself is a lazy chunk. If it fails to load, the visitor is taken to the link's
 * destination; if the request went stale meanwhile (closed, navigated, Direct access, a newer
 * request), nothing happens at all.
 */
import { isChaos } from '../lib/mode';
import { isActive, request } from '../lib/scene';
import { readSession } from '../lib/storage';

export interface ReleaseModule {
  setOpener(a: HTMLAnchorElement): void;
}

export interface ReleaseLinkOpts {
  load?: () => Promise<ReleaseModule>;
  navigate?: (href: string) => void;
}

const dialogSupported = (): boolean =>
  typeof HTMLDialogElement === 'function' &&
  typeof HTMLDialogElement.prototype.showModal === 'function';

/** Whether this activation of a release link should open the procedure instead of navigating. */
export function shouldIntercept(e: MouseEvent, a: HTMLAnchorElement): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.hasAttribute('download') || (a.target && a.target !== '_self')) return false;
  return isChaos() && !readSession().caseFile.released && dialogSupported();
}

export function initReleaseLinks(o: ReleaseLinkOpts = {}): void {
  const load = o.load ?? (() => import('./release'));
  const navigate = o.navigate ?? ((href: string) => location.assign(href));
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-release]');
    if (!a || !shouldIntercept(e, a)) return;
    e.preventDefault();
    // A second activation while the procedure is open or loading creates nothing new.
    if (isActive('release')) return;
    let failed = false;
    void request(
      'release',
      async () => {
        try {
          (await load()).setOpener(a);
        } catch (err) {
          failed = true;
          throw err;
        }
      },
      () => isChaos() && a.isConnected,
    ).then((started) => {
      if (!started && failed && isChaos() && a.isConnected) navigate(a.href);
    });
  });
}
