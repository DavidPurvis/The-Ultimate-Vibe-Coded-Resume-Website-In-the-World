/**
 * THE résumé. GEN composition from the Résumé Context Pack (§9), one page, ATS-safe.
 * This file is the single source for /resume/, resume.pdf, resume.md, llms.txt and JSON-LD.
 * Every bullet traces to a block ID; framings are pack-provided (or written from the FACT line).
 */
import type { BlockId } from './types';

export interface Bullet {
  block: BlockId;
  text: string;
}
export interface Role {
  id: 'aspen-sfa' | 'aspen-it' | 'cspire' | 'rafting';
  title: string;
  org: string;
  location: string;
  dates: string;
  /** ISO-ish start for ordering checks (YYYY-MM). */
  start: string;
  bullets: Bullet[];
}
export interface Project {
  id: 'P3' | 'P1';
  anchor: string;
  name: string;
  stack: string;
  bullets: Bullet[];
}

export const EMAIL = 'davidpurvis647@gmail.com';

export const identity = {
  name: 'David Purvis',
  headline: 'Software Engineer',
  location: 'Broomfield, CO',
  email: EMAIL,
  linkedin: { href: 'https://www.linkedin.com/in/dgp0', display: 'linkedin.com/in/dgp0' },
  github: { href: 'https://github.com/DavidPurvis', display: 'github.com/DavidPurvis' },
} as const;

export const summary: Bullet = {
  block: 'SUM-GEN',
  text: 'Software engineer with two years of production experience owning a system of record for a 300+ employee organization, plus a BS in Computer Science (Magna Cum Laude) and an MS in progress at CU Boulder.',
};

