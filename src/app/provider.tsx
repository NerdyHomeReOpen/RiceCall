'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { changeLanguage, i18nReady } from '@/i18n';

import { store } from '@/store';

import ContextMenuProvider from '@/providers/ContextMenu';
import LoadingProvider from '@/providers/Loading';
import SoundPlayerProvider from '@/providers/SoundPlayer';
import ImageViewerProvider from '@/providers/ImageViewer';
import InAppPopupProvider from '@/providers/InAppPopup';

interface ProvidersProps {
  children: React.ReactNode;
}

const ProvidersComponent = ({ children }: ProvidersProps) => {
  const [i18nIsLoaded, setI18nIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    i18nReady.then(() => setI18nIsLoaded(true));
  }, []);

  useEffect(() => {
    const handleFontChange = (font: string | null) => {
      if (!font) return;
      document.body.style.setProperty('font-family', font, 'important');
      document.body.style.setProperty('--font-family', font, 'important');
    };

    handleFontChange(ipc.systemSettings.font.get());
    const unsub = ipc.systemSettings.font.onUpdate(handleFontChange);

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleFontSizeChange = (fontSize: number | null) => {
      if (!fontSize) return;
      document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
    };

    handleFontSizeChange(ipc.systemSettings.fontSize.get());
    const unsub = ipc.systemSettings.fontSize.onUpdate(handleFontSizeChange);

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleThemeChange = (theme: Types.Theme | null) => {
      if (!theme) return;
      document.body.style.setProperty('--header-image', theme.headerImage, 'important');
      document.body.style.setProperty('--main-color', theme.mainColor, 'important');
      document.body.style.setProperty('--secondary-color', theme.secondaryColor, 'important');
    };

    handleThemeChange(ipc.customThemes.current.get());
    const unsub = ipc.customThemes.current.onUpdate(handleThemeChange);

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleLanguageChange = (language: Types.LanguageKey) => {
      if (!language) return;
      changeLanguage(language);
    };

    handleLanguageChange(ipc.systemSettings.language.get());
    const unsub = ipc.systemSettings.language.onUpdate(handleLanguageChange);

    return () => unsub();
  }, []);

  if (!i18nIsLoaded) return null;

  return (
    <Provider store={store}>
      <LoadingProvider>
        <ContextMenuProvider>
          <SoundPlayerProvider>
            <ImageViewerProvider>
              <InAppPopupProvider>{children}</InAppPopupProvider>
            </ImageViewerProvider>
          </SoundPlayerProvider>
        </ContextMenuProvider>
      </LoadingProvider>
    </Provider>
  );
};

ProvidersComponent.displayName = 'ProvidersComponent';

const Providers = dynamic(() => Promise.resolve(ProvidersComponent), { ssr: false });

export default Providers;
