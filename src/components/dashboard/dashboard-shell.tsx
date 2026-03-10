'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  userProfile: any;
  enterprise: any;
}

import { Providers } from '@/components/providers';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function DashboardShell({ children, userProfile, enterprise }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Providers enterprise={enterprise} userProfile={userProfile}>
      <div
        className="font-inter flex min-h-screen overflow-x-hidden bg-zinc-50/50"
        suppressHydrationWarning
      >
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} enterprise={enterprise} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <Topbar onMenuClick={() => setSidebarOpen(true)} userProfile={userProfile} />

          {/* Page Content */}
          <main className={cn('flex-1 transition-all duration-300', 'lg:ml-72')}>
            {mounted ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
                {children}
              </div>
            )}
          </main>

          <footer
            className={cn(
              'border-t border-zinc-100/60 bg-white/50 px-4 py-10 transition-all duration-300 sm:px-6 lg:px-10',
              'lg:ml-72'
            )}
          >
            <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 sm:flex-row">
              <span className="text-center text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase sm:text-left">
                © {new Date().getFullYear()} {mounted && enterprise?.nom ? enterprise.nom : 'GestiBulder'} — Built for Builders
              </span>
              <div className="flex items-center gap-6">
                <span className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-colors hover:text-zinc-950">
                  Privacy
                </span>
                <span className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-colors hover:text-zinc-950">
                  Terms
                </span>
                <span className="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-colors hover:text-zinc-950">
                  Support
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Providers>
  );
}
