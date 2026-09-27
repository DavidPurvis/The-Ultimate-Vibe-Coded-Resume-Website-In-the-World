/** Conditional approval: acknowledge, confirm, or appeal. Fiction, in the Department's voice (voice.test). */
export const acknowledgment = {
  pending: {
    heading: 'Conditional approval',
    body: 'Access is approved on one condition: acknowledge that the requested document is publicly available.',
    yes: 'Acknowledge',
    appeal: 'Appeal',
  },
  acknowledged: {
    heading: 'Confirm acknowledgment',
    body: 'Please confirm that you acknowledged. The confirmation will be filed with the acknowledgment.',
    yes: 'Confirm',
    appeal: 'Appeal',
  },
  appealed: {
    heading: 'Appeal decided',
    body: 'Appeal granted. Original decision was also granted. Records have been reconciled.',
    yes: 'Continue',
  },
};
