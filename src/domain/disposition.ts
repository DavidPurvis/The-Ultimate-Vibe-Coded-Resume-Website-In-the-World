/** The end of the case: a summary built only from what actually happened in this session. */
import { BUDGET } from './steps';
import type { LaneChoice } from './events';
import { selectCallbacks, type FindingId } from './findings';
import { caseNumber } from './assessment';
import type { AuthorizationRoute, CaseState } from './case';

export interface Disposition {
  readonly caseNumber: string;
  readonly route: AuthorizationRoute;
  /** The cut the visitor asked for; 'unspecified' becomes the standard résumé. */
  readonly lane: Exclude<LaneChoice, 'unspecified'>;
  readonly statedScope: LaneChoice | null;
  readonly lines: readonly { readonly finding: FindingId; readonly count: number }[];
  readonly resistance: { readonly used: number; readonly permitted: number };
  readonly requests: number;
}

export function disposition(s: CaseState): Disposition | null {
  if (!s.authorized) return null;
  return {
    caseNumber: caseNumber(s.seed),
    route: s.authorized.via,
    lane: s.lane && s.lane !== 'unspecified' ? s.lane : 'gen',
    statedScope: s.lane,
    lines: selectCallbacks(s, 'disposition').map((finding) => ({
      finding,
      count: s.findings[finding]?.count ?? 0,
    })),
    resistance: { used: s.resisted, permitted: BUDGET.maxResisted },
    requests: s.requests,
  };
}
