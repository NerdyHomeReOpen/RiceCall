import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  loadingServerId: string;
  onClose: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(({ loadingServerId, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className={styles['loading-overlay-wrapper']}>
      <div className={styles['loading-overlay']}>
        <div className={styles['loading-overlay-title-text']}>{t('connecting-server', { '0': loadingServerId })}</div>
        <div className={styles['loading-overlay-gif']} />
        <div className={styles['loading-overlay-close-button']} onClick={onClose} />
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;
