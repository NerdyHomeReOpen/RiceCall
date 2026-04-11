'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import AuthHeader from '@/components/AuthHeader';

import LoginPage from '@/page-components/Login';
import RegisterPage from '@/page-components/Register';
import ChangeServerPage from '@/page-components/ChangeServer';

const AuthPageComponent: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const [section, setSection] = useState<'register' | 'login' | 'change-server'>('login');

  const isDisplayLoginPage = section === 'login';
  const isDisplayRegisterPage = section === 'register';
  const isDisplayChangeServerPage = section === 'change-server';

  const handleBackToLoginBtnClick = () => {
    setSection('login');
  };

  const handleRegisterBtnClick = () => {
    setSection('register');
  };

  const handleChangeServerBtnClick = () => {
    setSection('change-server');
  };

  const handleMinimizeBtnClick = () => {
    ipc.window.minimize();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

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
      <AuthHeader onMinimize={handleMinimizeBtnClick} onClose={handleCloseBtnClick} />
      <LoginPage display={isDisplayLoginPage} onRegisterBtnClick={handleRegisterBtnClick} onChangeServerBtnClick={handleChangeServerBtnClick} />
      <RegisterPage display={isDisplayRegisterPage} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
      <ChangeServerPage display={isDisplayChangeServerPage} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
