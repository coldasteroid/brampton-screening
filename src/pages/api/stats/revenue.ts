import type { APIRoute } from 'astro';

export const prerender = false;

// City of Brampton 2026 APS penalty schedule projection
// Source: Council amendments, Oct 2025
export const GET: APIRoute = () =>
  Response.json({
    value: 1970000,
    label: '2026 projected revenue uplift',
    effective: '2026-01-01',
    source: 'Brampton Council amendments, Oct 2025',
  });
