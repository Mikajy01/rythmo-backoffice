import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeatureAccess, FeatureKey, PlanView, SubscriptionSettingsView } from '@/contracts';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/forms';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, Tabs } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatMoney, formatNumber, parseMoneyInput, toMoneyInput } from '@/lib/format';
import { useCurrencies, useMeta, useUrlState } from '@/lib/hooks';
import { useToast } from '@/lib/toast';

const INTERVAL_LABEL = { month: 'Mensuel', year: 'Annuel' } as const;

const FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  { key: 'recovery.strategies', label: 'Stratégies de rattrapage', description: 'Choisir entre plusieurs plans (Douce, Intense) après un dépassement.' },
  { key: 'recovery.custom', label: 'Plan sur mesure', description: 'Régler soi-même la durée du plan de rattrapage.' },
  { key: 'recovery.protectSpecialDays', label: 'Jours spéciaux protégés', description: 'Garder intacts les jours spéciaux malgré un plan.' },
  { key: 'simulation.scenarios', label: 'Scénarios de simulation', description: 'Comparer plusieurs façons de rattraper une dépense simulée.' },
  { key: 'simulation.projections', label: 'Projections détaillées', description: 'Voir les budgets jour par jour après une dépense simulée.' },
];

export function OffersPage() {
  const [{ tab }, setUrl] = useUrlState({ tab: 'plans' });
  const { can } = useAuth();
  return (
    <>
      <PageHeader title="Offres et prix" description="Ce que les clients peuvent acheter, et ce que comprend chaque formule." />
      <Tabs
        label="Sections"
        value={tab === 'settings' ? 'settings' : 'plans'}
        onChange={(id) => setUrl({ tab: id })}
        tabs={[
          { id: 'plans', label: 'Offres Premium' },
          { id: 'settings', label: 'Essai et fonctions' },
        ]}
      />
      {tab === 'settings' ? <SettingsPanel canWrite={can('pricing:write')} /> : <PlansPanel canWrite={can('pricing:write')} />}
    </>
  );
}

/* ───────────── Offres ───────────── */

