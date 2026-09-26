/**
 * Verifies a résumé PDF against the pack's hard requirements: exactly one US Letter page,
 * a selectable text layer, the integrity rules, and no fiction anywhere (text layer or metadata).
 * Writes reports/resume-report.json (GEN) or reports/resume-{lane}-report.json for the PR body.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { checkResumeText, formatViolations } from '../src/lib/integrity';
import { LANE_IDS, LANES, type LaneId } from '../src/content/lanes';
import { selection } from '../src/content/resume';
import { institutionStrings } from '../src/content/institution/strings';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SUBJECT = 'Résumé — Software Engineer';

interface TextItemLike {
  str: string;
  transform: number[];
}

export async function extractPdf(path: string): Promise<{
  pages: number;
  lines: string[];
  width: number;
  height: number;
  subject: string | undefined;
  meta: string;
}> {
  const buf = await readFile(path);
  const doc = await PDFDocument.load(buf);
  const first = doc.getPage(0).getSize();
  const pdf = await getDocument({ data: new Uint8Array(buf), useSystemFonts: false }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of tc.items as unknown as TextItemLike[]) {
      if (typeof it.str !== 'string' || !it.str) continue;
      const y = Math.round((it.transform[5] ?? 0) * 2) / 2;
      const x = it.transform[4] ?? 0;
      const row = rows.get(y) ?? [];
      row.push({ x, s: it.str });
      rows.set(y, row);
    }
    const ys = [...rows.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const text = (rows.get(y) ?? [])
        .sort((a, b) => a.x - b.x)
        .map((r) => r.s)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) lines.push(text);
    }
  }
  return {
    pages: doc.getPageCount(),
    lines,
    width: first.width,
    height: first.height,
    subject: doc.getSubject(),
    meta: [doc.getTitle(), doc.getAuthor(), doc.getSubject(), doc.getCreator(), doc.getProducer()]
      .concat(doc.getKeywords() ?? '')
      .join('\n'),
  };
}

export async function verifyPdf(
  path = resolve(ROOT, 'dist', 'resume.pdf'),
  laneId: LaneId = 'gen',
): Promise<boolean> {
  const lane = LANES[laneId];
  const name = lane.pdf;
  const { pages, lines, width, height, subject, meta } = await extractPdf(path);
  const text = lines.join('\n');
  const problems: string[] = [];
  if (pages !== 1) problems.push(`PDF has ${pages} pages; the pack requires exactly one.`);
  if (Math.abs(width - 612) > 0.5 || Math.abs(height - 792) > 0.5)
    problems.push(`Page size ${width}×${height}pt is not US Letter (612×792).`);
  for (const needle of [
    'David Purvis',
    'davidpurvis647@gmail.com',
    'Magna Cum Laude',
    'Software Developer Intern, Fiber Billing',
  ]) {
    if (!text.includes(needle)) problems.push(`Text layer is missing "${needle}".`);
  }
  const violations = checkResumeText(text, 'pdf');
  if (violations.length) problems.push(`Integrity violations:\n${formatViolations(violations)}`);
  if (subject !== SUBJECT)
    problems.push(`PDF Subject metadata is "${subject}", expected "${SUBJECT}".`);
  for (const s of institutionStrings())
    if (text.includes(s) || meta.includes(s))
      problems.push(`Institutional copy in the PDF: "${s.slice(0, 60)}"`);

  const renderedLines = lines.length;
  const report = {
    pages,
    renderedLines,
    lineBudget: '45–52 (pack §0; counts text lines only, not whitespace)',
    lane: lane.code,
    selected: lane.selection.selected,
    cut: lane.selection.cut,
    placeholders: selection.placeholders,
    ok: problems.length === 0,
  };
  await mkdir(resolve(ROOT, 'reports'), { recursive: true });
  await writeFile(
    resolve(
      ROOT,
      'reports',
      laneId === 'gen' ? 'resume-report.json' : `resume-${laneId}-report.json`,
    ),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  if (problems.length) {
    console.error(`✗ ${name} failed verification:\n- ${problems.join('\n- ')}`);
    return false;
  }
  const note =
    renderedLines < 40 || renderedLines > 52
      ? ' (outside the ~45–52 guidance — review spacing)'
      : '';
  console.log(
    `✓ ${name}: 1 Letter page, ${renderedLines} rendered text lines${note}, 0 integrity violations.`,
  );
  return true;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  Promise.all(LANE_IDS.map((id) => verifyPdf(resolve(ROOT, 'dist', LANES[id].pdf), id))).then(
    (oks) => process.exit(oks.every(Boolean) ? 0 : 1),
  );
}
