/** Preliminary determination: risk, evidence and telemetry. Fiction, in the Department's voice (voice.test). */
import type { FindingId } from '../../domain/findings';

export const findingsCopy = {
  heading: 'Preliminary determination',
  processing: 'Compiling findings…',
  body: 'Review is complete. The Department has reached a preliminary determination.',
  risk: (value: string) => `Risk score: ${value}.`,
  primary: 'Primary contributor',
  none: 'No contributing behavior was recorded.',
  evidence: 'Evidence on file',
  telemetryHeading: 'Telemetry',
  telemetry: (processed: number) => [
    `Events processed: ${processed}`,
    'Events transmitted: 0',
    'Analytics providers: 0',
    'Retention: until tab close',
  ],
  gpc: 'Global Privacy Control honored. Behavioral observation was suspended for this session.',
  credential: (title: string) =>
    `Supplementary credential on file: ${title}. Relevance: under review.`,
  proceed: 'Proceed to adjudication',
};

/** Primary-contributor phrasing for the risk line. */
export const primaryLabel: Record<FindingId, string> = {
  REPEATED_REQUEST: 'repeated selection of "View résumé."',
  PERSISTENCE: 'persistence after reassignment.',
  EXTERNAL_CONSULTATION: 'external consultation.',
  EXTRACTION: 'clipboard activity.',
  CASE_CONTINUITY: 'refresh behavior.',
  ACKNOWLEDGMENT_DECLINED: 'a declined acknowledgment.',
  CEREMONY_DECLINED: 'a declined ceremony.',
};
