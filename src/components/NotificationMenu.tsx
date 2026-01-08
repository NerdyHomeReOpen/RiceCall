import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from '@/styles/notificationMenu.module.css';
import contextMenuStyles from '@/styles/contextMenu.module.css';

export interface NotificationMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.NotificationMenuItem[];
  onClose: () => void;
}

const NotificationMenu: React.FC<NotificationMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
  const [display, setDisplay] = useState(false);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  // Variables
  const filteredItems = useMemo(() => items.filter((item) => item?.show ?? true), [items]);

  // Effect
  useEffect(() => {
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
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={menuRef} className={`context-menu-container ${styles['notification-menu']}`} style={display ? { top: menuY, left: menuX } : { opacity: 0 }}>
      {filteredItems.map((item) => (
        <NotificationMenuItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  );
});

NotificationMenu.displayName = 'NotificationMenu';

export default NotificationMenu;

interface NotificationMenuItemProps {
  item: Types.NotificationMenuItem;
  onClose: () => void;
}

const NotificationMenuItem: React.FC<NotificationMenuItemProps> = React.memo(({ item, onClose }) => {
  // Handlers
  const handleClick = () => {
    if (item.disabled) return;
    item.onClick?.();
    onClose();
  };

  return (
    <>
      <div className={`${styles['option']} ${item.className && styles[item.className]} ${item.disabled ? contextMenuStyles['disabled'] : ''}`} data-type={item.icon || ''} onClick={handleClick}>
        {item.showContentLength ? `${item.label} (${item.contents ? item.contents.length : 0})` : item.label}
      </div>
      {item.showContent && item.contents && (
        <div className={styles['contents']}>
          {item.contents
            .slice(0, 3)
            .map((content, index) => (item.contentType === 'image' ? <Image key={index} src={content} alt={content} width={32} height={32} loading="lazy" draggable="false" /> : content))}
          {item.contents.length > 3 && <span>...({item.contents.length - 3})</span>}
        </div>
      )}
    </>
  );
});

NotificationMenuItem.displayName = 'NotificationMenuItem';
