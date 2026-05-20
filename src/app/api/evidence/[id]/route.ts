import { requireRole } from '~/lib/auth';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) return new Response('forbidden', { status: 403 });

  const { id } = await params;
  if (!id) return new Response('missing id', { status: 400 });

  const e = env();
  const row = await e.DB
    .prepare('SELECT r2_key, mime_type, filename FROM evidence_items WHERE id = ?1 LIMIT 1')
    .bind(id)
    .first<{ r2_key: string; mime_type: string | null; filename: string | null }>();
  if (!row) return new Response('not found', { status: 404 });

  const object = await e.EVIDENCE.get(row.r2_key);
  if (!object) return new Response('object missing', { status: 404 });

  const headers = new Headers();
  if (row.mime_type) headers.set('content-type', row.mime_type);
  if (row.filename) headers.set('content-disposition', `inline; filename="${row.filename}"`);
  headers.set('cache-control', 'private, no-store');
  return new Response(object.body, { headers });
}
