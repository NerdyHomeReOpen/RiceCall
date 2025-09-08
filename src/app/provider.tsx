'use client';

import React, { useCallback, useEffect } from 'react';
import i18n, { LanguageKey } from '@/i18n';

// Providers
import ContextMenuProvider from '@/providers/ContextMenu';
import MainTabProvider from '@/providers/MainTab';
import LoadingProvider from '@/providers/Loading';
import SoundPlayerProvider from '@/providers/SoundPlayer';

// services
import ipc from '@/services/ipc.service';

// utilities
import { getLangByIp } from '@/utils/language';
import { Theme } from '@/types';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  // Handlers
  const handleFontChange = useCallback((font: string | null) => {
    console.info('[Font] font updated: ', font);
    if (!font) return;
    document.body.style.setProperty('font-family', font, 'important');
    document.body.style.setProperty('--font-family', font, 'important');
  }, []);

  const handleFontSizeChange = useCallback((fontSize: number | null) => {
    console.info('[Font] font size updated: ', fontSize);
    if (!fontSize) return;
    document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
  }, []);

  const handleThemeChange = useCallback((theme: Theme | null) => {
    console.info('[Theme] theme updated: ', theme);
    if (!theme) return;
    document.body.style.setProperty('--header-image', theme.headerImage, 'important');
    document.body.style.setProperty('--main-color', theme.mainColor, 'important');
    document.body.style.setProperty('--secondary-color', theme.secondaryColor, 'important');
  }, []);

  // Effects
  useEffect(() => {
    handleFontChange(ipc.systemSettings.font.get());
    handleFontSizeChange(ipc.systemSettings.fontSize.get());
    handleThemeChange(ipc.customThemes.current.get());

    const unsubscribe = [ipc.systemSettings.font.onUpdate(handleFontChange), ipc.systemSettings.fontSize.onUpdate(handleFontSizeChange), ipc.customThemes.current.onUpdate(handleThemeChange)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleFontChange, handleFontSizeChange, handleThemeChange]);

  useEffect(() => {
    const setupLanguage = async () => {
      const language = (ipc.language.get() || (await getLangByIp())) as LanguageKey;
      ipc.language.set(language);
      i18n.changeLanguage(language);
    };
    setupLanguage();
  }, []);

  return (
    <MainTabProvider>
      <LoadingProvider>
        <ContextMenuProvider>
          <SoundPlayerProvider>{children}</SoundPlayerProvider>
        </ContextMenuProvider>
      </LoadingProvider>
    </MainTabProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
