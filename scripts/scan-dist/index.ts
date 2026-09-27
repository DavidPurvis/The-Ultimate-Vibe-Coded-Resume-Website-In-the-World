/**
 * Post-build scan of dist/: fails the build on anything that would make the site's promises untrue
 * (plan §S). Usage: tsx scripts/scan-dist [dist]. Needs reports/chunk-graph.json from the build.
 */
import { resolve } from 'node:path';
import { kb, loadSite } from './load';
import { budgetRows, runPolicies } from './policies';

const DIST = resolve(process.argv[2] ?? 'dist');
const base = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');
const siteOrigin = new URL(process.env.SITE_URL || 'https://davidpurvis.github.io').origin;

const site = loadSite(DIST, {
  base,
  siteOrigin,
  graphFile: resolve('reports', 'chunk-graph.json'),
});
const problems = runPolicies(site);

const rows = budgetRows(site).sort(([a], [b]) => a.localeCompare(b));
const w = Math.max(...rows.map(([r]) => r.length), 5);
console.log(`${'route'.padEnd(w)}  JS gz KB  budget`);
for (const [r, total, budget] of rows)
  console.log(`${r.padEnd(w)}  ${kb(total).padStart(8)}  ${kb(budget).padStart(6)}`);

if (problems.length) {
  console.error(`\n✗ scan-dist found ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - [${p.policy}] ${p.file}: ${p.message}`);
  process.exit(1);
}
const scripts = Object.keys(site.files).filter((f) => f.endsWith('.js')).length;
console.log(`\n✓ scan-dist: ${site.pages.length} pages, ${scripts} scripts, every policy clean.`);
