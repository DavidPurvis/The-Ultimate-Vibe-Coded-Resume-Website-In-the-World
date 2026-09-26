import type { APIRoute } from 'astro';
import { renderResumeMarkdown } from '../lib/resumeText';
import { absoluteUrl } from '../lib/paths';

export const GET: APIRoute = ({ site }) =>
  new Response(renderResumeMarkdown(absoluteUrl('/resume.pdf', site)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
