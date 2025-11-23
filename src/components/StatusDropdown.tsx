import React, { useEffect, useRef, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { User } from '@/types';

// Constants
import { STATUS_OPTIONS } from '@/constant';

interface StatusDropdownProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onClose: () => void;
  onStatusSelect: (status: User['status']) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = React.memo(({ x, y, direction, onClose, onStatusSelect }) => {
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [dropdownX, setDropdownX] = useState(x);
  const [dropdownY, setDropdownY] = useState(y);

  // Effects
  useEffect(() => {
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
    <div ref={dropdownRef} className={`context-menu-container ${header['status-dropdown']}`} style={display ? { top: dropdownY, left: dropdownX } : { opacity: 0 }}>
      {STATUS_OPTIONS.map((status) => (
        <div
          key={status}
          className={header['option']}
          datatype={status}
          onClick={() => {
            onStatusSelect(status);
            onClose();
          }}
        />
      ))}
    </div>
  );
});

StatusDropdown.displayName = 'StatusDropdown';

export default StatusDropdown;
