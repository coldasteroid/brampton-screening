interface AtRiskCase {
  id: string;
  ward: number | null;
  label: string;
  amount: number;
  daysToDue: number;
  risk: number;
}

interface Props {
  cases: AtRiskCase[];
}

export default function PredictiveCollections({ cases }: Props) {
  return (
    <ol className="divide-y divide-line">
      {cases.map((c) => {
        const riskLabel = c.risk > 0.85 ? 'Critical' : c.risk > 0.6 ? 'High' : 'Moderate';
        const riskColor = c.risk > 0.85 ? 'text-danger' : c.risk > 0.6 ? 'text-amber-700' : 'text-fair-dark';
        const days = Math.round(c.daysToDue);
        return (
          <li key={c.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold">
              {(c.ward ?? '?').toString().padStart(2, '0')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{c.label}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-subtle">
                {c.id} · ${c.amount.toLocaleString('en-CA')}
              </p>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-xs text-ink-subtle">
                {days <= 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`}
              </p>
              <RiskBar risk={c.risk} />
            </div>
            <p className={`w-20 text-right text-xs font-semibold uppercase tracking-[0.12em] ${riskColor}`}>{riskLabel}</p>
          </li>
        );
      })}
    </ol>
  );
}

function RiskBar({ risk }: { risk: number }) {
  return (
    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-surface-sunken">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.round(risk * 100)}%`,
          background:
            risk > 0.85
              ? 'linear-gradient(to right, #f87171, #dc2626)'
              : risk > 0.6
                ? 'linear-gradient(to right, #fbbf24, #f59e0b)'
                : 'linear-gradient(to right, #5FD3B0, #009776)',
        }}
      />
    </div>
  );
}
