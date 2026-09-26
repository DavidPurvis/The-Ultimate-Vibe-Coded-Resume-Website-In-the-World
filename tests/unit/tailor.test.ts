import { describe, expect, it } from 'vitest';
import {
  JD_MAX,
  RULES,
  URL_MAX,
  asciiFold,
  buildPrompt,
  claudeUrl,
  handoff,
  pickLane,
  type Family,
  type Focus,
} from '../../src/scenes/tailor/logic';
import { LANE_IDS, LANES } from '../../src/content/lanes';
import { renderResumeText } from '../../src/lib/resumeText';
import { tailorCopy } from '../../src/content/copy/tailor';

const BASE = 'https://claude.ai/new';
const labels = {
  family: Object.fromEntries(tailorCopy.family.options.map((o) => [o.value, o.label])),
  focus: Object.fromEntries(tailorCopy.focus.options.map((o) => [o.value, o.label])),
};
const laneFor = (id: (typeof LANE_IDS)[number]) => ({
  label: LANES[id].label,
  url: `https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World${LANES[id].path}`,
  text: renderResumeText(LANES[id]),
});
const decode = (href: string) => decodeURIComponent(href.slice(`${BASE}?q=`.length));

describe('pickLane', () => {
  it('follows the role family when one is given', () => {
    for (const f of ['emb', 'plt', 'be', 'gen'] as const) {
      expect(pickLane({ family: f })).toBe(f);
      expect(pickLane({ family: f, focus: 'vibes' })).toBe(f);
    }
  });

  it('defers to what matters most for fans and the undecided', () => {
    const table: [Focus, string][] = [
      ['hardware', 'emb'],
      ['debugging', 'emb'],
      ['ownership', 'plt'],
      ['data', 'be'],
      ['vibes', 'gen'],
    ];
    for (const [focus, lane] of table) {
      expect(pickLane({ family: 'fan', focus })).toBe(lane);
      expect(pickLane({ focus })).toBe(lane);
    }
  });

  it('falls back to the standard cut with no answers', () => {
    expect(pickLane({})).toBe('gen');
    expect(pickLane({ family: 'fan' as Family })).toBe('gen');
  });
});

describe('asciiFold', () => {
  it('flattens typography without changing the words', () => {
    expect(asciiFold('David’s résumé — Apr 2025 – May 2026 · “Magna”™ •')).toBe(
      'David\'s resume - Apr 2025 - May 2026 | "Magna" -',
    );
  });
});

describe('buildPrompt', () => {
  const lane = laneFor('emb');

  it('carries the answers, the integrity rules and the whole lane résumé', () => {
    const p = buildPrompt(
      { family: 'emb', focus: 'hardware', summary: 'no', jd: 'Firmware role' },
      lane,
      labels,
    );
    expect(p).toContain('Role: Embedded software or embedded Linux');
    expect(p).toContain('What matters most: Low-level and hardware knowledge');
    expect(p).toContain('Open with a summary: no');
    expect(p).toContain('Job description:\n"""\nFirmware role\n"""');
    for (const r of RULES) expect(p).toContain(`- ${asciiFold(r)}`);
    expect(p).toContain(asciiFold(lane.text));
    expect(p).toContain(lane.url);
  });

  it('leaves the visitor’s job description exactly as typed', () => {
    const jd = 'Ingeniería de “firmware” — 東京';
    expect(buildPrompt({ jd }, lane, labels)).toContain(jd);
  });

  it('says so when there is no job description', () => {
    const p = buildPrompt({ jd: '   ' }, lane, labels);
    expect(p).toContain('No job description provided.');
    expect(p).not.toContain('"""');
  });
});

describe('handoff', () => {
  const longAscii = 'Ships reliable Linux software and debugs hardware. '.repeat(100);
  const longUnicode = 'Ingeniería — “fiabilidad” · 東京 '.repeat(200);

  it('builds a claude.ai/new?q= link', () => {
    expect(claudeUrl(BASE, 'a b')).toBe('https://claude.ai/new?q=a%20b');
  });

  it.each(LANE_IDS)('fits the %s cut in the link with room for a job description', (id) => {
    const h = handoff({ family: 'gen' }, laneFor(id), labels, BASE);
    expect(h.truncated).toBe(false);
    expect(h.href.length).toBeLessThan(URL_MAX - 1500);
    expect(decode(h.href)).toBe(h.prompt);
  });

  it.each(LANE_IDS)(
    'shortens only the job description when the %s link would be too long',
    (id) => {
      for (const jd of [longAscii, longUnicode]) {
        const h = handoff({ family: 'emb', jd }, laneFor(id), labels, BASE);
        expect(h.truncated).toBe(true);
        expect(h.href.length).toBeLessThanOrEqual(URL_MAX);
        const sent = decode(h.href);
        expect(sent).toContain(asciiFold(laneFor(id).text));
        for (const r of RULES) expect(sent).toContain(asciiFold(r));
        expect(sent).toContain('[…]');
        // The read-only box keeps the job description, capped at JD_MAX.
        expect(h.prompt).toContain(jd.trim().slice(0, JD_MAX));
        expect(h.prompt).not.toContain(jd.trim().slice(0, JD_MAX + 1));
      }
    },
  );

  it('uses as much of the job description as fits', () => {
    const h = handoff({ jd: longAscii }, laneFor('gen'), labels, BASE);
    const kept = /"""\n([\s\S]*?) \[…\]\n"""/.exec(decode(h.href))?.[1] ?? '';
    expect(kept.length).toBeGreaterThan(1000);
    expect(h.href.length).toBeGreaterThan(URL_MAX - 100);
  });
});
