/**
 * The Content-Security-Policy, defined once. Head.astro emits it; scan-dist checks every page's
 * policy against it character for character. The DOOM engine frame has its own, stricter policy
 * and is the only document allowed to compile WebAssembly.
 */
export function buildCsp(bootHash: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'sha256-${bootHash}'`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    // 'self' is DOOM's own frame (/doom-engine/). YouTube leaves with its features (P4A).
    "frame-src 'self' https://www.youtube-nocookie.com",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    // No upgrade-insecure-requests: Pages is HTTPS-only and every subresource is same-origin and
    // path-relative (scan-dist enforces it), and WebKit applies it to plain-HTTP localhost.
  ].join('; ');
}

/** public/doom-engine/play.html carries exactly this policy (checked by doom.test and scan-dist). */
export const ENGINE_CSP =
  "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; base-uri 'none'; form-action 'none'";
