import { useQueryClient } from '@tanstack/react-query';
import type { AdminPermission, AdminProfile, AdminSession } from '@rythmo/engine';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  admin: AdminProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  /** L'administrateur connecté a-t-il cette permission ? Sert à masquer ce qu'il ne peut pas faire. */
  can: (permission: AdminPermission) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(getToken() ? 'loading' : 'anonymous');
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const signOut = useCallback(() => {
    setToken(null);
    setAdmin(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      setAdmin(await api.get<AdminProfile>('/admin/auth/me'));
      setStatus('authenticated');
    } catch {
      signOut();
    }
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    if (getToken()) void refresh();
  }, [refresh, signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await api.post<AdminSession>('/admin/auth/login', { email, password });
      setToken(session.token);
      setAdmin(session.admin);
      setStatus('authenticated');
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, admin, signIn, signOut, refresh, can: (permission) => admin?.permissions.includes(permission) ?? false }),
    [status, admin, signIn, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return context;
}
