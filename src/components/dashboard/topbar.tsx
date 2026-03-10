'use client';

import React, { useEffect, useState, memo } from 'react';
import { User, Bell, Search, Menu, Loader2, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
        'sticky top-0 z-30 flex h-20 items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-10',
        'lg:ml-72',
        isScrolled
          ? 'h-16 border-b border-zinc-100 bg-white/80 shadow-sm backdrop-blur-xl'
          : 'h-20 bg-transparent'
      )}
      suppressHydrationWarning
    >
      <div className="flex max-w-2xl flex-1 items-center gap-4 sm:gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-transparent p-2 text-zinc-500 transition-all hover:border-zinc-200 hover:bg-zinc-100 active:scale-95 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Visual Search Indicator */}
        <div className="hidden text-[11px] font-black tracking-widest text-zinc-400 uppercase sm:block">
          Dashboard / <span className="text-indigo-600">Vue d'ensemble</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-all hover:border-zinc-200 hover:bg-zinc-100 hover:text-indigo-600 active:scale-95">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 animate-pulse rounded-full border-2 border-white bg-indigo-500 ring-2 ring-indigo-100" />
        </button>

        <div className="mx-2 h-6 w-[1px] bg-zinc-200" />

        {/* Profile */}
        <button className="group flex items-center gap-3 rounded-2xl border border-transparent py-1 pr-1 pl-2 transition-all hover:border-zinc-100 hover:bg-zinc-50 active:scale-95">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-indigo-600 text-xs font-black text-white shadow-lg shadow-indigo-200 transition-transform group-hover:rotate-3">
            {mounted && profile?.nom_complet ? (
              profile.nom_complet.charAt(0).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="flex hidden flex-col items-start text-left sm:flex">
            <span className="flex items-center gap-1.5 text-[13px] leading-none font-black text-zinc-900">
              {mounted && profile?.nom_complet ? profile.nom_complet : 'Utilisateur'}
              <ChevronDown
                size={12}
                className="text-zinc-400 transition-colors group-hover:text-indigo-600"
              />
            </span>
            <span className="mt-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              {mounted && profile?.role ? profile.role : 'Chargement...'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
});
