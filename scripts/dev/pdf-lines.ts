/** Dev helper: print the résumé PDF's text lines (for tuning the one-page layout). */
import { extractPdf } from '../verify-pdf';

async function main(): Promise<void> {
  const r = await extractPdf(process.argv[2] ?? 'dist/resume.pdf');
  console.log(`pages=${r.pages} lines=${r.lines.length}`);
  r.lines.forEach((l, i) => console.log(String(i + 1).padStart(2), l.slice(0, 120)));
}
void main();
