/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

import styles from '@/styles/loadingSpinner.module.css';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ className }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div className={styles['spinner']} />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
