/**
 * Rasterize original SVG art into the PNGs browsers still want (favicons, apple-touch icon,
 * Safari-safe cursors) and render the Open Graph card. Outputs are committed; re-run when the
 * art or the card changes:  npm run rasterize
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { chromium, type Page } from '@playwright/test';
import { startServer } from './serve-dist';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUB = resolve(ROOT, 'public');
const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

async function svgToPng(
  page: Page,
  svgPath: string,
  out: string,
  size: number,
  background?: string,
): Promise<void> {
  const b64 = readFileSync(resolve(PUB, svgPath)).toString('base64');
  const pad = background ? Math.round(size * 0.12) : 0;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${background ?? 'transparent'}"><img src="data:image/svg+xml;base64,${b64}" width="${size - pad * 2}" height="${size - pad * 2}"></body></html>`,
  );
  mkdirSync(dirname(resolve(PUB, out)), { recursive: true });
  await page.screenshot({ path: resolve(PUB, out), omitBackground: !background });
  console.log(`✓ ${out}`);
}

async function main(): Promise<void> {
  if (!existsSync(resolve(ROOT, 'dist', 'og-card', 'index.html'))) {
    execSync('npx astro build', { stdio: 'inherit', cwd: ROOT });
  }
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage();
  await svgToPng(page, 'favicon.svg', 'generated/favicon-32.png', 32);
  await svgToPng(page, 'favicon.svg', 'generated/icon-192.png', 192);
  await svgToPng(page, 'favicon.svg', 'generated/icon-512.png', 512);
  await svgToPng(page, 'favicon.svg', 'generated/apple-touch-icon.png', 180, '#F6F1E7');
  for (const c of ['cabbage', 'paddle', 'crosshair']) {
    await svgToPng(page, `cursors/${c}.svg`, `generated/cursors/${c}-32.png`, 32);
  }

  const server = await startServer(4398);
  try {
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.goto(`http://127.0.0.1:4398${BASE}/og-card/`, { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    await og.screenshot({ path: resolve(PUB, 'og.png') });
    console.log('✓ og.png');
  } finally {
    server.close();
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
