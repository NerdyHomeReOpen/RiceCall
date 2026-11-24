import React, { useLayoutEffect, useRef, useState } from 'react';

import type * as Types from '@/types';

import NotificationMenuItem from './NotificationMenuItem';

interface NotificationMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.NotificationMenuItem[];
  onClose: () => void;
}

const NotificationMenu: React.FC<NotificationMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  const filteredItems = items.filter((item) => item?.show ?? true);

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

    setMenuX(newPosX);
    setMenuY(newPosY);
    setIsVisible(true);
  }, [x, y, direction]);

  return (
    <div
      ref={menuRef}
      className={`context-menu-container not-empty:fixed not-empty:z-10000 not-empty:flex not-empty:flex-col not-empty:justify-around not-empty:min-w-[200px] not-empty:overflow-hidden not-empty:bg-background not-empty:rounded-[3px] not-empty:shadow-box-shadow`}
      style={isVisible ? { top: menuY, left: menuX } : { opacity: 0 }}
    >
      {filteredItems.map((item) => (
        <NotificationMenuItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  );
});

NotificationMenu.displayName = 'NotificationMenu';

export default NotificationMenu;
