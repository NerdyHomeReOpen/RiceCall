import React, { useLayoutEffect, useRef, useState } from 'react';

import type * as Types from '@/types';

import { STATUS_OPTIONS } from '@/constants';

import StatusItem from './StatusItem';

import styles from './StatusDropdown.module.css';

interface StatusDropdownProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onClose: () => void;
  onStatusSelect: (status: Types.User['status']) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = React.memo(({ x, y, direction, onClose, onStatusSelect }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [display, setDisplay] = useState(false);
  const [dropdownX, setDropdownX] = useState(x);
  const [dropdownY, setDropdownY] = useState(y);

  useLayoutEffect(() => {
    if (!dropdownRef.current) return;
    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = dropdownRef.current;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const marginEdge = 10;
    let newPosX = x;
    let newPosY = y;

    if (direction === 'left-top' || direction === 'right-top') {
      newPosY -= menuHeight;
    }
    if (direction === 'left-top' || direction === 'left-bottom') {
      newPosX -= menuWidth;
    }

    if (newPosX + menuWidth + marginEdge > windowWidth) {
      newPosX = windowWidth - menuWidth - marginEdge;
    }
    if (newPosX < marginEdge) {
      newPosX = marginEdge;
    }
    if (newPosY + menuHeight + marginEdge > windowHeight) {
      newPosY = windowHeight - menuHeight - marginEdge;
    }
    if (newPosY < marginEdge) {
      newPosY = marginEdge;
    }

    setDropdownX(newPosX);
    setDropdownY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={dropdownRef} className={`context-menu-container ${styles['status-dropdown']}`} style={display ? { top: dropdownY, left: dropdownX } : { opacity: 0 }}>
      {STATUS_OPTIONS.map((status) => (
        <StatusItem key={status} status={status} onStatusSelect={onStatusSelect} onClose={onClose} />
      ))}
    </div>
  );
});

StatusDropdown.displayName = 'StatusDropdown';

export default StatusDropdown;
