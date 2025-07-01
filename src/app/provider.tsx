'use client';

import React, { useEffect } from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';
import LoadingProvider from '@/providers/Loading';
import i18n, { LanguageKey } from '@/i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    const language = localStorage.getItem('language') as LanguageKey;
    if (language) i18n.changeLanguage(language);
  }, []);

  return (
    <ThemeProvider>
      <SocketProvider>
        <MainTabProvider>
          <LoadingProvider>
            <ContextMenuProvider>{children}</ContextMenuProvider>
          </LoadingProvider>
        </MainTabProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
