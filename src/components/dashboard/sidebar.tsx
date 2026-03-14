'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HardHat,
  Users,
  Wallet,
  Package,
  Truck,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/server/auth.actions';
import { useQueryClient } from '@tanstack/react-query';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import Image from 'next/image';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chantiers', href: '/dashboard/chantiers', icon: HardHat },
  { name: 'Ouvriers', href: '/dashboard/ouvriers', icon: Users },
  { name: 'Stocks', href: '/dashboard/stocks', icon: Package },
  { name: 'Équipements', href: '/dashboard/equipements', icon: Truck },
  { name: 'Équipe', href: '/dashboard/team', icon: Shield },
  { name: 'Pointage', href: '/dashboard/pointage', icon: Calendar },
  { name: 'Finances', href: '/dashboard/budget', icon: Wallet },
];

export const Sidebar = memo(({
  isOpen,
  setIsOpen,
  enterprise,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  enterprise?: any;
}) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
  };

  const prefetchData = (key: string) => {
    if (key === 'projects') queryClient.prefetchQuery({ queryKey: ['projects'], queryFn: getProjects });
    if (key === 'workers') queryClient.prefetchQuery({ queryKey: ['workers', 1, ''], queryFn: () => getWorkers(1, 8) });
    if (key === 'budget') queryClient.prefetchQuery({ queryKey: ['budget-data'], queryFn: () => getBudgetData() });
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white p-1 shadow-sm border border-border">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-size-sm font-semibold tracking-tight text-foreground">
              {enterprise?.nom || 'GestiBulder'}
            </span>
            <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
              GESTIBULDER
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                setIsOpen(false);
                if (item.href === '/dashboard/chantiers') prefetchData('projects');
                if (item.href === '/dashboard/ouvriers') prefetchData('workers');
                if (item.href === '/dashboard/budget') prefetchData('budget');
              }}
              className={cn(
                'group flex items-center justify-between rounded-md px-3 py-2 transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-primary'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'transition-transform',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span className="text-[13px] font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={12} className="text-primary-foreground/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/dashboard/settings"
          onClick={() => setIsOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200',
            pathname === '/dashboard/settings'
              ? 'bg-muted text-primary border border-border'
              : 'text-muted-foreground hover:bg-muted hover:text-primary'
          )}
        >
          <Settings size={18} />
          <span>Paramètres</span>
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-destructive transition-all duration-200 hover:border-destructive/10 hover:bg-destructive/5 active:scale-95"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
