/**
 * Verified facts from David Purvis's Résumé Context Pack (§1–§8).
 * These are the immutable FACT lines and the pack's integrity constraints, encoded as data so
 * the build can enforce them. Nothing in here may be invented.
 */
import type { BlockId } from './types';

/** Immutable FACT lines (pack wording) — the single reference for grounded copy. */
export const FACTS: Record<BlockId, string> = {
  ID: 'David Purvis · Broomfield, CO · linkedin.com/in/dgp0 · github.com/DavidPurvis',
  'SUM-GEN':
    'Software engineer with two years of production experience owning a system of record for a 300+ employee organization, plus a BS in Computer Science (Magna Cum Laude) and an MS in progress at CU Boulder.',
  'SUM-EMB-SHORT':
    'Software engineer pivoting to embedded, with a completed digital logic and microprocessors sequence, two years of production Python and systems automation, and personal embedded Linux work in D-Bus, systemd, and USB HID.',
  'SUM-PLT':
    'Software engineer with two years as sole technical owner of a municipal system-of-record platform, building unattended integrations, automated failure reporting, and change-impact tooling. Runs a self-hosted Proxmox environment with a full CI/CD pipeline. MS in Computer Science in progress at CU Boulder.',
  'SUM-BE':
    'Software engineer with two years of production integration work — REST API extraction, scheduled batch loading into a financial system of record, and high-throughput parsing across 100+ schema variants. MS in Computer Science in progress at CU Boulder, focused on network and distributed systems.',
  A1: 'Sole technical resource for the city’s Salesforce org, the system of record for permitting and financial operations across 22 departments in a 300+ employee municipal government.',
  A2: 'Built a Python integration extracting financial data via the Salesforce REST API and loading daily journal entries into Oracle. Deployed as a scheduled Windows Server job with automated email reporting of run status and errors. Eliminated approximately 125 hours of annual manual entry and a recurring transcription error path.',
  A3: 'Migrated the org’s full inventory of Workflow Rules and Process Builders to Flow ahead of Salesforce’s retirement deadline, identifying and correcting a runtime order-of-execution defect introduced by the transition.',
  A4: 'Introduced Elements.cloud for metadata dependency analysis and authored the org’s first technical documentation of the data model, object relationships, and integrations, establishing change-impact assessment in a previously undocumented environment.',
  A5: 'Led the technical side of a three-day onsite architecture assessment with the managed-package vendor and implementation partner; drove the resulting $130K engagement through three contract revisions to approval.',
  A6: 'Assessed the org’s permission model, network allowlisting, and session handling; documented findings and remediation recommendations for leadership review.',
  B1: 'Deployed and configured 150+ workstations in six months; developed a PowerShell provisioning script to automate imaging and setup.',
  C1: 'Developed an adaptive XML parser handling 100+ schema variants for the Fiber Billing system, sustaining 1,000 files/minute.',
  C2: 'Automated SFTP transfer and parsing between Linux hosts; integrated into the existing continuous integration process.',
  D1: 'Led trips of up to 20 rafts and 120 customers; trained new guides on technique and safety protocol.',
  E1: 'University of Colorado Boulder — MS, Computer Science (Professional) · Expected May 2028',
  E2: 'Mississippi State University — BS, Computer Science, AI Concentration · May 2023 · Magna Cum Laude · 3.76 GPA',
  E3: 'Coursework: Network Systems, Graduate Algorithms',
  E4: 'Began in Computer Engineering and completed the digital logic and microprocessors sequence before transferring into Computer Science.',
  CW2: 'Relevant coursework: Microprocessors (PIC24 assembly and C, I2C/SPI/UART, single-board bring-up), Digital Devices and Logic Design, Operating Systems, Programming Language Implementation.',
  CW4: 'Coursework: Operating Systems, Algorithms, Software Architecture and Design, Software Testing and QA, Programming Language Implementation.',
  P1: 'Repurposed a discontinued Spotify Car Thing — an embedded Linux touch device — into a desk media controller, with a Python service bridging MPRIS over D-Bus and an HTTP control API; packaged with an install script and a systemd user service.',
  P2: 'Brought a Stream Deck + up on Fedora-based Linux without vendor software; diagnosed a device-enumeration failure by comparing two open-source host implementations; built per-application PipeWire audio routing.',
  P3: 'CI/CD pipeline from pull request through build to deployment for containerized services on a Proxmox host, including a self-hosted OpenSpeedTest instance and a Python scraper that monitors rafting availability and posts notifications to Discord.',
  P4: 'Built a React dashboard consuming a third-party match-statistics API for a five-player team, extracting 459 opening-duel events and 258 clutch events across 21 matches into six tabs of performance metrics.',
  S2: 'Languages: C, Python, Bash, JavaScript, SQL; PIC24 assembly · Embedded & Systems: I2C/SPI/UART, digital logic design, USB HID, Linux, systemd, D-Bus, udev, Docker, Proxmox VE · Practices: Git, CI/CD, unattended job design, technical documentation',
  S3: 'Languages: Python, Bash, PowerShell, SQL, JavaScript, Apex/SOQL · Infrastructure: Linux, Docker, Proxmox VE, Windows Server, Active Directory / Entra ID · Platforms: Salesforce, Oracle Financials, Elements.cloud, Atera',
  S4: 'Languages: Python, Java, JavaScript, SQL, C, Bash · Backend: REST API integration, batch and scheduled data pipelines, high-throughput parsing, schema normalization · Infrastructure: Linux, Docker, Proxmox VE, CI/CD, Git',
  'SK-linux':
    'Linux (Ubuntu, Fedora derivatives, Arch derivatives) — daily driver across Ubuntu, Kubuntu, Bazzite, Nobara, Omarchy.',
  'SK-git': 'Git — production and personal projects throughout.',
};

/**
 * Pack §8 rule 8: "Every number in this pack is verified … No other numbers exist."
 * Normalised forms (see integrity.normalizeNumber).
 */
export const VERIFIED_NUMBERS: readonly string[] = [
  '125',
  '22',
  '300+',
  '150+',
  '10+',
  '100+',
  '1,000',
  '$130K',
  '20',
  '120',
  '3.76',
  '130',
  '459',
  '258',
  '21',
  '800x480',
  '144x144',
];

/** Real organisations: pure fiction (copy without blockRefs) must never borrow these names. */
export const REAL_EMPLOYERS: readonly string[] = [
  'City of Aspen',
  'C Spire',
  'Whitewater Rafting, LLC',
  'Mississippi State',
  'CU Boulder',
  'University of Colorado',
];

/** Pack §8 rule 10 — technologies with no supporting evidence anywhere. */
export const ABSENT_TECH =
  /\b(?:C\+\+|Rust|Kubernetes|k8s|Terraform|Ansible|AWS|Azure|GCP|FreeRTOS|Zephyr|RTOS|Yocto|Buildroot|device tree|kernel module|JTAG|SWD|CAN bus|Cortex-M|FPGA|VHDL|Verilog|SystemVerilog|MISRA|ISO 26262|DO-178C)(?![\w+])/i;

/** Case-sensitive "Go" the language, excluding ordinary English uses. */
export const GO_LANG = /\bGo\b(?!\s+(?:home|to|back|outside|ahead|on))/;
