import React, { useContext, createContext, ReactNode, useState } from 'react';

interface MainTabContextType {
  setSelectedTabId: (tabId: 'home' | 'friends' | 'server') => void;
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

  return <MainTabContext.Provider value={{ setSelectedTabId, selectedTabId }}>{children}</MainTabContext.Provider>;
};

MainTabProvider.displayName = 'MainTabProvider';

export default MainTabProvider;
