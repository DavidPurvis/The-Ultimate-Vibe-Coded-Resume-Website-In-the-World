/**
 * Framings: every wording of a fact that a résumé cut uses. IDs are `${block}:${lane}` after the
 * first lane (gen, emb, plt, be) that used the wording; skills lines add their label. A framing may
 * reorder, compress or re-emphasise its fact, but validate.ts rejects any number or technology its
 * fact doesn't carry (unless grandfathered in lexicon.ts, with a source, for David to confirm).
 */
import type { Framing, FramingId } from './types';

const pack = (id: FramingId, text: string): Framing => ({
  id,
  fact: id.split(':')[0] as Framing['fact'],
  text,
  origin: 'pack',
});
const adapted = (id: FramingId, text: string, why: string): Framing => ({
  ...pack(id, text),
  origin: 'adapted',
  why,
});

const LIST: readonly Framing[] = [
  /* ---------- summaries ---------- */
  pack(
    'SUM-GEN:gen',
    'Software engineer with two years of production experience owning a system of record for a 300+ employee organization, plus a BS in Computer Science (Magna Cum Laude) and an MS in progress at CU Boulder.',
  ),
  pack(
    'SUM-EMB-SHORT:emb',
    'Software engineer pivoting to embedded, with a completed digital logic and microprocessors sequence, two years of production Python and systems automation, and personal embedded Linux work in D-Bus, systemd, and USB HID.',
  ),
  pack(
    'SUM-PLT:plt',
    'Software engineer with two years as sole technical owner of a municipal system-of-record platform, building unattended integrations, automated failure reporting, and change-impact tooling. Runs a self-hosted Proxmox environment with a full CI/CD pipeline. MS in Computer Science in progress at CU Boulder.',
  ),
  pack(
    'SUM-BE:be',
    'Software engineer with two years of production integration work — REST API extraction, scheduled batch loading into a financial system of record, and high-throughput parsing across 100+ schema variants. MS in Computer Science in progress at CU Boulder, focused on network and distributed systems.',
  ),

  /* ---------- City of Aspen, Salesforce Administrator ---------- */
  adapted(
    'A1:gen',
    'Served as the sole technical resource for the city’s Salesforce org, the system of record for permitting and financial operations across 22 departments in a 300+ employee municipal government.',
    'verb-first, written from the FACT line',
  ),
  pack(
    'A2:gen',
    'Designed and shipped a scheduled Python integration between the Salesforce REST API and Oracle Financials, with run-status and error reporting built into the job itself; removed ~125 annual hours of manual entry and the transcription error class that came with it.',
  ),
  pack(
    'A2:emb',
    'Built a Python integration extracting financial data via the Salesforce REST API and loading daily journal entries into Oracle, deployed as an unattended scheduled job with automated reporting of run status and error conditions; eliminated ~125 hours of annual manual entry and a recurring transcription error path.',
  ),
  pack(
    'A2:be',
    'Built a daily batch integration extracting financial records via REST and loading journal entries into Oracle Financials, with automated status and failure reporting; eliminated ~125 hours of annual manual data entry.',
  ),
  pack(
    'A3:gen',
    'Migrated the org’s legacy automation inventory to Flow, isolating a runtime order-of-execution defect introduced by the transition.',
  ),
  pack(
    'A3:emb',
    'Isolated and corrected a runtime order-of-execution defect surfaced during a full platform migration of the org’s automation inventory ahead of a vendor retirement deadline.',
  ),
  pack(
    'A3:plt',
    'Migrated the org’s full inventory of legacy automation to the current platform framework ahead of a vendor retirement deadline, isolating and correcting a runtime order-of-execution defect introduced by the transition.',
  ),
  adapted(
    'A4:plt',
    'Introduced dependency-analysis tooling and authored the org’s first technical documentation of the data model, object relationships, and integrations, establishing change-impact assessment in a previously undocumented environment.',
    'vendor-neutral: the tool is described, not named',
  ),
  pack(
    'A5:gen',
    'Led the technical side of a three-day vendor architecture assessment and drove the resulting $130K engagement to approval.',
  ),
  pack(
    'A6:plt',
    'Assessed the org’s permission model, network allowlisting, and session handling; documented findings and remediation recommendations for leadership review.',
  ),

  /* ---------- City of Aspen, IT Support Specialist ---------- */
  pack(
    'B1:gen',
    'Automated workstation imaging and setup with a PowerShell provisioning script, deploying and configuring 150+ machines in six months.',
  ),

  /* ---------- C Spire ---------- */
  pack(
    'C1:gen',
    'Developed an adaptive XML parser handling 100+ schema variants for the Fiber Billing system, sustaining a throughput of 1,000 files per minute.',
  ),
  pack(
    'C1:be',
    'Developed an adaptive parser that normalized 100+ schema variants into a single billing ingest path, sustaining 1,000 files per minute.',
  ),
  pack(
    'C2:gen',
    'Automated SFTP transfer and parsing between Linux hosts; integrated the pipeline into the existing continuous integration process.',
  ),

  /* ---------- Whitewater Rafting ---------- */
  pack(
    'D1:gen',
    'Led trips of up to 20 rafts and 120 customers; trained new guides on technique and safety protocol.',
  ),

  /* ---------- projects ---------- */
  pack(
    'P1:gen',
    'Repurposed a discontinued embedded Linux touch device into a media controller with a Python D-Bus/MPRIS service, touch frontend, and systemd packaging.',
  ),
  pack(
    'P1:emb',
    'Repurposed a discontinued Spotify Car Thing (embedded Linux touch device) into a desk media controller. Wrote a Python service bridging MPRIS over D-Bus and an HTTP control API, auto-detecting the active player and serving a touch-optimized 800x480 frontend to the device. Packaged with an install script and a systemd user unit.',
  ),
  pack(
    'P2:emb',
    'Brought a USB HID control surface (Stream Deck +) up on Fedora-based Linux without vendor software; diagnosed a device-enumeration failure through differential testing across two open-source host implementations, and built per-application audio routing through PipeWire.',
  ),
  pack(
    'P2:plt',
    'Brought a USB HID control surface up on Linux without vendor software, diagnosing a device-enumeration failure and building per-application PipeWire audio routing.',
  ),
  adapted(
    'P3:gen',
    'Built a CI/CD pipeline from pull request through build to deployment for containerized services on a Proxmox host, including a self-hosted OpenSpeedTest instance and a Python scraper that monitors rafting availability and posts notifications to Discord.',
    'the FACT line, verb-first',
  ),
  adapted(
    'P4:be',
    'Built a React dashboard over a third-party match-statistics API, extracting 459 opening-duel events and 258 clutch events across 21 matches into six tabs of performance metrics; documented zeroed percentage fields in the primary endpoint and computed them from a secondary array endpoint.',
    'API-inconsistency detail added from the pack; the game is not named',
  ),

  /* ---------- skills ---------- */
  pack('S3:gen:languages', 'Python, Bash, PowerShell, SQL, JavaScript, Apex/SOQL'),
  pack(
    'S3:gen:infrastructure',
    'Linux, Docker, Proxmox VE, Windows Server, Active Directory / Entra ID',
  ),
  pack(
    'S3:gen:platforms',
    'Salesforce (REST API, Flow, Apex), Oracle Financials, Elements.cloud, Atera',
  ),
  pack(
    'S3:gen:practices',
    'CI/CD, scheduled and unattended job design, dependency and impact analysis, documentation',
  ),
  adapted(
    'S2:emb:languages',
    'Python, Bash, JavaScript, SQL; C, PIC24 assembly (coursework)',
    'coursework-only languages labelled (coursework)',
  ),
  adapted(
    'S2:emb:embedded-systems',
    'USB HID, Linux, systemd, D-Bus, udev, Docker, Proxmox VE; I2C/SPI/UART and digital logic design (coursework)',
    'coursework-only skills labelled (coursework)',
  ),
  pack('S2:emb:practices', 'Git, CI/CD, unattended job design, technical documentation'),
  adapted(
    'S4:be:languages',
    'Python, JavaScript, SQL, Bash; Java, C (coursework)',
    'coursework-only languages labelled (coursework)',
  ),
  pack(
    'S4:be:backend',
    'REST API integration, batch and scheduled data pipelines, high-throughput parsing, schema normalization',
  ),
  pack('S4:be:infrastructure', 'Linux, Docker, Proxmox VE, CI/CD, Git'),

  /* ---------- education notes ---------- */
  pack('E3:plt', 'Coursework: Network Systems, Graduate Algorithms'),
  pack(
    'E4:emb',
    'Began in Computer Engineering and completed the digital logic and microprocessors sequence before transferring into Computer Science.',
  ),
  pack(
    'CW2:emb',
    'Relevant coursework: Microprocessors (PIC24 assembly and C, I2C/SPI/UART, single-board bring-up), Digital Devices and Logic Design, Operating Systems, Programming Language Implementation.',
  ),
  pack(
    'CW4:be',
    'Coursework: Operating Systems, Algorithms, Software Architecture and Design, Software Testing and QA, Programming Language Implementation.',
  ),
];

export const FRAMINGS: Readonly<Record<FramingId, Framing>> = Object.fromEntries(
  LIST.map((f) => [f.id, f]),
) as Record<FramingId, Framing>;
