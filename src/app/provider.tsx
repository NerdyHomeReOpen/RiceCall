'use client';

import React from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import LanguageProvider from '@/providers/Language';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';
import LoadingProvider from '@/providers/Loading';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SocketProvider>
          <MainTabProvider>
            <LoadingProvider>
              <ContextMenuProvider>{children}</ContextMenuProvider>
            </LoadingProvider>
          </MainTabProvider>
        </SocketProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
