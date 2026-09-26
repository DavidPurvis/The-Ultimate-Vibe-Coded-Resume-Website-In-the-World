/**
 * Golden guard for the overhaul: the résumé's render model, plain text and Markdown must not
 * change unless a commit changes them on purpose (and regenerates these files with -u).
 */
import { describe, expect, it } from 'vitest';
import { LANES, LANE_IDS } from '../../../src/content/lanes';
import { renderResumeMarkdown, renderResumeText } from '../../../src/lib/resumeText';

describe('golden résumé outputs', () => {
  for (const id of LANE_IDS) {
    it(`${id}: plain text`, async () => {
      await expect(`${renderResumeText(LANES[id])}\n`).toMatchFileSnapshot(
        `../../golden/resume-${id}.txt`,
      );
    });
    it(`${id}: render model`, async () => {
      await expect(`${JSON.stringify(LANES[id], null, 2)}\n`).toMatchFileSnapshot(
        `../../golden/resume-${id}.model.json`,
      );
    });
  }

  it('resume.md', async () => {
    await expect(renderResumeMarkdown('https://example.test/resume.pdf')).toMatchFileSnapshot(
      '../../golden/resume.md.txt',
    );
  });
});
