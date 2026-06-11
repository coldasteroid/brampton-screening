import { requireRole } from '~/lib/auth';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

// Officer-agent file uploads.
//
// Files land in R2 under `agent-scratch/{userId}/...` — prefix-disjoint from the
// resident screening evidence path (`evidence/...`) so the two flows can never
// collide. Ephemeral scratch: no D1 row. An R2 lifecycle rule on the
// `agent-scratch/` prefix can expire them after N days; we don't track them
// long-term because their only purpose is grounding the next chat turn.

const MAX_FILES = 3;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg', 'image/heic', 'application/pdf']);

export async function POST(request: Request) {
  const guard = requireRole(await getCurrentUser(), ['officer', 'manager']);
  if (!guard.ok) return Response.json({ error: 'forbidden' }, { status: 403 });

  const e = env();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'expected multipart/form-data' }, { status: 400 });
  }

  const files = form
    .getAll('files')
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) {
    return Response.json({ error: 'no files attached' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return Response.json({ error: `max ${MAX_FILES} files per upload` }, { status: 400 });
  }

  const stored: Array<{ key: string; filename: string; mimeType: string; sizeBytes: number }> = [];
  const rejected: Array<{ filename: string; reason: string }> = [];

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({ filename: file.name, reason: `file too large (${Math.round(file.size / 1024)} KB, max ${MAX_FILE_BYTES / 1024 / 1024} MB)` });
      continue;
    }
    if (!ACCEPTED_MIME.has(file.type)) {
      rejected.push({ filename: file.name, reason: `unsupported type ${file.type || '(unknown)'}; allowed: PNG/JPEG/HEIC/PDF` });
      continue;
    }
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const key = `agent-scratch/${guard.user.id}/${id}-${safeName(file.name)}`;
    const bytes = await file.arrayBuffer();
    await e.EVIDENCE.put(key, bytes, { httpMetadata: { contentType: file.type } });
    stored.push({ key, filename: file.name, mimeType: file.type, sizeBytes: file.size });
  }

  if (stored.length === 0) {
    return Response.json({ error: 'all files rejected', rejected }, { status: 400 });
  }
  return Response.json({ files: stored, ...(rejected.length ? { rejected } : {}) });
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
