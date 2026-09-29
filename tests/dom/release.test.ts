// @vitest-environment happy-dom
/**
 * The résumé release procedure (handoff §3): three views, each with a direct link and a close;
 * approval recorded when the determination is shown; later requests go straight through; only a
 * plain activation is intercepted; failures fall back to the link; stale work does nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initReleaseLinks, shouldIntercept, type ReleaseModule } from '../../src/case/request';
import * as release from '../../src/case/release';
import { _resetMode, initMode, setMode } from '../../src/lib/mode';
import { _reset, disposeAll, isActive, register } from '../../src/lib/scene';
import { readSession, writeSession } from '../../src/lib/storage';
import { emptyCaseFile } from '../../src/case/state';

const RESUME = 'https://example.test/site/resume/';
const tick = () => new Promise((r) => setTimeout(r, 0));
let controller: AbortController;

function link(): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = RESUME;
  a.dataset.release = '';
  a.textContent = 'Request résumé';
  document.body.append(a);
  return a;
}
const click = (a: HTMLElement, init: MouseEventInit = {}) => {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  a.dispatchEvent(e);
  return e;
};
const dialog = () => document.getElementById('release') as HTMLDialogElement | null;
const view = () => dialog()?.dataset.releaseView ?? null;
const button = (name: string) =>
  [...(dialog()?.querySelectorAll<HTMLElement>('button, a') ?? [])].find(
    (b) => b.textContent === name,
  );

/** The release scene, registered again after each registry reset. */
async function freshRelease(): Promise<ReleaseModule> {
  release.registerRelease();
  return release;
}

beforeEach(async () => {
  document.body.replaceChildren();
  localStorage.clear();
  sessionStorage.clear();
  _reset();
  _resetMode();
  document.documentElement.removeAttribute('data-mode');
  initMode();
  controller = new AbortController();
});
afterEach(() => {
  controller.abort();
  disposeAll('navigate');
});

/** initReleaseLinks with listeners that end with the test. */
function wire(o: Parameters<typeof initReleaseLinks>[0]): void {
  const add = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementationOnce((type, fn, opts) =>
    add(type, fn, { ...(typeof opts === 'object' ? opts : {}), signal: controller.signal }),
  );
  initReleaseLinks(o);
}

describe('which activations are intercepted', () => {
  it('only a plain primary click, with procedures on, not yet released, and <dialog> available', () => {
    const a = link();
    const plain = new MouseEvent('click', { button: 0 });
    expect(shouldIntercept(plain, a)).toBe(true);
    for (const init of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ])
      expect(shouldIntercept(new MouseEvent('click', { button: 0, ...init }), a)).toBe(false);
    a.target = '_blank';
    expect(shouldIntercept(plain, a)).toBe(false);
    a.target = '';
    a.setAttribute('download', '');
    expect(shouldIntercept(plain, a)).toBe(false);
    a.removeAttribute('download');
    writeSession({ caseFile: { ...emptyCaseFile(), released: true } });
    expect(shouldIntercept(plain, a)).toBe(false);
    writeSession({ caseFile: emptyCaseFile() });
    setMode('recruiter', { announce: false });
    expect(shouldIntercept(plain, a)).toBe(false);
    setMode('chaos', { announce: false });
    const showModal = HTMLDialogElement.prototype.showModal;
    // @ts-expect-error simulating a browser without native dialogs
    HTMLDialogElement.prototype.showModal = undefined;
    expect(shouldIntercept(plain, a)).toBe(false);
    HTMLDialogElement.prototype.showModal = showModal;
  });
});

