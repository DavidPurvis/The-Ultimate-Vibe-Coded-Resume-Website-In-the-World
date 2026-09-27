/** Scope clarification: the request for the request. Fiction, in the Department's voice (voice.test). */
import type { LaneChoice } from '../../domain/events';

export const scope = {
  heading: 'Scope clarification',
  processing: 'Classifying request…',
  body: 'Your request to view publicly available information has been received. Please specify the scope of the request.',
  legend: 'Scope of request',
  options: [
    { value: 'emb', label: 'Embedded software' },
    { value: 'plt', label: 'Platform / SRE' },
    { value: 'be', label: 'Backend' },
    { value: 'gen', label: 'General software engineering' },
    { value: 'unspecified', label: 'I was told there would be a PDF' },
  ] as const satisfies readonly { value: LaneChoice; label: string }[],
  submit: 'Submit scope',
  empty: 'Scope cannot be empty. “None” is not a scope.',
  accepted: 'Scope accepted. Approved in principle.',
};
