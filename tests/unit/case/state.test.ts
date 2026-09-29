/** The case record: validation keeps what is valid, and the reducer only ever adds. */
import { describe, expect, it } from 'vitest';
import {
  DEPARTMENT_IDS,
  emptyCaseFile,
  NOTICE_IDS,
  reduceCase,
  validateCaseFile,
} from '../../../src/case/state';

describe('validateCaseFile', () => {
  it('gives a missing, non-object or malformed record safe defaults', () => {
    for (const bad of [undefined, null, 3, 'x', [], [1, 2]])
      expect(validateCaseFile(bad)).toEqual(emptyCaseFile());
  });

  it('keeps known IDs, filters unknown ones and removes duplicates, in first-seen order', () => {
    expect(
      validateCaseFile({
        departments: ['cube', 'nope', 'intake', 'cube', 7, null, 'doom'],
        issuedNotices: ['appendix-reviewed', 'appendix-reviewed', 'made-up'],
        released: true,
      }),
    ).toEqual({
      departments: ['cube', 'intake', 'doom'],
      issuedNotices: ['appendix-reviewed'],
      released: true,
    });
  });

  it('treats anything but true as not released, and non-arrays as empty', () => {
    expect(validateCaseFile({ departments: 'cube', released: 'yes' })).toEqual(emptyCaseFile());
  });

  it('knows every department and notice exactly once', () => {
    expect(new Set(DEPARTMENT_IDS).size).toBe(DEPARTMENT_IDS.length);
    expect(new Set(NOTICE_IDS).size).toBe(NOTICE_IDS.length);
  });
});

describe('reduceCase', () => {
  it('records each department once and returns the same object when nothing changes', () => {
    const a = reduceCase(emptyCaseFile(), { t: 'visit', department: 'cube' });
    expect(a.departments).toEqual(['cube']);
    expect(reduceCase(a, { t: 'visit', department: 'cube' })).toBe(a);
  });

  it('issues each notice once', () => {
    const a = reduceCase(emptyCaseFile(), { t: 'notice', id: 'inspection-absent' });
    expect(reduceCase(a, { t: 'notice', id: 'inspection-absent' })).toBe(a);
  });

  it('release only sets released: history and departments stay', () => {
    const visited = reduceCase(emptyCaseFile(), { t: 'visit', department: 'doom' });
    const released = reduceCase(visited, { t: 'release' });
    expect(released).toEqual({ departments: ['doom'], issuedNotices: [], released: true });
    expect(reduceCase(released, { t: 'release' })).toBe(released);
    // Exploration continues after approval.
    expect(reduceCase(released, { t: 'visit', department: 'cube' }).departments).toEqual([
      'doom',
      'cube',
    ]);
  });
});
