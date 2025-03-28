'use client';

import React from 'react';

// Providers
import SocketProvider from '@/providers/SocketProvider';
import ContextMenuProvider from '@/providers/ContextMenuProvider';
import LanguageProvider from '@/providers/LanguageProvider';
import WebRTCProvider from '@/providers/WebRTCProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <LanguageProvider>
      <SocketProvider>
        <WebRTCProvider>
          <ContextMenuProvider>{children}</ContextMenuProvider>
        </WebRTCProvider>
      </SocketProvider>
    </LanguageProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;
