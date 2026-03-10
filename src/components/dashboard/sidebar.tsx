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
        'fixed top-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-zinc-100 bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      suppressHydrationWarning
    >
      {/* Mobile Close Button */}
      <button
        onClick={() => setIsOpen?.(false)}
        className="absolute top-10 right-4 rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-50 hover:text-zinc-950 lg:hidden"
      >
        <X size={20} />
      </button>

      {/* Logo Section */}
      <div className="p-10 pb-8">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-100 transition-all group-hover:scale-105 active:scale-95">
            <HardHat size={26} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl leading-none font-black tracking-tight text-zinc-950">
              {mounted && enterprise?.nom ? enterprise.nom : 'GestiBulder'}
            </span>
            <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-indigo-600/60 text-zinc-400 uppercase">
              BTP OS 2026
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Search Trigger (Visual only for now) */}
      <div className="mb-6 px-10">
        <button className="flex h-10 w-full items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 text-[11px] font-black tracking-widest text-zinc-400 uppercase transition-colors hover:bg-zinc-100">
          <Search size={14} />
          <span>Recherche rapide...</span>
          <span className="ml-auto rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
            ⌘K
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-8">
        <div className="mb-4 px-2">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
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
                'group flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-200',
                isActive
                  ? 'scale-[1.02] bg-indigo-600 font-black text-white shadow-xl shadow-indigo-100'
                  : 'font-bold text-zinc-500 hover:bg-zinc-50 hover:text-indigo-600'
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
              {isActive && <ChevronRight size={14} className="text-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-2 p-8 pt-4">
        <div className="mb-2 px-2">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
            Compte
          </span>
        </div>
        <Link
          href="/dashboard/settings"
          onClick={() => setIsOpen?.(false)}
          className={cn(
            'flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[13px] font-black transition-all duration-200',
            pathname === '/dashboard/settings'
              ? 'border border-zinc-200 bg-zinc-100 text-indigo-600'
              : 'text-zinc-500 hover:bg-zinc-50 hover:text-indigo-600'
          )}
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </Link>
        <button
          className="flex w-full items-center gap-3.5 rounded-2xl border border-transparent px-4 py-3 text-[13px] font-black text-red-500 transition-all duration-200 hover:border-red-100 hover:bg-red-50 active:scale-95"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
});