describe('the procedure', () => {
  it('three views, each with a direct link and a close; approval when shown @smoke', async () => {
    const mod = await freshRelease();
    wire({ load: async () => mod });
    const a = link();
    expect(click(a).defaultPrevented).toBe(true);
    await tick();
    expect(view()).toBe('request');
    expect(dialog()?.open).toBe(true);
    expect(dialog()?.textContent).toContain('You are requesting David Purvis’s résumé.');
    for (const name of ['Go directly to résumé', 'Close']) expect(button(name), name).toBeTruthy();
    expect(button('Go directly to résumé')?.getAttribute('href')).toBe(RESUME);

    button('Confirm request')?.click();
    expect(view()).toBe('confirm');
    expect(dialog()?.textContent).toContain(
      'Please confirm that your previous confirmation concerned this document.',
    );
    expect(readSession().caseFile.released).toBe(false);

    button('Confirm')?.click();
    expect(view()).toBe('determination');
    expect(dialog()?.textContent).toContain('Approved.');
    expect(dialog()?.textContent).toContain('No supporting declarations were supplied.');
    expect(button('Open résumé')?.getAttribute('href')).toBe(RESUME);
    expect(button('Go directly to résumé')).toBeTruthy();
    expect(readSession().caseFile.released).toBe(true);

    // Nothing navigates by itself; later requests go straight through.
    button('Close')?.click();
    await tick();
    expect(dialog()).toBeNull();
    expect(click(a).defaultPrevented).toBe(false);
  });

  it('the determination cites only what was recorded', async () => {
    writeSession({
      identity: { declared: 'human', model: null, transcription: null },
      casinoLosses: 2,
      caseFile: { ...emptyCaseFile(), departments: ['intake', 'allocation', 'cube'] },
    });
    const mod = await freshRelease();
    wire({ load: async () => mod });
    click(link());
    await tick();
    button('Confirm request')?.click();
    button('Confirm')?.click();
    const text = dialog()?.textContent ?? '';
    expect(text).toContain('3 departments consulted.');
    expect(text).toContain('Classification: human, as declared.');
    expect(text).toContain('2 unsuccessful allocations on file.');
    expect(text).not.toContain('Verification');
    expect(text).not.toContain('No supporting declarations');
  });

  it('Escape or closing early costs nothing, and the next request starts at the beginning', async () => {
    const mod = await freshRelease();
    wire({ load: async () => mod });
    const a = link();
    click(a);
    await tick();
    button('Confirm request')?.click();
    dialog()?.close('cancel');
    await tick();
    expect(dialog()).toBeNull();
    expect(readSession().caseFile.released).toBe(false);
    click(a);
    await tick();
    expect(view()).toBe('request');
  });

  it('a second activation opens nothing new', async () => {
    const mod = await freshRelease();
    wire({ load: async () => mod });
    const a = link();
    click(a);
    click(a);
    await tick();
    click(a);
    await tick();
    expect(document.querySelectorAll('#release')).toHaveLength(1);
  });

  it('Direct access closes an open procedure and leaves the link working', async () => {
    const mod = await freshRelease();
    wire({ load: async () => mod });
    const a = link();
    click(a);
    await tick();
    expect(isActive('release')).toBe(true);
    setMode('recruiter', { announce: false });
    expect(isActive('release')).toBe(false);
    expect(dialog()).toBeNull();
    expect(click(a).defaultPrevented).toBe(false);
  });

  it('a failed load falls back to the link’s destination', async () => {
    const navigate = vi.fn();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    wire({ load: () => Promise.reject(new Error('offline')), navigate });
    click(link());
    await tick();
    await tick();
    expect(navigate).toHaveBeenCalledWith(RESUME);
    err.mockRestore();
  });

  it('a load that finishes after the visitor moved on opens nothing and goes nowhere', async () => {
    const navigate = vi.fn();
    let finish!: (m: ReleaseModule) => void;
    const mod = await freshRelease();
    wire({ load: () => new Promise<ReleaseModule>((r) => (finish = r)), navigate });
    click(link());
    disposeAll('navigate');
    finish(mod);
    await tick();
    await tick();
    expect(dialog()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('a procedure started elsewhere replaces it', async () => {
    const mod = await freshRelease();
    wire({ load: async () => mod });
    register({ id: 'other', major: true, start() {} });
    click(link());
    await tick();
    const { start } = await import('../../src/lib/scene');
    await start('other');
    expect(isActive('release')).toBe(false);
    expect(dialog()).toBeNull();
  });
});
