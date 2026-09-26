// @vitest-environment happy-dom
/** The case record: seed + accepted events in sessionStorage, validated on every load (plan §K). */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupLegacy, CASE_KEY, hintOf, load, save } from '../../src/runtime/persistence';
import { replay } from '../../src/domain/case';
import { _setBackends, type KV } from '../../src/lib/storage';
import type { CaseEvent } from '../../src/domain/events';

const OPEN: CaseEvent = { t: 'RESUME_REQUESTED', via: 'cta' };

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => _setBackends({ local: undefined, session: undefined }));

describe('persistence', () => {
  it('starts a fresh case when nothing is stored, and writes nothing until an event', () => {
    const l = load();
    expect(l.restored).toBe(false);
    expect(l.log).toEqual([]);
    expect(l.state.opened).toBe(false);
    expect(sessionStorage.getItem(CASE_KEY)).toBeNull();
  });

  it('round-trips seed and events; state is replayed, never stored', () => {
    const events: CaseEvent[] = [OPEN, { t: 'SCOPE_STATED', lane: 'emb' }];
    const { state } = replay(99, events);
    save(99, events, state);
    const raw = JSON.parse(sessionStorage.getItem(CASE_KEY) ?? '{}');
    expect(Object.keys(raw).sort()).toEqual(['events', 'hint', 'seed', 'v']);
    expect(raw.hint).toBe('open');
    const l = load();
    expect(l.restored).toBe(true);
    expect(l.seed).toBe(99);
    expect(l.state).toEqual(state);
  });

  it('starts over on corrupt JSON, another version or an invalid seed', () => {
    for (const raw of [
      '{not json',
      JSON.stringify({ v: 1, seed: 1, events: [] }),
      JSON.stringify({ v: 2, seed: -3, events: [] }),
      JSON.stringify({ v: 2, seed: 1.5, events: [] }),
      JSON.stringify({ v: 2, seed: 7, events: 'nope' }),
    ]) {
      sessionStorage.setItem(CASE_KEY, raw);
      expect(load().restored, raw).toBe(false);
    }
  });

  it('drops invalid and inapplicable events: the canonical log is what replays', () => {
    sessionStorage.setItem(
      CASE_KEY,
      JSON.stringify({
        v: 2,
        seed: 5,
        events: [
          OPEN,
          { t: 'RELEASE_ATTEMPTED', x: 1 },
          { t: 'ACKNOWLEDGED' },
          { t: 'SCOPE_STATED', lane: 'be' },
        ],
        hint: 'open',
      }),
    );
    const l = load();
    expect(l.log).toEqual([OPEN, { t: 'SCOPE_STATED', lane: 'be' }]);
    expect(l.state.step).toBe('preview');
  });

  it('hints arrival, open and closed', () => {
    expect(hintOf(replay(1, []).state)).toBe('arrival');
    expect(hintOf(replay(1, [OPEN]).state)).toBe('open');
    expect(hintOf(replay(1, [OPEN, { t: 'BYPASS_REQUESTED' }]).state)).toBe('closed');
  });

  it('removes the old site’s keys and nothing else', () => {
    localStorage.setItem('uvcr:prefs', '{}');
    localStorage.setItem('uvcr:biscotti:01', 'x');
    sessionStorage.setItem('uvcr:session', '{}');
    sessionStorage.setItem(CASE_KEY, '{}');
    localStorage.setItem('someone-else', '1');
    cleanupLegacy();
    expect(localStorage.getItem('uvcr:prefs')).toBeNull();
    expect(localStorage.getItem('uvcr:biscotti:01')).toBeNull();
    expect(sessionStorage.getItem('uvcr:session')).toBeNull();
    expect(sessionStorage.getItem(CASE_KEY)).toBe('{}');
    expect(localStorage.getItem('someone-else')).toBe('1');
  });

  it('keeps working in memory when storage throws', () => {
    const broken: KV = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
      key: () => null,
      length: 0,
    };
    _setBackends({ session: broken });
    const { state } = replay(3, [OPEN]);
    save(3, [OPEN], state);
    const l = load();
    expect(l.restored).toBe(true);
    expect(l.state.opened).toBe(true);
  });
});
