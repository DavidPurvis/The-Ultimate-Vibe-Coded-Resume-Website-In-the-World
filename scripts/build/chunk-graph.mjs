// @ts-check
/**
 * Records the client build's chunk graph for the scanner: each emitted JS chunk under _assets/, its
 * static and dynamic imports, and the source modules inside it (repo-relative). Written to
 * reports/chunk-graph.json (outside dist, never deployed). The scanner computes each page's static
 * closure and the résumé boundary from this instead of parsing minified import statements.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'reports', 'chunk-graph.json');

/** @returns {import('vite').Plugin} */
export function chunkGraph() {
  /** @type {Record<string, unknown>} */
  let chunks = {};
  return {
    name: 'uvcr:chunk-graph',
    apply: 'build',
    generateBundle(_options, bundle) {
      // The client environment emits the page scripts; server-side bundles are ignored.
      for (const out of Object.values(bundle)) {
        if (out.type !== 'chunk' || !out.fileName.startsWith('_assets/')) continue;
        chunks[out.fileName] = {
          fileName: out.fileName,
          isEntry: out.isEntry,
          isDynamicEntry: out.isDynamicEntry,
          imports: out.imports,
          dynamicImports: out.dynamicImports,
          modules: out.moduleIds
            .filter((id) => !id.startsWith('\0'))
            .map((id) => relative(ROOT, id.split('?')[0] ?? id).replace(/\\/g, '/'))
            .sort(),
        };
      }
    },
    writeBundle() {
      if (!Object.keys(chunks).length) return;
      mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
      writeFileSync(OUT, `${JSON.stringify({ chunks }, null, 2)}\n`);
      chunks = {};
    },
  };
}
