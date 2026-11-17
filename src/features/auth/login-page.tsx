import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/forms';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';

export function LoginPage() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <svg viewBox="0 0 48 48" className="size-14" role="img" aria-label="Rythmo">
            <rect width="48" height="48" rx="13" fill="#1E40AF" />
            <rect x="10" y="22" width="5.5" height="14" rx="2.75" fill="#93B4FF" />
            <rect x="18.2" y="15" width="5.5" height="21" rx="2.75" fill="#FFFFFF" />
            <rect x="26.4" y="11" width="5.5" height="25" rx="2.75" fill="#FFFFFF" />
            <rect x="34.6" y="19" width="5.5" height="17" rx="2.75" fill="#FBBF24" />
          </svg>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Back-office Rythmo</h1>
          <p className="mt-1 text-sm text-ink-2">Réservé à l’équipe. Connecte-toi pour gérer l’application.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-card" noValidate>
          <Field label="Adresse e-mail">
            {(props) => (
              <Input {...props} type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
          </Field>
          <Field label="Mot de passe">
            {(props) => (
              <Input {...props} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            )}
          </Field>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!email || !password}>
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
