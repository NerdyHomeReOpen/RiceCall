'use client';

import React, { useEffect, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Pages
import LoginPage from '@/components/pages/Login';
import RegisterPage from '@/components/pages/Register';

// Services
import ipcService from '@/services/ipc.service';
import authService from '@/services/auth.service';

const Header: React.FC = React.memo(() => {
  // Handlers
  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

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

const Auth: React.FC = () => {
  // States
  const [section, setSection] = useState<'register' | 'login'>('login');

  // Effects
  useEffect(() => {
    const autoLogin = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await authService.autoLogin();
    };
    autoLogin();
  }, []);

  const getMainContent = () => {
    switch (section) {
      case 'login':
        return <LoginPage setSection={setSection} />;
      case 'register':
        return <RegisterPage setSection={setSection} />;
    }
  };

  return (
    <>
      <Header />
      {getMainContent()}
    </>
  );
};

Auth.displayName = 'Auth';

export default Auth;
