import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DashboardOverview, SubscriptionTier } from '@/contracts';
import { Activity, Banknote, Crown, Receipt, TrendingUp, UserMinus, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router';
import { BarList, DonutChart } from '@/components/charts/distribution';
import { TimeChart } from '@/components/charts/time-chart';
import { Avatar, Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/surfaces';
import { StatCard } from '@/components/ui/stat-card';
import { api, errorMessage } from '@/lib/api';
import { cx } from '@/lib/cx';
import { formatAgo, formatMoney, formatNumber, formatPercent, plural } from '@/lib/format';
import { useCurrencies, useMeta, useUrlState } from '@/lib/hooks';

const RANGES = ['7', '30', '90'] as const;

const TIER_LABEL: Record<SubscriptionTier, string> = { premium: 'Premium', trial: 'Essai', free: 'Gratuit' };
const TIER_COLOR: Record<SubscriptionTier, string> = {
  premium: 'var(--c-chart-3)',
  trial: 'var(--c-chart-1)',
  free: 'var(--c-chart-6)',
};

export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  return <Badge tone={tier === 'premium' ? 'gold' : tier === 'trial' ? 'primary' : 'neutral'}>{TIER_LABEL[tier]}</Badge>;
}

export function DashboardPage() {
  const [{ range }, setUrl] = useUrlState({ range: '30' });
  const days = Number(range);
  const money = useCurrencies();
  const meta = useMeta();

  const query = useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => api.get<DashboardOverview>('/admin/dashboard', { range: days }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
  const data = query.data;
  const currency = money(data?.currency ?? 'MGA');
  const loading = query.isLoading;
  const categoryLabel = (id: string) => meta.data?.categories.find((c) => c.id === id)?.label ?? id;
  const kpis = data?.kpis;
  const fmtMoney = (value: number) => formatMoney(value, currency);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={data ? `Activité des ${days} derniers jours, comparée aux ${days} jours précédents.` : 'Vue d’ensemble de l’application.'}
        actions={
          <div role="group" aria-label="Période d’analyse" className="inline-flex gap-1 rounded-2xl bg-surface-2 p-1">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setUrl({ range: value })}
                className={cx('rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors', range === value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink')}
              >
                {value} jours
              </button>
            ))}
          </div>
        }
      />

      {query.isError && !data ? (
        <Card>
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Utilisateurs"
              icon={Users}
              loading={loading}
              value={kpis ? formatNumber(kpis.totalUsers) : '—'}
              compare={kpis ? { current: kpis.newUsers, previous: kpis.newUsersPrevious } : undefined}
              hint={kpis ? `${plural(kpis.newUsers, 'inscription')}` : undefined}
            />
            <StatCard
              label="Utilisateurs actifs"
              icon={Activity}
              loading={loading}
              value={kpis ? formatNumber(kpis.activeUsers) : '—'}
              hint={kpis ? `${formatNumber(kpis.activeToday)} aujourd’hui` : undefined}
            />
            <StatCard
              label="Revenu mensuel récurrent"
              icon={TrendingUp}
              loading={loading}
              value={kpis ? fmtMoney(kpis.mrr) : '—'}
              hint="Abonnements actifs"
            />
            <StatCard
              label="Revenus de la période"
              icon={Banknote}
              loading={loading}
              value={kpis ? fmtMoney(kpis.revenue) : '—'}
              compare={kpis ? { current: kpis.revenue, previous: kpis.revenuePrevious } : undefined}
            />
            <StatCard
              label="Abonnés Premium"
              icon={Crown}
              loading={loading}
              value={kpis ? formatNumber(kpis.premiumUsers) : '—'}
              hint={kpis ? `${formatPercent(kpis.conversionRate)} des comptes` : undefined}
            />
            <StatCard label="Essais en cours" icon={UserPlus} loading={loading} value={kpis ? formatNumber(kpis.trialUsers) : '—'} hint="Convertibles en Premium" />
            <StatCard
              label="Résiliations"
              icon={UserMinus}
              loading={loading}
              value={kpis ? formatNumber(kpis.cancellations) : '—'}
              hint="Sur la période"
            />
            <StatCard
              label="Dépenses saisies"
              icon={Receipt}
              loading={loading}
              value={kpis ? formatNumber(kpis.expensesCount) : '—'}
              hint={kpis ? `${formatPercent(kpis.onboardedRate)} des comptes configurés` : undefined}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Inscriptions" description="Nouveaux comptes par jour" />
              <div className="px-3 pb-4 pt-3">
                {data ? <TimeChart data={data.series.signups} label="Inscriptions par jour" color="var(--c-chart-1)" /> : <Skeleton className="m-2 h-[230px]" />}
              </div>
            </Card>
            <Card>
              <CardHeader title="Utilisateurs actifs" description="Comptes ayant ouvert l’application, par jour" />
              <div className="px-3 pb-4 pt-3">
                {data ? <TimeChart data={data.series.activeUsers} label="Utilisateurs actifs par jour" color="var(--c-chart-2)" /> : <Skeleton className="m-2 h-[230px]" />}
              </div>
            </Card>
            <Card>
              <CardHeader title="Revenus" description={`Montant encaissé par jour (${currency.symbol})`} />
              <div className="px-3 pb-4 pt-3">
                {data ? (
                  <TimeChart data={data.series.revenue} variant="bars" label="Revenus par jour" color="var(--c-chart-3)" format={fmtMoney} />
                ) : (
                  <Skeleton className="m-2 h-[230px]" />
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Dépenses saisies" description="Volume d’utilisation de l’application" />
              <div className="px-3 pb-4 pt-3">
                {data ? <TimeChart data={data.series.expenses} variant="bars" label="Dépenses saisies par jour" color="var(--c-chart-4)" /> : <Skeleton className="m-2 h-[230px]" />}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader title="Formules" description="Répartition des comptes" />
              <div className="p-5">
                {data ? (
                  <DonutChart
                    centerLabel="comptes"
                    slices={data.tiers.map((t) => ({ label: TIER_LABEL[t.tier], value: t.count, color: TIER_COLOR[t.tier] }))}
                  />
                ) : (
                  <Skeleton className="h-40" />
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Offres" description="Revenu mensuel par offre" />
              <div className="p-5">
                {!data ? (
                  <Skeleton className="h-32" />
                ) : data.plans.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-3">Aucun abonnement actif pour le moment.</p>
                ) : (
                  <BarList
                    color="var(--c-chart-3)"
                    format={fmtMoney}
                    items={data.plans.map((p) => ({ label: p.name, value: p.mrr, hint: plural(p.subscribers, 'abonné') }))}
                  />
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Catégories" description="Dépenses les plus saisies" />
              <div className="p-5">
                {!data ? (
                  <Skeleton className="h-32" />
                ) : data.categories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-3">Aucune dépense sur la période.</p>
                ) : (
                  <BarList color="var(--c-chart-4)" items={data.categories.map((c) => ({ label: categoryLabel(c.categoryId), value: c.count }))} />
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Dernières inscriptions"
                actions={
                  <Link to="/utilisateurs" className="text-sm font-semibold text-primary hover:underline">
                    Tous les utilisateurs
                  </Link>
                }
              />
              {!data ? (
                <Skeleton className="m-5 h-40" />
              ) : data.recentSignups.length === 0 ? (
                <EmptyState icon={Users} title="Aucun utilisateur" message="Les comptes créés apparaîtront ici." />
              ) : (
                <ul className="divide-y divide-line px-2 py-2">
                  {data.recentSignups.map((user) => (
                    <li key={user.id}>
                      <Link to={`/utilisateurs/${user.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
                        <Avatar name={user.displayName} size="sm" />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-sm font-bold text-ink">{user.displayName}</span>
                          <span className="block truncate text-xs text-ink-3">{user.email}</span>
                        </span>
                        <TierBadge tier={user.tier} />
                        <span className="hidden w-24 text-right text-xs text-ink-3 sm:block">{formatAgo(user.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardHeader
                title="Promotions les plus utilisées"
                actions={
                  <Link to="/promotions" className="text-sm font-semibold text-primary hover:underline">
                    Gérer
                  </Link>
                }
              />
              {!data ? (
                <Skeleton className="m-5 h-40" />
              ) : data.promotions.length === 0 ? (
                <EmptyState icon={Receipt} title="Aucune utilisation" message="Les codes promo utilisés par les clients apparaîtront ici." />
              ) : (
                <ul className="divide-y divide-line px-2 py-2">
                  {data.promotions.map((promo) => (
                    <li key={promo.code} className="flex items-center gap-3 px-3 py-3">
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="num block truncate text-sm font-bold text-ink">{promo.code}</span>
                        <span className="block truncate text-xs text-ink-3">{promo.name}</span>
                      </span>
                      <span className="text-right text-sm leading-tight">
                        <span className="num block font-bold text-ink">{plural(promo.redemptions, 'utilisation')}</span>
                        {promo.discountGiven > 0 && <span className="num block text-xs text-ink-3">{fmtMoney(promo.discountGiven)} offerts</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
