'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { buildPopup } from '@/popups/PopupRegistry';

import StoreSyncer from '@/components/store-syncer';
import PopupHeader from '@/components/popup-header';

const PopupPageComponent: React.FC = React.memo(() => {
  const [popup, setPopup] = useState<Types.Popup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMaximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimize = () => {
    if (!popup?.id) return;
    ipc.window.minimize(popup.id);
  };

  const handleClose = () => {
    if (!popup?.id) return;
    ipc.popup.close(popup.id);
  };

  useEffect(() => {
    const unsubs = [ipc.window.onUnmaximize(() => setIsFullscreen(false)), ipc.window.onMaximize(() => setIsFullscreen(true))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as Types.PopupType;
      const id = params.get('id') as string;
      const initialData = ipc.initialData.get(id);

      // initialData was loaded for this popup type by main/popup before the window opened.
      const popup = buildPopup(id, { type, data: initialData } as Types.PopupData);

      setPopup(popup);
    }
  }, []);

  return (
    <>
      <StoreSyncer.Slave />
      {popup && !popup.hideHeader && (
        <PopupHeader
          title={popup.title}
          buttons={popup.buttons}
          popupType={popup.type}
          isFullscreen={isFullscreen}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onRestore={handleUnmaximize}
          onClose={handleClose}
        />
      )}
      {popup && popup.node()}
    </>
  );
});

PopupPageComponent.displayName = 'PopupPageComponent';

const PopupPage = dynamic(() => Promise.resolve(PopupPageComponent), { ssr: false });

export default PopupPage;
