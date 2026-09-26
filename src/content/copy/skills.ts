/** Loadout — real skills (pack §4) as weapon skins; rarity encodes the pack's evidence tag. */
import type { CopyRecord } from '../types';

export type Rarity = 'covert' | 'classified' | 'restricted' | 'consumer' | 'souvenir';
export type Wear = 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred';

export interface Skin {
  name: string;
  wear: Wear;
  float: number;
  rarity: Rarity;
  /** Pack §4 "Source" column, verbatim. Empty for the fictional souvenir. */
  evidence: string;
  statTrak?: string;
}

export const skillsCopy = {
  kicker: 'FORM DRV-4 · EQUIPMENT MANIFEST',
  h1: 'Loadout',
  sub: 'Skills rendered as weapon skins. The float values are fictional; the skills are not.',
  legend:
    'Float values and wear are decorative and say nothing about proficiency. Rarity reflects where the skill was used:',
  rarities: {
    covert: { label: 'Covert', meaning: 'paid production work' },
    classified: { label: 'Classified', meaning: 'production and personal projects' },
    restricted: { label: 'Restricted', meaning: 'personal projects' },
    consumer: { label: 'Consumer Grade', meaning: 'coursework' },
    souvenir: { label: 'Souvenir', meaning: 'fictional' },
  } as Record<Rarity, { label: string; meaning: string }>,
  inspect: 'Inspect',
  inspectBack: 'Back',
  evidenceLabel: 'Where it was used',
  matrixCaption: 'On the record vs. alleged liabilities',
  matrixCols: ['Discipline', 'On the record (verified)', 'Alleged liability'],
  fabricated: 'Fabricated',
  raftingCaption: 'International Scale of River Difficulty, as applied to employment',
};

