/** Tiny DOM builder for step renderers: textContent only, never innerHTML. */
import type { Scope } from '../runtime/lifecycle';

type Attrs = Record<string, string | boolean | undefined>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

/** A button that runs `fn` on activation; the listener belongs to `scope`. */
export function button(
  scope: Scope,
  label: string,
  fn: (e: Event, el: HTMLButtonElement) => void,
  attrs: Attrs = {},
): HTMLButtonElement {
  const b = h('button', { type: 'button', class: 'btn case-btn', ...attrs }, label);
  scope.on(b, 'click', (e) => fn(e, b));
  return b;
}

/** Drop empty entries so optional children can be written inline. */
export const nodes = (...items: Child[]): (Node | string)[] =>
  items.filter((c): c is Node | string => c !== null && c !== undefined && c !== false);
