import React, { useContext, createContext, ReactNode, useState, useMemo, useCallback } from 'react';

interface MainTabContextType {
  selectTab: (tabId: 'home' | 'friends' | 'server') => void;
  selectedTabId: 'home' | 'friends' | 'server';
}

const MainTabContext = createContext<MainTabContextType | null>(null);

export const useMainTab = (): MainTabContextType => {
  const context = useContext(MainTabContext);
  if (!context) throw new Error('useMainTab must be used within a MainTabProvider');
  return context;
};

interface MainTabProviderProps {
  children: ReactNode;
}

const MainTabProvider = ({ children }: MainTabProviderProps) => {
  // States
  const [selectedTabId, setSelectedTabId] = useState<'home' | 'friends' | 'server'>('home');

  // Functions
  const selectTab = useCallback((tabId: 'home' | 'friends' | 'server') => {
    setSelectedTabId(tabId);
  }, []);

  const contextValue = useMemo(() => ({ selectTab, selectedTabId }), [selectTab, selectedTabId]);

  return <MainTabContext.Provider value={contextValue}>{children}</MainTabContext.Provider>;
};

MainTabProvider.displayName = 'MainTabProvider';

export default MainTabProvider;
