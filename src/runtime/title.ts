/** The browser-native artifacts of a case: the tab title and the header chip. */
import { phase, type CaseState } from '../domain/case';
import { STEPS } from '../domain/steps';
import { titles } from '../content/institution/case';

export function titleFor(s: CaseState, caseNo: string, arrivalTitle: string): string {
  const p = phase(s);
  if (p === 'authorized') return titles.closed;
  if (p === 'arrival') return arrivalTitle;
  return titles.open(caseNo, STEPS[p].label);
}

export function chipFor(s: CaseState, caseNo: string): string | null {
  const p = phase(s);
  if (p === 'authorized') return titles.chipClosed;
  if (p === 'arrival') return null;
  return titles.chip(caseNo, STEPS[p].label);
}

export const hiddenTitle = (caseNo: string): string => titles.hidden(caseNo);
