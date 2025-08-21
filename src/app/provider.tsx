'use client';

import React, { useCallback, useEffect } from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import ThemeProvider from '@/providers/Theme';
import LoadingProvider from '@/providers/Loading';
import SoundPlayerProvider from '@/providers/SoundPlayer';

// services
import ipc from '@/services/ipc.service';

// utilities
import { setupLanguage } from '@/utils/language';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  // Handlers
  const handleEditFont = useCallback((font: string | null) => {
    console.info('[Font] font updated: ', font);
    if (!font) return;
    document.body.style.setProperty('font-family', font, 'important');
    document.body.style.setProperty('--font-family', font, 'important');
  }, []);

  const handleEditFontSize = useCallback((fontSize: number | null) => {
    console.info('[Font] font size updated: ', fontSize);
    if (!fontSize) return;
    document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
  }, []);

  // Effects
  useEffect(() => {
    setupLanguage();
  }, []);

  useEffect(() => {
    const unsubscribe = [ipc.systemSettings.font.get(handleEditFont), ipc.systemSettings.fontSize.get(handleEditFontSize)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditFont, handleEditFontSize]);

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
