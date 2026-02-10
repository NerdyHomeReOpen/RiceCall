import React from 'react';

import styles from '@/styles/loadingSpinner.module.css';

const LoadingSpinner: React.FC = React.memo(() => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div className={styles['spinner']} />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
