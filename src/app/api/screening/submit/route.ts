import { z } from 'zod';
import { attachEvidence, createReview, getTicket, logAudit } from '~/lib/db';
import { findPenalty } from '~/lib/data/penalties';
import { getCurrentUser } from '~/lib/auth-server';
import { env } from '~/lib/runtime';

const REASON_CODES = ['financial_hardship', 'factual_dispute', 'exceptional_circumstances'] as const;
const reasonsSchema = z.array(z.enum(REASON_CODES)).min(1).max(REASON_CODES.length);

const MAX_FILES = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg', 'image/heic', 'application/pdf']);

export async function POST(request: Request) {
  const e = env();
  const user = await getCurrentUser();
  const form = await request.formData();

  const ticketId = String(form.get('ticketId') ?? '').toUpperCase();
  if (!/^BRP-\d{4}-\d{6}$/.test(ticketId)) {
    return Response.json({ error: 'Invalid ticket id.' }, { status: 400 });
  }

  let reasons: string[];
  try {
    reasons = reasonsSchema.parse(JSON.parse(String(form.get('reasons') ?? '[]')));
  } catch {
    return Response.json({ error: 'Pick at least one reason.' }, { status: 400 });
  }

  const narrative = String(form.get('narrative') ?? '').trim();
  if (narrative.length < 30) {
    return Response.json({ error: 'Tell us a little more about what happened.' }, { status: 400 });
  }

  const ticket = await getTicket(e.DB, ticketId);
  if (!ticket) return Response.json({ error: 'Notice not found.' }, { status: 404 });

  const reviewId = `rev_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
  const priority = computePriority({ ticket, reasons });

  await createReview(e.DB, {
    id: reviewId,
    ticketId,
    userId: user?.id ?? null,
    reasons,
    narrative,
    language: 'en',
    priorityScore: priority,
  });

  const evidence = form.getAll('evidence').filter((v): v is File => v instanceof File && v.size > 0);
  let stored = 0;
  for (const file of evidence.slice(0, MAX_FILES)) {
    if (file.size > MAX_FILE_BYTES) continue;
    if (!ACCEPTED_MIME.has(file.type)) continue;
    const evidenceId = `ev_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
    const key = `evidence/${reviewId}/${evidenceId}-${safeName(file.name)}`;
    const bytes = await file.arrayBuffer();
    await e.EVIDENCE.put(key, bytes, { httpMetadata: { contentType: file.type } });
    await attachEvidence(e.DB, {
      id: evidenceId,
      reviewId,
      r2Key: key,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    stored++;
  }

  await logAudit(e.DB, {
    ticket_id: ticketId,
    actor: user ? `user:${user.id}` : 'resident:anonymous',
    action: 'submit_review',
    details: { reviewId, reasons, evidenceCount: stored, priority },
  });

  return Response.json({ reviewId, evidenceCount: stored, priority });
}

function computePriority(args: {
  ticket: { amount_cents: number; offence_code: string };
  reasons: string[];
}): number {
  const penalty = findPenalty(args.ticket.offence_code);
  const safety = penalty && (penalty.riskLevel === 'severe' || penalty.riskLevel === 'high') ? 0.3 : 0;
  const hardship = args.reasons.includes('financial_hardship') ? 0.35 : 0;
  const factual = args.reasons.includes('factual_dispute') ? 0.25 : 0;
  const exceptional = args.reasons.includes('exceptional_circumstances') ? 0.15 : 0;
  const amount = Math.min(0.2, args.ticket.amount_cents / 150000);
  return Math.min(1, safety + hardship + factual + exceptional + amount);
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
