import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AuditEntryView, Paginated } from '@rythmo/engine';
import { ScrollText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Input, Select } from '@/components/ui/forms';
import { Badge, Card, EmptyState, ErrorState, PageHeader, type Tone } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useDebounced, useUrlState } from '@/lib/hooks';

const TARGETS: Record<string, string> = { user: 'Utilisateur', plan: 'Offre', promotion: 'Promotion', admin: 'Administrateur', settings: 'Réglages' };

function toneOf(action: string): Tone {
  if (/delete|suspend|revoke|deactivate|pause/.test(action)) return 'danger';
  if (/create|grant|activate|reactivate/.test(action)) return 'success';
  return 'primary';
}

export function AuditPage() {
  const [url, setUrl] = useUrlState({ q: '', target: '', page: '1', size: '20' });
  const [search, setSearch] = useState(url.q);
  const debounced = useDebounced(search, 350);
  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = useQuery({
    queryKey: ['audit', url],
    queryFn: () => api.get<Paginated<AuditEntryView>>('/admin/audit', { search: url.q, targetType: url.target, page: Number(url.page), pageSize: Number(url.size) }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<AuditEntryView>[] = [
    { id: 'date', header: 'Date', cell: (e) => <span className="num whitespace-nowrap text-ink-2">{formatDateTime(e.createdAt)}</span> },
    { id: 'admin', header: 'Administrateur', hideBelow: 'md', cell: (e) => <span className="text-ink-2">{e.adminEmail}</span> },
    { id: 'action', header: 'Cible', cell: (e) => <Badge tone={toneOf(e.action)}>{TARGETS[e.targetType] ?? e.targetType}</Badge> },
    {
      id: 'summary',
      header: 'Détail',
      cell: (e) => (
        <div className="max-w-xl leading-tight">
          <p className="font-semibold text-ink">{e.summary}</p>
          <p className="mt-0.5 text-xs text-ink-3">
            {e.action}
            {e.targetType === 'user' && e.targetId && (
              <>
                {' · '}
                <Link to={`/utilisateurs/${e.targetId}`} className="font-semibold text-primary hover:underline">
                  Voir la fiche
                </Link>
              </>
            )}
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Journal d’audit" description="Toutes les actions faites dans le back-office : qui, quoi, quand." />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <Input type="search" aria-label="Rechercher dans le journal" placeholder="Administrateur, action ou détail" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select aria-label="Filtrer par type" value={url.target} onChange={(e) => setUrl({ target: e.target.value })} className="w-48">
            <option value="">Tous les types</option>
            {Object.entries(TARGETS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {query.isError && !query.data ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <>
            <DataTable
              caption="Journal d’audit"
              columns={columns}
              rows={query.data?.items}
              getKey={(e) => e.id}
              loading={query.isFetching}
              empty={<EmptyState icon={ScrollText} title="Journal vide" message="Les actions d’administration seront enregistrées ici." />}
            />
            {query.data && (
              <Pagination
                {...query.data}
                noun="entrées"
                onPage={(page) => setUrl({ page: String(page) }, { keepPage: true })}
                onPageSize={(size) => setUrl({ size: String(size) })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
