/**
 * Build-time icon inlining (never shipped as runtime JS). Only names in ICON_MANIFEST are allowed,
 * so the credits ledger always knows exactly which third-party icons the site uses.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ICON_MANIFEST, type IconSet } from '../content/credits';

const require = createRequire(import.meta.url);

/** Returns inline <svg> markup. `label` → role="img" + aria-label; otherwise aria-hidden. */
export function getSvg(
  set: IconSet,
  name: string,
  opts: { size?: number; label?: string; className?: string } = {},
): string {
  if (!ICON_MANIFEST[set].includes(name)) {
    throw new Error(`Icon ${set}:${name} is not in ICON_MANIFEST (src/content/credits.ts).`);
  }
  const size = opts.size ?? 24;
  const a11y = opts.label
    ? { role: 'img', 'aria-label': opts.label }
    : { 'aria-hidden': 'true', focusable: 'false' };
  const cls = ['icon', `icon--${set}`, opts.className].filter(Boolean).join(' ');
  const raw = readFileSync(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8');
  const inner = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();
  const attrs: Record<string, string> = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: cls,
    ...a11y,
  };
  return `<svg ${Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')}>${inner}</svg>`;
}
