import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAccountView, AdminRole, Paginated } from '@/contracts';
import { KeyRound, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, Pagination, type Column } from '@/components/ui/data-table';
import { Field, Input, Select, Switch } from '@/components/ui/forms';
import { Modal } from '@/components/ui/modal';
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatAgo } from '@/lib/format';
import { useUrlState } from '@/lib/hooks';
import { useToast } from '@/lib/toast';

const ROLES: { id: AdminRole; label: string; description: string }[] = [
  { id: 'owner', label: 'Propriétaire', description: 'Tous les droits, y compris la gestion des administrateurs.' },
  { id: 'manager', label: 'Gestionnaire', description: 'Utilisateurs, offres, promotions et journal ; pas les administrateurs ni la suppression de comptes.' },
  { id: 'support', label: 'Support', description: 'Consulter et assister les utilisateurs (suspendre, offrir du Premium) ; lecture seule sur les offres.' },
  { id: 'analyst', label: 'Analyste', description: 'Lecture seule : tableau de bord, utilisateurs, offres, promotions et journal.' },
];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.id, r.label])) as Record<AdminRole, string>;

export function AdminsPage() {
  const { admin: me } = useAuth();
  const [url, setUrl] = useUrlState({ page: '1' });
  const [dialog, setDialog] = useState<{ kind: 'create' } | { kind: 'edit' | 'password'; target: AdminAccountView } | null>(null);

  const query = useQuery({
    queryKey: ['admins', url],
    queryFn: () => api.get<Paginated<AdminAccountView>>('/admin/admins', { page: Number(url.page), pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<AdminAccountView>[] = [
    {
      id: 'admin',
      header: 'Administrateur',
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.displayName} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold text-ink">
              {a.displayName} {a.id === me?.id && <span className="text-xs font-semibold text-ink-3">(toi)</span>}
            </p>
            <p className="truncate text-xs text-ink-3">{a.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'role', header: 'Rôle', cell: (a) => <Badge tone={a.role === 'owner' ? 'gold' : 'primary'}>{ROLE_LABEL[a.role]}</Badge> },
    { id: 'status', header: 'Statut', cell: (a) => (a.active ? <Badge tone="success">Actif</Badge> : <Badge>Désactivé</Badge>) },
    { id: 'login', header: 'Dernière connexion', hideBelow: 'md', cell: (a) => <span className="text-ink-2">{formatAgo(a.lastLoginAt)}</span> },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" icon={Pencil} onClick={() => setDialog({ kind: 'edit', target: a })}>
            Modifier
          </Button>
          <Button size="sm" icon={KeyRound} onClick={() => setDialog({ kind: 'password', target: a })}>
            Mot de passe
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Administrateurs"
        description="Qui a accès au back-office, avec quels droits."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setDialog({ kind: 'create' })}>
            Nouvel administrateur
          </Button>
        }
      />
      <Card>
        {query.isError && !query.data ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <>
            <DataTable
              caption="Administrateurs"
              columns={columns}
              rows={query.data?.items}
              getKey={(a) => a.id}
              loading={query.isFetching}
              skeletonRows={3}
              empty={<EmptyState icon={ShieldCheck} title="Aucun administrateur" />}
            />
            {query.data && (
              <Pagination {...query.data} noun="administrateurs" onPage={(page) => setUrl({ page: String(page) }, { keepPage: true })} />
            )}
          </>
        )}
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Description des rôles">
        {ROLES.map((role) => (
          <div key={role.id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-bold text-ink">{role.label}</p>
            <p className="mt-1 text-sm text-ink-2">{role.description}</p>
          </div>
        ))}
      </section>

      {dialog?.kind === 'create' && <CreateDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <EditDialog target={dialog.target} isSelf={dialog.target.id === me?.id} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'password' && <PasswordDialog target={dialog.target} onClose={() => setDialog(null)} />}
    </>
  );
}

function RoleSelect({ value, onChange, disabled }: { value: AdminRole; onChange: (role: AdminRole) => void; disabled?: boolean }) {
  return (
    <Field label="Rôle" hint={ROLES.find((r) => r.id === value)?.description}>
      {(props) => (
        <Select {...props} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as AdminRole)}>
          {ROLES.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function useAdminMutation<T>(run: (input: T) => Promise<unknown>, success: string, onClose: () => void, setError: (message: string) => void) {
  const toast = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success(success);
      onClose();
    },
    onError: (error) => setError(errorMessage(error)),
  });
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('support');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useAdminMutation((body: object) => api.post('/admin/admins', body), 'Administrateur créé.', onClose, setError);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    create.mutate({ email: email.trim(), displayName: displayName.trim(), role, password });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouvel administrateur"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="admin-create" loading={create.isPending}>
            Créer le compte
          </Button>
        </>
      }
    >
      <form id="admin-create" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Adresse e-mail">{(props) => <Input {...props} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />}</Field>
        <Field label="Nom affiché">{(props) => <Input {...props} value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} required />}</Field>
        <RoleSelect value={role} onChange={setRole} />
        <Field label="Mot de passe provisoire" hint="10 caractères minimum. Communique-le de façon sûre : la personne pourra le changer.">
          {(props) => <Input {...props} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
      </form>
    </Modal>
  );
}

function EditDialog({ target, isSelf, onClose }: { target: AdminAccountView; isSelf: boolean; onClose: () => void }) {
  const [displayName, setDisplayName] = useState(target.displayName);
  const [role, setRole] = useState<AdminRole>(target.role);
  const [active, setActive] = useState(target.active);
  const [error, setError] = useState<string | null>(null);
  const update = useAdminMutation((body: object) => api.patch(`/admin/admins/${target.id}`, body), 'Administrateur mis à jour.', onClose, setError);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    update.mutate({ displayName: displayName.trim(), role, active });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Modifier ${target.displayName}`}
      description={target.email}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="admin-edit" loading={update.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="admin-edit" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nom affiché">{(props) => <Input {...props} value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} required />}</Field>
        <RoleSelect value={role} onChange={setRole} disabled={isSelf} />
        <Switch checked={active} onChange={setActive} disabled={isSelf} label="Compte actif" description={isSelf ? 'Tu ne peux pas désactiver ton propre compte.' : 'Un compte désactivé ne peut plus se connecter.'} />
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
      </form>
    </Modal>
  );
}

function PasswordDialog({ target, onClose }: { target: AdminAccountView; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reset = useAdminMutation((body: object) => api.post(`/admin/admins/${target.id}/reset-password`, body), 'Mot de passe modifié.', onClose, setError);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    reset.mutate({ newPassword: password });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouveau mot de passe"
      description={`Définis un mot de passe pour ${target.email}.`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="admin-password" loading={reset.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="admin-password" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Mot de passe" hint="10 caractères minimum.">
          {(props) => <Input {...props} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
      </form>
    </Modal>
  );
}
