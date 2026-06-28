import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './ChangeServer.module.css';

interface ServerOptionProps {
  option: { tKey: string; value: 'prod' | 'dev' };
  onSelect: (value: 'prod' | 'dev') => void;
}

const ServerOption: React.FC<ServerOptionProps> = React.memo(({ option, onSelect }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    onSelect(option.value);
  };

  return (
    <button key={option.value} className={styles['server-option']} onClick={handleClick}>
      {t(option.tKey)}
    </button>
  );
});

ServerOption.displayName = 'ServerOption';

export default ServerOption;
