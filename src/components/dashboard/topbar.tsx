'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Topbar = memo(({
  onMenuClick,
  userProfile,
}: {
  onMenuClick?: () => void;
  userProfile?: any;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const profile = userProfile;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 transition-all sm:px-6 lg:px-8',
        'lg:ml-72'
      )}
      suppressHydrationWarning
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Path Indicator */}
        <div className="hidden text-sm font-medium text-muted-foreground sm:block">
          Tableau de bord
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary" />
        </Button>

        <div className="mx-2 h-4 w-[1px] bg-border" />

        {/* Profile */}
        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto font-medium">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
            {mounted && profile?.nom_complet ? (
              profile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={14} />
            )}
          </div>
          <span className="hidden text-sm sm:inline-block">
            {mounted && profile?.nom_complet ? profile.nom_complet : 'Utilisateur'}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
});