function PlansPanel({ canWrite }: { canWrite: boolean }) {
  const money = useCurrencies();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlanView | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PlanView | null>(null);
  const query = useQuery({ queryKey: ['plans'], queryFn: () => api.get<PlanView[]>('/admin/plans') });

  const toggle = useMutation({
    mutationFn: (plan: PlanView) => api.patch<PlanView>(`/admin/plans/${plan.id}`, { active: !plan.active }),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(plan.active ? `« ${plan.name} » est de nouveau en vente.` : `« ${plan.name} » n’est plus proposée.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (plan: PlanView) => api.delete(`/admin/plans/${plan.id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Offre supprimée.');
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setDeleting(null);
    },
  });

  const columns: Column<PlanView>[] = [
    {
      id: 'name',
      header: 'Offre',
      cell: (plan) => (
        <div className="leading-tight">
          <p className="font-bold text-ink">{plan.name}</p>
          <p className="text-xs text-ink-3">{plan.code}</p>
        </div>
      ),
    },
    { id: 'interval', header: 'Période', hideBelow: 'md', cell: (plan) => <Badge>{INTERVAL_LABEL[plan.interval]}</Badge> },
    { id: 'price', header: 'Prix', align: 'right', cell: (plan) => <span className="num font-bold text-ink">{formatMoney(plan.amount, money(plan.currency))}</span> },
    { id: 'subscribers', header: 'Abonnés', align: 'right', hideBelow: 'md', cell: (plan) => <span className="num text-ink-2">{formatNumber(plan.subscribers)}</span> },
    {
      id: 'active',
      header: 'En vente',
      cell: (plan) => (
        <div className="w-28">
          <Switch checked={plan.active} disabled={!canWrite || toggle.isPending} onChange={() => toggle.mutate(plan)} label={plan.active ? 'Oui' : 'Non'} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (plan) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button size="sm" icon={Pencil} onClick={() => setEditing(plan)}>
              Modifier
            </Button>
            <IconButton icon={Trash2} label={`Supprimer ${plan.name}`} onClick={() => setDeleting(plan)} className="hover:text-danger" />
          </div>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Offres Premium"
        description="Changer un prix n’affecte pas les abonnements déjà vendus : leur historique garde le prix payé."
        actions={
          canWrite && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing('new')}>
              Nouvelle offre
            </Button>
          )
        }
      />
      <div className="pt-3">
        {query.isError ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <DataTable
            caption="Offres Premium"
            columns={columns}
            rows={query.data}
            getKey={(plan) => plan.id}
            loading={query.isLoading}
            skeletonRows={3}
            empty={<EmptyState icon={Tag} title="Aucune offre" message="Crée une première offre pour permettre le passage en Premium." />}
          />
        )}
      </div>
      {editing && <PlanForm plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette offre ?"
        message={
          <>
            L’offre <strong>{deleting?.name}</strong> sera supprimée. Une offre déjà vendue ne peut pas l’être : retire-la de la vente avec l’interrupteur.
          </>
        }
        confirmLabel="Supprimer"
        danger
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </Card>
  );
}

function PlanForm({ plan, onClose }: { plan: PlanView | null; onClose: () => void }) {
  const meta = useMeta();
  const money = useCurrencies();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [code, setCode] = useState(plan?.code ?? '');
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [interval, setIntervalValue] = useState<'month' | 'year'>(plan?.interval ?? 'month');
  const [currencyCode, setCurrencyCode] = useState(plan?.currency ?? 'MGA');
  const currency = money(currencyCode);
  const [price, setPrice] = useState(plan ? toMoneyInput(plan.amount, money(plan.currency)) : '');
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder ?? 0));
  const [active, setActive] = useState(plan?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => (plan ? api.patch<PlanView>(`/admin/plans/${plan.id}`, body) : api.post<PlanView>('/admin/plans', body)),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(plan ? `« ${saved.name} » mise à jour.` : `Offre « ${saved.name} » créée.`);
      onClose();
    },
    onError: (failure) => setError(errorMessage(failure)),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const amount = parseMoneyInput(price, currency);
    if (amount === null) return setError('Indique un prix valide (nombre positif).');
    setError(null);
    const body = { name: name.trim(), description: description.trim(), interval, amount, currency: currencyCode, active, sortOrder: Number(sortOrder) || 0 };
    save.mutate(plan ? body : { code: code.trim(), ...body });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={plan ? `Modifier « ${plan.name} »` : 'Nouvelle offre Premium'}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="plan-form" loading={save.isPending}>
            {plan ? 'Enregistrer' : 'Créer l’offre'}
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={submit} className="space-y-4" noValidate>
        {!plan && (
          <Field label="Code" hint="Identifiant technique, définitif. Ex. premium-monthly">
            {(props) => <Input {...props} value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} maxLength={40} required />}
          </Field>
        )}
        <Field label="Nom affiché dans l’application">{(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />}</Field>
        <Field label="Description (facultatif)">{(props) => <Textarea {...props} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Période de facturation">
            {(props) => (
              <Select {...props} value={interval} onChange={(e) => setIntervalValue(e.target.value as 'month' | 'year')}>
                <option value="month">Mensuelle</option>
                <option value="year">Annuelle</option>
              </Select>
            )}
          </Field>
          <Field label="Devise">
            {(props) => (
              <Select {...props} value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
                {(meta.data?.currencies ?? [currency]).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Prix (${currency.symbol})`} hint={price && parseMoneyInput(price, currency) !== null ? `Affiché : ${formatMoney(parseMoneyInput(price, currency)!, currency)}` : undefined}>
            {(props) => <Input {...props} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={currency.decimals > 0 ? '4,50' : '5000'} required />}
          </Field>
          <Field label="Ordre d’affichage" hint="Le plus petit en premier.">
            {(props) => <Input {...props} type="number" min={0} max={1000} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />}
          </Field>
        </div>
        <Switch checked={active} onChange={setActive} label="Proposée à la vente" description="Une offre retirée de la vente n’est plus visible dans l’application." />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

/* ───────────── Essai et fonctions ───────────── */

function SettingsPanel({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['subscription-settings'], queryFn: () => api.get<SubscriptionSettingsView>('/admin/subscription-settings') });
  const [trial, setTrial] = useState<number | null>(null);
  const [features, setFeatures] = useState<Record<FeatureKey, FeatureAccess> | null>(null);

  useEffect(() => {
    if (query.data) {
      setTrial(query.data.trialDurationDays);
      setFeatures(query.data.features);
    }
  }, [query.data]);

  const save = useMutation({
    mutationFn: () => api.put<SubscriptionSettingsView>('/admin/subscription-settings', { trialDurationDays: trial, features }),
    onSuccess: (saved) => {
      queryClient.setQueryData(['subscription-settings'], saved);
      toast.success('Réglages enregistrés : ils s’appliquent immédiatement à tous les comptes.');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (query.isError) {
    return (
      <Card>
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </Card>
    );
  }
  if (!query.data || !features || trial === null) return <Skeleton className="h-96" />;

  const dirty = trial !== query.data.trialDurationDays || FEATURES.some((f) => features[f.key] !== query.data.features[f.key]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader title="Essai gratuit" description="Durée offerte aux nouveaux utilisateurs qui démarrent l’essai." />
        <div className="space-y-4 p-5">
          <Field label="Durée de l’essai">
            {(props) => (
              <Select {...props} value={trial} disabled={!canWrite} onChange={(e) => setTrial(Number(e.target.value))}>
                {query.data.allowedTrialDurations.map((days) => (
                  <option key={days} value={days}>
                    {days} jours
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <p className="text-sm text-ink-3">Les essais déjà commencés gardent la durée choisie au départ.</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Fonctions réservées au Premium" description="Désactive un interrupteur pour offrir la fonction à tout le monde." />
        <ul className="divide-y divide-line px-5 py-2">
          {FEATURES.map((feature) => (
            <li key={feature.key} className="py-3">
              <Switch
                label={feature.label}
                description={feature.description}
                disabled={!canWrite}
                checked={features[feature.key] === 'premium'}
                onChange={(premium) => setFeatures({ ...features, [feature.key]: premium ? 'premium' : 'free' })}
              />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="text-sm text-ink-3">{dirty ? 'Modifications non enregistrées.' : 'Aucune modification.'}</p>
          {canWrite && (
            <Button variant="primary" loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
              Enregistrer
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
