'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from '@/lib/context/app-context';
import { Tooltip } from '@base-ui/react/tooltip';

export function Providers({
  children,
  enterprise,
  userProfile,
}: {
  children: React.ReactNode;
  enterprise: any;
  userProfile: any;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider>
        <AppProvider enterprise={enterprise} userProfile={userProfile}>
          {children}
        </AppProvider>
      </Tooltip.Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
