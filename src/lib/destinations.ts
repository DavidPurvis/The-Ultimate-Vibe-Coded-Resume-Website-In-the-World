/** Hyperlink allocation: every destination the Department allocates, and how it is displayed. */
import { DEST_IDS, type DestId } from './storage';
import { EMAIL } from '../content/resume/identity';
import { url } from './paths';

export { DEST_IDS, type DestId };

export interface Dest {
  label: string;
  href: string;
  display: string;
  tombstonePath: string;
  external: boolean;
}

export const DEST: Record<DestId, Dest> = {
  github: {
    label: 'GitHub',
    href: 'https://github.com/DavidPurvis',
    display: 'github.com/DavidPurvis',
    tombstonePath: '/DavidPurvis',
    external: true,
  },
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/dgp0',
    display: 'linkedin.com/in/dgp0',
    tombstonePath: '/in/dgp0',
    external: true,
  },
  email: {
    label: 'Email',
    href: `mailto:${EMAIL}`,
    display: EMAIL,
    tombstonePath: '/mailto',
    external: true,
  },
  pdf: {
    label: 'Résumé PDF',
    href: url('/resume.pdf'),
    display: 'resume.pdf',
    tombstonePath: '/resume.pdf',
    external: false,
  },
  repo: {
    label: 'This website’s source code',
    href: 'https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World',
    display: 'github.com/DavidPurvis/The-Ultimate-…',
    tombstonePath: '/source',
    external: true,
  },
};

export function isDestId(v: unknown): v is DestId {
  return typeof v === 'string' && (DEST_IDS as readonly string[]).includes(v);
}
