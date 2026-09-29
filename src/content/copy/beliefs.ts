/** Peer-Reviewed Research — absurd positions (numbered without 7) and five mini-papers. */
import type { CopyRecord } from '../types';

export const beliefsCopy = {
  kicker: 'Form DDP-5 · Public Affairs · Research',
  h1: 'Peer-Reviewed By My Peers',
  sub: '(Two Guys From My CS2 Team)',
  disclaimer:
    'Everything on this page is satire. None of it is advice. Real physics remains undefeated.',
  positionsHeading: 'Positions',
  papersHeading: 'Papers',
  sevenObjection: 'The build system has lodged a formal objection to the missing item 7.',
  upsideLabel:
    'THE UPSIDE DOWN. Scrolling inside this box is inverted. Scrolling outside it is fine. Nothing in here is real, including the scrollbar’s sense of direction.',
  upsideDisabled: 'Inversion disabled. The gravity of the situation remains.',
  realTestingLabel: 'How real testing would differ',
};

export interface Position extends CopyRecord {
  n: number;
  upsideDown?: boolean;
  icon?: string;
}

/** Numbering deliberately skips 7 (see paper P-4). */
export const positions: Position[] = [
  {
    n: 1,
    id: 'cloud',
    icon: 'desktop-computer',
    status: 'fictional',
    text: 'The cloud isn’t real. I worked city IT; it’s a man named Doug in a basement with a lot of hard drives, and he’s tired.',
  },
  {
    n: 2,
    id: 'rivers',
    icon: 'water-wave',
    status: 'fictional',
    text: 'Rivers only flow downhill because nobody has told them they can do otherwise. As a former raft guide, I’ve seen their potential.',
  },
  {
    n: 3,
    id: 'neurons',
    icon: 'brain',
    status: 'fictional',
    text: 'Neural networks contain zero neurons. I checked, with a flashlight. My degree is a lie and I’m keeping it.',
  },
  {
    n: 4,
    id: 'electrons',
    status: 'fictional',
    text: 'Electrons are just protons who haven’t come out of their shell yet.',
  },
  {
    n: 5,
    id: 'gravity',
    status: 'fictional',
    text: 'Gravity is a subscription. I canceled mine years ago, which is why I drop things.',
  },
  {
    n: 6,
    id: 'water',
    icon: 'droplet',
    status: 'fictional',
    text: 'Water isn’t wet; it’s “damp-adjacent.” Ask any raft guide. They’ll lie to you the same way.',
  },
  {
    n: 8,
    id: 'moon',
    icon: 'crescent-moon',
    upsideDown: true,
    status: 'fictional',
    text: 'The moon is a load balancer for the tides. It has been failing over since 1969.',
  },
  {
    n: 9,
    id: 'timezones',
    status: 'fictional',
    text: 'Time zones were invented by Salesforce to sell more reports.',
  },
  {
    n: 10,
    id: 'recoil',
    status: 'fictional',
    text: 'Recoil in CS2 is proof the earth is moving. My spray pattern is proof the earth is angry.',
  },
  {
    n: 11,
    id: 'windows',
    icon: 'window',
    status: 'fictional',
    text: 'Windows (the glass kind) are a psyop. You’ve been looking at very still paintings of outside. See also: the CAPTCHA.',
  },
  {
    n: 12,
    id: 'dinosaurs',
    icon: 'sauropod',
    upsideDown: true,
    status: 'fictional',
    text: 'Dinosaurs didn’t go extinct. They just logged off and never came back, like my old guild.',
  },
  {
    n: 13,
    id: 'calculus',
    status: 'fictional',
    text: 'Continuous mathematics is an institutional fabrication. If a change can’t be expressed in whole numbers, its rate does not exist.',
  },
  {
    n: 14,
    id: 'flat-moon',
    icon: 'full-moon-face',
    status: 'fictional',
    text: 'The Earth is an oblate spheroid governed by general relativity. The Moon, however, is an unrendered 2D sprite maintained by telescope manufacturers.',
  },
  {
    n: 15,
    id: 'seven',
    status: 'fictional',
    text: 'The number seven should be abolished for structural asymmetry. (This list has complied.)',
  },
  {
    n: 16,
    id: 'raccoons',
    icon: 'raccoon',
    status: 'fictional',
    text: 'Integration testing should be replaced by releasing raccoons into server racks. Biological chaos finds better edge cases than fuzzing. (Paper only. No raccoons were deployed.)',
  },
];

