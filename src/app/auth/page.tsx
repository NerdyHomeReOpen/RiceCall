'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ChangeServerPage from '@/pages/ChangeServer';
import * as Popup from '@/utils/popup';

import headerStyles from '@/styles/header.module.css';

const Header: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleMinimizeBtnClick = () => {
    ipc.window.minimize();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    ipc.discord.updatePresence({
      details: t('rpc:login-page'),
      state: `${t('rpc:un-login')}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
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
    <header className={`${headerStyles['header']} ${headerStyles['big']}`}>
      <div className={headerStyles['title-box']}>
        <div className={headerStyles['app-icon']} />
      </div>
      <div className={headerStyles['buttons']}>
        <div className={headerStyles['minimize']} onClick={handleMinimizeBtnClick} />
        <div className={headerStyles['close']} onClick={handleCloseBtnClick} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const AuthPageComponent: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<'register' | 'login' | 'change-server'>('login');

  // Variables
  const isDisplayLoginPage = section === 'login';
  const isDisplayRegisterPage = section === 'register';
  const isDisplayChangeServerPage = section === 'change-server';

  // Handlers
  const handleBackToLoginBtnClick = () => {
    setSection('login');
  };

  const handleRegisterBtnClick = () => {
    setSection('register');
  };

  const handleChangeServerBtnClick = () => {
    setSection('change-server');
  };

  // Effects
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      // Only attempt autoLogin if token actually exists and is not an empty string
      if (token && token.length > 10) {
        const res = await ipc.auth.autoLogin(token);
        if (res && res.success) {
          ipc.auth.loginSuccess(res.token);
        } else if (res && !res.success) {
          // Clear invalid token to stop the loop
          localStorage.removeItem('token');
          // Show the reason from server or a generic fallback
          Popup.openErrorDialog(t(res.message || 'message:login-failed'), () => {});
        }
        return res;
      }
    };
    autoLogin();
  }, [t]);

  return (
    <>
      <Header />
      <LoginPage display={isDisplayLoginPage} onRegisterBtnClick={handleRegisterBtnClick} onChangeServerBtnClick={handleChangeServerBtnClick} />
      <RegisterPage display={isDisplayRegisterPage} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
      <ChangeServerPage display={isDisplayChangeServerPage} onBackToLoginBtnClick={handleBackToLoginBtnClick} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
