'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { changeLanguage, i18nReady } from '@/i18n';

import Logger from '@/utils/logger';

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
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    i18nReady.then(() => setI18nLoaded(true));
  }, []);

  useEffect(() => {
    const changeFont = (font: string | null) => {
      new Logger('Font').info(`Font updated: ${font}`);
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
      new Logger('Font').info(`Font size updated: ${fontSize}`);
      if (!fontSize) return;
      document.body.style.setProperty('font-size', `${fontSize}px`, 'important');
    };
    changeFontSize(ipc.systemSettings.fontSize.get());
    const unsub = ipc.systemSettings.fontSize.onUpdate(changeFontSize);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeTheme = (theme: Types.Theme | null) => {
      new Logger('Theme').info(`Theme updated: ${theme}`);
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
    const changeLang = (language: Types.LanguageKey) => {
      new Logger('Language').info(`Language updated: ${language}`);
      if (!language) return;
      changeLanguage(language);
    };
    changeLang(ipc.systemSettings.language.get());
    const unsub = ipc.systemSettings.language.onUpdate(changeLang);
    return () => unsub();
  }, []);

  if (!i18nLoaded) return null;

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
