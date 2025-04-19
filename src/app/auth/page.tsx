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
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    if (isFullscreen) ipcService.window.unmaximize();
    else ipcService.window.maximize();
    setIsFullscreen(!isFullscreen);
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={header['header']}>
      {/* Title */}
      <div className={`${header['titleBox']} ${header['big']}`}>
        <div className={header['appIcon']} />
      </div>
      {/* Buttons */}
      <div className={header['buttons']}>
        <div className={header['minimize']} onClick={() => handleMinimize()} />
        <div
          className={isFullscreen ? header['restore'] : header['maxsize']}
          onClick={() => handleFullscreen()}
        />
        <div className={header['close']} onClick={() => handleClose()} />
      </div>
    </div>
  );
});

Header.displayName = 'Header';

const Auth: React.FC = () => {
  // States
  const [section, setSection] = useState<'register' | 'login'>('login');

  // Effects
  useEffect(() => {
    setTimeout(() => authService.autoLogin(), 1000); // Can be change to when socket is onReady not just specific time
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
    <div className="wrapper">
      {/* Top Navigation */}
      <Header />
      {/* Main Content */}
      <div className="content">{getMainContent()}</div>
    </div>
  );
};

Auth.displayName = 'Auth';

export default Auth;
