/**
 * Postbuild: print /resume/ to dist/resume.pdf with headless Chromium, stamp PDF metadata
 * (including the one joke), then verify it. Fails the build if the résumé isn't exactly 1 page.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { startServer } from './serve-dist';
import { verifyPdf } from './verify-pdf';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');
const PORT = Number(process.env.POSTBUILD_PORT ?? 4399);
export const PDF_SUBJECT = 'Printed from a website that asked if you were Claude.';

async function main(): Promise<void> {
  const server = await startServer(PORT);
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}${BASE}/resume/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const raw = await page.pdf({ printBackground: false, preferCSSPageSize: true, tagged: true });

    const doc = await PDFDocument.load(raw);
    doc.setTitle('David Purvis — Résumé');
    doc.setAuthor('David Purvis');
    doc.setSubject(PDF_SUBJECT);
    doc.setKeywords(['Software Engineer', 'Résumé']);
    doc.setCreator('Department of Recruiter Verification');
    doc.setProducer('Astro + Playwright + pdf-lib');
    const bytes = await doc.save();
    const out = resolve(ROOT, 'dist', 'resume.pdf');
    await writeFile(out, bytes);
    console.log(`✓ wrote ${out} (${bytes.length} bytes)`);
  } finally {
    await browser.close();
    server.close();
  }
  const ok = await verifyPdf(resolve(ROOT, 'dist', 'resume.pdf'));
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