export const experience: Role[] = [
  {
    id: 'aspen-sfa',
    title: 'Salesforce Administrator',
    org: 'City of Aspen, Strategy & Innovation Office',
    location: 'Aspen, CO',
    dates: 'Apr 2025 – May 2026',
    start: '2025-04',
    bullets: [
      {
        block: 'A1',
        text: 'Served as the sole technical resource for the city’s Salesforce org, the system of record for permitting and financial operations across 22 departments in a 300+ employee municipal government.',
      },
      {
        block: 'A2',
        text: 'Designed and shipped a scheduled Python integration between the Salesforce REST API and Oracle Financials, with run-status and error reporting built into the job itself; removed ~125 annual hours of manual entry and the transcription error class that came with it.',
      },
      {
        block: 'A3',
        text: 'Migrated the org’s legacy automation inventory to Flow, isolating a runtime order-of-execution defect introduced by the transition.',
      },
      {
        block: 'A5',
        text: 'Led the technical side of a three-day vendor architecture assessment and drove the resulting $130K engagement to approval.',
      },
    ],
  },
  {
    id: 'aspen-it',
    title: 'IT Support Specialist',
    org: 'City of Aspen',
    location: 'Aspen, CO',
    dates: 'Oct 2024 – Apr 2025',
    start: '2024-10',
    bullets: [
      {
        block: 'B1',
        text: 'Automated workstation imaging and setup with a PowerShell provisioning script, deploying and configuring 150+ machines in six months.',
      },
    ],
  },
  {
    id: 'rafting',
    title: 'Whitewater Rafting Guide / Instructor',
    org: 'Whitewater Rafting, LLC',
    location: 'Glenwood Springs, CO',
    dates: 'May 2022 – Nov 2024 (seasonal)',
    start: '2022-05',
    bullets: [
      {
        block: 'D1',
        text: 'Led trips of up to 20 rafts and 120 customers; trained new guides on technique and safety protocol.',
      },
    ],
  },
  {
    id: 'cspire',
    title: 'Software Developer Intern, Fiber Billing',
    org: 'C Spire',
    location: 'Ridgeland, MS',
    dates: 'Jun 2021 – Jul 2021',
    start: '2021-06',
    bullets: [
      {
        block: 'C1',
        text: 'Developed an adaptive XML parser handling 100+ schema variants for the Fiber Billing system, sustaining a throughput of 1,000 files per minute.',
      },
      {
        block: 'C2',
        text: 'Automated SFTP transfer and parsing between Linux hosts; integrated the pipeline into the existing continuous integration process.',
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: 'P3',
    anchor: 'homelab',
    name: 'Self-Hosted Service Infrastructure',
    stack: 'Proxmox VE, Docker, Python, CI/CD',
    bullets: [
      {
        block: 'P3',
        text: 'Built a CI/CD pipeline from pull request through build to deployment for containerized services on a Proxmox host, including a self-hosted OpenSpeedTest instance and a Python scraper that monitors rafting availability and posts notifications to Discord.',
      },
    ],
  },
  {
    id: 'P1',
    anchor: 'car-thing',
    name: 'Car Thing Media Controller',
    stack: 'Python, aiohttp, dbus-next, systemd, MPRIS',
    bullets: [
      {
        block: 'P1',
        text: 'Repurposed a discontinued embedded Linux touch device into a media controller with a Python D-Bus/MPRIS service, touch frontend, and systemd packaging.',
      },
    ],
  },
];

/** S3 — Platform-first skills block (pack verbatim), as used by the GEN composition. */
export const skills: { label: string; items: string }[] = [
  { label: 'Languages', items: 'Python, Bash, PowerShell, SQL, JavaScript, Apex/SOQL' },
  {
    label: 'Infrastructure',
    items: 'Linux, Docker, Proxmox VE, Windows Server, Active Directory / Entra ID',
  },
  {
    label: 'Platforms',
    items: 'Salesforce (REST API, Flow, Apex), Oracle Financials, Elements.cloud, Atera',
  },
  {
    label: 'Practices',
    items:
      'CI/CD, scheduled and unattended job design, dependency and impact analysis, documentation',
  },
];

/** E1 + E2. */
export const education: { block: BlockId; school: string; line: string }[] = [
  {
    block: 'E1',
    school: 'University of Colorado Boulder',
    line: 'MS, Computer Science (Professional) · Expected May 2028',
  },
  {
    block: 'E2',
    school: 'Mississippi State University',
    line: 'BS, Computer Science, AI Concentration · May 2023 · Magna Cum Laude · 3.76 GPA',
  },
];

/** Pack "what to report back": selection, cuts and why. Surfaced in the PR and verify-pdf report. */
export const selection = {
  lane: 'GEN',
  selected: [
    'ID (full contact line, no phone)',
    'SUM-GEN',
    'A1 (verb-first, written from the FACT line)',
    'A2 (platform framing)',
    'A3 (SHORT)',
    'A5 (SHORT)',
    'B1 (automation-forward)',
    'C1 (throughput framing)',
    'C2 (as written)',
    'D1',
    'P3 (first sentence, verb-first)',
    'P1 (short framing)',
    'S3',
    'E1',
    'E2',
  ],
  cut: [
    {
      block: 'B5',
      reason:
        'Listed in GEN, but the pack says to cut it when Projects are included (cut-order #2).',
    },
    { block: 'A4, A6, A7', reason: 'Not part of the GEN composition.' },
    { block: 'E3, E4, E5, C1–C5 coursework', reason: 'GEN composition uses E1+E2 only.' },
    { block: 'P2, P4', reason: 'Not in GEN; shown on the /projects/ Case Files page instead.' },
    { block: 'P5, P6, P7', reason: 'Weakest / unverified projects.' },
    { block: 'O1–O4', reason: 'Optional sections; cut-order #1.' },
    { block: 'MSU Teaching Assistant', reason: 'Pack: incomplete record, never write a bullet.' },
  ],
  placeholders: {
    EMAIL: `${EMAIL} (approved by David)`,
    USERNAME: 'DavidPurvis (confirmed by David)',
    PHONE: 'Omitted by choice',
  },
} as const;
