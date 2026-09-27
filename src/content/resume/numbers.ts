/**
 * Numbers. The pack's rule: "Every number in this pack is verified … No other numbers exist." The
 * same tokenizer serves the integrity guard (R8) and the content validator.
 */

/** Every verified number, in normalised form (see normalizeNumber). */
export const VERIFIED_NUMBERS: readonly string[] = [
  '125',
  '22',
  '300+',
  '150+',
  '10+',
  '100+',
  '1,000',
  '$130K',
  '20',
  '120',
  '3.76',
  '130',
  '459',
  '258',
  '21',
  '800x480',
  '144x144',
];

export const YEAR = /^(19|20)\d{2}$/;

/** The numeric tokens in `text`, normalised ("~125" → "125", "1000" → "1,000"); years kept as is. */
export function numberTokens(text: string): string[] {
  // Skip digits glued to words/emails/handles (e.g. "purvis647", "dgp0", "PIC24").
  const re = /(?<![A-Za-z0-9_@])~?\$?\d[\d,]*(?:\.\d+)?(?:x\d+|K|\+)?(?![A-Za-z0-9_@])/g;
  return [...text.matchAll(re)].map((m) => {
    const raw = m[0].replace(/,$/, '');
    return YEAR.test(raw) ? raw : normalizeNumber(raw);
  });
}

/** Normalise a matched numeric token for whitelist comparison ("~125" → "125", "1000" → "1,000"). */
export function normalizeNumber(token: string): string {
  let t = token.trim().replace(/^~/, '');
  if (/^\d{4,}$/.test(t)) t = Number(t).toLocaleString('en-US');
  return t;
}
