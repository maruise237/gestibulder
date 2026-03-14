'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Menu, ChevronDown, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectSelector } from './project-selector';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllAsRead } from '@/lib/server/notification.actions';

export const Topbar = memo(({
  onMenuClick,
  userProfile,
}: {
  onMenuClick?: () => void;
  userProfile?: any;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await getNotifications();
      return res.notifications || [];
    },
    refetchInterval: 30000, // rafraîchir toutes les 30s
  });

  const unreadCount = notifData?.filter((n: any) => !n.lu).length || 0;

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8',
        'lg:ml-72',
        isScrolled
          ? 'h-14 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl'
          : 'h-16 bg-transparent'
      )}
      suppressHydrationWarning
    >
      <div className="flex max-w-2xl flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background p-1 text-muted-foreground transition-all hover:bg-muted active:scale-95 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-4">
          {pathname.startsWith('/dashboard') && <ProjectSelector />}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notifications */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-background shadow-elevated overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
                    >
                      <CheckCheck size={12} /> Tout lire
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {!notifData || notifData.length === 0 ? (
                    <div className="p-6 text-center text-[10px] font-medium text-muted-foreground italic">
                      Aucune notification.
                    </div>
                  ) : (
                    notifData.slice(0, 10).map((notif: any) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-3 transition-colors hover:bg-muted/30',
                          !notif.lu && 'bg-primary/5 border-l-2 border-l-primary'
                        )}
                      >
                        <p className="text-[11px] font-bold text-foreground leading-tight">{notif.titre}</p>
                        {notif.message && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{notif.message}</p>
                        )}
                        <p className="mt-1 text-[9px] font-semibold text-muted-foreground uppercase">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mx-1 h-5 w-[1px] bg-border" />

        <button className="group flex items-center gap-2 rounded-md border border-transparent py-1 pr-1 pl-1.5 transition-all hover:bg-muted active:scale-95">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-primary text-[10px] font-semibold text-primary-foreground shadow-sm transition-transform group-hover:rotate-3">
            {mounted && userProfile?.nom_complet ? (
              userProfile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={14} />
            )}
          </div>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="flex items-center gap-1 text-[12px] leading-none font-semibold text-foreground">
              {mounted && userProfile?.nom_complet ? userProfile.nom_complet : 'User'}
              <ChevronDown size={10} className="text-muted-foreground" />
            </span>
          </div>
        </button>
      </div>
    </header>
  );
});
Topbar.displayName = 'Topbar';
