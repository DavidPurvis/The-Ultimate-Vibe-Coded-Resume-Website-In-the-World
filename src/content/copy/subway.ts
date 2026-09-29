/**
 * Attention-Span Mode. The gameplay videos are YouTube IDs only David can pick (embeddable,
 * genuinely Subway Surfers); until he fills them in, every player is a placeholder tile and
 * nothing third-party loads at all.
 */
import type { PersonalFact } from '../pending';

export const SUBWAY_VIDEOS: PersonalFact[] = [
  {
    id: 'subway-video-1',
    label: 'Subway Surfers gameplay: YouTube video ID (must allow embedding)',
    text: '',
    status: 'needs-review',
  },
  {
    id: 'subway-video-2',
    label: 'Optional second gameplay video ID, for variety',
    text: '',
    status: 'needs-review',
  },
];

export const subwayCopy = {
  dock: 'Attention-Span Mode',
  summon: (n: number, max: number) => `Summon gameplay (${n}/${max})`,
  reasonable: 'Reasonable amount reached.',
  unreasonable: 'Unreasonable amounts require Director approval.',
  dismissAll: 'Dismiss all',
  close: (n: number) => `Dismiss player ${n}`,
  popOut: (n: number) => `Pop out player ${n}`,
  poppedOut: 'Watching in picture-in-picture.',
  handle: (n: number) => `Player ${n}. Drag it, or use the arrow keys, to move it.`,
  region: 'Summoned gameplay',
  iframeTitle: 'Subway Surfers gameplay (muted)',
  pending: 'Gameplay pending.',
  pendingSub: 'The Department is still negotiating with the subway.',
  summoned: (n: number) => `Player ${n} summoned.`,
  dismissedAll: 'All players dismissed. Your attention span has been returned.',
};
