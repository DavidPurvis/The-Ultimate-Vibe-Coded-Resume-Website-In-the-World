/** The Department Newsletter (blog) chrome and the facts only David can declassify. */
import type { PersonalFact } from '../pending';

export const blogCopy = {
  kicker: 'FORM DRV-28 · THE DEPARTMENT NEWSLETTER',
  h1: 'The Department Newsletter',
  sub: 'Long-form positions, confessions and incident reports. Published irregularly. Read by fewer.',
  readingTime: (min: number) => `${min} min read`,
  filedUnder: 'Filed under',
  rss: 'RSS feed',
  rssNote: 'For the three people who still use RSS, all of whom run Linux.',
  back: '← All newsletters',
  prev: '← Previous',
  next: 'Next →',
  declassified: 'Declassified',
  r6Link: 'Full tracker profile ↗',
  channelTitle: 'The Department Newsletter · David Purvis',
  channelDescription:
    'Positions, confessions and incident reports from David Purvis. For the three people who still use RSS, all of whom run Linux.',
};

/** How many applications David has sent (national security). Hidden until he says. */
export const applications: PersonalFact = {
  id: 'applications',
  label: 'Applications submitted (patriotically)',
  text: '',
  status: 'needs-review',
};
