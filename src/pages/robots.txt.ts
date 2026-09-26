import type { APIRoute } from 'astro';
import { renderRobotsTxt } from '../lib/machineText';

export const GET: APIRoute = () =>
  new Response(renderRobotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
