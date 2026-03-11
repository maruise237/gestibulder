'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface DashboardShellProps {
  children: React.ReactNode;
  userProfile: any;
  enterprise: any;
}

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
        className="flex min-h-screen overflow-x-hidden bg-background"
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
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="mx-auto max-w-7xl p-fluid-sm sm:p-fluid-md"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="mx-auto max-w-7xl p-fluid-sm sm:p-fluid-md">
                {children}
              </div>
            )}
          </main>

          <footer
            className={cn(
              'border-t border-border bg-card/50 px-4 py-6 transition-all duration-300 sm:px-6 lg:px-8',
              'lg:ml-72'
            )}
          >
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
              <span className="text-center text-[9px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-left">
                © {new Date().getFullYear()} {mounted && enterprise?.nom ? enterprise.nom : 'GestiBulder'}
              </span>
              <div className="flex items-center gap-4">
                <span className="cursor-pointer text-[9px] font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary">
                  Support
                </span>
                <span className="cursor-pointer text-[9px] font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary">
                  Terms
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Providers>
  );
}
