'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Pages
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ChangeServerPage from '@/pages/ChangeServer';

// Services
import ipc from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

const Header: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
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
    <header className={`${header['header']} ${header['big']}`}>
      {/* Title */}
      <div className={header['title-box']}>
        <div className={header['app-icon']} />
      </div>

      {/* Buttons */}
      <div className={header['buttons']}>
        <div className={header['minimize']} onClick={() => handleMinimize()} />
        <div className={header['close']} onClick={() => handleClose()} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const AuthPageComponent: React.FC = React.memo(() => {
  // States
  const [section, setSection] = useState<'register' | 'login' | 'change-server'>('login');

  // Effects
  useEffect(() => {
    const autoLogin = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const token = localStorage.getItem('token');
      if (token) {
        return await ipc.auth.autoLogin(token);
      }
    };
    autoLogin();
  }, []);

  useEffect(() => {
    history.pushState = () => {};
    history.back = () => {};
    history.forward = () => {};
  }, []);

  return (
    <>
      <Header />
      <LoginPage display={section === 'login'} setSection={setSection} />
      <RegisterPage display={section === 'register'} setSection={setSection} />
      <ChangeServerPage display={section === 'change-server'} setSection={setSection} />
    </>
  );
});

AuthPageComponent.displayName = 'AuthPageComponent';

const AuthPage = dynamic(() => Promise.resolve(AuthPageComponent), { ssr: false });

export default AuthPage;
