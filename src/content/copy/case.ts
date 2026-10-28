export const caseCopy = {
  status: {
    intake: 'Case status: intake',
    review: 'Case status: departmental review',
    oversight: 'Case status: administrative oversight',
    released: 'Case status: released',
    direct: 'Direct access',
  },
  notices: {
    'classification-withheld': 'Your refusal to be classified has been circulated to the relevant offices. No office has accepted responsibility.',
    'inspection-waived': 'Verification was concluded without inspection. The absence of findings has been filed as a finding.',
    'allocation-loss': 'An unsuccessful hyperlink allocation appears in your file. The allocation procedure has been found satisfactory.',
    'appendix-reviewed': 'You have reviewed material the committee removed from the file. The removal has been entered into the file.',
    'verification-revised': 'Your verification required revisions. The verification system has received no revisions.',
    'file-circulated': 'Your file has now been circulated between departments. This constitutes progress.',
    'oversight-opened': 'Your continued presence has qualified this visit for administrative oversight. No action is required. Several actions are available.',
  },
  ruling: {
    neutral: 'The Department has established no grounds for withholding this document.',
    refused: 'Classification remains withheld. This has no bearing on document release.',
    skipped: 'Inspection was waived. The document has remained available throughout.',
    loss: 'The allocation record has been reviewed. It does not concern this document.',
    appendix: 'The appendix has been consulted. Its recommendations are not required.',
  },
} as const;

export const releaseCopy = {
  close: 'Close document release',
  first: {
    title: 'Request document release',
    body: 'You are requesting access to the résumé of David Purvis. Please confirm that this is the document you intend to read.',
    button: 'Confirm document request',
  },
  second: {
    title: 'Confirm your confirmation',
    body: 'Your request has been received. The Department requires confirmation that the preceding confirmation was intentional.',
    button: 'Confirm previous confirmation',
  },
  approved: 'Approved',
  open: 'Open résumé',
  bypass: 'Read résumé directly',
} as const;
