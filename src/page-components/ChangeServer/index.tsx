import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { openAlertDialog } from '@/services';

import { SERVER_OPTIONS } from '@/constants';

import ServerOption from './ServerOption';

import styles from './ChangeServer.module.css';

interface ChangeServerPageProps {
  display: boolean;
  onBackToLoginBtnClick: () => void;
}

const ChangeServerPageComponent: React.FC<ChangeServerPageProps> = React.memo(({ display, onBackToLoginBtnClick }) => {
  const { t } = useTranslation();

  const handleServerSelect = (value: 'prod' | 'dev') => {
    if (value === 'dev') {
      openAlertDialog(t('confirm-change-server-to-dev'), () => {
        ipc.env.change(value);
        onBackToLoginBtnClick();
      });
    } else {
      ipc.env.change(value);
      onBackToLoginBtnClick();
    }
  };

  const handleBackToLoginBtnClick = () => {
    onBackToLoginBtnClick();
  };

  return (
    <main className={styles['page']} style={display ? {} : { display: 'none' }}>
      <main className={styles['page-body']}>
        <div className={styles['app-logo']} />
        <div className={styles['form-wrapper']}>
          {SERVER_OPTIONS.map((option) => (
            <ServerOption key={option.value} option={option} onServerSelect={handleServerSelect} />
          ))}
        </div>
      </main>
      <div className={styles['page-footer']}>
        <div className={styles['back-to-login-button']} onClick={handleBackToLoginBtnClick}>
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

ChangeServerPageComponent.displayName = 'ChangeServerPageComponent';

const ChangeServerPage = dynamic(() => Promise.resolve(ChangeServerPageComponent), { ssr: false });

export default ChangeServerPage;
