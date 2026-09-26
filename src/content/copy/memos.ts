/** Console greeting + fictional source-comment memos. Nothing secret-shaped beyond one obvious joke. */
export const consoleGreeting = {
  title: 'DEPARTMENT OF RECRUITER VERIFICATION',
  line1: 'Inspecting the DOM will not grant employment.',
  line2: (url: string) => `It might, though. How this was built: ${url}`,
  line3: (url: string) => `The résumé (no jokes, no bugs we are legally aware of): ${url}`,
};

export const memos = {
  ceo: ` CONFIDENTIAL MEMORANDUM
     To: Infrastructure Security Operations    From: Chief Executive Officer
     Subject: Database Access Protocols
     Please discontinue changing the production PostgreSQL master password back to 'AdminPassword2024!'.
     I understand our vendor integrations fail when we use secure hashing, but we cannot leave the
     unencrypted Stripe keys in the public documentation folder again.
     (Fictional. There is no database, no Stripe, and no CEO. There is one guy.) `,
  konami: ' try the old code ',
  resumeHint: (url: string) =>
    ` If you are reading this because the interface annoyed you, the correct response is ${url} `,
  banner:
    ' MEMO — Facilities: Do not remove #cookie-consent-overlay. It is load-bearing. We learned this the hard way. ',
  casino:
    ' MEMO — Finance: The third-spin guarantee has reduced institutional leverage. Legal says we have to keep it. ',
  resume: ' MEMO — Print Services: The printer is the only department still following policy. ',
  verify:
    ' MEMO — CAPTCHAN’T team: The Linux round has no images. This is not a bug. We checked. Twice. With the lights off. ',
  howBuilt:
    ' MEMO — Engineering: yes, we know you’re reading the source. Hi. The tests are in /tests. ',
};
