import { formatNumber, formatPercent } from '@/lib/format';

export interface Slice {
  label: string;
  value: number;
  /** Variable CSS de couleur, ex. `var(--c-chart-2)`. */
  color: string;
}

/** Anneau de répartition + légende chiffrée (la couleur n'est jamais le seul signal). */
export function DonutChart({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90" role="img" aria-label={`Répartition : ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--c-surface-2)" strokeWidth="22" />
          {total > 0 &&
            slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="22"
                  strokeDasharray={`${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-2xl font-extrabold text-ink">{formatNumber(total)}</span>
          <span className="text-xs font-semibold text-ink-3">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-[10rem] flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-3 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: slice.color }} aria-hidden="true" />
            <span className="flex-1 font-semibold text-ink">{slice.label}</span>
            <span className="num text-ink-2">{formatNumber(slice.value)}</span>
            <span className="num w-14 text-right text-ink-3">{total > 0 ? formatPercent(slice.value / total) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Classement en barres horizontales (catégories, offres…). */
export function BarList({
  items,
  format = formatNumber,
  color = 'var(--c-chart-1)',
}: {
  items: { label: string; value: number; hint?: string }[];
  format?: (value: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-ink">{item.label}</span>
            <span className="num shrink-0 text-ink-2">
              {format(item.value)}
              {item.hint && <span className="ml-1.5 text-xs text-ink-3">{item.hint}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
