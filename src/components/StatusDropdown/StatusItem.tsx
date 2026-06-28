import React from 'react';

import * as Types from '@/types';

import styles from './StatusDropdown.module.css';

interface StatusItemProps {
  status: Types.User['status'];
  onSelect: (status: Types.User['status']) => void;
  onClose: () => void;
}

const StatusItem: React.FC<StatusItemProps> = React.memo(({ status, onSelect, onClose }) => {
  const handleClick = () => {
    onSelect(status);
    onClose();
  };

  return <div key={status} className={styles['status-dropdown-option']} datatype={status} onClick={handleClick} />;
});

StatusItem.displayName = 'StatusItem';

export default StatusItem;
