'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface AppContextType {
  enterprise: any;
  userProfile: any;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gestibulder_selected_project');
    if (saved) {
      setSelectedProjectId(saved);
    }
  }, []);

  const handleSetSelectedProjectId = (id: string | null) => {
    setSelectedProjectId(id);
    if (id) {
      localStorage.setItem('gestibulder_selected_project', id);
    } else {
      localStorage.removeItem('gestibulder_selected_project');
    }
  };

  return (
    <AppContext.Provider
      value={{
        enterprise,
        userProfile,
        selectedProjectId,
        setSelectedProjectId: handleSetSelectedProjectId,
      }}
    >
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
