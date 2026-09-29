/** Toast notifications: role=status, pause on hover/focus, dismissible. */
import { toastCloseLabel } from '../content/copy/global';

const X_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

export function toast(
  message: string,
  opts: { ms?: number; iconHtml?: string } = {},
): HTMLElement | null {
  const stack = document.querySelector<HTMLElement>('[data-toasts]');
  if (!stack) return null;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  if (opts.iconHtml) {
    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.innerHTML = opts.iconHtml;
    el.append(icon);
  }
  const p = document.createElement('p');
  p.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'icon-btn';
  close.setAttribute('aria-label', toastCloseLabel);
  close.innerHTML = X_ICON;
  el.append(p, close);
  stack.append(el);
  while (stack.children.length > 3) stack.firstElementChild?.remove();

  let remaining = opts.ms ?? 4200;
  let started = Date.now();
  let timer = setTimeout(() => el.remove(), remaining);
  const pause = () => {
    clearTimeout(timer);
    remaining -= Date.now() - started;
  };
  const resume = () => {
    started = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => el.remove(), Math.max(1200, remaining));
  };
  el.addEventListener('mouseenter', pause);
  el.addEventListener('mouseleave', resume);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);
  close.addEventListener('click', () => {
    clearTimeout(timer);
    el.remove();
  });
  return el;
}