export const skins: Skin[] = [
  {
    name: 'Python',
    wear: 'Factory New',
    float: 0.0142,
    rarity: 'covert',
    evidence: 'Salesforce-to-Oracle integration; C Spire parser; Car Thing service; Docker scraper',
  },
  {
    name: 'SQL & SOQL',
    wear: 'Minimal Wear',
    float: 0.0931,
    rarity: 'covert',
    evidence: 'Salesforce org queries',
  },
  {
    name: 'Apex',
    wear: 'Field-Tested',
    float: 0.225,
    rarity: 'covert',
    evidence: 'Salesforce org',
  },
  {
    name: 'PowerShell',
    wear: 'Field-Tested',
    float: 0.3107,
    rarity: 'covert',
    evidence: 'Workstation provisioning script',
  },
  {
    name: 'Bash',
    wear: 'Minimal Wear',
    float: 0.1203,
    rarity: 'covert',
    evidence: 'Linux automation, install scripting',
  },
  {
    name: 'Salesforce (REST API, Flow, Apex)',
    wear: 'Factory New',
    float: 0.0301,
    rarity: 'covert',
    evidence: 'Sole admin of production org',
  },
  {
    name: 'Oracle Financials',
    wear: 'Well-Worn',
    float: 0.4099,
    rarity: 'covert',
    evidence: 'Journal entry loading',
  },
  {
    name: 'Windows Server',
    wear: 'Battle-Scarred',
    float: 0.6613,
    rarity: 'covert',
    evidence: 'Aspen integration deployment',
  },
  {
    name: 'Active Directory · Entra ID',
    wear: 'Field-Tested',
    float: 0.2718,
    rarity: 'covert',
    evidence: 'Aspen IT',
  },
  {
    name: 'Elements.cloud',
    wear: 'Minimal Wear',
    float: 0.0877,
    rarity: 'covert',
    evidence: 'Aspen',
  },
  {
    name: 'Atera',
    wear: 'Field-Tested',
    float: 0.2244,
    rarity: 'covert',
    evidence: 'Aspen evaluation and deployment',
  },
  {
    name: 'SFTP Automation',
    wear: 'Minimal Wear',
    float: 0.101,
    rarity: 'covert',
    evidence: 'C Spire',
  },
  {
    name: 'Linux',
    wear: 'Factory New',
    float: 0.0007,
    rarity: 'classified',
    evidence: 'C Spire Linux hosts; daily driver across Ubuntu, Kubuntu, Bazzite, Nobara, Omarchy',
    statTrak: 'StatTrak™: distros installed',
  },
  {
    name: 'CI/CD',
    wear: 'Minimal Wear',
    float: 0.0716,
    rarity: 'classified',
    evidence: 'C Spire CI integration; homelab PR-to-deploy pipeline',
  },
  {
    name: 'Git',
    wear: 'Field-Tested',
    float: 0.1999,
    rarity: 'classified',
    evidence: 'Throughout',
  },
  {
    name: 'REST API Integration',
    wear: 'Minimal Wear',
    float: 0.0808,
    rarity: 'classified',
    evidence: 'Salesforce REST API; Leetify API; Spotify OAuth',
  },
  {
    name: 'JavaScript',
    wear: 'Field-Tested',
    float: 0.26,
    rarity: 'restricted',
    evidence: 'React dashboard, GitHub Pages apps, self-contained HTML tooling',
  },
  {
    name: 'Docker',
    wear: 'Minimal Wear',
    float: 0.11,
    rarity: 'restricted',
    evidence: 'Containerized self-hosted services',
  },
  {
    name: 'Proxmox VE · LXC',
    wear: 'Factory New',
    float: 0.042,
    rarity: 'restricted',
    evidence: 'Homelab host, dedicated game server container',
  },
  {
    name: 'USB HID',
    wear: 'Well-Worn',
    float: 0.42,
    rarity: 'restricted',
    evidence: 'Stream Deck + bring-up on Linux without vendor software',
  },
  {
    name: 'D-Bus · MPRIS',
    wear: 'Minimal Wear',
    float: 0.1337,
    rarity: 'restricted',
    evidence: 'Car Thing media controller',
  },
  {
    name: 'systemd',
    wear: 'Field-Tested',
    float: 0.2001,
    rarity: 'restricted',
    evidence: 'Car Thing install path',
  },
  {
    name: 'udev',
    wear: 'Battle-Scarred',
    float: 0.7777,
    rarity: 'restricted',
    evidence: 'Stream Deck detection failure diagnosis',
  },
  {
    name: 'PipeWire',
    wear: 'Minimal Wear',
    float: 0.099,
    rarity: 'restricted',
    evidence: 'Per-application routing via PipeWeaver',
  },
  {
    name: 'React · JSX',
    wear: 'Field-Tested',
    float: 0.27,
    rarity: 'restricted',
    evidence: 'Leetify team dashboard',
  },
  {
    name: 'aiohttp',
    wear: 'Minimal Wear',
    float: 0.144,
    rarity: 'restricted',
    evidence: 'Car Thing backend',
  },
  {
    name: 'GitHub Pages',
    wear: 'Factory New',
    float: 0.01,
    rarity: 'restricted',
    evidence: 'Static app hosting',
  },
  {
    name: 'C (coursework)',
    wear: 'Field-Tested',
    float: 0.3,
    rarity: 'consumer',
    evidence: 'ECE 3724 peripheral drivers',
  },
  {
    name: 'PIC24 · dsPIC33 Assembly (coursework)',
    wear: 'Well-Worn',
    float: 0.44,
    rarity: 'consumer',
    evidence: 'ECE 3724 lab',
  },
  {
    name: 'Java (coursework)',
    wear: 'Field-Tested',
    float: 0.29,
    rarity: 'consumer',
    evidence: 'MSU coursework',
  },
  {
    name: 'I2C · SPI · UART (coursework)',
    wear: 'Minimal Wear',
    float: 0.15,
    rarity: 'consumer',
    evidence: 'ECE 3724',
  },
  {
    name: 'Patience',
    wear: 'Battle-Scarred',
    float: 0.9999,
    rarity: 'souvenir',
    evidence: '',
    statTrak: 'Dropped during an unspecified permitting season.',
  },
];

export interface MatrixRow {
  discipline: string;
  record: CopyRecord;
  liability: CopyRecord;
}

