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
    const changeFont = (font: string | null) => {
      console.info('[Font] font updated: ', font);
      if (!font) return;
      document.body.style.setProperty('font-family', font, 'important');
      document.body.style.setProperty('--font-family', font, 'important');
    };
    const changeFontSize = (fontSize: number | null) => {
      console.info('[Font] font size updated: ', fontSize);
      if (!fontSize) return;
      document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
    };

    const unsubscribe: (() => void)[] = [ipcService.systemSettings.font.get(changeFont), ipcService.systemSettings.fontSize.get(changeFontSize)];
    return () => unsubscribe.forEach((unsub) => unsub());
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
