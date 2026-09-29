/**
 * Minimal static server that serves ./dist (or DIST_DIR, e.g. dist-hooks) under the real GitHub
 * Pages base path,
 * mirroring Pages behaviour closely enough for e2e, PDF rendering and Lighthouse:
 *  - directories → index.html, missing trailing slash → 301
 *  - unknown paths → dist/404.html with status 404
 */
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)), process.env.DIST_DIR || 'dist');
const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function isFile(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}
async function isDir(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

export function startServer(port = 4321, host = '127.0.0.1'): Promise<Server> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${host}:${port}`);
    const send = async (status: number, file: string) => {
      const body = await readFile(file);
      res.writeHead(status, {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const notFound = async () => {
      const f404 = join(ROOT, '404.html');
      if (await isFile(f404)) return send(404, f404);
      res.writeHead(404).end('Not found');
    };

    if (BASE && (url.pathname === '/' || url.pathname === '')) {
      res.writeHead(302, { Location: `${BASE}/` }).end();
      return;
    }
    if (BASE && !url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) return notFound();
    let rel = decodeURIComponent(url.pathname.slice(BASE.length)) || '/';
    rel = normalize(rel).replace(/^(\.\.[/\\])+/, '');
    const target = join(ROOT, rel);
    if (!target.startsWith(ROOT)) return notFound();

    if (await isFile(target)) return send(200, target);
    if (await isDir(target)) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      const index = join(target, 'index.html');
      if (await isFile(index)) return send(200, index);
    }
    return notFound();
  });
  return new Promise((ok) => server.listen(port, host, () => ok(server)));
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const port = Number(process.env.PORT ?? 4321);
  startServer(port).then(() => {
    console.log(`Serving dist at http://127.0.0.1:${port}${BASE}/`);
  });
}
