/**
 * The deployment invariants (D1–D3), pinned against the workflow text: one build, every consumer
 * starts from the SHA-256-verified artifact, and deploy only publishes. Read as text on purpose, so
 * checking the pipeline needs no YAML dependency.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const WORKFLOW = readFileSync('.github/workflows/pipeline.yml', 'utf8');
const ACTION = readFileSync('.github/actions/verified-site/action.yml', 'utf8');
const VERIFIED = './.github/actions/verified-site';

/** Each job's block, keyed by job id (the two-space keys under `jobs:`). */
function jobs(text: string): Record<string, string> {
  const body = text.slice(text.indexOf('\njobs:\n'));
  const marks = [...body.matchAll(/^ {2}([a-z][\w-]*):\s*$/gm)];
  return Object.fromEntries(
    marks.map((m, i) => [m[1] ?? '', body.slice(m.index, marks[i + 1]?.index ?? body.length)]),
  );
}

const JOBS = jobs(WORKFLOW);
const job = (id: string): string => {
  const text = JOBS[id];
  if (text === undefined) throw new Error(`no job ${id}`);
  return text;
};

describe('pipeline.yml', () => {
  it('is the only workflow', () => {
    expect(readdirSync('.github/workflows')).toEqual(['pipeline.yml']);
  });

  it('runs check → build → { e2e, lighthouse } → deploy', () => {
    expect(Object.keys(JOBS)).toEqual(['check', 'build', 'e2e', 'lighthouse', 'deploy']);
    expect(job('build')).toMatch(/^\s+needs: check$/m);
    expect(job('e2e')).toMatch(/^\s+needs: build$/m);
    expect(job('lighthouse')).toMatch(/^\s+needs: build$/m);
    expect(job('deploy')).toMatch(/^\s+needs: \[e2e, lighthouse\]$/m);
  });

  it('builds exactly once, in the build job, and writes the manifest there (D1)', () => {
    for (const [id, text] of Object.entries(JOBS)) {
      expect(text.includes('npm run build'), id).toBe(id === 'build');
      expect(/sha256sum\) > site\.sha256/.test(text), id).toBe(id === 'build');
    }
    // The PDFs and the scan are verified before anything is uploaded.
    const build = job('build');
    expect(build.indexOf('npm run build && npm run scan')).toBeLessThan(
      build.indexOf('name: site\n'),
    );
    expect(build).toContain('name: site-manifest');
  });

  it('tests, measures and deploys only the verified artifact (D1, D2)', () => {
    for (const id of ['e2e', 'lighthouse', 'deploy'])
      expect(job(id), id).toContain(`uses: ${VERIFIED}`);
    for (const id of ['check', 'build']) expect(job(id), id).not.toContain(VERIFIED);
  });

  it('runs every Playwright project against the artifact', () => {
    const config = readFileSync('playwright.config.ts', 'utf8');
    const projects = [...config.matchAll(/\{ name: '(\w+)'/g)].map((m) => m[1]);
    const matrix = [...job('e2e').matchAll(/project: (\w+),/g)].map((m) => m[1]);
    expect(projects).toHaveLength(4);
    expect(matrix).toEqual(projects);
    expect(job('e2e')).toContain('npx playwright test --project=${{ matrix.project }}');
  });

  it('deploys only from main, and only publishes (D3)', () => {
    const deploy = job('deploy');
    expect(deploy).toContain(
      "if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'",
    );
    expect(deploy).not.toMatch(/\bnpm\b|\bnpx\b|setup-node/);
    expect(deploy).toContain('uses: actions/upload-pages-artifact@v5');
    expect(deploy).toMatch(/with:\n\s+path: dist\n/);
    expect(deploy).toContain('id-token: write');
  });

  it('builds, serves and deploys with one set of site settings', () => {
    expect(WORKFLOW).toMatch(/^env:\n {2}SITE_URL: \$\{\{ vars\.SITE_URL \}\}\n {2}BASE_PATH:/m);
    expect(WORKFLOW).not.toMatch(/PUBLIC_TEST_HOOKS|__uvcr/);
  });
});

describe('the verified-site action', () => {
  it('downloads the site and its manifest', () => {
    expect(ACTION).toMatch(/name: site\n\s+path: dist\n/);
    expect(ACTION).toMatch(/name: site-manifest\n/);
  });

  it('fails on any changed, missing or extra file', () => {
    expect(ACTION).toContain('set -euo pipefail');
    expect(ACTION).toContain('sha256sum --check --strict --quiet ../site.sha256');
    expect(ACTION).toContain('if [ "$files" -ne "$listed" ]; then');
    expect(ACTION).toMatch(/exit 1\n/);
  });
});
