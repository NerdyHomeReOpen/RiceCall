import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import * as Popup from '@/utils/popup';

import { SERVER_OPTIONS } from '@/constant';

import styles from '@/styles/changeServer.module.css';

interface ChangeServerPageProps {
  display: boolean;
  setSection: (section: 'login' | 'register' | 'change-server') => void;
}

const ChangeServerPageComponent: React.FC<ChangeServerPageProps> = React.memo(({ display, setSection }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const selectServer = (value: 'prod' | 'dev') => {
    if (value === 'dev') {
      Popup.openAlertDialog(t('confirm-change-server-to-dev'), () => {
        ipc.changeServer(value);
        setSection('login');
      });
    } else {
      ipc.changeServer(value);
      setSection('login');
    }
  };

  return (
    <main className={styles['change-server']} style={display ? {} : { display: 'none' }}>
      <main className={styles['change-server-body']}>
        <div className={styles['app-logo']} />
        <div className={styles['form-wrapper']}>
          {SERVER_OPTIONS.map((option) => (
            <button key={option.value} className={styles['server-option']} onClick={() => selectServer(option.value)}>
              {t(option.tKey)}
            </button>
          ))}
        </div>
      </main>
      <div className={styles['change-server-footer']}>
        <div className={styles['back-to-login']} onClick={() => setSection('login')}>
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

ChangeServerPageComponent.displayName = 'ChangeServerPageComponent';

const ChangeServerPage = dynamic(() => Promise.resolve(ChangeServerPageComponent), { ssr: false });

export default ChangeServerPage;
