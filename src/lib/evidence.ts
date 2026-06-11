import type { EvidenceItemRow } from './db';

/**
 * Evidence compilation — assemble the files attached to a screening review into
 * a single honest manifest the Screening Officer (and the recommendation agent
 * and the officer-agent tools) can read at a glance. Deterministic; makes no
 * OCR/content claims.
 */
export function compileEvidenceSummary(evidence: EvidenceItemRow[]): string {
  if (evidence.length === 0) return '';
  const byType = new Map<string, number>();
  let totalBytes = 0;
  for (const e of evidence) {
    const type = (e.mime_type?.split('/')[1] ?? 'file').toUpperCase();
    byType.set(type, (byType.get(type) ?? 0) + 1);
    totalBytes += e.size_bytes ?? 0;
  }
  const typeSummary = Array.from(byType.entries())
    .map(([type, n]) => `${n}× ${type}`)
    .join(', ');
  const files = evidence
    .map(
      (e) =>
        `"${e.filename ?? e.r2_key}" (${e.mime_type ?? 'unknown'}, ${e.size_bytes ? `${Math.round(e.size_bytes / 1024)} KB` : 'size n/a'})`,
    )
    .join('; ');
  return `${evidence.length} file(s) attached — ${typeSummary}; ${Math.round(totalBytes / 1024)} KB total. Files: ${files}.`;
}
