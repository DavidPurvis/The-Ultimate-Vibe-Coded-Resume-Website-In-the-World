/**
 * Vendor DOOM into public/doom-engine/ (gitignored): Cloudflare's WebAssembly build of Chocolate
 * Doom (GPL-2.0) and id Software's shareware doom1.wad, from the pinned npm package that
 * re-publishes them. Every file is checked against a pinned SHA-256 first, so a changed upstream
 * package fails the build instead of shipping. Runs before every site build.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SRC = join(ROOT, 'node_modules', '@nicejsisverycool', 'tizendoom');
const OUT = join(ROOT, 'public', 'doom-engine');

export const PINNED: Record<string, string> = {
  'websockets-doom.js': 'a2909044a9fbc5529f941c8dbf93cc2931927690e0341c737545cf0b9cff23fb',
  'websockets-doom.wasm': '6366f83a58fe8596ce742a66dbf86871d315862c89c11e65b54935be03c7e6c4',
  // DOOM 1.9 shareware, 4,196,020 bytes.
  'doom1.wad': '1d7d43be501e67d927e415e0b8f3e29c3bf33075e859721816f652a526cac771',
};

const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

export function vendorDoom(): void {
  mkdirSync(OUT, { recursive: true });
  for (const [file, want] of Object.entries(PINNED)) {
    const dest = join(OUT, file);
    if (existsSync(dest) && sha256(dest) === want) continue;
    const src = join(SRC, file);
    if (!existsSync(src)) throw new Error(`vendor-doom: ${src} is missing. Run npm ci.`);
    const got = sha256(src);
    if (got !== want)
      throw new Error(`vendor-doom: ${file} hash ${got} does not match pinned ${want}.`);
    copyFileSync(src, dest);
    console.log(`✓ vendored doom-engine/${file}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) vendorDoom();
