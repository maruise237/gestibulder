'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Menu, ChevronDown, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
        'lg:ml-64',
        isScrolled
          ? 'h-14 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl'
          : 'h-16 bg-transparent'
      )}
      suppressHydrationWarning
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 text-muted-foreground lg:hidden"
        >
          <Menu size={18} />
        </Button>
        <div className="flex min-w-0 items-center gap-4">
          {pathname.startsWith('/dashboard') && <ProjectSelector />}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative text-muted-foreground hover:text-primary"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <span className="text-xs font-medium text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => markAllMutation.mutate()}
                  className="h-auto gap-1 p-0 text-xs font-medium"
                >
                  <CheckCheck size={12} /> Tout lire
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {!notifData || notifData.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
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
                    <p className="text-sm font-medium text-foreground leading-tight">{notif.titre}</p>
                    {notif.message && (
                      <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{notif.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-1 h-5 w-[1px] bg-border" />

        <Button
          variant="ghost"
          className="h-auto gap-2 rounded-sm border border-transparent py-1 pr-1 pl-1.5"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm bg-secondary text-xs font-medium text-secondary-foreground">
            {mounted && userProfile?.nom_complet ? (
              userProfile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={14} />
            )}
          </div>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="flex items-center gap-1 text-[13px] leading-none font-medium text-foreground">
              {mounted && userProfile?.nom_complet ? userProfile.nom_complet : 'User'}
              <ChevronDown size={10} className="text-muted-foreground" />
            </span>
          </div>
        </Button>
      </div>
    </header>
  );
});
Topbar.displayName = 'Topbar';
