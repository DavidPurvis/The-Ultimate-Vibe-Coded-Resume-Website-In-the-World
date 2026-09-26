/**
 * Lane résumés: the Résumé Context Pack's §9 "Recommended composition by lane", assembled from the
 * same verified blocks as the GEN résumé. GEN *is* resume.ts, so /resume/ can't drift. Framings
 * are pack-provided and lane-matched; where one is adapted, `selection` says how and why. Role
 * headers (titles, dates) always come from resume.ts, and roles stay reverse-chronological.
 *
 * Coursework-only skills (C, Java, assembly, microcontroller peripherals) are labelled
 * "(coursework)" wherever they sit outside Education (pack §4 CRSE rule, §8 rule 7).
 */
import * as gen from './resume';
import type { Bullet, EducationEntry, Project, Role } from './resume';

export type LaneId = 'gen' | 'emb' | 'plt' | 'be';
export type SectionKey = 'summary' | 'experience' | 'projects' | 'skills' | 'education';

export interface LaneResume {
  id: LaneId;
  code: 'GEN' | 'EMB' | 'PLT' | 'BE';
  /** "Embedded software" etc.: what the cut is for. */
  label: string;
  path: string;
  /** Output file in dist/ (and its link, relative to the base). */
  pdf: string;
  /** Suggested filename for the download attribute. */
  pdfName: string;
  order: readonly SectionKey[];
  summary: Bullet | null;
  experience: Role[];
  projects: Project[];
  skills: { label: string; items: string }[];
  education: EducationEntry[];
  selection: {
    selected: readonly string[];
    cut: readonly { block: string; reason: string }[];
  };
}

/** A role from resume.ts with this lane's bullets (header data is never re-typed). */
function role(id: Role['id'], bullets: Bullet[]): Role {
  const r = gen.experience.find((x) => x.id === id);
  if (!r) throw new Error(`unknown role ${id}`);
  return { ...r, bullets };
}

const genBullet = (block: Bullet['block']): Bullet => {
  const b = gen.experience.flatMap((r) => r.bullets).find((x) => x.block === block);
  if (!b) throw new Error(`GEN has no ${block}`);
  return b;
};

const P3 = gen.projects.find((p) => p.id === 'P3') as Project;
const P1: Project = {
  ...(gen.projects.find((p) => p.id === 'P1') as Project),
  bullets: [
    {
      block: 'P1',
      text: 'Repurposed a discontinued Spotify Car Thing (embedded Linux touch device) into a desk media controller. Wrote a Python service bridging MPRIS over D-Bus and an HTTP control API, auto-detecting the active player and serving a touch-optimized 800x480 frontend to the device. Packaged with an install script and a systemd user unit.',
    },
  ],
};
const P2 = (text: string): Project => ({
  id: 'P2',
  anchor: 'stream-deck',
  name: 'Stream Deck + Bring-Up on Linux',
  stack: 'USB HID, udev, PipeWire',
  bullets: [{ block: 'P2', text }],
});
const P4: Project = {
  id: 'P4',
  anchor: 'dashboard',
  name: 'Match Analytics Dashboard',
  stack: 'React, REST API integration',
  bullets: [
    {
      block: 'P4',
      text: 'Built a React dashboard over a third-party match-statistics API, extracting 459 opening-duel events and 258 clutch events across 21 matches into six tabs of performance metrics; documented zeroed percentage fields in the primary endpoint and computed them from a secondary array endpoint.',
    },
  ],
};

const [MS, BS] = gen.education as [EducationEntry, EducationEntry];
const BS_NO_GPA: EducationEntry = {
  block: 'E1',
  school: BS.school,
  line: BS.line.replace(/ · 3\.76 GPA$/, ''),
};
const E3: Bullet = { block: 'E3', text: 'Coursework: Network Systems, Graduate Algorithms' };

const A3_MIGRATION: Bullet = {
  block: 'A3',
  text: 'Migrated the org’s full inventory of legacy automation to the current platform framework ahead of a vendor retirement deadline, isolating and correcting a runtime order-of-execution defect introduced by the transition.',
};

const OPTIONAL_CUT = { block: 'O1–O4', reason: 'Optional sections; cut-order #1.' } as const;
const TA_CUT = {
  block: 'MSU Teaching Assistant',
  reason: 'Pack: incomplete record, never write a bullet.',
} as const;

