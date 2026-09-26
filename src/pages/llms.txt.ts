import type { APIRoute } from 'astro';
import { renderLlmsTxt } from '../lib/machineText';

export const GET: APIRoute = ({ site }) =>
  new Response(renderLlmsTxt(site), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
