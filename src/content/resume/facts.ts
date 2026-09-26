/**
 * Verified facts: the Résumé Context Pack's FACT lines, verbatim, each with its source. Nothing in
 * here may be invented or reworded; framings (framings.ts) word these for a lane, and validate.ts
 * proves they add nothing.
 */
import type { BlockId, Fact } from './types';

/** The FACT line for `block` in the Résumé Context Pack. */
const pack = (block: BlockId) =>
  ({ doc: 'resume-context-pack', section: `FACT ${block}` }) as const;

export const FACTS: Record<BlockId, Fact> = {
  ID: {
    id: 'ID',
    claim: 'David Purvis · Broomfield, CO · linkedin.com/in/dgp0 · github.com/DavidPurvis',
    source: pack('ID'),
    kind: 'identity',
  },
  'SUM-GEN': {
    id: 'SUM-GEN',
    claim:
      'Software engineer with two years of production experience owning a system of record for a 300+ employee organization, plus a BS in Computer Science (Magna Cum Laude) and an MS in progress at CU Boulder.',
    source: pack('SUM-GEN'),
    kind: 'summary',
  },
  'SUM-EMB-SHORT': {
    id: 'SUM-EMB-SHORT',
    claim:
      'Software engineer pivoting to embedded, with a completed digital logic and microprocessors sequence, two years of production Python and systems automation, and personal embedded Linux work in D-Bus, systemd, and USB HID.',
    source: pack('SUM-EMB-SHORT'),
    kind: 'summary',
  },
  'SUM-PLT': {
    id: 'SUM-PLT',
    claim:
      'Software engineer with two years as sole technical owner of a municipal system-of-record platform, building unattended integrations, automated failure reporting, and change-impact tooling. Runs a self-hosted Proxmox environment with a full CI/CD pipeline. MS in Computer Science in progress at CU Boulder.',
    source: pack('SUM-PLT'),
    kind: 'summary',
  },
  'SUM-BE': {
    id: 'SUM-BE',
    claim:
      'Software engineer with two years of production integration work — REST API extraction, scheduled batch loading into a financial system of record, and high-throughput parsing across 100+ schema variants. MS in Computer Science in progress at CU Boulder, focused on network and distributed systems.',
    source: pack('SUM-BE'),
    kind: 'summary',
  },
  A1: {
    id: 'A1',
    claim:
      'Sole technical resource for the city’s Salesforce org, the system of record for permitting and financial operations across 22 departments in a 300+ employee municipal government.',
    source: pack('A1'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  A2: {
    id: 'A2',
    claim:
      'Built a Python integration extracting financial data via the Salesforce REST API and loading daily journal entries into Oracle. Deployed as a scheduled Windows Server job with automated email reporting of run status and errors. Eliminated approximately 125 hours of annual manual entry and a recurring transcription error path.',
    source: pack('A2'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  A3: {
    id: 'A3',
    claim:
      'Migrated the org’s full inventory of Workflow Rules and Process Builders to Flow ahead of Salesforce’s retirement deadline, identifying and correcting a runtime order-of-execution defect introduced by the transition.',
    source: pack('A3'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  A4: {
    id: 'A4',
    claim:
      'Introduced Elements.cloud for metadata dependency analysis and authored the org’s first technical documentation of the data model, object relationships, and integrations, establishing change-impact assessment in a previously undocumented environment.',
    source: pack('A4'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  A5: {
    id: 'A5',
    claim:
      'Led the technical side of a three-day onsite architecture assessment with the managed-package vendor and implementation partner; drove the resulting $130K engagement through three contract revisions to approval.',
    source: pack('A5'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  A6: {
    id: 'A6',
    claim:
      'Assessed the org’s permission model, network allowlisting, and session handling; documented findings and remediation recommendations for leadership review.',
    source: pack('A6'),
    kind: 'role-bullet',
    role: 'aspen-sfa',
  },
  B1: {
    id: 'B1',
    claim:
      'Deployed and configured 150+ workstations in six months; developed a PowerShell provisioning script to automate imaging and setup.',
    source: pack('B1'),
    kind: 'role-bullet',
    role: 'aspen-it',
  },
  C1: {
    id: 'C1',
    claim:
      'Developed an adaptive XML parser handling 100+ schema variants for the Fiber Billing system, sustaining 1,000 files/minute.',
    source: pack('C1'),
    kind: 'role-bullet',
    role: 'cspire',
  },
  C2: {
    id: 'C2',
    claim:
      'Automated SFTP transfer and parsing between Linux hosts; integrated into the existing continuous integration process.',
    source: pack('C2'),
    kind: 'role-bullet',
    role: 'cspire',
  },
  D1: {
    id: 'D1',
    claim:
      'Led trips of up to 20 rafts and 120 customers; trained new guides on technique and safety protocol.',
    source: pack('D1'),
    kind: 'role-bullet',
    role: 'rafting',
  },
  E1: {
    id: 'E1',
    claim:
      'University of Colorado Boulder — MS, Computer Science (Professional) · Expected May 2028',
    source: pack('E1'),
    kind: 'education',
  },
  E2: {
    id: 'E2',
    claim:
      'Mississippi State University — BS, Computer Science, AI Concentration · May 2023 · Magna Cum Laude · 3.76 GPA',
    source: pack('E2'),
    kind: 'education',
  },
  E3: {
    id: 'E3',
    claim: 'Coursework: Network Systems, Graduate Algorithms',
    source: pack('E3'),
    kind: 'coursework',
  },
  E4: {
    id: 'E4',
    claim:
      'Began in Computer Engineering and completed the digital logic and microprocessors sequence before transferring into Computer Science.',
    source: pack('E4'),
    kind: 'education',
  },
  CW2: {
    id: 'CW2',
    claim:
      'Relevant coursework: Microprocessors (PIC24 assembly and C, I2C/SPI/UART, single-board bring-up), Digital Devices and Logic Design, Operating Systems, Programming Language Implementation.',
    source: pack('CW2'),
    kind: 'coursework',
  },
  CW4: {
    id: 'CW4',
    claim:
      'Coursework: Operating Systems, Algorithms, Software Architecture and Design, Software Testing and QA, Programming Language Implementation.',
    source: pack('CW4'),
    kind: 'coursework',
  },
  P1: {
    id: 'P1',
    claim:
      'Repurposed a discontinued Spotify Car Thing — an embedded Linux touch device — into a desk media controller, with a Python service bridging MPRIS over D-Bus and an HTTP control API; packaged with an install script and a systemd user service.',
    source: pack('P1'),
    kind: 'project',
    project: 'P1',
  },
  P2: {
    id: 'P2',
    claim:
      'Brought a Stream Deck + up on Fedora-based Linux without vendor software; diagnosed a device-enumeration failure by comparing two open-source host implementations; built per-application PipeWire audio routing.',
    source: pack('P2'),
    kind: 'project',
    project: 'P2',
  },
  P3: {
    id: 'P3',
    claim:
      'CI/CD pipeline from pull request through build to deployment for containerized services on a Proxmox host, including a self-hosted OpenSpeedTest instance and a Python scraper that monitors rafting availability and posts notifications to Discord.',
    source: pack('P3'),
    kind: 'project',
    project: 'P3',
  },
  P4: {
    id: 'P4',
    claim:
      'Built a React dashboard consuming a third-party match-statistics API for a five-player team, extracting 459 opening-duel events and 258 clutch events across 21 matches into six tabs of performance metrics.',
    source: pack('P4'),
    kind: 'project',
    project: 'P4',
  },
  S2: {
    id: 'S2',
    claim:
      'Languages: C, Python, Bash, JavaScript, SQL; PIC24 assembly · Embedded & Systems: I2C/SPI/UART, digital logic design, USB HID, Linux, systemd, D-Bus, udev, Docker, Proxmox VE · Practices: Git, CI/CD, unattended job design, technical documentation',
    source: pack('S2'),
    kind: 'skills',
  },
  S3: {
    id: 'S3',
    claim:
      'Languages: Python, Bash, PowerShell, SQL, JavaScript, Apex/SOQL · Infrastructure: Linux, Docker, Proxmox VE, Windows Server, Active Directory / Entra ID · Platforms: Salesforce, Oracle Financials, Elements.cloud, Atera',
    source: pack('S3'),
    kind: 'skills',
  },
  S4: {
    id: 'S4',
    claim:
      'Languages: Python, Java, JavaScript, SQL, C, Bash · Backend: REST API integration, batch and scheduled data pipelines, high-throughput parsing, schema normalization · Infrastructure: Linux, Docker, Proxmox VE, CI/CD, Git',
    source: pack('S4'),
    kind: 'skills',
  },
  'SK-linux': {
    id: 'SK-linux',
    claim:
      'Linux (Ubuntu, Fedora derivatives, Arch derivatives) — daily driver across Ubuntu, Kubuntu, Bazzite, Nobara, Omarchy.',
    source: pack('SK-linux'),
    kind: 'skills',
  },
  'SK-git': {
    id: 'SK-git',
    claim: 'Git — production and personal projects throughout.',
    source: pack('SK-git'),
    kind: 'skills',
  },
};
