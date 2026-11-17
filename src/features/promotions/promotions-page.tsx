import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Paginated, PlanView, PromotionKind, PromotionStatus, PromotionView } from '@rythmo/engine';
import { Pencil, Plus, Search, Ticket, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/forms';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { Badge, Card, EmptyState, ErrorState, PageHeader, type Tone } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatMoney, formatNumber, fromLocalInput, toLocalInput } from '@/lib/format';
import { useCurrencies, useDebounced, useUrlState } from '@/lib/hooks';
import { useToast } from '@/lib/toast';

const DEFAULTS = { q: '', status: '', page: '1', size: '20' };

const STATUS: Record<PromotionStatus, { label: string; tone: Tone }> = {
  active: { label: 'En cours', tone: 'success' },
  scheduled: { label: 'Programmée', tone: 'primary' },
  paused: { label: 'En pause', tone: 'neutral' },
  expired: { label: 'Expirée', tone: 'warning' },
  exhausted: { label: 'Épuisée', tone: 'warning' },
};

const KIND_LABEL: Record<PromotionKind, string> = {
  percent: 'Remise en pourcentage',
  fixed: 'Remise en montant',
  free_trial: 'Jours d’essai offerts',
};

function useDescribe() {
  const money = useCurrencies();
  return (promo: Pick<PromotionView, 'kind' | 'value'>): string => {
    if (promo.kind === 'percent') return `−${promo.value} %`;
    if (promo.kind === 'free_trial') return `${promo.value} jours d’essai`;
    return `−${formatMoney(promo.value, money('MGA'))}`;
  };
}

export function PromotionsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const describe = useDescribe();
  const canWrite = can('promotions:write');

  const [url, setUrl] = useUrlState(DEFAULTS);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebounced(search, 350);
  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const [editing, setEditing] = useState<PromotionView | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PromotionView | null>(null);

  const query = useQuery({
    queryKey: ['promotions', url],
    queryFn: () =>
      api.get<Paginated<PromotionView>>('/admin/promotions', {
        search: url.q,
        status: url.status,
        page: Number(url.page),
        pageSize: Number(url.size),
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['promotions'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const toggle = useMutation({
    mutationFn: (promo: PromotionView) => api.patch<PromotionView>(`/admin/promotions/${promo.id}`, { active: !promo.active }),
    onSuccess: (promo) => {
      refresh();
      toast.success(promo.active ? `${promo.code} est réactivé.` : `${promo.code} est en pause.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (promo: PromotionView) => api.delete(`/admin/promotions/${promo.id}`),
    onSuccess: () => {
      refresh();
      toast.success('Promotion supprimée.');
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setDeleting(null);
    },
  });

  const columns: Column<PromotionView>[] = [
    {
      id: 'code',
      header: 'Code',
      cell: (promo) => (
        <div className="leading-tight">
          <p className="num font-extrabold tracking-wide text-ink">{promo.code}</p>
          <p className="text-xs text-ink-3">{promo.name}</p>
        </div>
      ),
    },
    { id: 'value', header: 'Avantage', cell: (promo) => <span className="num font-bold text-ink">{describe(promo)}</span> },
    {
      id: 'plans',
      header: 'Offres',
      hideBelow: 'lg',
      cell: (promo) => <span className="text-ink-2">{promo.planCodes.length === 0 ? 'Toutes' : promo.planCodes.join(', ')}</span>,
    },
    {
      id: 'period',
      header: 'Validité',
      hideBelow: 'md',
      cell: (promo) => (
        <span className="text-ink-2">
          {promo.startsAt ? `Du ${formatDate(promo.startsAt)}` : 'Dès maintenant'}
          <br />
          {promo.endsAt ? `au ${formatDate(promo.endsAt)}` : 'sans fin'}
        </span>
      ),
    },
    {
      id: 'uses',
      header: 'Utilisations',
      align: 'right',
      cell: (promo) => (
        <span className="num text-ink-2">
          {formatNumber(promo.redemptions)}
          {promo.maxRedemptions !== null && <span className="text-ink-3"> / {formatNumber(promo.maxRedemptions)}</span>}
        </span>
      ),
    },
    { id: 'status', header: 'Statut', cell: (promo) => <Badge tone={STATUS[promo.status].tone}>{STATUS[promo.status].label}</Badge> },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (promo) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button size="sm" onClick={() => toggle.mutate(promo)} disabled={toggle.isPending}>
              {promo.active ? 'Mettre en pause' : 'Réactiver'}
            </Button>
            <IconButton icon={Pencil} label={`Modifier ${promo.code}`} onClick={() => setEditing(promo)} />
            <IconButton icon={Trash2} label={`Supprimer ${promo.code}`} onClick={() => setDeleting(promo)} className="hover:text-danger" />
          </div>
        ),
    },
  ];

  const result = query.data;
  const filtered = Boolean(url.q || url.status);

  return (
    <>
      <PageHeader
        title="Promotions"
        description="Codes promo : remises sur les abonnements et jours d’essai offerts."
        actions={
          canWrite && (
            <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
              Nouvelle promotion
            </Button>
          )
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <Input type="search" aria-label="Rechercher une promotion" placeholder="Code ou nom" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select aria-label="Filtrer par statut" value={url.status} onChange={(e) => setUrl({ status: e.target.value })} className="w-44">
            <option value="">Tous les statuts</option>
            <option value="active">En cours</option>
            <option value="scheduled">Programmées</option>
            <option value="paused">En pause</option>
            <option value="expired">Expirées</option>
          </Select>
        </div>
        {query.isError && !result ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <>
            <DataTable
              caption="Promotions"
              columns={columns}
              rows={result?.items}
              getKey={(promo) => promo.id}
              loading={query.isFetching}
              skeletonRows={5}
              empty={
                <EmptyState
                  icon={Ticket}
                  title={filtered ? 'Aucun résultat' : 'Aucune promotion'}
                  message={filtered ? 'Aucune promotion ne correspond à ces critères.' : 'Crée un code pour offrir une remise ou des jours d’essai.'}
                />
              }
            />
            {result && (
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
                totalPages={result.totalPages}
                noun="promotions"
                onPage={(next) => setUrl({ page: String(next) }, { keepPage: true })}
                onPageSize={(size) => setUrl({ size: String(size) })}
              />
            )}
          </>
        )}
      </Card>

      {editing && <PromotionForm promotion={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette promotion ?"
        message={
          <>
            Le code <strong>{deleting?.code}</strong> sera supprimé. Un code déjà utilisé ne peut pas être supprimé : mets-le en pause.
          </>
        }
        confirmLabel="Supprimer"
        danger
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  );
}

function PromotionForm({ promotion, onClose, onSaved }: { promotion: PromotionView | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.get<PlanView[]>('/admin/plans') });
  const locked = (promotion?.redemptions ?? 0) > 0;

  const [code, setCode] = useState(promotion?.code ?? '');
  const [name, setName] = useState(promotion?.name ?? '');
  const [description, setDescription] = useState(promotion?.description ?? '');
  const [kind, setKind] = useState<PromotionKind>(promotion?.kind ?? 'percent');
  const [value, setValue] = useState(String(promotion?.value ?? ''));
  const [planCodes, setPlanCodes] = useState<string[]>(promotion?.planCodes ?? []);
  const [startsAt, setStartsAt] = useState(toLocalInput(promotion?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(promotion?.endsAt ?? null));
  const [max, setMax] = useState(promotion?.maxRedemptions ? String(promotion.maxRedemptions) : '');
  const [active, setActive] = useState(promotion?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      promotion ? api.patch<PromotionView>(`/admin/promotions/${promotion.id}`, body) : api.post<PromotionView>('/admin/promotions', body),
    onSuccess: (saved) => {
      onSaved();
      toast.success(promotion ? `${saved.code} mise à jour.` : `Promotion ${saved.code} créée.`);
      onClose();
    },
    onError: (failure) => setError(errorMessage(failure)),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(value);
    if (!Number.isInteger(amount) || amount < 1) return setError('Indique une valeur entière supérieure à zéro.');
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim(),
      kind,
      value: amount,
      planCodes,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      maxRedemptions: max ? Number(max) : null,
      active,
    };
    save.mutate(promotion ? body : { code: code.trim().toUpperCase(), ...body });
  }

  const unit = kind === 'percent' ? '%' : kind === 'free_trial' ? 'jours' : 'Ar';

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={promotion ? `Modifier ${promotion.code}` : 'Nouvelle promotion'}
      description={locked ? `Ce code a déjà été utilisé ${promotion?.redemptions} fois : le type et la valeur ne sont plus modifiables.` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="promotion-form" loading={save.isPending}>
            {promotion ? 'Enregistrer' : 'Créer la promotion'}
          </Button>
        </>
      }
    >
      <form id="promotion-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {!promotion && (
            <Field label="Code à saisir par le client" hint="3 à 32 caractères : lettres, chiffres, - ou _.">
              {(props) => <Input {...props} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={32} placeholder="BIENVENUE20" required />}
            </Field>
          )}
          <Field label="Nom interne" className={promotion ? 'sm:col-span-2' : undefined}>
            {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Lancement — 20 %" required />}
          </Field>
        </div>
        <Field label="Description (facultatif)">{(props) => <Textarea {...props} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} />}</Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type d’avantage">
            {(props) => (
              <Select {...props} value={kind} disabled={locked} onChange={(e) => setKind(e.target.value as PromotionKind)}>
                {Object.entries(KIND_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={`Valeur (${unit})`} hint={kind === 'percent' ? 'Entre 1 et 100.' : kind === 'fixed' ? 'Dans la plus petite unité de la devise de l’offre.' : 'Durée de l’essai offert.'}>
            {(props) => <Input {...props} type="number" min={1} value={value} disabled={locked} onChange={(e) => setValue(e.target.value)} required />}
          </Field>
        </div>

        {kind !== 'free_trial' && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-ink">Offres concernées</legend>
            <p className="mb-2 text-xs text-ink-3">Ne coche rien pour qu’il vale pour toutes les offres.</p>
            <div className="flex flex-wrap gap-2">
              {(plans.data ?? []).map((plan) => {
                const checked = planCodes.includes(plan.code);
                return (
                  <label
                    key={plan.code}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${checked ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink-2'}`}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--c-primary)]"
                      checked={checked}
                      onChange={() => setPlanCodes(checked ? planCodes.filter((c) => c !== plan.code) : [...planCodes, plan.code])}
                    />
                    {plan.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Début (facultatif)">{(props) => <Input {...props} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}</Field>
          <Field label="Fin (facultatif)">{(props) => <Input {...props} type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />}</Field>
          <Field label="Plafond d’utilisations" hint="Vide = illimité.">
            {(props) => <Input {...props} type="number" min={Math.max(1, promotion?.redemptions ?? 1)} value={max} onChange={(e) => setMax(e.target.value)} />}
          </Field>
        </div>
        <Switch checked={active} onChange={setActive} label="Actif" description="Une promotion en pause refuse le code, sans le supprimer." />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
