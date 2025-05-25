'use client';

import React from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import LanguageProvider from '@/providers/Language';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SocketProvider>
          <MainTabProvider>
            <ContextMenuProvider>{children}</ContextMenuProvider>
          </MainTabProvider>
        </SocketProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
