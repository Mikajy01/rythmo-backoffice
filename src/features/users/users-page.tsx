import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AdminUserListItem, Paginated } from '@rythmo/engine';
import { Ban, CheckCircle2, Search, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Input, Select } from '@/components/ui/forms';
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { formatAgo, formatDate } from '@/lib/format';
import { useDebounced, useUrlState } from '@/lib/hooks';
import { TierBadge } from '../dashboard/dashboard-page';

const DEFAULTS = { q: '', tier: '', status: '', sort: 'createdAt', order: 'desc', page: '1', size: '20' };

export function UsersPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useUrlState(DEFAULTS);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebounced(search, 350);

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const page = Number(url.page);
  const pageSize = Number(url.size);
  const query = useQuery({
    queryKey: ['users', url],
    queryFn: () =>
      api.get<Paginated<AdminUserListItem>>('/admin/users', {
        search: url.q,
        tier: url.tier,
        status: url.status,
        sort: url.sort,
        order: url.order,
        page,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });
  const result = query.data;
  const filtered = Boolean(url.q || url.tier || url.status);

  const columns: Column<AdminUserListItem>[] = [
    {
      id: 'user',
      header: 'Utilisateur',
      sortKey: 'displayName',
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={user.displayName} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold text-ink">{user.displayName}</p>
            <p className="truncate text-xs text-ink-3">{user.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'tier', header: 'Formule', cell: (user) => <TierBadge tier={user.tier} /> },
    {
      id: 'status',
      header: 'Statut',
      hideBelow: 'md',
      cell: (user) =>
        user.suspended ? (
          <Badge tone="danger" icon={Ban}>
            Suspendu
          </Badge>
        ) : user.onboarded ? (
          <Badge tone="success" icon={CheckCircle2}>
            Actif
          </Badge>
        ) : (
          <Badge tone="warning">Non configuré</Badge>
        ),
    },
    { id: 'createdAt', header: 'Inscrit le', sortKey: 'createdAt', hideBelow: 'lg', cell: (user) => <span className="text-ink-2">{formatDate(user.createdAt)}</span> },
    { id: 'lastSeenAt', header: 'Dernière activité', sortKey: 'lastSeenAt', hideBelow: 'md', cell: (user) => <span className="text-ink-2">{formatAgo(user.lastSeenAt)}</span> },
  ];

  return (
    <>
      <PageHeader title="Utilisateurs" description="Recherche, suivi et gestion des comptes." />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Rechercher un utilisateur"
              placeholder="Nom, e-mail ou identifiant"
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select aria-label="Filtrer par formule" value={url.tier} onChange={(e) => setUrl({ tier: e.target.value })} className="w-44">
            <option value="">Toutes les formules</option>
            <option value="free">Gratuit</option>
            <option value="trial">Essai</option>
            <option value="premium">Premium</option>
          </Select>
          <Select aria-label="Filtrer par statut" value={url.status} onChange={(e) => setUrl({ status: e.target.value })} className="w-40">
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
          </Select>
        </div>

        {query.isError && !result ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <>
            <DataTable
              caption="Liste des utilisateurs"
              columns={columns}
              rows={result?.items}
              getKey={(user) => user.id}
              loading={query.isFetching}
              skeletonRows={Math.min(pageSize, 8)}
              onRowClick={(user) => navigate(`/utilisateurs/${user.id}`)}
              rowLabel={(user) => `Ouvrir la fiche de ${user.displayName}`}
              sort={{ key: url.sort, order: url.order === 'asc' ? 'asc' : 'desc' }}
              onSort={(sort) => setUrl({ sort: sort.key, order: sort.order })}
              empty={
                filtered ? (
                  <EmptyState icon={UserX} title="Aucun résultat" message="Aucun compte ne correspond à ces critères. Essaie d’élargir la recherche." />
                ) : (
                  <EmptyState icon={Users} title="Aucun utilisateur" message="Les comptes créés dans l’application apparaîtront ici." />
                )
              }
            />
            {result && (
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
                totalPages={result.totalPages}
                noun="utilisateurs"
                onPage={(next) => setUrl({ page: String(next) }, { keepPage: true })}
                onPageSize={(size) => setUrl({ size: String(size) })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
