/** The content model proves every résumé line traces to a fact and adds nothing (F1, F2). */
import { describe, expect, it } from 'vitest';
import { CONTENT, validateContent, type ContentModel } from '../../../src/content/resume/validate';
import type { Framing, FramingId } from '../../../src/content/resume/types';

/** A copy of the model with one framing replaced (or added). */
function withFraming(f: Framing): ContentModel {
  return { ...CONTENT, framings: { ...CONTENT.framings, [f.id]: f } };
}
const found = CONTENT.framings['A1:gen'];
if (!found) throw new Error('A1:gen is missing');
const base: Framing = found;

describe('validateContent', () => {
  it('the published content is clean', () => {
    expect(validateContent()).toEqual([]);
  });

  it('rejects a framing of an unknown fact', () => {
    const bad = withFraming({ ...base, id: 'A9:gen' as FramingId, fact: 'A9' as Framing['fact'] });
    expect(validateContent(bad).map((x) => x.rule)).toContain('fact');
  });

  it('rejects an adapted framing with no reason', () => {
    const { why: _why, ...rest } = base;
    const bad = withFraming({ ...rest, origin: 'adapted' });
    expect(validateContent(bad)).toContainEqual(
      expect.objectContaining({ rule: 'fact', where: 'A1:gen' }),
    );
  });

  it('rejects a number the fact does not carry', () => {
    const bad = withFraming({ ...base, text: `${base.text} Saved 40% of the budget.` });
    expect(validateContent(bad)).toContainEqual(
      expect.objectContaining({ rule: 'number', where: 'A1:gen' }),
    );
  });

  it('rejects a technology the fact does not carry, and one with no evidence at all', () => {
    const foreign = withFraming({ ...base, text: `${base.text} Wrote the Docker images.` });
    expect(validateContent(foreign)).toContainEqual(
      expect.objectContaining({ rule: 'term', where: 'A1:gen' }),
    );
    const absent = withFraming({ ...base, text: `${base.text} Ran it on Kubernetes.` });
    expect(validateContent(absent)).toContainEqual(
      expect.objectContaining({ rule: 'absent-tech', where: 'A1:gen' }),
    );
  });

  it('rejects a bullet placed under the wrong role', () => {
    const c = CONTENT.compositions.gen;
    const bad: ContentModel = {
      ...CONTENT,
      compositions: {
        ...CONTENT.compositions,
        gen: {
          ...c,
          roles: c.roles.map((r) => (r.role === 'cspire' ? { ...r, bullets: ['A1:gen'] } : r)),
        },
      },
    };
    expect(validateContent(bad)).toContainEqual(
      expect.objectContaining({ rule: 'placement', where: 'gen:A1:gen' }),
    );
  });

  it('rejects a composition that references a missing framing or runs out of order', () => {
    const c = CONTENT.compositions.plt;
    const bad: ContentModel = {
      ...CONTENT,
      compositions: {
        ...CONTENT.compositions,
        plt: { ...c, summary: 'SUM-PLT:nowhere', roles: [...c.roles].reverse() },
      },
    };
    const rules = validateContent(bad).map((x) => x.rule);
    expect(rules).toContain('reference');
    expect(rules).toContain('order');
  });

  it('grandfathered wording is exactly what is listed for David to confirm', () => {
    const report = CONTENT.grandfathered.map((g) => `${g.where} ${g.kind} ${g.value}`);
    expect(report).toEqual([
      'A2:gen term Oracle Financials',
      'A2:be term Oracle Financials',
      'P2:emb term USB HID',
      'P2:plt term USB HID',
      'P1:emb number 800x480',
      'stack:P1 term aiohttp',
      'stack:P1 term dbus-next',
    ]);
    const ungrandfathered: ContentModel = { ...CONTENT, grandfathered: [] };
    expect(validateContent(ungrandfathered)).toHaveLength(7);
  });
});
