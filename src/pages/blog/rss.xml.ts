/** RSS 2.0 for the Department Newsletter. Hand-rolled: it is a short XML file. */
import type { APIRoute } from 'astro';
import { blogCopy as B } from '../../content/copy/blog';
import { posts } from '../../lib/blog';
import { absoluteUrl } from '../../lib/paths';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const items = (await posts())
    .map((p) => {
      const link = absoluteUrl(`/blog/${p.id}/`, site);
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description>${esc(p.data.summary)}</description>
    </item>`;
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(B.channelTitle)}</title>
    <link>${absoluteUrl('/blog/', site)}</link>
    <description>${esc(B.channelDescription)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
