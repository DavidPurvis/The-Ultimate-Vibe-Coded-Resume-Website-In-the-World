/** Projects — P1–P4 from their FACT lines. Integrity rules run on this page's rendered text. */
import type { BlockId } from '../resume/types';

export const projectsCopy = {
  kicker: 'Form DDP-11 · Records · Projects',
  h1: 'Projects',
  sub: 'Things David built because he wanted them to exist. The technical record under each is held to the same integrity rules as the résumé.',
  stackLabel: 'Stack',
  knownIssueLabel: 'Known issue',
  footer: 'Source code for individual projects isn’t linked here yet. David’s GitHub profile:',
};

export interface CaseFile {
  id: string;
  block: BlockId;
  n: number;
  name: string;
  stack: string;
  /** Why it exists, in the plainest terms (David’s words, from the handoff). */
  motive?: string;
  body: string[];
  knownIssue?: string;
}

export const caseFiles: CaseFile[] = [
  {
    id: 'car-thing',
    block: 'P1',
    n: 1,
    name: 'Car Thing Media Controller',
    motive: 'David wanted a desk media controller.',
    stack: 'Python, aiohttp, dbus-next, systemd, MPRIS, OAuth',
    body: [
      'Repurposed a discontinued Spotify Car Thing (an embedded Linux touch device) into a desk media controller.',
      'Built a Python service bridging MPRIS over D-Bus for one player and an HTTP control API for another, with auto-detection of the active player, album art display, an authenticated like action, and a browser-based setup page.',
      'Serves a touch-optimized 800x480 frontend to the device. Packaged with an install script and a systemd user service.',
    ],
    knownIssue:
      'A runtime failure attributed to a dbus-next incompatibility with Python 3.14 was unresolved at last check.',
  },
  {
    id: 'stream-deck',
    block: 'P2',
    n: 2,
    name: 'Stream Deck + Bring-Up on Linux',
    motive: 'David wanted the buttons to work on Linux.',
    stack: 'USB HID, udev, PipeWire',
    body: [
      'Brought a Stream Deck + (dial and touchscreen model) up on Fedora-based Linux without vendor software.',
      'Diagnosed a device-enumeration failure by comparing behavior across two open-source host implementations.',
      'Built per-application audio routing for system, focused-window, chat and media streams through PipeWire, replacing a hand-built link topology with a maintained output mapping.',
      'Also produced a custom 144x144 icon set for the device display.',
    ],
  },
  {
    id: 'homelab',
    block: 'P3',
    n: 3,
    name: 'Self-Hosted Service Infrastructure',
    stack: 'Proxmox VE, Docker, Python, CI/CD',
    body: [
      'A CI/CD pipeline from pull request through build to deployment for containerized services on a Proxmox host, including a self-hosted OpenSpeedTest instance and a Python scraper that monitors rafting availability and posts notifications to Discord.',
      'Also runs an LXC-hosted dedicated game server.',
    ],
  },
  {
    id: 'dashboard',
    block: 'P4',
    n: 4,
    name: 'Match Analytics Dashboard',
    motive: 'David wanted to inspect his team’s match statistics.',
    stack: 'React, REST API integration',
    body: [
      'Built a React dashboard consuming a third-party match-statistics API for a five-player team, extracting 459 opening-duel events and 258 clutch events across 21 matches into six tabs of performance metrics.',
      'Documented API inconsistencies, including zeroed percentage fields in the primary endpoint that required computation from a secondary array endpoint.',
    ],
  },
];
