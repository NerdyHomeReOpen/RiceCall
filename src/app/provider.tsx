'use client';

import React, { useEffect } from 'react';
import i18n from '@/i18n';

// Providers
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import LoadingProvider from '@/providers/Loading';
import SoundPlayerProvider from '@/providers/SoundPlayer';
import ImageViewerProvider from '@/providers/ImageViewer';

// Services
import ipc from '@/ipc';

// Types
import { Theme, LanguageKey } from '@/types';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  // Effects
  useEffect(() => {
    const changeFont = (font: string | null) => {
      console.info('[Font] font updated: ', font);
      if (!font) return;
      document.body.style.setProperty('font-family', font, 'important');
      document.body.style.setProperty('--font-family', font, 'important');
    };
    changeFont(ipc.systemSettings.font.get());
    const unsub = ipc.systemSettings.font.onUpdate(changeFont);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeFontSize = (fontSize: number | null) => {
      console.info('[Font] font size updated: ', fontSize);
      if (!fontSize) return;
      document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
    };
    changeFontSize(ipc.systemSettings.fontSize.get());
    const unsub = ipc.systemSettings.fontSize.onUpdate(changeFontSize);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeTheme = (theme: Theme | null) => {
      console.info('[Theme] theme updated: ', theme);
      if (!theme) return;
      document.body.style.setProperty('--header-image', theme.headerImage, 'important');
      document.body.style.setProperty('--main-color', theme.mainColor, 'important');
      document.body.style.setProperty('--secondary-color', theme.secondaryColor, 'important');
    };
    changeTheme(ipc.customThemes.current.get());
    const unsub = ipc.customThemes.current.onUpdate(changeTheme);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeLanguage = (language: LanguageKey) => {
      console.info('[Language] language updated: ', language);
      if (!language) return;
      i18n.changeLanguage(language);
    };
    changeLanguage(ipc.language.get());
    const unsub = ipc.language.onUpdate(changeLanguage);
    return () => unsub();
  }, []);

  return (
    <MainTabProvider>
      <LoadingProvider>
        <ContextMenuProvider>
          <SoundPlayerProvider>
            <ImageViewerProvider>{children}</ImageViewerProvider>
          </SoundPlayerProvider>
        </ContextMenuProvider>
      </LoadingProvider>
    </MainTabProvider>
  );
};

Providers.displayName = 'Providers';

export default Providers;
