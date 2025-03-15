'use client';

import React from 'react';
import { Provider } from 'react-redux';

// Providers
import SocketProvider from '@/providers/SocketProvider';
import ContextMenuProvider from '@/providers/ContextMenuProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';

// Redux
import store from '@/redux/store';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <SocketProvider>
          <ContextMenuProvider>{children}</ContextMenuProvider>
        </SocketProvider>
      </LanguageProvider>
    </Provider>
  );
};

Providers.displayName = 'Page';

export default Providers;
