import React, { useLayoutEffect, useRef, useState } from 'react';

import * as Types from '@/types';

import NotificationMenuItem from './NotificationMenuItem';

import styles from './NotificationMenu.module.css';

interface NotificationMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.NotificationMenuItem[];
  onClose: () => void;
}

const NotificationMenu: React.FC<NotificationMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const [display, setDisplay] = useState<boolean>(false);
  const [positionX, setPositionX] = useState<number>(x);
  const [positionY, setPositionY] = useState<number>(y);

  const filteredItems: Types.NotificationMenuItem[] = items.filter((item) => item?.show ?? true);

  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.current;
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

    setPositionX(newPosX);
    setPositionY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={menuRef} className={`context-menu-container ${styles['menu']}`} style={display ? { top: positionY, left: positionX } : { opacity: 0 }}>
      {filteredItems.map((item) => (
        <NotificationMenuItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  );
});

NotificationMenu.displayName = 'NotificationMenu';

export default NotificationMenu;
