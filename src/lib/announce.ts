/** Polite live-region announcements — outcomes only, never animation ticks. */
export function announce(msg: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const el = document.getElementById('announcer');
  if (!el) return;
  el.setAttribute('aria-live', politeness);
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
}
