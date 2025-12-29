'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ChangeServerPage from '@/pages/ChangeServer';

import headerStyles from '@/styles/header.module.css';

const Header: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const minimize = () => {
    ipc.window.minimize();
  };

  const close = () => {
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
        <div className={headerStyles['minimize']} onClick={minimize} />
        <div className={headerStyles['close']} onClick={close} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const AuthPageComponent: React.FC = React.memo(() => {
  // States
  const [section, setSection] = useState<'register' | 'login' | 'change-server'>('login');

  // Variables
  const isDisplayLoginPage = useMemo(() => section === 'login', [section]);
  const isDisplayRegisterPage = useMemo(() => section === 'register', [section]);
  const isDisplayChangeServerPage = useMemo(() => section === 'change-server', [section]);

  // Effects
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        return await ipc.auth.autoLogin(token);
      }
    };
    autoLogin();
  }, []);

  return (
    <>
      <Header />
      <LoginPage display={isDisplayLoginPage} setSection={setSection} />
      <RegisterPage display={isDisplayRegisterPage} setSection={setSection} />
      <ChangeServerPage display={isDisplayChangeServerPage} setSection={setSection} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
