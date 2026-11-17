import type { AdminPermission } from '@rythmo/engine';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  ShieldCheck,
  Sun,
  Tag,
  Ticket,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { cx } from '@/lib/cx';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/hooks';
import { Avatar } from '../ui/surfaces';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: AdminPermission;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, permission: 'dashboard:read', end: true },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users, permission: 'users:read' },
  { to: '/offres', label: 'Offres et prix', icon: Tag, permission: 'pricing:read' },
  { to: '/promotions', label: 'Promotions', icon: Ticket, permission: 'promotions:read' },
  { to: '/audit', label: 'Journal d’audit', icon: ScrollText, permission: 'audit:read' },
  { to: '/administrateurs', label: 'Administrateurs', icon: ShieldCheck, permission: 'admins:manage' },
];

const ROLE_LABELS = { owner: 'Propriétaire', manager: 'Gestionnaire', support: 'Support', analyst: 'Analyste' } as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <svg viewBox="0 0 48 48" className="size-9" role="img" aria-label="Rythmo">
        <rect width="48" height="48" rx="13" fill="#1E40AF" />
        <rect x="10" y="22" width="5.5" height="14" rx="2.75" fill="#93B4FF" />
        <rect x="18.2" y="15" width="5.5" height="21" rx="2.75" fill="#FFFFFF" />
        <rect x="26.4" y="11" width="5.5" height="25" rx="2.75" fill="#FFFFFF" />
        <rect x="34.6" y="19" width="5.5" height="17" rx="2.75" fill="#FBBF24" />
      </svg>
      <div className="leading-tight">
        <p className="text-base font-extrabold text-ink">Rythmo</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Back-office</p>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { admin, can, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  if (!admin) return null;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1">
        {NAV.filter((item) => can(item.permission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line pt-4">
        <NavLink
          to="/compte"
          onClick={onNavigate}
          className={({ isActive }) =>
            cx('flex items-center gap-3 rounded-xl px-2 py-2 transition-colors', isActive ? 'bg-primary-soft' : 'hover:bg-surface-2')
          }
        >
          <Avatar name={admin.displayName} size="sm" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-bold text-ink">{admin.displayName}</span>
            <span className="block truncate text-xs text-ink-3">{ROLE_LABELS[admin.role]}</span>
          </span>
          <UserCircle className="size-4 text-ink-3" aria-hidden="true" />
        </NavLink>
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          {theme === 'dark' ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
          {theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Aller au contenu
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="inline-flex size-9 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2">
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Brand />
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-in bg-surface shadow-pop" aria-label="Menu">
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-xl text-ink-2 hover:bg-surface-2">
              <X className="size-5" aria-hidden="true" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main id="contenu" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
