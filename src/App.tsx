import type { AdminPermission } from '@rythmo/engine';
import { ShieldAlert } from 'lucide-react';
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState, Skeleton } from '@/components/ui/surfaces';
import { AccountPage } from '@/features/account/account-page';
import { AdminsPage } from '@/features/admins/admins-page';
import { AuditPage } from '@/features/audit/audit-page';
import { LoginPage } from '@/features/auth/login-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { OffersPage } from '@/features/pricing/offers-page';
import { PromotionsPage } from '@/features/promotions/promotions-page';
import { UserDetailPage } from '@/features/users/user-detail-page';
import { UsersPage } from '@/features/users/users-page';
import { useAuth } from '@/lib/auth';

/** Redirige vers la connexion si personne n'est connecté ; attend la vérification de la session au rechargement. */
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-8" aria-busy="true" aria-label="Chargement">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (status === 'anonymous') return <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />;
  return <AppShell />;
}

/** N'affiche la page que si l'administrateur en a le droit (le serveur le vérifie de toute façon). */
function Guard({ permission, children }: { permission: AdminPermission; children: React.ReactNode }) {
  const { can } = useAuth();
  if (can(permission)) return <>{children}</>;
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Accès refusé"
      message="Ton rôle ne donne pas accès à cette page. Demande à un propriétaire si tu en as besoin."
    />
  );
}

const guarded = (permission: AdminPermission, element: React.ReactNode) => <Guard permission={permission}>{element}</Guard>;

const routes: RouteObject[] = [
  { path: '/connexion', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { index: true, element: guarded('dashboard:read', <DashboardPage />) },
      { path: 'utilisateurs', element: guarded('users:read', <UsersPage />) },
      { path: 'utilisateurs/:id', element: guarded('users:read', <UserDetailPage />) },
      { path: 'offres', element: guarded('pricing:read', <OffersPage />) },
      { path: 'promotions', element: guarded('promotions:read', <PromotionsPage />) },
      { path: 'audit', element: guarded('audit:read', <AuditPage />) },
      { path: 'administrateurs', element: guarded('admins:manage', <AdminsPage />) },
      { path: 'compte', element: <AccountPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
