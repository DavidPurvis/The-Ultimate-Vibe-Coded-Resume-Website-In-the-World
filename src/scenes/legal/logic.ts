/** "We've detected…" — built only from values the browser already exposes; nothing is sent. */
import { detected as D } from '../../content/copy/legal';
import { formatTimeLocal } from '../../lib/format';

export interface DetectEnv {
  cores: number | undefined;
  now: Date;
  timeZone: string | undefined;
  language: string | undefined;
  reducedMotion: boolean;
}
export interface DetectLine {
  id: string;
  text: string;
  how: string;
}

export function isWorkHours(d: Date): boolean {
  const day = d.getDay();
  const h = d.getHours();
  return day >= 1 && day <= 5 && h >= 9 && h < 17;
}

export function buildDetected(env: DetectEnv): DetectLine[] {
  const time = env.timeZone
    ? `${D.time(formatTimeLocal(env.now), env.timeZone)} ${isWorkHours(env.now) ? D.workHours : D.afterHours}`
    : D.timeFallback;
  return [
    { id: 'screen', text: D.screen, how: D.screenHow },
    { id: 'cores', text: env.cores ? D.cores(env.cores) : D.coresFallback, how: D.coresHow },
    { id: 'time', text: time, how: D.timeHow },
    {
      id: 'language',
      text: env.language ? D.language(env.language) : D.languageFallback,
      how: D.languageHow,
    },
    { id: 'motion', text: env.reducedMotion ? D.motionReduced : D.motionFull, how: D.motionHow },
    { id: 'hired', text: D.notHired, how: D.notHiredHow },
    { id: 'timeline', text: D.timeline, how: D.timelineHow },
  ];
}
