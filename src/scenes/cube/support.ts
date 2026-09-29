/**
 * Whether this browser will give three.js a WebGL2 context, asked of a throwaway canvas before the
 * three.js chunk is fetched. Where it won't (WebGL off, blocklisted, or WebGL2 disabled), the
 * drawing stays and nothing is downloaded or logged.
 */
export function webgl2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}
