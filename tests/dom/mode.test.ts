// @vitest-environment happy-dom
/**
 * Direct access: the internal values and ?mode= are unchanged, and switching on is a transaction
 * that stops procedures, closes dialogs, drops the novelty theme and remembers the choice.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetMode,
  getMode,
  initMode,
  isDirectAccess,
  onModeChange,
  parseModeParam,
  setMode,
} from '../../src/lib/mode';
import { _reset, isActive, register, start } from '../../src/lib/scene';
import { readPrefs, writePrefs } from '../../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<main id="main" tabindex="-1"></main>';
  document.documentElement.removeAttribute('data-theme');
  _resetMode();
  _reset();
});
afterEach(() => vi.unstubAllGlobals());

describe('mode', () => {
  it('parses only the two known values', () => {
    expect(parseModeParam('?mode=recruiter')).toBe('recruiter');
    expect(parseModeParam('?mode=chaos')).toBe('chaos');
    expect(parseModeParam('?mode=boss')).toBeNull();
    expect(parseModeParam('')).toBeNull();
  });

  it('starts from the saved preference, and a ?mode= link overrides and is saved', () => {
    writePrefs({ mode: 'recruiter' });
    expect(initMode()).toBe('recruiter');
    expect(document.documentElement.dataset.mode).toBe('recruiter');
    _resetMode();
    vi.stubGlobal('location', { search: '?mode=chaos' });
    expect(initMode()).toBe('chaos');
    expect(readPrefs().mode).toBe('chaos');
  });

  it('switching to Direct access stops scenes, closes dialogs and drops the novelty theme', async () => {
    initMode();
    register({ id: 'cookies', major: true, start: () => {} });
    await start('cookies');
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    dialog.showModal?.();
    dialog.setAttribute('open', '');
    document.documentElement.setAttribute('data-theme', 'comic');
    writePrefs({ theme: 'comic' });
    const seen: string[] = [];
    onModeChange((m) => seen.push(m));

    setMode('recruiter');
    expect(isDirectAccess()).toBe(true);
    expect(isActive('cookies')).toBe(false);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(readPrefs()).toMatchObject({ mode: 'recruiter', theme: 'system' });
    expect(seen).toEqual(['recruiter']);
    expect(document.getElementById('announcer')).toBeNull(); // no live region: announce is a no-op

    // Procedures refuse to start until Direct access is off again.
    expect(await start('cookies')).toBe(false);
    setMode('chaos', { announce: false });
    expect(getMode()).toBe('chaos');
    expect(await start('cookies')).toBe(true);
  });

  it('switching to the same mode does nothing', () => {
    initMode();
    const seen: string[] = [];
    onModeChange((m) => seen.push(m));
    setMode('chaos');
    expect(seen).toEqual([]);
  });
});
