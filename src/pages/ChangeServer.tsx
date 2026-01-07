import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import * as Popup from '@/utils/popup';

import { SERVER_OPTIONS } from '@/constant';

import styles from '@/styles/changeServer.module.css';

interface ChangeServerPageProps {
  display: boolean;
  onBackToLoginBtnClick: () => void;
}

const ChangeServerPageComponent: React.FC<ChangeServerPageProps> = React.memo(({ display, onBackToLoginBtnClick }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleServerSelect = (value: 'prod' | 'dev') => {
    if (value === 'dev') {
      Popup.openAlertDialog(t('confirm-change-server-to-dev'), () => {
        ipc.changeServer(value);
        onBackToLoginBtnClick();
      });
    } else {
      ipc.changeServer(value);
      onBackToLoginBtnClick();
    }
  };

  const handleBackToLoginBtnClick = () => {
    onBackToLoginBtnClick();
  };

  return (
    <main className={styles['change-server']} style={display ? {} : { display: 'none' }}>
      <main className={styles['change-server-body']}>
        <div className={styles['app-logo']} />
        <div className={styles['form-wrapper']}>
          {SERVER_OPTIONS.map((option) => (
            <ServerOption key={option.value} option={option} onServerSelect={handleServerSelect} />
          ))}
        </div>
      </main>
      <div className={styles['change-server-footer']}>
        <div className={styles['back-to-login']} onClick={handleBackToLoginBtnClick}>
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

ChangeServerPageComponent.displayName = 'ChangeServerPageComponent';

const ChangeServerPage = dynamic(() => Promise.resolve(ChangeServerPageComponent), { ssr: false });

export default ChangeServerPage;

interface ServerOptionProps {
  option: { tKey: string; value: 'prod' | 'dev' };
  onServerSelect: (value: 'prod' | 'dev') => void;
}

const ServerOption: React.FC<ServerOptionProps> = React.memo(({ option, onServerSelect }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleClick = () => {
    onServerSelect(option.value);
  };

  return (
    <button key={option.value} className={styles['server-option']} onClick={handleClick}>
      {t(option.tKey)}
    </button>
  );
});

ServerOption.displayName = 'ServerOption';
