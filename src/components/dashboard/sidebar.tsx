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
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sidebar-foreground/5 p-1">
            <Image src="/logo.png" alt="Logo" width={22} height={22} className="object-contain" />
          </div>
          <span className="font-display truncate text-base font-medium text-sidebar-foreground">
            {enterprise?.nom || 'GestiBulder'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-6">
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
                'group relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-sidebar-primary" />
              )}
              <item.icon size={17} strokeWidth={1.75} className="shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-sidebar-border p-3">
        <Link
          href="/dashboard/settings"
          onClick={() => setIsOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors duration-150',
            pathname === '/dashboard/settings'
              ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <Settings size={17} strokeWidth={1.75} />
          <span>Paramètres</span>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 rounded-sm px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut size={17} strokeWidth={1.75} />
          <span>Déconnexion</span>
        </Button>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
