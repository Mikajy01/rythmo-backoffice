import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { formatDelta } from '@/lib/format';
import { Card, Skeleton } from './surfaces';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  compare,
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Comparaison avec la période précédente. */
  compare?: { current: number; previous: number };
  loading?: boolean;
}) {
  const delta = compare ? formatDelta(compare.current, compare.previous) : null;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink-2">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="num mt-2 text-[1.75rem] font-extrabold leading-tight text-ink">{value}</p>
      )}
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-ink-3">
        {!loading && delta && (
          <span
            className={cx(
              'inline-flex items-center gap-0.5 font-bold',
              delta.direction === 'up' && 'text-success',
              delta.direction === 'down' && 'text-danger',
              delta.direction === 'flat' && 'text-ink-3',
            )}
          >
            {delta.direction === 'up' ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : delta.direction === 'down' ? <ArrowDownRight className="size-3.5" aria-hidden="true" /> : <Minus className="size-3.5" aria-hidden="true" />}
            {delta.text}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </Card>
  );
}
