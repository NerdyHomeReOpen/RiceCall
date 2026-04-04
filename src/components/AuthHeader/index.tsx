import React from 'react';

import styles from '@/styles/Header.module.css';

interface AuthHeaderProps {
  onMinimize?: () => void;
  onClose?: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = React.memo(({ onMinimize, onClose }) => {
  const handleMinimizeClick = () => {
    onMinimize?.();
  };

  const handleCloseClick = () => {
    onClose?.();
  };

  return (
    <header className={`${styles['header']} ${styles['big']}`}>
      <div className={styles['title-box']}>
        <div className={styles['app-icon']} />
      </div>
      <div className={styles['buttons']}>
        <div className={styles['minimize']} onClick={handleMinimizeClick} />
        <div className={styles['close']} onClick={handleCloseClick} />
      </div>
    </header>
  );
});

AuthHeader.displayName = 'AuthHeader';

export default AuthHeader;
