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

  const [selectedPage, setSelectedPage] = useState<Page>('login');

  const loginPageIsSelected = selectedPage === 'login';
  const registerPageIsSelected = selectedPage === 'register';
  const changeServerPageIsSelected = selectedPage === 'change-server';

  const handleBackToLoginBtnClick = useCallback(() => {
    setSelectedPage('login');
  }, []);

  const handleRegisterBtnClick = useCallback(() => {
    setSelectedPage('register');
  }, []);

  const handleChangeServerBtnClick = useCallback(() => {
    setSelectedPage('change-server');
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
      <LoginPage display={loginPageIsSelected} onRegisterBtnClick={handleRegisterBtnClick} onChangeServerBtnClick={handleChangeServerBtnClick} />
      <RegisterPage display={registerPageIsSelected} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
      <ChangeServerPage display={changeServerPageIsSelected} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
