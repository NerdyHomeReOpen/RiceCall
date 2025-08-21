'use client';

import React, { useEffect, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Pages
import LoginPage from '@/components/pages/Login';
import RegisterPage from '@/components/pages/Register';

// Services
import ipc from '@/services/ipc.service';
import auth from '@/services/auth.service';

const Header: React.FC = React.memo(() => {
  // Handlers
  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
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
      await auth.autoLogin();
    };
    autoLogin();
  }, []);

  return (
    <>
      <Header />
      <LoginPage display={section === 'login'} setSection={setSection} />
      <RegisterPage display={section === 'register'} setSection={setSection} />
    </>
  );
};

Auth.displayName = 'Auth';

export default Auth;
