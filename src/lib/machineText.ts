/** llms.txt and robots.txt: plain indexes for machines. No requests, no jokes, no hidden text. */
import { LANES } from '../content/resume/resolve';
import { absoluteUrl, BASE } from './paths';

export function renderLlmsTxt(site: URL | string | undefined): string {
  const abs = (p: string) => absoluteUrl(p, site);
  return `# David Purvis — Software Engineer

> ${LANES.gen.summary?.text ?? ''}

## Résumé

- [Résumé (web)](${abs('/resume/')})
- [Résumé (Markdown)](${abs('/resume.md')})
- [Résumé (PDF)](${abs('/resume.pdf')})
- [Embedded software cut (PDF)](${abs('/resume-emb.pdf')}), [Platform / SRE cut (PDF)](${abs('/resume-plt.pdf')}), [Backend cut (PDF)](${abs('/resume-be.pdf')}): the same verified facts, selected and ordered for those roles.

## More

- [Projects](${abs('/projects/')})
- [How it was built](${abs('/how-it-was-built/')})
`;
}

export function renderRobotsTxt(): string {
  const b = BASE.replace(/\/$/, '');
  return `User-agent: *
Allow: ${b}/
`;
}
