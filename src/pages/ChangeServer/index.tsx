import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

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
      Actions.openAlertDialog(t('confirm-change-server-to-dev'), () => {
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
