/**
 * Words the résumé may and may not use: real organisations, technologies with no evidence at all,
 * and the technology vocabulary the validator tracks from fact to framing.
 */
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

/**
 * Technology vocabulary the validator tracks: a framing may only use a term its fact carries (for
 * skills lines and project stacks: a term some fact carries). Compiled from the FACT lines, the
 * project stacks and the skills lines as of the content-model migration.
 */
export const TECH_TERMS: readonly string[] = [
  'Python',
  'Bash',
  'PowerShell',
  'SQL',
  'JavaScript',
  'Java',
  'C',
  'Apex',
  'SOQL',
  'Salesforce',
  'Oracle',
  'Oracle Financials',
  'Elements.cloud',
  'Atera',
  'Linux',
  'Docker',
  'Proxmox',
  'Proxmox VE',
  'Windows Server',
  'Active Directory',
  'Entra ID',
  'REST',
  'Flow',
  'D-Bus',
  'dbus-next',
  'MPRIS',
  'systemd',
  'udev',
  'USB HID',
  'PipeWire',
  'aiohttp',
  'React',
  'CI/CD',
  'Git',
  'SFTP',
  'XML',
  'HTTP',
  'PIC24',
  'I2C',
  'SPI',
  'UART',
  'OpenSpeedTest',
  'Discord',
  'Fedora',
  'Ubuntu',
];

/** Does `text` use `term` as a word (so "Java" is not found inside "JavaScript")? */
export function usesTerm(text: string, term: string): boolean {
  const esc = term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const tail = term === 'C' ? '(?![A-Za-z0-9+#]|\\s+Spire)' : '(?![A-Za-z0-9])';
  return new RegExp(`(?<![A-Za-z0-9./-])${esc}${tail}`).test(text);
}

/**
 * Wording already published before the content model that goes beyond its own FACT line. Nothing
 * here was changed; each entry says where else the pack supports it, and postbuild lists them in
 * reports/content-report.json for David to confirm (or to cut).
 */
export interface Grandfathered {
  /** A framing ID, or `stack:<project>` for a project's stack line. */
  readonly where: string;
  readonly kind: 'term' | 'number';
  readonly value: string;
  readonly note: string;
}

export const GRANDFATHERED: readonly Grandfathered[] = [
  {
    where: 'A2:gen',
    kind: 'term',
    value: 'Oracle Financials',
    note: 'The A2 FACT line says "Oracle"; S3 names the system "Oracle Financials".',
  },
  {
    where: 'A2:be',
    kind: 'term',
    value: 'Oracle Financials',
    note: 'The A2 FACT line says "Oracle"; S3 names the system "Oracle Financials".',
  },
  {
    where: 'P2:emb',
    kind: 'term',
    value: 'USB HID',
    note: 'The P2 FACT line names the device (Stream Deck +); SUM-EMB-SHORT and S2 name USB HID.',
  },
  {
    where: 'P2:plt',
    kind: 'term',
    value: 'USB HID',
    note: 'The P2 FACT line names the device (Stream Deck +); SUM-EMB-SHORT and S2 name USB HID.',
  },
  {
    where: 'P1:emb',
    kind: 'number',
    value: '800x480',
    note: 'On the pack’s list of verified numbers; the P1 FACT line omits the display size.',
  },
  {
    where: 'stack:P1',
    kind: 'term',
    value: 'aiohttp',
    note: 'In the P1 stack as published; no FACT line names it.',
  },
  {
    where: 'stack:P1',
    kind: 'term',
    value: 'dbus-next',
    note: 'In the P1 stack as published; no FACT line names it (P1 says D-Bus).',
  },
];
