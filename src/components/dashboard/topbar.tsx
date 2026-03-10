'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        'sticky top-0 z-30 flex items-center justify-between px-fluid-md transition-all duration-300 sm:px-fluid-lg lg:px-fluid-xl',
        'lg:ml-72',
        isScrolled
          ? 'h-16 border-b border-border bg-background/80 shadow-sm backdrop-blur-xl'
          : 'h-20 bg-transparent'
      )}
      suppressHydrationWarning
    >
      <div className="flex max-w-2xl flex-1 items-center gap-fluid-sm">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-transparent p-2 text-muted-foreground transition-all hover:border-border hover:bg-muted active:scale-95 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Visual Search Indicator */}
        <div className="hidden text-[11px] font-semibold tracking-widest text-muted-foreground uppercase sm:block">
          Dashboard / <span className="text-primary">Vue d'ensemble</span>
        </div>
      </div>

      <div className="flex items-center gap-fluid-sm">
        {/* Notifications */}
        <button className="group relative flex h-11 w-11 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-primary active:scale-95">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 animate-pulse rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
        </button>

        <div className="mx-2 h-6 w-[1px] bg-border" />

        {/* Profile */}
        <button className="group flex items-center gap-3 rounded-md border border-transparent py-1 pr-1 pl-2 transition-all hover:border-border hover:bg-muted active:scale-95">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-primary text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:rotate-3">
            {mounted && profile?.nom_complet ? (
              profile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="flex hidden flex-col items-start text-left sm:flex">
            <span className="flex items-center gap-1.5 text-[13px] leading-none font-semibold text-foreground">
              {mounted && profile?.nom_complet ? profile.nom_complet : 'Utilisateur'}
              <ChevronDown
                size={12}
                className="text-muted-foreground transition-colors group-hover:text-primary"
              />
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {mounted && profile?.role ? profile.role : 'Chargement...'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
});
