'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectSelector } from './project-selector';
import { usePathname } from 'next/navigation';

export const Topbar = memo(({
  onMenuClick,
  userProfile,
}: {
  onMenuClick?: () => void;
  userProfile?: any;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const profile = userProfile;

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
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background p-1 text-muted-foreground transition-all hover:bg-muted active:scale-95 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Centralized Project Selector - Only on Dashboard */}
        <div className="flex items-center gap-4">
           {pathname === '/dashboard' && <ProjectSelector />}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-95">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        </button>

        <div className="mx-1 h-5 w-[1px] bg-border" />

        {/* Profile */}
        <button className="group flex items-center gap-2 rounded-md border border-transparent py-1 pr-1 pl-1.5 transition-all hover:bg-muted active:scale-95">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-primary text-[10px] font-semibold text-primary-foreground shadow-sm transition-transform group-hover:rotate-3">
            {mounted && profile?.nom_complet ? (
              profile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={14} />
            )}
          </div>
          <div className="flex hidden flex-col items-start text-left sm:flex">
            <span className="flex items-center gap-1 text-[12px] leading-none font-semibold text-foreground">
              {mounted && profile?.nom_complet ? profile.nom_complet : 'User'}
              <ChevronDown size={10} className="text-muted-foreground" />
            </span>
          </div>
        </button>
      </div>
    </header>
  );
});
Topbar.displayName = 'Topbar';
