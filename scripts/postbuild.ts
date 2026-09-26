/**
 * Postbuild: print /resume/ to dist/resume.pdf (and each lane cut to dist/resume-{lane}.pdf) with
 * headless Chromium, stamp plain PDF metadata, then verify every file. Fails the build if any
 * résumé isn't exactly 1 page. PDFs get forwarded to people outside the joke: no fiction inside.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { startServer } from './serve-dist';
import { verifyPdf } from './verify-pdf';
import { LANE_IDS, LANES } from '../src/content/lanes';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');
const PORT = Number(process.env.POSTBUILD_PORT ?? 4399);
export const PDF_SUBJECT = 'Résumé — Software Engineer';

async function main(): Promise<void> {
  const server = await startServer(PORT);
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const page = await browser.newPage();
    for (const id of LANE_IDS) {
      const lane = LANES[id];
      await page.goto(`http://127.0.0.1:${PORT}${BASE}${lane.path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const raw = await page.pdf({ printBackground: false, preferCSSPageSize: true, tagged: true });

      const doc = await PDFDocument.load(raw);
      doc.setTitle(
        id === 'gen' ? 'David Purvis — Résumé' : `David Purvis — Résumé (${lane.label})`,
      );
      doc.setAuthor('David Purvis');
      doc.setSubject(PDF_SUBJECT);
      doc.setKeywords(['Software Engineer', 'Résumé']);
      doc.setCreator('David Purvis');
      doc.setProducer('Astro + Playwright + pdf-lib');
      const bytes = await doc.save();
      const out = resolve(ROOT, 'dist', lane.pdf);
      await writeFile(out, bytes);
      console.log(`✓ wrote ${out} (${bytes.length} bytes)`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  let ok = true;
  for (const id of LANE_IDS) ok = (await verifyPdf(resolve(ROOT, 'dist', LANES[id].pdf), id)) && ok;
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
