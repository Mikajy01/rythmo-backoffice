import type { SeriesPoint } from '@rythmo/engine';
import { useState } from 'react';
import { useElementWidth } from '@/lib/hooks';
import { formatCompact, formatDayMonth, formatNumber } from '@/lib/format';

const PAD = { top: 12, right: 12, bottom: 26, left: 46 };

/** Arrondit vers le haut à 1, 2, 5 × 10ⁿ : des graduations lisibles. */
function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Courbe (aire) ou histogramme d'une série quotidienne. Dessiné en SVG : aucune bibliothèque.
 * Survol / toucher : repère + infobulle. Une table masquée reprend les valeurs pour les lecteurs d'écran.
 */
export function TimeChart({
  data,
  variant = 'area',
  color = 'var(--c-chart-1)',
  height = 230,
  format = formatNumber,
  label,
}: {
  data: SeriesPoint[];
  variant?: 'area' | 'bars';
  color?: string;
  height?: number;
  format?: (value: number) => string;
  /** Décrit le graphique (« Inscriptions par jour »). */
  label: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...data.map((p) => p.value)));
  const total = data.reduce((sum, p) => sum + p.value, 0);
  const n = data.length;

  const slot = innerW / Math.max(n, 1);
  const xOf = (index: number): number => PAD.left + (variant === 'bars' ? slot * index + slot / 2 : n <= 1 ? innerW / 2 : (innerW * index) / (n - 1));
  const yOf = (value: number): number => PAD.top + innerH - (value / max) * innerH;

  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  const labelStep = Math.max(1, Math.ceil(n / Math.max(Math.floor(innerW / 72), 1)));

  const linePath = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`).join(' ');
  const areaPath = n > 0 ? `${linePath} L${xOf(n - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${xOf(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z` : '';

  const locate = (clientX: number, element: SVGSVGElement): void => {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left - PAD.left;
    const index = variant === 'bars' ? Math.floor(x / slot) : Math.round((x / innerW) * (n - 1));
    setHover(index >= 0 && index < n ? index : null);
  };

  const hovered = hover !== null ? data[hover] : undefined;
  const gradientId = `grad-${label.replace(/\W+/g, '')}`;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label} : total ${format(total)} sur ${n} jours`}
          onPointerMove={(event) => locate(event.clientX, event.currentTarget)}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={yOf(tick)} y2={yOf(tick)} stroke="var(--c-border)" strokeDasharray={tick === 0 ? undefined : '3 4'} />
              <text x={PAD.left - 8} y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="var(--c-ink-3)" className="num">
                {formatCompact(tick)}
              </text>
            </g>
          ))}

          {variant === 'area' ? (
            <>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={linePath} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : (
            data.map((p, i) => {
              const barW = Math.max(Math.min(slot * 0.68, 28), 2);
              const top = yOf(p.value);
              return (
                <rect
                  key={p.date}
                  x={xOf(i) - barW / 2}
                  y={top}
                  width={barW}
                  height={Math.max(PAD.top + innerH - top, p.value > 0 ? 2 : 0)}
                  rx={Math.min(4, barW / 2)}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              );
            })
          )}

          {data.map((p, i) =>
            i % labelStep === 0 ? (
              <text key={p.date} x={xOf(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--c-ink-3)">
                {formatDayMonth(p.date)}
              </text>
            ) : null,
          )}

          {hovered && hover !== null && (
            <g pointerEvents="none">
              <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--c-border-strong)" />
              {variant === 'area' && <circle cx={xOf(hover)} cy={yOf(hovered.value)} r="4.5" fill="var(--c-surface)" stroke={color} strokeWidth="2.5" />}
            </g>
          )}
        </svg>
      )}

      {hovered && hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop"
          style={{ left: Math.min(Math.max(xOf(hover), 70), width - 70), top: 0 }}
        >
          <p className="font-semibold text-ink-3">{formatDayMonth(hovered.date)}</p>
          <p className="num text-sm font-bold text-ink">{format(hovered.value)}</p>
        </div>
      )}

      {total === 0 && width > 0 && (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm font-medium text-ink-3">Aucune donnée sur la période</p>
      )}

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
