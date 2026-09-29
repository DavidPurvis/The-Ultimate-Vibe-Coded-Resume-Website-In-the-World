/** Performance budgets (Pf1, Pf2), in KB gzipped. */

/**
 * Route → the page's static JS closure. The Department's shell (mode, storage, the directory menu,
 * overlays on request, the case record) goes on every department page; the attractions that
 * carry their own machinery get their own line. Pages not listed get the default.
 */
export const JS_BUDGET_KB: Readonly<Record<string, number>> = {
  // The front desk: the shell, classification, and the résumé request.
  '': 16,
  // Verification: the reducer, three rounds, the alternative challenge and the progress record.
  'verify/': 20,
  // Hyperlink allocation: the wheel, its odds and the destinations.
  'casino/': 20,
  // The DOOM player's wiring; the engine itself is a separate frame, fetched on Play.
  'doom/': 15,
  // The sincere page carries no Department machinery at all.
  'tribute/': 0,
  // The share card is a screenshot source, not a page anyone visits.
  'og-card/': 0,
  // Only the Print button.
  'resume/': 2,
  'resume/for/emb/': 2,
  'resume/for/plt/': 2,
  'resume/for/be/': 2,
};
export const DEFAULT_JS_BUDGET_KB = 14;
/** Each application chunk loaded on request (a dialog, an overlay, a procedure). */
export const LAZY_CHUNK_BUDGET_KB = 12;
/** The vendored engines, each loaded only by the attraction that needs it. */
export const VENDOR_CHUNK_BUDGET_KB: Readonly<Record<string, number>> = {
  // three.js, for the tungsten cube on /cube/ and the wishlist.
  'vendor-three': 200,
  // matter.js, for the gravity on /support/.
  'vendor-matter': 35,
};
/** No chunk this big may sit in any page's static closure. */
export const HEAVY_CHUNK_KB = 20;
export const CSS_BUDGET_KB = 16;
