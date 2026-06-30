'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import AuthHeader from '@/components/AuthHeader';

import LoginPage from '@/page-components/Login';
import RegisterPage from '@/page-components/Register';
import ChangeServerPage from '@/page-components/ChangeServer';

type Page = 'register' | 'login' | 'change-server';

const AuthPageComponent: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const [activePage, setActivePage] = useState<Page>('login');

  const handleNavigateToLoginPage = useCallback(() => {
    setActivePage('login');
  }, []);

  const handleNavigateToRegisterPage = useCallback(() => {
    setActivePage('register');
  }, []);

  const handleNavigateToChangeServerPage = useCallback(() => {
    setActivePage('change-server');
  }, []);

  const handleMinimize = useCallback(() => {
    ipc.window.minimize();
  }, []);

  const handleClose = useCallback(() => {
    ipc.window.close();
  }, []);

  useEffect(() => {
    ipc.discord.updatePresence({
      details: t('rpc:login-page'),
      state: `${t('rpc:un-login')}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RiceCall',
      smallImageKey: 'login_icon',
      smallImageText: t('rpc:login-page'),
      timestamp: Date.now(),
      buttons: [
        {
          label: t('rpc:join-discord-server'),
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [t]);

  return (
    <>
      <AuthHeader onMinimize={handleMinimize} onClose={handleClose} />
      <LoginPage isActive={activePage === 'login'} onNavigateToRegisterPage={handleNavigateToRegisterPage} onNavigateToChangeServerPage={handleNavigateToChangeServerPage} />
      <RegisterPage isActive={activePage === 'register'} onNavigateToLoginPage={handleNavigateToLoginPage} />
      <ChangeServerPage isActive={activePage === 'change-server'} onNavigateToLoginPage={handleNavigateToLoginPage} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
