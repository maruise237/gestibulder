'use client';

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/server/auth.actions';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Truck,
  Clock,
  Package,
  Calculator,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chantiers', href: '/dashboard/chantiers', icon: HardHat },
  { name: 'Ouvriers', href: '/dashboard/ouvriers', icon: Users },
  { name: 'Stocks & Matériaux', href: '/dashboard/stocks', icon: Package },
  { name: 'Parc Équipements', href: '/dashboard/equipements', icon: Truck },
  { name: 'Équipe Admin', href: '/dashboard/team', icon: Users },
  { name: 'Pointage & RH', href: '/dashboard/pointage', icon: Clock },
  { name: 'Finances', href: '/dashboard/budget', icon: Calculator },
  { name: 'Planning', href: '/dashboard/planning', icon: Calendar },
];

export const Sidebar = memo(({
  isOpen,
  setIsOpen,
  enterprise,
}: {
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
  enterprise?: any;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefetchData = (key: string) => {
    if (key === 'projects') {
      queryClient.prefetchQuery({
        queryKey: ['projects'],
        queryFn: async () => {
          const result = await getProjects();
          return result.projects || [];
        },
        staleTime: 1000 * 60 * 5,
      });
    } else if (key === 'workers') {
      queryClient.prefetchQuery({
        queryKey: ['workers', 1],
        queryFn: async () => {
          const result = await getWorkers(1, 10);
          return result;
        },
        staleTime: 1000 * 60 * 5,
      });
    } else if (key === 'budget') {
      queryClient.prefetchQuery({
        queryKey: ['budget-data'],
        queryFn: async () => {
          const data = await getBudgetData();
          return { projects: data.projects || [], expenses: data.expenses || [] };
        },
        staleTime: 1000 * 60 * 5,
      });
    }
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      router.push('/auth/login');
    }
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-border bg-card shadow-sm transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      suppressHydrationWarning
    >
      {/* Mobile Close Button */}
      <button
        onClick={() => setIsOpen?.(false)}
        className="absolute top-10 right-4 flex h-11 w-11 items-center justify-center rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground lg:hidden"
      >
        <X size={20} />
      </button>

      {/* Logo Section */}
      <div className="p-fluid-lg pb-8">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="rounded-md bg-primary p-2.5 text-primary-foreground shadow-lg shadow-primary/20 transition-all group-hover:scale-105 active:scale-95">
            <HardHat size={26} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl leading-none font-semibold tracking-tight text-foreground">
              {mounted && enterprise?.nom ? enterprise.nom : 'GestiBulder'}
            </span>
            <span className="mt-1.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
              BTP OS 2026
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Search Trigger */}
      <div className="mb-6 px-fluid-lg">
        <button className="flex h-11 w-full items-center gap-3 rounded-md border border-border bg-muted/50 px-4 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:bg-muted">
          <Search size={14} />
          <span>Recherche rapide...</span>
          <span className="ml-auto rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ⌘K
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-fluid-md">
        <div className="mb-4 px-2">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Menu Principal
          </span>
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen?.(false)}
              onMouseEnter={() => {
                if (item.href === '/dashboard/chantiers') prefetchData('projects');
                if (item.href === '/dashboard/ouvriers') prefetchData('workers');
                if (item.href === '/dashboard/budget') prefetchData('budget');
              }}
              className={cn(
                'group flex items-center justify-between rounded-md px-4 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-primary'
              )}
            >
              <div className="flex items-center gap-3.5">
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'transition-transform',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span className="text-[13px] tracking-tight">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-primary-foreground/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-2 p-fluid-lg pt-4">
        <div className="mb-2 px-2">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Compte
          </span>
        </div>
        <Link
          href="/dashboard/settings"
          onClick={() => setIsOpen?.(false)}
          className={cn(
            'flex items-center gap-3.5 rounded-md px-4 py-2.5 text-[13px] font-semibold transition-all duration-200',
            pathname === '/dashboard/settings'
              ? 'border border-border bg-muted text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-primary'
          )}
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </Link>
        <button
          className="flex w-full items-center gap-3.5 rounded-md border border-transparent px-4 py-2.5 text-[13px] font-semibold text-destructive transition-all duration-200 hover:border-destructive/10 hover:bg-destructive/5 active:scale-95"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
});
