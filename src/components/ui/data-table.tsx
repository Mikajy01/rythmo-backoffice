import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { formatNumber } from '@/lib/format';
import { Skeleton } from './surfaces';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Active le tri sur cette colonne (clé envoyée à l'API). */
  sortKey?: string;
  align?: 'left' | 'right';
  className?: string;
  /** Masque la colonne sous cette largeur d'écran. */
  hideBelow?: 'md' | 'lg';
}

export interface SortState {
  key: string;
  order: 'asc' | 'desc';
}

const HIDE = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' } as const;

export function DataTable<T>({
  columns,
  rows,
  getKey,
  loading,
  skeletonRows = 8,
  onRowClick,
  rowLabel,
  empty,
  sort,
  onSort,
  caption,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  getKey: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  /** Libellé accessible d'une ligne cliquable. */
  rowLabel?: (row: T) => string;
  empty?: ReactNode;
  sort?: SortState;
  onSort?: (sort: SortState) => void;
  caption: string;
}) {
  const showSkeleton = loading && (!rows || rows.length === 0);
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs font-bold uppercase tracking-wider text-ink-3">
            {columns.map((column) => {
              const active = sort?.key === column.sortKey;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={active ? (sort?.order === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cx('whitespace-nowrap px-4 py-3', column.align === 'right' && 'text-right', column.hideBelow && HIDE[column.hideBelow])}
                >
                  {column.sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort({ key: column.sortKey!, order: active && sort?.order === 'desc' ? 'asc' : 'desc' })}
                      className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink"
                    >
                      {column.header}
                      {active ? sort?.order === 'asc' ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" /> : <ChevronsUpDown className="size-3 opacity-50" aria-hidden="true" />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={cx(loading && !showSkeleton && 'opacity-60 transition-opacity')}>
          {showSkeleton
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index} className="border-b border-line last:border-0">
                  {columns.map((column) => (
                    <td key={column.id} className={cx('px-4 py-3.5', column.hideBelow && HIDE[column.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-[10rem]" />
                    </td>
                  ))}
                </tr>
              ))
            : rows?.map((row) => (
                <tr
                  key={getKey(row)}
                  className={cx('border-b border-line last:border-0', onRowClick && 'cursor-pointer transition-colors hover:bg-surface-2/70')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget) onRowClick(row);
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? rowLabel?.(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.id} className={cx('px-4 py-3', column.align === 'right' && 'text-right', column.hideBelow && HIDE[column.hideBelow], column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows && rows.length === 0 && empty}
    </div>
  );
}

/** Pages à afficher : 1 … 4 5 [6] 7 8 … 20 (les trous sont des points de suspension). */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  pages.forEach((p, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && p - previous > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
  onPageSize,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  noun: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p className="num text-ink-2" aria-live="polite">
        {formatNumber(from)}–{formatNumber(to)} sur {formatNumber(total)} {noun}
      </p>
      <div className="flex items-center gap-3">
        {onPageSize && (
          <label className="flex items-center gap-2 text-ink-3">
            Par page
            <select
              value={pageSize}
              onChange={(event) => onPageSize(Number(event.target.value))}
              className="h-9 rounded-xl border border-line-strong bg-surface px-2 text-sm text-ink"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Page précédente"
            className="inline-flex size-9 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          {pageWindow(page, totalPages).map((entry, index) =>
            entry === '…' ? (
              <span key={`gap-${index}`} className="px-1 text-ink-3" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPage(entry)}
                aria-current={entry === page ? 'page' : undefined}
                className={cx('num inline-flex size-9 items-center justify-center rounded-xl font-semibold', entry === page ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-surface-2')}
              >
                {entry}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Page suivante"
            className="inline-flex size-9 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