export const LANES: Record<LaneId, LaneResume> = {
  gen: {
    id: 'gen',
    code: 'GEN',
    label: 'General software engineering',
    path: '/resume/',
    pdf: 'resume.pdf',
    pdfName: 'David-Purvis-Resume.pdf',
    order: ['summary', 'experience', 'projects', 'skills', 'education'],
    summary: gen.summary,
    experience: gen.experience,
    projects: gen.projects,
    skills: gen.skills,
    education: gen.education,
    selection: { selected: gen.selection.selected, cut: gen.selection.cut },
  },

  emb: {
    id: 'emb',
    code: 'EMB',
    label: 'Embedded software',
    path: '/resume/for/emb/',
    pdf: 'resume-emb.pdf',
    pdfName: 'David-Purvis-Resume-Embedded.pdf',
    // Pack: education sits high because the ECE sequence is the credential the work history lacks.
    order: ['summary', 'skills', 'education', 'projects', 'experience'],
    summary: {
      block: 'SUM-EMB-SHORT',
      text: 'Software engineer pivoting to embedded, with a completed digital logic and microprocessors sequence, two years of production Python and systems automation, and personal embedded Linux work in D-Bus, systemd, and USB HID.',
    },
    // S2 (cut-order #8: S1 ran the page over), with coursework-only skills labelled.
    skills: [
      {
        label: 'Languages',
        items: 'Python, Bash, JavaScript, SQL; C, PIC24 assembly (coursework)',
      },
      {
        label: 'Embedded & Systems',
        items:
          'USB HID, Linux, systemd, D-Bus, udev, Docker, Proxmox VE; I2C/SPI/UART and digital logic design (coursework)',
      },
      { label: 'Practices', items: 'Git, CI/CD, unattended job design, technical documentation' },
    ],
    education: [
      MS,
      {
        ...BS,
        notes: [
          {
            block: 'E4',
            text: 'Began in Computer Engineering and completed the digital logic and microprocessors sequence before transferring into Computer Science.',
          },
          {
            block: 'CW2',
            text: 'Relevant coursework: Microprocessors (PIC24 assembly and C, I2C/SPI/UART, single-board bring-up), Digital Devices and Logic Design, Operating Systems, Programming Language Implementation.',
          },
        ],
      },
    ],
    projects: [
      P1,
      P2(
        'Brought a USB HID control surface (Stream Deck +) up on Fedora-based Linux without vendor software; diagnosed a device-enumeration failure through differential testing across two open-source host implementations, and built per-application audio routing through PipeWire.',
      ),
      P3,
    ],
    experience: [
      role('aspen-sfa', [
        genBullet('A1'),
        {
          block: 'A2',
          text: 'Built a Python integration extracting financial data via the Salesforce REST API and loading daily journal entries into Oracle, deployed as an unattended scheduled job with automated reporting of run status and error conditions; eliminated ~125 hours of annual manual entry and a recurring transcription error path.',
        },
        {
          block: 'A3',
          text: 'Isolated and corrected a runtime order-of-execution defect surfaced during a full platform migration of the org’s automation inventory ahead of a vendor retirement deadline.',
        },
      ]),
      role('aspen-it', [genBullet('B1')]),
      role('cspire', [genBullet('C1'), genBullet('C2')]),
    ],
    selection: {
      selected: [
        'ID (full contact line, no phone)',
        'SUM-EMB-SHORT',
        'S2 (coursework-only skills labelled)',
        'E1',
        'E2',
        'E4',
        'Coursework C2 (compressed embedded)',
        'P1 (long framing)',
        'P2 (long framing)',
        'P3 (first sentence, verb-first)',
        'A1 (verb-first, written from the FACT line)',
        'A2 (embedded/reliability framing)',
        'A3 (debugging-forward)',
        'B1 (automation-forward)',
        'C1 (throughput framing)',
        'C2 (as written)',
      ],
      cut: [
        {
          block: 'D1 and the rafting header',
          reason: 'Cut-order #7: the page ran five lines over.',
        },
        { block: 'S1', reason: 'Compressed to S2 (cut-order #8), after which the page fits.' },
        {
          block: 'SUM-EMB',
          reason:
            'Used SUM-EMB-SHORT: the long form lists C and PIC24 assembly beside production work without the coursework label (pack §4).',
        },
        {
          block: 'A4, A5, A6, A7',
          reason: 'Not part of the EMB composition (A5 is weak for EMB).',
        },
        { block: 'B2–B5', reason: 'Not part of the EMB composition.' },
        { block: 'E3, E5', reason: 'EMB composition uses E1+E2+E4+C2.' },
        { block: 'P4–P7', reason: 'Not in EMB; P4 is on the /projects/ Case Files page.' },
        OPTIONAL_CUT,
        TA_CUT,
      ],
    },
  },

  plt: {
    id: 'plt',
    code: 'PLT',
    label: 'Platform, DevOps and SRE',
    path: '/resume/for/plt/',
    pdf: 'resume-plt.pdf',
    pdfName: 'David-Purvis-Resume-Platform.pdf',
    order: ['summary', 'experience', 'projects', 'skills', 'education'],
    summary: {
      block: 'SUM-PLT',
      text: 'Software engineer with two years as sole technical owner of a municipal system-of-record platform, building unattended integrations, automated failure reporting, and change-impact tooling. Runs a self-hosted Proxmox environment with a full CI/CD pipeline. MS in Computer Science in progress at CU Boulder.',
    },
    experience: [
      role('aspen-sfa', [
        genBullet('A1'),
        genBullet('A2'),
        A3_MIGRATION,
        {
          block: 'A4',
          text: 'Introduced dependency-analysis tooling and authored the org’s first technical documentation of the data model, object relationships, and integrations, establishing change-impact assessment in a previously undocumented environment.',
        },
        {
          block: 'A6',
          text: 'Assessed the org’s permission model, network allowlisting, and session handling; documented findings and remediation recommendations for leadership review.',
        },
      ]),
      role('aspen-it', [genBullet('B1')]),
      role('rafting', [genBullet('D1')]),
      role('cspire', [genBullet('C1'), genBullet('C2')]),
    ],
    projects: [
      P3,
      P2(
        'Brought a USB HID control surface up on Linux without vendor software, diagnosing a device-enumeration failure and building per-application PipeWire audio routing.',
      ),
    ],
    skills: gen.skills,
    education: [{ ...MS, notes: [E3] }, BS_NO_GPA],
    selection: {
      selected: [
        'ID (full contact line, no phone)',
        'SUM-PLT',
        'A1 (verb-first, written from the FACT line)',
        'A2 (platform framing)',
        'A3 (migration-forward)',
        'A4 (vendor-neutral)',
        'A6',
        'B1 (automation-forward)',
        'C1 (throughput framing)',
        'C2 (as written)',
        'D1',
        'P3 (first sentence, verb-first)',
        'P2 (short framing)',
        'S3',
        'E1 (degree and honors, no GPA)',
        'E3',
      ],
      cut: [
        { block: 'B4', reason: 'Cut-order #2: the page ran one line over.' },
        { block: 'E2 (GPA)', reason: 'Pack: drop the GPA for PLT postings.' },
        { block: 'A5, A7', reason: 'Not part of the PLT composition.' },
        { block: 'B2, B3, B5', reason: 'Not part of the PLT composition.' },
        {
          block: 'P1, P4–P7',
          reason: 'Not in PLT; P1 and P4 are on the /projects/ Case Files page.',
        },
        {
          block: 'Coursework lines',
          reason: 'Pack: C5, omit coursework when experience fills the page.',
        },
        OPTIONAL_CUT,
        TA_CUT,
      ],
    },
  },

  be: {
    id: 'be',
    code: 'BE',
    label: 'Backend and distributed systems',
    path: '/resume/for/be/',
    pdf: 'resume-be.pdf',
    pdfName: 'David-Purvis-Resume-Backend.pdf',
    order: ['summary', 'experience', 'projects', 'skills', 'education'],
    summary: {
      block: 'SUM-BE',
      text: 'Software engineer with two years of production integration work — REST API extraction, scheduled batch loading into a financial system of record, and high-throughput parsing across 100+ schema variants. MS in Computer Science in progress at CU Boulder, focused on network and distributed systems.',
    },
    experience: [
      role('aspen-sfa', [
        genBullet('A1'),
        {
          block: 'A2',
          text: 'Built a daily batch integration extracting financial records via REST and loading journal entries into Oracle Financials, with automated status and failure reporting; eliminated ~125 hours of annual manual data entry.',
        },
        A3_MIGRATION,
      ]),
      // Pack: for BE, keep only the IT Support header for continuity.
      role('aspen-it', []),
      role('rafting', [genBullet('D1')]),
      role('cspire', [
        {
          block: 'C1',
          text: 'Developed an adaptive parser that normalized 100+ schema variants into a single billing ingest path, sustaining 1,000 files per minute.',
        },
        genBullet('C2'),
      ]),
    ],
    projects: [P3, P4],
    skills: [
      { label: 'Languages', items: 'Python, JavaScript, SQL, Bash; Java, C (coursework)' },
      {
        label: 'Backend',
        items:
          'REST API integration, batch and scheduled data pipelines, high-throughput parsing, schema normalization',
      },
      { label: 'Infrastructure', items: 'Linux, Docker, Proxmox VE, CI/CD, Git' },
    ],
    education: [
      { ...MS, notes: [E3] },
      {
        ...BS,
        notes: [
          {
            block: 'CW4',
            text: 'Coursework: Operating Systems, Algorithms, Software Architecture and Design, Software Testing and QA, Programming Language Implementation.',
          },
        ],
      },
    ],
    selection: {
      selected: [
        'ID (full contact line, no phone)',
        'SUM-BE',
        'A1 (verb-first, written from the FACT line)',
        'A2 (backend framing)',
        'A3 (migration-forward)',
        'IT Support Specialist header only',
        'C1 (robustness framing)',
        'C2 (as written)',
        'D1',
        'P3 (first sentence, verb-first)',
        'P4 (API-inconsistency detail, game unnamed)',
        'S4 (coursework-only languages labelled)',
        'E1',
        'E2',
        'E3',
        'Coursework C4',
      ],
      cut: [
        { block: 'B1–B5', reason: 'Pack: for BE, keep the IT Support header only.' },
        { block: 'A4–A7', reason: 'Not part of the BE composition.' },
        {
          block: 'P1, P2, P5–P7',
          reason: 'Not in BE; P1 and P2 are on the /projects/ Case Files page.',
        },
        OPTIONAL_CUT,
        TA_CUT,
      ],
    },
  },
};

export const LANE_IDS = Object.keys(LANES) as LaneId[];
/** The three tailored cuts that get their own page (GEN is /resume/ itself). */
export const TAILORED_LANES = LANE_IDS.filter((l) => l !== 'gen');
