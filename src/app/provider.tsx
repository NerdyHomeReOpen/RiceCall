'use client';

import React, { useEffect } from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';
import LoadingProvider from '@/providers/Loading';
import i18n, { LanguageKey } from '@/i18n';

// services
import ipcService from '@/services/ipc.service';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    const language = localStorage.getItem('language') as LanguageKey;
    if (language) i18n.changeLanguage(language);
  }, []);

  useEffect(() => {
    const setFont = (font: string | null) => {
      if (!font) return;
      console.log('font', font);
      document.body.style.fontFamily = font;
    };

    const setFontSize = (fontSize: number | null) => {
      if (!fontSize) return;
      // document.body.style.fontSize = `${fontSize}px`;
    };

    ipcService.systemSettings.font.get(setFont);
    ipcService.systemSettings.font.onUpdate(setFont);
    ipcService.systemSettings.fontSize.get(setFontSize);
    ipcService.systemSettings.fontSize.onUpdate(setFontSize);
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
