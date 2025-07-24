'use client';

import React, { useEffect } from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';
import LoadingProvider from '@/providers/Loading';
import SoundPlayerProvider from '@/providers/SoundPlayer';

// services
import ipcService from '@/services/ipc.service';

// utilities
import { setupLanguage } from '@/utils/language';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    setupLanguage();
  }, []);

  useEffect(() => {
    const setFont = (font: string | null) => {
      if (!font) return;
      document.body.style.setProperty('font-family', font, 'important');
      document.body.style.setProperty('--font-family', font, 'important');
    };

    const setFontSize = (fontSize: number | null) => {
      if (!fontSize) return;
      document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
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
            <ContextMenuProvider>
              <SoundPlayerProvider>{children}</SoundPlayerProvider>
            </ContextMenuProvider>
          </LoadingProvider>
        </MainTabProvider>
      </SocketProvider>
    </ThemeProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
