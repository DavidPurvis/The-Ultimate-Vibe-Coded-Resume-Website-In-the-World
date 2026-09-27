/** Performance budgets (Pf1, Pf2), in KB gzipped. */

/** Route → the page's static JS closure. Pages not listed ship no JS at all. */
export const JS_BUDGET_KB: Readonly<Record<string, number>> = {
  // The Access Request case (kernel + domain + first-step copy); steps load lazily.
  '': 12,
  // The storage table and its Reset button.
  'privacy/': 4,
  // The DOOM player's wiring; the engine itself is a separate frame, fetched on Play.
  'doom/': 12,
  // Only the Print button.
  'resume/': 2,
  'resume/for/emb/': 2,
  'resume/for/plt/': 2,
  'resume/for/be/': 2,
};
export const DEFAULT_JS_BUDGET_KB = 0;
/** Each lazily loaded chunk (the case's steps and the lines they show). */
export const LAZY_CHUNK_BUDGET_KB = 6;
/** No chunk this big may sit in any page's static closure. */
export const HEAVY_CHUNK_KB = 20;
export const CSS_BUDGET_KB = 16;
