/** Pure blog helpers (no astro:content), unit-testable. */
/** Form numbers for newsletters skip 7, like every other form. */
export function postFormId(index: number): string {
  let n = 0;
  let count = -1;
  while (count < index) {
    n += 1;
    if (!String(n).includes('7')) count += 1;
  }
  return `DRV-28/${String(n).padStart(2, '0')}`;
}

export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
