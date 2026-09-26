/** Plain-text and Markdown renderings of the résumé (for resume.md, tests and llms.txt). */
import { education, experience, identity, projects, skills, summary } from '../content/resume';
import { resumeSections as S } from '../content/copy/resumeExtras';

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

/** Plain text in reading order — mirrors the rendered page and PDF. */
export function renderResumeText(): string {
  const lines: string[] = [
    identity.name,
    contactLine(),
    '',
    S.summary,
    summary.text,
    '',
    S.experience,
  ];
  for (const r of experience) {
    lines.push(roleHeading(r));
    for (const b of r.bullets) lines.push(`• ${b.text}`);
  }
  lines.push('', S.projects);
  for (const p of projects) {
    lines.push(`${p.name} — ${p.stack}`);
    for (const b of p.bullets) lines.push(`• ${b.text}`);
  }
  lines.push('', S.skills);
  for (const s of skills) lines.push(`${s.label}: ${s.items}`);
  lines.push('', S.education);
  for (const e of education) lines.push(`${e.school} — ${e.line}`);
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
