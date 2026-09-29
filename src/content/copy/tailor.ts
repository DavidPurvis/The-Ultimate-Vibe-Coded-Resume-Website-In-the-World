/** Résumé For You™ (/tailor/). The quiz picks a verified cut; Claude is strictly opt-in. */
import type { Family, Focus } from '../../scenes/tailor/logic';
import type { LaneId } from '../resume/resolve';

export const tailorCopy = {
  kicker: 'Form DDP-26 · Records · Résumé selection',
  h1: 'Résumé Selection',
  lede: 'State the role you are hiring for. The Department selects the cut of David’s résumé that fits, arranges it to your preference, and invents nothing to make it fit better.',
  skip: 'Skip the quiz:',
  family: {
    label: 'What are you hiring for?',
    options: [
      { value: 'emb', label: 'Embedded software or embedded Linux' },
      { value: 'plt', label: 'Platform, DevOps or SRE' },
      { value: 'be', label: 'Backend or distributed systems' },
      { value: 'gen', label: 'General software engineering' },
      { value: 'fan', label: 'Nothing. I just like the website.' },
    ] satisfies { value: Family; label: string }[],
  },
  focus: {
    label: 'What matters most in this hire?',
    options: [
      { value: 'hardware', label: 'Low-level and hardware knowledge' },
      { value: 'ownership', label: 'Owning a production system end to end' },
      { value: 'data', label: 'Integrations, pipelines and throughput' },
      { value: 'debugging', label: 'Debugging the weird stuff' },
      { value: 'vibes', label: 'Vibes' },
    ] satisfies { value: Focus; label: string }[],
  },
  summary: {
    label: 'Should it open with a summary?',
    options: [
      { value: 'yes', label: 'Yes. Tell me who he is.' },
      { value: 'no', label: 'No. Lead with the work.' },
    ],
  },
  jd: {
    label: 'Paste the job description (optional)',
    hint: 'It stays in this browser. It goes somewhere only if you press the Claude link below, and then only to claude.ai, in your own account.',
    counter: (n: string, max: string) => `${n} of ${max} characters`,
  },
  alias: {
    label: 'Which name should appear on your copy?',
    options: [
      'David Purvis',
      'Big Purv',
      'BP (stands for Big Purv)',
      'Dragon',
      'Bruce',
      'Billy Bob Joe',
    ],
  },
  assemble: 'Assemble my résumé',
  processing: 'Consulting the lanes. Reordering sections. Inventing nothing.',
  result: {
    title: 'Your résumé is ready',
    cut: (label: string) => `Recommended cut: ${label}`,
    fan: 'You just like the website. Respect. Here’s the cut the Department recommends for someone with your taste.',
    why: {
      gen: 'The standard cut: everything in balance, in the order most readers expect.',
      emb: 'The microprocessors sequence and the embedded Linux projects move above the job history. The rafting got cut to make room. It understands.',
      plt: 'Leads with two years of owning a production platform alone: unattended jobs, failure reporting and change-impact tooling.',
      be: 'Leads with the integration work: REST extraction, scheduled batch loading, and a parser built for a hundred-plus schema variants.',
    } satisfies Record<LaneId, string>,
    view: 'Open this cut',
    pdf: 'Download the PDF',
    alias: (picked: string) =>
      `Name on the résumé: David Purvis. You asked for “${picked}”. HR asked for the legal name. HR wins.`,
  },
  claude: {
    heading: 'Tailor it further with Claude',
    body: 'Claude isn’t running on this site. This link opens claude.ai in a new tab, in your own account, with your answers and this cut of the résumé typed into the message box. Nothing is sent until you press it, and nothing is sent to David.',
    link: 'Tailor it with Claude',
    newTab: '(opens claude.ai in a new tab)',
    promptLabel: 'The message it will pre-fill',
    truncated:
      'The job description was shortened to fit in a link. The full message is in the box below if you’d rather copy it over yourself.',
  },
  disclaimer:
    'The quiz runs entirely in your browser. Your answers are not stored, and nothing is sent anywhere unless you press the Claude link.',
};
