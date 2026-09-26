/** Plain-text and Markdown renderings of the résumé (for resume.md, tests and llms.txt). */
import { education, experience, identity, projects, skills, summary } from '../content/resume';
import { resumeSections as S } from '../content/site/resumeExtras';
import { LANES, type LaneResume } from '../content/lanes';

export function contactLine(): string {
  return [
    identity.location,
    identity.email,
    identity.linkedin.display,
    identity.github.display,
  ].join(' · ');
}

export function roleHeading(r: (typeof experience)[number]): string {
  return `${r.title} — ${r.org} · ${r.location} · ${r.dates}`;
}

/** Plain text in reading order — mirrors the rendered page and PDF (GEN unless a lane is given). */
export function renderResumeText(lane: LaneResume = LANES.gen): string {
  const lines: string[] = [identity.name, contactLine()];
  for (const key of lane.order) {
    if (key === 'summary' && !lane.summary) continue;
    lines.push('', S[key]);
    if (key === 'summary' && lane.summary) lines.push(lane.summary.text);
    if (key === 'experience')
      for (const r of lane.experience) {
        lines.push(roleHeading(r));
        for (const b of r.bullets) lines.push(`• ${b.text}`);
      }
    if (key === 'projects')
      for (const p of lane.projects) {
        lines.push(`${p.name} — ${p.stack}`);
        for (const b of p.bullets) lines.push(`• ${b.text}`);
      }
    if (key === 'skills') for (const s of lane.skills) lines.push(`${s.label}: ${s.items}`);
    if (key === 'education')
      for (const e of lane.education) {
        lines.push(`${e.school} — ${e.line}`);
        for (const n of e.notes ?? []) lines.push(n.text);
      }
  }
  return lines.join('\n');
}

/** resume.md — clean, joke-free, instruction-free. */
export function renderResumeMarkdown(pdfUrl: string): string {
  const out: string[] = [
    `# ${identity.name}`,
    '',
    `${identity.headline} · ${identity.location} · ${identity.email} · ${identity.linkedin.href} · ${identity.github.href}`,
    '',
    `## ${S.summary}`,
    '',
    summary.text,
    '',
    `## ${S.experience}`,
  ];
  for (const r of experience) {
    out.push('', `### ${r.title} — ${r.org}`, '', `${r.location} · ${r.dates}`, '');
    for (const b of r.bullets) out.push(`- ${b.text}`);
  }
  out.push('', `## ${S.projects}`);
  for (const p of projects) {
    out.push('', `### ${p.name}`, '', `Stack: ${p.stack}`, '');
    for (const b of p.bullets) out.push(`- ${b.text}`);
  }
  out.push('', `## ${S.skills}`, '');
  for (const s of skills) out.push(`- **${s.label}:** ${s.items}`);
  out.push('', `## ${S.education}`, '');
  for (const e of education) out.push(`- ${e.school} — ${e.line}`);
  out.push('', '---', '', `PDF: ${pdfUrl}`, '');
  return out.join('\n');
}
