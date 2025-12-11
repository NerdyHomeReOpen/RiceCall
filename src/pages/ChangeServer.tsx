import dynamic from 'next/dynamic';
import React from 'react';

// CSS
import styles from '@/styles/changeServer.module.css';

// Services
import ipc from '@/ipc';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';

interface ChangeServerPageProps {
  display: boolean;
  setSection: (section: 'login' | 'register' | 'change-server') => void;
}

const ChangeServerPageComponent: React.FC<ChangeServerPageProps> = React.memo(({ display, setSection }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const options: { label: string; value: 'prod' | 'dev' }[] = [
    {
      label: t('prod-server'),
      value: 'prod',
    },
    {
      label: t('test-server'),
      value: 'dev',
    },
  ];

  // Handlers
  const handleSelectServer = (value: 'prod' | 'dev') => {
    if (value === 'dev') {
      handleOpenAlertDialog(t('confirm-change-server-to-dev'), () => {
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
          {options.map((option) => (
            <button key={option.value} className={styles['server-option']} onClick={() => handleSelectServer(option.value)}>
              {option.label}
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