export interface Paper {
  id: string;
  code: string;
  title: string;
  icon?: string;
  sections: { heading: string; body: string }[];
  aside?: { heading: string; body: string };
  /** Formatted as a bug report instead of a paper. */
  bugReport?: boolean;
}

export const papers: Paper[] = [
  {
    id: 'packets',
    code: 'P-1',
    title: 'The Effect of Altitude on Packet Motivation',
    sections: [
      {
        heading: 'Abstract',
        body: 'This study investigates whether network packets perform better when they believe they are going downhill. Results were conclusive until the router was moved back upstairs.',
      },
      {
        heading: 'Hypothesis',
        body: 'Gravity has been omitted from the OSI model for reasons the committee refuses to discuss.',
      },
      {
        heading: 'Method',
        body: 'One router upstairs. One workstation downstairs. Change the cable, router position, workload and measurement interval simultaneously. Record one number that supports the hypothesis. Decline to repeat the experiment, because reproducibility would introduce repetition.',
      },
      {
        heading: 'Observations',
        body: 'A transfer completed. The research team has elected to interpret this as encouragement.',
      },
      {
        heading: 'Limitations',
        body: 'Distance, cable characteristics, device load, protocol behavior and every other plausible explanation were outside the scope of the grant, which did not exist.',
      },
      {
        heading: 'Conclusion',
        body: 'Install important services downstairs. (Fictional conclusion. Not networking advice.)',
      },
      { heading: 'Peer review', body: '“Sure.” (Roommate, passing through the room.)' },
    ],
    aside: {
      heading: 'How real testing would differ',
      body: 'Controlled variables, repeated trials, a meaningful metric such as throughput or latency distributions, and changing one thing at a time.',
    },
  },
  {
    id: 'calculus',
    code: 'P-2',
    title: 'Toward Anti-Calculus Realism',
    sections: [
      {
        heading: 'Abstract',
        body: 'Continuous functions are merely discrete functions with excellent public relations.',
      },
      { heading: 'Method', body: 'Plot a smooth curve to prove there are no smooth curves.' },
      { heading: 'Limitations', body: 'The chart was produced by interpolation.' },
      { heading: 'Conclusion', body: 'Rates of change are a rumor.' },
      { heading: 'Peer review', body: '“You used a derivative to write this.” (Rejected.)' },
    ],
  },
  {
    id: 'moon',
    code: 'P-3',
    title: 'The Moon Is Not Rendered: A Bug Report',
    icon: 'full-moon-face',
    bugReport: true,
    sections: [
      {
        heading: 'Steps to reproduce',
        body: '1. Look up. 2. Adjust lunar graphics settings (access denied).',
      },
      { heading: 'Expected', body: 'A three-dimensional moon.' },
      { heading: 'Actual', body: 'A suspiciously flat moon. Possibly cheese.' },
      { heading: 'Severity', body: 'Cosmic.' },
      { heading: 'Status', body: 'Won’t fix: works as designed.' },
    ],
  },
  {
    id: 'seven',
    code: 'P-4',
    title: 'On the Abolition of Seven',
    sections: [
      { heading: '§1', body: 'Seven is structurally asymmetric.' },
      { heading: '§2', body: 'It is prime, which is suspicious.' },
      { heading: '§3', body: 'It is odd, which is rude.' },
      { heading: '§4', body: 'It sits between six and eight, contributing nothing.' },
      { heading: '§5', body: 'It has been removed from this document.' },
      { heading: '§6', body: 'Section 8 follows Section 6 without incident.' },
      { heading: '§8', body: 'See?' },
      {
        heading: '§9',
        body: 'The build system has objected. The objection has been filed under §7.',
      },
    ],
  },
  {
    id: 'raccoons',
    code: 'P-5',
    title: 'Biological Quality Assurance: Raccoon-Driven Testing (A Thought Experiment)',
    icon: 'raccoon',
    sections: [
      { heading: 'Abstract', body: 'Raccoons are nature’s fuzzers.' },
      {
        heading: 'Method',
        body: 'Paper only. No animals, racks or facilities were involved; the facilities are fictional.',
      },
      {
        heading: 'Conclusion',
        body: 'The raccoons would have found the edge cases. The raccoons would also have eaten the edge cases.',
      },
    ],
    aside: {
      heading: 'How real chaos testing works',
      body: 'Controlled fault injection, limits on blast radius, good observability and a rollback plan. Raccoons are not involved.',
    },
  },
];
