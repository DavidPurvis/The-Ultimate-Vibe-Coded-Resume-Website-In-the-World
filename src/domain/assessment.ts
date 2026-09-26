/**
 * Seeded cosmetics: the case number, the risk score's digits, which bullet gets ceremonial review,
 * and service latencies. Pure functions of (seed, state). They make the institution look
 * arbitrary; none of them can change what the visitor is entitled to (the reducer never reads
 * them).
 */
import { derive } from './random';
import { BUDGET } from './steps';
import { selectCallbacks, type FindingId } from './findings';
import type { CaseState } from './case';

/** Form numbers never contain a 7. The Department abolished it. */
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '8', '9'] as const;

export function caseNumber(seed: number): string {
  const r = derive(seed, 'case-number');
  let out = '';
  for (let i = 0; i < 6; i++) {
    const pool = i === 0 ? DIGITS.slice(1) : DIGITS;
    out += pool[Math.floor(r() * pool.length)] ?? '1';
  }
  return `DRV-${out}`;
}

const WEIGHT: Record<FindingId, number> = {
  REPEATED_REQUEST: 0.12,
  PERSISTENCE: 0.09,
  EXTERNAL_CONSULTATION: 0.07,
  CEREMONY_DECLINED: 0.08,
  ACKNOWLEDGMENT_DECLINED: 0.06,
  EXTRACTION: 0.05,
  CASE_CONTINUITY: 0.04,
};
const WEIGHT_ORDER = Object.keys(WEIGHT) as FindingId[];

/** Risk score: base + findings + seeded last digits. Four decimals, always below 1. */
export function riskScore(s: CaseState): { value: string; primary: FindingId | null } {
  let total = 0.41;
  let primary: FindingId | null = null;
  let best = 0;
  for (const id of WEIGHT_ORDER) {
    const n = s.findings[id]?.count ?? 0;
    const w = n * WEIGHT[id];
    total += w;
    if (w > best) {
      best = w;
      primary = id;
    }
  }
  const jitter = Math.floor(derive(s.seed, 'risk')() * 1000) / 10000;
  return { value: Math.min(0.9999, total + jitter).toFixed(4), primary };
}

/** Which of `count` candidate bullets receives ceremonial review. */
export function ceremonyIndex(seed: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.floor(derive(seed, 'ceremony-framing')() * count));
}

export const SERVICE_IDS = [
  'intake',
  'confidentiality',
  'persistence',
  'plausibility',
  'consultation',
  'jurisdiction',
  'bullet-review',
  'status-inversion',
  'policy-compiler',
  'overreaction',
  'decision-point',
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceRow {
  readonly id: ServiceId;
  readonly latencyMs: number;
  /** A finding recorded earlier in the session that this row reports, if any. */
  readonly cites: FindingId | null;
}

const CITES: Partial<Record<ServiceId, FindingId>> = {
  persistence: 'PERSISTENCE',
  consultation: 'EXTERNAL_CONSULTATION',
  intake: 'REPEATED_REQUEST',
};
const MIN_LATENCY = 140;
const SPREAD = 161;

/** Eleven services reviewing one résumé bullet. Total latency never exceeds the climax budget. */
export function serviceRows(s: CaseState): readonly ServiceRow[] {
  const r = derive(s.seed, 'latency:ceremony');
  const eligible = new Set(selectCallbacks(s, 'ceremony'));
  const rows = SERVICE_IDS.map((id) => {
    const cite = CITES[id];
    return {
      id,
      latencyMs: MIN_LATENCY + Math.floor(r() * SPREAD),
      cites: cite && eligible.has(cite) ? cite : null,
    };
  });
  const total = rows.reduce((n, row) => n + row.latencyMs, 0);
  if (total <= BUDGET.climaxMaxMs) return rows;
  const k = BUDGET.climaxMaxMs / total;
  return rows.map((row) => ({ ...row, latencyMs: Math.floor(row.latencyMs * k) }));
}

/** A processing delay for `step`, inside the budget. */
export function processingMs(seed: number, step: string): number {
  const { min, max } = BUDGET.processingMs;
  return min + Math.floor(derive(seed, `latency:${step}`)() * (max - min + 1));
}
