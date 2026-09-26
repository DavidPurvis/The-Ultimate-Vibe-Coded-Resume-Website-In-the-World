/** Who and how to reach him. Verified contact facts, kept apart so they are cheap to import. */
export const EMAIL = 'davidpurvis647@gmail.com';

export const identity = {
  name: 'David Purvis',
  headline: 'Software Engineer',
  location: 'Broomfield, CO',
  email: EMAIL,
  linkedin: { href: 'https://www.linkedin.com/in/dgp0', display: 'linkedin.com/in/dgp0' },
  github: { href: 'https://github.com/DavidPurvis', display: 'github.com/DavidPurvis' },
} as const;
