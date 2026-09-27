/** What counts as a plain click: the only kind the case may intercept (A8). */
export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
}

/** A primary-button click with no modifier that nothing else has handled. */
export function isPlainActivation(e: ClickLike): boolean {
  return (
    !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
  );
}
