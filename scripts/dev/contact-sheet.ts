/** Dev helper: render SVGs in a directory to a contact-sheet PNG for visual review. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

async function main(): Promise<void> {
  const [dir = 'public/captcha/windows', out = '/tmp/claude-0/shots/sheet.png', size = '160'] =
    process.argv.slice(2);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .sort();
  const cells = files
    .map((f) => {
      const b64 = Buffer.from(readFileSync(join(dir, f))).toString('base64');
      return `<figure><img src="data:image/svg+xml;base64,${b64}" width="${size}" height="${size}"><figcaption>${f}</figcaption></figure>`;
    })
    .join('');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await page.setContent(
    `<style>body{margin:12px;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:12px;background:#fff}figure{margin:0;text-align:center}img{display:block;border:1px solid #ddd;object-fit:contain}</style>${cells}`,
  );
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(`wrote ${out} (${files.length} images)`);
}
void main();
