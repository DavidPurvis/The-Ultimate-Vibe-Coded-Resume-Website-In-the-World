/** Behavioral review: the release control and its reassignments. Fiction, in the Department's voice (voice.test). */
export const release = {
  heading: 'Behavioral review',
  body: 'Full document release is subject to behavioral review. Select "Release document" when ready. The review may reassign your request.',
  desk: 'Release desk',
  label: 'Release document',
  /** The control's label after one and after two reassignments. */
  labels: ['Release document (under review)', 'Release document (reassigned)'],
  reassigned: (window: number) => `Request reassigned to Window ${window}.`,
  ready: 'Window 3 is open.',
};
