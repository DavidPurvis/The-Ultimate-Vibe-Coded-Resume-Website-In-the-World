/**
 * Overkill HUD copy. You are the player; David's website is the level. Loaded only with the HUD
 * chunk. Everything here is fiction except the hotbar links, which go to real pages.
 */
import type { ThreatReason } from '../../lib/threat';

export const hudCopy = {
  offButton: 'HUD: off',
  controlsLabel: 'HUD controls',
  hotbarLabel: 'Hotbar',
  refill: 'Refill caffeine',
  player: 'YOU',
  role: 'Recruiter',
  level: (n: number) => `Lv. ${n}`,
  xp: (pct: number) => `XP ${pct}%`,
  caffeine: 'CAFFEINE',
  stamina: 'STAMINA',
  fps: (n: number) => `${n} FPS`,
  ping: 'PING 1 ms (it’s local)',
  heading: (deg: number, dir: string) => `${dir} ${deg}° · toward the résumé`,
  live: 'LIVE',
  viewers: '1 viewer (you)',
  ammo: 'APPLICATIONS ∞ / ∞',
  minimap: 'MAP',
  questsTitle: 'QUESTS',
  quests: {
    hire: 'MAIN: Hire David',
    read: 'SIDE: Read one sentence',
    banner: 'SIDE: Survive the cookie banner',
    human: 'SIDE: Prove you’re human',
    grass: 'DAILY: Touch grass',
  },
  feedTitle: 'KILL FEED',
  chatTitle: 'CHAT',
  sponsor: 'SPONSORED BY',
  levelUp: 'LEVEL UP',
  achievement: 'ACHIEVEMENT UNLOCKED',
  achievements: {
    bottom: 'Read to the bottom of a page',
    threat: (level: string) => `Threat level: ${level}`,
    hud: 'Turned on the Overkill HUD',
  },
};

/** Kill-feed lines for Department events. Format: [attacker, victim]. */
export const feedLines: Record<ThreatReason, [string, string]> = {
  identityComplete: ['You', 'Identity Checkpoint'],
  refused: ['You', 'The Department (refusal)'],
  captchaReject: ['CAPTCHA', 'You'],
  captchaSkip: ['You', 'CAPTCHA (skipped)'],
  dodge: ['Button', 'Your cursor'],
  spin: ['Casino', 'Your patience'],
  rickroll: ['Rick Astley', 'You'],
  konami: ['You', 'The konami code'],
  bannerRemoved: ['You', 'Cookie Banner'],
  gravity: ['Gravity', 'Causes'],
  biscotti: ['You', 'Fifty biscotti'],
  lightsOut: ['You', 'The lights'],
  appendix: ['You', 'The Appendix'],
  summon: ['Subway Surfers', 'Your attention span'],
};

export const feedSeed: [string, string][] = [
  ['David', 'Imposter syndrome'],
  ['Coffee', 'Sleep'],
];

/** Fake chat. Handles and lines are fiction; nobody is actually watching. */
export const chatHandles = [
  'hiring_mgr',
  'xX_HR_Xx',
  'cto_lurker',
  'ats_bot',
  'legal_dept',
  'intern_steve',
  'sasquatch_fan',
  'mom',
];
export const chatLines = [
  'BIG PURV DIFF',
  'W résumé',
  'HR has entered the chat',
  'is this the goldfish guy',
  'chat is this real',
  'the CAPTCHA was all windows btw',
  'zipper merge enjoyers malding',
  'who let him cook',
  'he’s cooking',
  'Salesforce admin arc',
  'ordained minister spotted',
  'not the tungsten cube again',
  'LinkedIn could never',
  'mods, clip that',
  'Thermite main confirmed',
  'GG',
  'first',
  'adaptive early merge supremacy',
];
export const donations = [
  { from: 'Mom', amount: '$5', note: 'proud of you' },
  { from: 'hiring_mgr', amount: '$0.00', note: 'exposure' },
  { from: 'Dad', amount: '$10', note: 'call your mother' },
];
export const donationLine = (d: { from: string; amount: string; note: string }) =>
  `${d.from} donated ${d.amount}: ${d.note}`;

/** Hotbar: real links. Slot numbers skip 7, which the Department abolished. */
export const hotbar = [
  { path: '/resume/', label: 'Résumé' },
  { path: '/projects/', label: 'Case Files' },
  { path: '/skills/', label: 'Loadout' },
  { path: '/casino/', label: 'Casino' },
  { path: '/blog/', label: 'Newsletter' },
  { path: '/personnel-file/', label: 'Personnel' },
  { path: '/tailor/', label: 'For You™' },
  { path: '/presentation/', label: 'Résumé.ppt' },
  { path: '/contact/', label: 'Contact' },
];
