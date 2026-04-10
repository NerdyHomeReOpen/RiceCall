import React from 'react';

import type * as Types from '@/types';

import styles from './StatusDropdown.module.css';

interface StatusItemProps {
  status: Types.User['status'];
  onStatusSelect: (status: Types.User['status']) => void;
  onClose: () => void;
}

const StatusItem: React.FC<StatusItemProps> = React.memo(({ status, onStatusSelect, onClose }) => {
  const handleClick = () => {
    onStatusSelect(status);
    onClose();
  };

  return <div key={status} className={styles['status-dropdown-option']} datatype={status} onClick={handleClick} />;
});

StatusItem.displayName = 'StatusItem';

export default StatusItem;
