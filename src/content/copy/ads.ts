/**
 * Parody ads that just say "ad", in as many ways as the Department could think of. They sell
 * nothing, link nowhere, track no one, and are hidden in Direct access.
 */
export interface ParodyAdVariant {
  id: string;
  /** Visual treatment (a CSS modifier on .pb). */
  style: string;
  /** Main line. */
  text: string;
  /** Optional small print under it. */
  small?: string;
  /** Crossed-out word shown before the text (the typo ad). */
  struck?: string;
}

export const adsCopy = {
  label: 'Parody ad',
  tag: 'Sponsored (by nobody)',
  skip: 'Skip this ad (to another ad)',
  blockerNote: 'Ad blocker users: you’re missing absolutely nothing.',
};

export const PARODY_ADS: ParodyAdVariant[] = [
  { id: 'caps', style: 'caps', text: 'AD' },
  { id: 'period', style: 'plain', text: 'Ad.' },
  { id: 'lower', style: 'lower', text: 'advertisement' },
  { id: 'formal', style: 'formal', text: 'ADVERTISEMENT', small: 'Paid announcement. Unpaid.' },
  { id: 'sentence', style: 'plain', text: 'This is an ad.' },
  { id: 'humble', style: 'humble', text: 'an ad', small: '(humble)' },
  { id: 'shy', style: 'shy', text: 'ad', small: '(it’s shy)' },
  { id: 'anno', style: 'formal', text: 'A.D.', small: 'Anno Domini. Sponsored since year one.' },
  { id: 'astra', style: 'astra', text: 'Ad Astra', small: 'To the stars. Still an ad.' },
  {
    id: 'typo',
    style: 'plain',
    struck: 'ADD',
    text: 'AD',
    small: '(typo; corrected; still an ad)',
  },
  { id: 'nobody', style: 'plain', text: 'Sponsored by: nobody' },
  { id: 'meta', style: 'meta', text: 'Enjoying this ad?', small: 'Here is an ad for this ad.' },
  { id: 'exposure', style: 'plain', text: 'Ad', small: '(paid for in exposure)' },
  { id: 'skippable', style: 'video', text: 'Ad · 0:05', small: 'Your content will begin never.' },
  { id: 'extruded', style: 'extruded', text: 'AD', small: 'Now in 3D.' },
  { id: 'comic', style: 'comic', text: 'Ad!', small: 'Kapow.' },
  { id: 'sad', style: 'sad', text: 'ad', small: 'but it’s sad' },
  { id: 'stutter', style: 'stutter', text: 'adadadadadadadadad' },
  { id: 'question', style: 'plain', text: 'Ad? Ad.' },
  { id: 'centred', style: 'centred', text: 'ad', small: 'The word “ad”, centred.' },
  {
    id: 'classified',
    style: 'classified',
    text: 'FOR SALE',
    small: 'One (1) ad. Barely used. Still an ad. No lowballers.',
  },
  { id: 'neon', style: 'neon', text: 'AD', small: 'Open 24 hours. Closed always.' },
  { id: 'geocities', style: 'geocities', text: '~*~ AD ~*~', small: 'Best viewed in any browser.' },
  { id: 'luxury', style: 'luxury', text: 'AD', small: 'For people who appreciate ads.' },
];

/** Deterministic pick so a page's ads never shift between builds (and never cause layout shift). */
export function pickAd(seed: string, salt: number): ParodyAdVariant {
  let h = 2166136261 ^ salt;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return PARODY_ADS[(h >>> 0) % PARODY_ADS.length] ?? PARODY_ADS[0]!;
}
