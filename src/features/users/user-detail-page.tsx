import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserDetail, PlanView, SubscriptionRecordView } from '@rythmo/engine';
import { ArrowLeft, Ban, Crown, Hourglass, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Textarea } from '@/components/ui/forms';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { Avatar, Badge, Card, CardHeader, EmptyState, ErrorState, Skeleton } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatAgo, formatDate, formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { useCurrencies } from '@/lib/hooks';
import { useToast } from '@/lib/toast';
import { TierBadge } from '../dashboard/dashboard-page';

type Dialog = 'suspend' | 'rename' | 'grant' | 'trial' | 'delete' | 'revoke' | null;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function UserDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const money = useCurrencies();
  const [dialog, setDialog] = useState<Dialog>(null);

  const query = useQuery({ queryKey: ['user', id], queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`) });
  const user = query.data;

  /** Exécute une action sur le compte, rafraîchit la fiche et les listes, puis confirme. */
  const act = useMutation({
    mutationFn: async ({ run }: { run: () => Promise<AdminUserDetail | void>; success: string }) => run(),
    onSuccess: (result, { success }) => {
      if (result) queryClient.setQueryData(['user', id], result);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(success);
      setDialog(null);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const canWrite = can('users:write');
  const canDelete = can('users:delete');

  if (query.isError) {
    return (
      <Card>
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </Card>
    );
  }

  const records: Column<SubscriptionRecordView>[] = [
    { id: 'plan', header: 'Offre', cell: (r) => <span className="font-bold text-ink">{r.planName}</span> },
    {
      id: 'amount',
      header: 'Payé',
      align: 'right',
      cell: (r) => (
        <span className="num">
          {formatMoney(r.amountPaid, money(r.currency))}
          {r.amountPaid < r.listAmount && <span className="ml-1.5 text-xs text-ink-3 line-through">{formatMoney(r.listAmount, money(r.currency))}</span>}
        </span>
      ),
    },
    { id: 'source', header: 'Origine', hideBelow: 'md', cell: (r) => <span className="text-ink-2">{r.source === 'admin' ? 'Offert (back-office)' : r.promoCode ? `Achat · ${r.promoCode}` : 'Achat'}</span> },
    { id: 'startedAt', header: 'Début', cell: (r) => <span className="text-ink-2">{formatDate(r.startedAt)}</span> },
    {
      id: 'status',
      header: 'Statut',
      cell: (r) => (r.status === 'active' ? <Badge tone="success">Actif</Badge> : <Badge>Résilié {r.cancelledAt ? formatDate(r.cancelledAt) : ''}</Badge>),
    },
  ];

  return (
    <>
      <Link to="/utilisateurs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Utilisateurs
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {user ? <Avatar name={user.displayName} size="lg" /> : <Skeleton className="size-14 rounded-full" />}
          <div className="min-w-0">
            {user ? (
              <>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-ink">
                  {user.displayName}
                  <TierBadge tier={user.tier} />
                  {user.suspended && (
                    <Badge tone="danger" icon={Ban}>
                      Suspendu
                    </Badge>
                  )}
                </h1>
                <p className="truncate text-sm text-ink-2">{user.email}</p>
              </>
            ) : (
              <Skeleton className="h-8 w-56" />
            )}
          </div>
        </div>

        {user && canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={Pencil} onClick={() => setDialog('rename')}>
              Renommer
            </Button>
            {user.tier === 'premium' ? (
              <Button size="sm" icon={Crown} onClick={() => setDialog('revoke')}>
                Retirer le Premium
              </Button>
            ) : (
              <Button size="sm" icon={Crown} onClick={() => setDialog('grant')}>
                Offrir le Premium
              </Button>
            )}
            {user.tier !== 'premium' && (
              <Button size="sm" icon={Hourglass} onClick={() => setDialog('trial')}>
                Essai
              </Button>
            )}
            {user.suspended ? (
              <Button
                size="sm"
                variant="primary"
                icon={ShieldCheck}
                loading={act.isPending}
                onClick={() => act.mutate({ run: () => api.post<AdminUserDetail>(`/admin/users/${id}/reactivate`), success: 'Compte réactivé.' })}
              >
                Réactiver
              </Button>
            ) : (
              <Button size="sm" icon={Ban} onClick={() => setDialog('suspend')}>
                Suspendre
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDialog('delete')}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Profil" />
          <dl className="divide-y divide-line px-5 pb-3 pt-2">
            {user ? (
              <>
                <Row label="Inscrit le">{formatDateTime(user.createdAt)}</Row>
                <Row label="Dernière activité">{formatAgo(user.lastSeenAt)}</Row>
                <Row label="Budget configuré">{user.onboarded ? 'Oui' : 'Non'}</Row>
                <Row label="Devise">{user.currency}</Row>
                {user.onboarded && <Row label="Budget mensuel"><span className="num">{formatMoney(user.monthlyBudget, money(user.currency))}</span></Row>}
                {user.onboarded && <Row label="Début de période">Le {user.periodStartDay} du mois</Row>}
                {user.suspendedAt && <Row label="Suspendu le">{formatDateTime(user.suspendedAt)}</Row>}
                <Row label="Identifiant"><span className="num break-all text-xs font-medium text-ink-2">{user.id}</span></Row>
              </>
            ) : (
              <Skeleton className="my-3 h-40" />
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Utilisation" description="Activité enregistrée par l’application" />
          <dl className="divide-y divide-line px-5 pb-3 pt-2">
            {user ? (
              <>
                <Row label="Dépenses saisies"><span className="num">{formatNumber(user.stats.expenses)}</span></Row>
                <Row label="Total dépensé"><span className="num">{formatMoney(user.stats.expensesTotal, money(user.currency))}</span></Row>
                <Row label="Jours actifs (30 j)"><span className="num">{user.stats.activeDays30}</span></Row>
                <Row label="Plans de rattrapage"><span className="num">{user.stats.recoveryPlans}</span></Row>
                <Row label="Succès débloqués"><span className="num">{user.stats.achievements}</span></Row>
                <Row label="Messages du coach"><span className="num">{user.stats.notifications}</span></Row>
              </>
            ) : (
              <Skeleton className="my-3 h-40" />
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Abonnement" />
          <dl className="divide-y divide-line px-5 pb-3 pt-2">
            {user ? (
              <>
                <Row label="Formule"><TierBadge tier={user.tier} /></Row>
                {user.premiumSince && <Row label="Premium depuis">{formatDate(user.premiumSince)}</Row>}
                <Row label="Essai">
                  {user.trial.startedAt
                    ? user.trial.active
                      ? `En cours · fin le ${formatDate(user.trial.endsAt!)}`
                      : `Terminé le ${formatDate(user.trial.endsAt!)}`
                    : 'Jamais utilisé'}
                </Row>
                {user.trial.durationDays && <Row label="Durée de l’essai">{user.trial.durationDays} jours</Row>}
              </>
            ) : (
              <Skeleton className="my-3 h-32" />
            )}
          </dl>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Historique des abonnements" description="Achats et Premium offerts" />
        <div className="pt-3">
          <DataTable
            caption="Historique des abonnements"
            columns={records}
            rows={user?.subscriptions}
            getKey={(r) => r.id}
            loading={!user}
            skeletonRows={2}
            empty={<EmptyState icon={Crown} title="Aucun abonnement" message="Cet utilisateur n’a jamais été Premium." />}
          />
        </div>
      </Card>

      {user && (
        <>
          <SuspendDialog open={dialog === 'suspend'} onClose={() => setDialog(null)} user={user} busy={act.isPending} onSubmit={(reason) => act.mutate({ run: () => api.post<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason }), success: 'Compte suspendu.' })} />
          <RenameDialog open={dialog === 'rename'} onClose={() => setDialog(null)} user={user} busy={act.isPending} onSubmit={(displayName) => act.mutate({ run: () => api.patch<AdminUserDetail>(`/admin/users/${id}`, { displayName }), success: 'Nom modifié.' })} />
          <GrantDialog open={dialog === 'grant'} onClose={() => setDialog(null)} user={user} busy={act.isPending} onSubmit={(body) => act.mutate({ run: () => api.post<AdminUserDetail>(`/admin/users/${id}/premium`, body), success: 'Premium offert.' })} />
          <TrialDialog open={dialog === 'trial'} onClose={() => setDialog(null)} user={user} busy={act.isPending} onSubmit={(body) => act.mutate({ run: () => api.post<AdminUserDetail>(`/admin/users/${id}/trial`, body), success: 'Essai mis à jour.' })} />
          <ConfirmDialog
            open={dialog === 'revoke'}
            onClose={() => setDialog(null)}
            title="Retirer le Premium ?"
            message={<>Le compte <strong>{user.email}</strong> repasse en formule gratuite immédiatement. Ses données sont conservées.</>}
            confirmLabel="Retirer le Premium"
            danger
            loading={act.isPending}
            onConfirm={() => act.mutate({ run: () => api.delete<AdminUserDetail>(`/admin/users/${id}/premium`), success: 'Premium retiré.' })}
          />
          <ConfirmDialog
            open={dialog === 'delete'}
            onClose={() => setDialog(null)}
            title="Supprimer ce compte ?"
            message={
              <>
                Toutes les données de <strong>{user.email}</strong> (budget, dépenses, plans, messages) seront effacées <strong>définitivement</strong>. L’historique des ventes est conservé pour la comptabilité.
              </>
            }
            confirmLabel="Supprimer définitivement"
            danger
            requireText={user.email}
            loading={act.isPending}
            onConfirm={() =>
              act.mutate(
                { run: async () => void (await api.delete(`/admin/users/${id}`)), success: 'Compte supprimé.' },
                { onSuccess: () => navigate('/utilisateurs', { replace: true }) },
              )
            }
          />
        </>
      )}
    </>
  );
}

interface DialogProps<T> {
  open: boolean;
  onClose: () => void;
  user: AdminUserDetail;
  busy: boolean;
  onSubmit: (value: T) => void;
}

function SuspendDialog({ open, onClose, user, busy, onSubmit }: DialogProps<string>) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suspendre ce compte"
      description={`${user.email} ne pourra plus utiliser l’application : sa session est coupée immédiatement.`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="danger" loading={busy} onClick={() => onSubmit(reason.trim())}>
            Suspendre
          </Button>
        </>
      }
    >
      <Field label="Motif (facultatif)" hint="Conservé dans le journal d’audit, jamais montré à l’utilisateur.">
        {(props) => <Textarea {...props} value={reason} maxLength={240} onChange={(e) => setReason(e.target.value)} />}
      </Field>
    </Modal>
  );
}

function RenameDialog({ open, onClose, user, busy, onSubmit }: DialogProps<string>) {
  const [name, setName] = useState(user.displayName);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Renommer l’utilisateur"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={busy} disabled={!name.trim() || name.trim() === user.displayName} onClick={() => onSubmit(name.trim())}>
            Enregistrer
          </Button>
        </>
      }
    >
      <Field label="Prénom affiché">{(props) => <Input {...props} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />}</Field>
    </Modal>
  );
}

function GrantDialog({ open, onClose, user, busy, onSubmit }: DialogProps<{ planCode?: string; note?: string }>) {
  const money = useCurrencies();
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.get<PlanView[]>('/admin/plans'), enabled: open });
  const [planCode, setPlanCode] = useState('');
  const [note, setNote] = useState('');
  const active = plans.data?.filter((p) => p.active) ?? [];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Offrir le Premium"
      description={`Active le Premium pour ${user.email}. Rien n’est facturé ; l’opération apparaît dans l’historique et le journal d’audit.`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={busy} onClick={() => onSubmit({ planCode: planCode || undefined, note: note.trim() || undefined })}>
            Offrir le Premium
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Offre">
          {(props) => (
            <Select {...props} value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
              <option value="">Par défaut (première offre active)</option>
              {active.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} — {formatMoney(plan.amount, money(plan.currency))}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Note (facultatif)" hint="Ex. « geste commercial suite au ticket #123 ».">
          {(props) => <Textarea {...props} value={note} maxLength={240} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  );
}

function TrialDialog({ open, onClose, user, busy, onSubmit }: DialogProps<{ action: 'extend' | 'reset' | 'end'; days?: number }>) {
  const [action, setAction] = useState<'extend' | 'reset' | 'end'>('extend');
  const [days, setDays] = useState('7');
  const invalid = action === 'extend' && !(Number(days) >= 1 && Number(days) <= 90);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gérer l’essai gratuit"
      description={`Essai de ${user.email} : ${user.trial.startedAt ? (user.trial.active ? 'en cours' : 'terminé') : 'jamais utilisé'}.`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={busy} disabled={invalid} onClick={() => onSubmit({ action, days: action === 'extend' ? Number(days) : undefined })}>
            Appliquer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Action">
          {(props) => (
            <Select {...props} value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
              <option value="extend">{user.trial.active ? 'Prolonger l’essai' : 'Relancer un essai'}</option>
              <option value="end" disabled={!user.trial.active}>Terminer l’essai maintenant</option>
              <option value="reset" disabled={!user.trial.startedAt}>Remettre l’essai à disposition</option>
            </Select>
          )}
        </Field>
        {action === 'extend' && (
          <Field label="Nombre de jours" hint="Entre 1 et 90.">
            {(props) => <Input {...props} type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} />}
          </Field>
        )}
      </div>
    </Modal>
  );
}
