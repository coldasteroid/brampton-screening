// City of Brampton 2026 APS penalty schedule projection
// Source: Council amendments, Oct 2025
export function GET() {
  return Response.json({
    value: 1970000,
    label: '2026 projected revenue uplift',
    effective: '2026-01-01',
    source: 'Brampton Council amendments, Oct 2025',
  });
}
