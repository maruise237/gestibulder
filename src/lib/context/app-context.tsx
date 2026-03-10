'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface AppContextType {
  enterprise: any;
  userProfile: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
  children,
  enterprise,
  userProfile,
}: {
  children: ReactNode;
  enterprise: any;
  userProfile: any;
}) {
  return (
    <AppContext.Provider value={{ enterprise, userProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
