import type { APIRoute } from 'astro';
import { requireRole } from '~/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const guard = requireRole(locals.user, ['officer', 'manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const env = locals.runtime.env;
  const id = params.id?.toString() ?? '';
  if (!id) return new Response('missing id', { status: 400 });

  const row = await env.DB
    .prepare('SELECT r2_key, mime_type, filename FROM evidence_items WHERE id = ?1 LIMIT 1')
    .bind(id)
    .first<{ r2_key: string; mime_type: string | null; filename: string | null }>();
  if (!row) return new Response('not found', { status: 404 });

  const object = await env.EVIDENCE.get(row.r2_key);
  if (!object) return new Response('object missing', { status: 404 });

  const headers = new Headers();
  if (row.mime_type) headers.set('content-type', row.mime_type);
  if (row.filename) headers.set('content-disposition', `inline; filename="${row.filename}"`);
  headers.set('cache-control', 'private, no-store');
  return new Response(object.body, { headers });
};
