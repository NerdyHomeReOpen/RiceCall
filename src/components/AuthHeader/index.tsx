import React from 'react';

import styles from './AuthHeader.module.css';

interface AuthHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = React.memo(({ onMinimize, onClose }) => {
  return (
    <header className={`${styles['header']} ${styles['big']}`}>
      <div className={styles['title-box']}>
        <div className={styles['app-icon']} />
      </div>
      <div className={styles['buttons']}>
        <div className={styles['minimize-button']} onClick={onMinimize} />
        <div className={styles['close-button']} onClick={onClose} />
      </div>
    </header>
  );
});

AuthHeader.displayName = 'AuthHeader';

export default AuthHeader;