export const matrix: MatrixRow[] = [
  {
    discipline: 'Salesforce Flow',
    record: {
      id: 'm-flow',
      text: 'Migrated the org’s automation inventory to Flow and corrected a runtime order-of-execution defect.',
      status: 'verified',
      blockRefs: ['A3'],
    },
    liability: {
      id: 'l-flow',
      text: 'Now hears “order of execution” in his sleep. The order of his dreams remains unresolved.',
      status: 'fictional',
    },
  },
  {
    discipline: 'Python',
    record: {
      id: 'm-python',
      text: 'Built a scheduled REST-to-Oracle integration that removed ~125 annual hours of manual entry.',
      status: 'verified',
      blockRefs: ['A2'],
    },
    liability: {
      id: 'l-python',
      text: 'Automated away 125 hours of tedium per year and refuses to say what he did with them.',
      status: 'verified',
      blockRefs: ['A2'],
    },
  },
  {
    discipline: 'PowerShell',
    record: {
      id: 'm-ps',
      text: 'Automated imaging and setup for 150+ workstations.',
      status: 'verified',
      blockRefs: ['B1'],
    },
    liability: {
      id: 'l-ps',
      text: 'Has provisioned 150+ machines and apologized to none of them.',
      status: 'verified',
      blockRefs: ['B1'],
    },
  },
  {
    discipline: 'XML',
    record: {
      id: 'm-xml',
      text: 'Adaptive parser for 100+ schema variants at 1,000 files per minute.',
      status: 'verified',
      blockRefs: ['C1'],
    },
    liability: {
      id: 'l-xml',
      text: 'Has seen 100+ ways to spell the same field. Cannot unsee them.',
      status: 'verified',
      blockRefs: ['C1'],
    },
  },
  {
    discipline: 'Linux',
    record: {
      id: 'm-linux',
      text: 'Daily driver across Ubuntu, Kubuntu, Bazzite, Nobara and Omarchy.',
      status: 'verified',
      blockRefs: ['SK-linux'],
    },
    liability: {
      id: 'l-linux',
      text: 'Distro count exceeds friend count. Both are growing.',
      status: 'fictional',
    },
  },
  {
    discipline: 'Git',
    record: {
      id: 'm-git',
      text: 'Used throughout production and personal work.',
      status: 'verified',
      blockRefs: ['SK-git'],
    },
    liability: {
      id: 'l-git',
      text: 'Specializes in git push --force against production at 4:59 PM on holiday weekends.',
      status: 'fictional',
    },
  },
  {
    discipline: 'Stakeholder management',
    record: {
      id: 'm-stake',
      text: 'Drove a $130K vendor engagement to approval.',
      status: 'verified',
      blockRefs: ['A5'],
    },
    liability: {
      id: 'l-stake',
      text: 'Can nod through multi-hour calls without processing actionable context.',
      status: 'fictional',
    },
  },
];

export const rafting: CopyRecord[] = [
  {
    id: 'r-sfa',
    text: 'Salesforce Administrator, City of Aspen: Class V. Mandatory portage around Procurement.',
    status: 'verified',
    blockRefs: ['A1'],
  },
  {
    id: 'r-it',
    text: 'IT Support Specialist, City of Aspen: Class III. 150+ workstations, one paddle.',
    status: 'verified',
    blockRefs: ['B1'],
  },
  {
    id: 'r-cspire',
    text: 'Software Developer Intern, C Spire: Class IV. 100+ schema variants; eddies everywhere.',
    status: 'verified',
    blockRefs: ['C1'],
  },
  {
    id: 'r-guide',
    text: 'Whitewater Rafting Guide / Instructor: Class: literally water. Up to 20 rafts and 120 customers. Customers returned: all of them.',
    status: 'verified',
    blockRefs: ['D1'],
  },
  {
    id: 'r-ms',
    text: 'MS Computer Science, CU Boulder (in progress): Class unknown. Currently scouting the rapid.',
    status: 'verified',
    blockRefs: ['E1'],
  },
];
