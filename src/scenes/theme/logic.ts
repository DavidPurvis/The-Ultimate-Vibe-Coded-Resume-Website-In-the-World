/** Theme cycle: Light → Dark → Darker → Lights Out → Light (Comic Sans) → Light … */
import type { ThemeName } from '../../lib/storage';

export type ConcreteTheme = Exclude<ThemeName, 'system'>;
export const CYCLE: readonly ConcreteTheme[] = ['light', 'dark', 'darker', 'lights-out', 'comic'];

/** Resolve 'system' against the OS preference. */
export function effective(theme: ThemeName, prefersDark: boolean): ConcreteTheme {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function nextTheme(current: ThemeName, prefersDark: boolean): ConcreteTheme {
  const eff = effective(current, prefersDark);
  const i = CYCLE.indexOf(eff);
  return CYCLE[(i + 1) % CYCLE.length] as ConcreteTheme;
}
