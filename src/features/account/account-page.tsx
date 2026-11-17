import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/forms';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/surfaces';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const ROLE_LABELS = { owner: 'Propriétaire', manager: 'Gestionnaire', support: 'Support', analyst: 'Analyste' } as const;

export function AccountPage() {
  const { admin } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: () => api.post('/admin/auth/password', { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success('Mot de passe modifié.');
      setCurrent('');
      setNext('');
      setConfirm('');
    },
    onError: (failure) => setError(errorMessage(failure)),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (next.length < 10) return setError('Le nouveau mot de passe doit contenir au moins 10 caractères.');
    if (next !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setError(null);
    change.mutate();
  }

  if (!admin) return null;
  return (
    <>
      <PageHeader title="Mon compte" description="Ton profil et ton mot de passe." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profil" />
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Nom</dt>
              <dd className="font-semibold text-ink">{admin.displayName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">E-mail</dt>
              <dd className="font-semibold text-ink">{admin.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Rôle</dt>
              <dd>
                <Badge tone="primary">{ROLE_LABELS[admin.role]}</Badge>
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-ink-3">Permissions</dt>
              <dd className="flex flex-wrap gap-1.5">
                {admin.permissions.map((permission) => (
                  <Badge key={permission}>{permission}</Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Changer de mot de passe" />
          <form onSubmit={submit} className="space-y-4 p-5" noValidate>
            <Field label="Mot de passe actuel">{(props) => <Input {...props} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
            <Field label="Nouveau mot de passe" hint="10 caractères minimum.">
              {(props) => <Input {...props} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
            </Field>
            <Field label="Confirmer le nouveau mot de passe">{(props) => <Input {...props} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}</Field>
            {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
            <Button type="submit" variant="primary" loading={change.isPending} disabled={!current || !next || !confirm}>
              Enregistrer
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
