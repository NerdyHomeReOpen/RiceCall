/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/notifyMenu.module.css';
import contextMenu from '@/styles/contextMenu.module.css';

// Types
import type { NotifyMenuItem } from '@/types';

interface NotifyMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: NotifyMenuItem[];
  onClose: () => void;
}

const NotifyMenu: React.FC<NotifyMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
  const [display, setDisplay] = useState(false);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

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
    <div ref={menuRef} className={`context-menu-container ${styles['notify-menu']}`} style={display ? { top: menuY, left: menuX } : { opacity: 0 }}>
      {items
        .filter((item) => item?.show ?? true)
        .map((item, index) => {
          return (
            <div key={index}>
              <div
                className={`${styles['option']} ${item.className && styles[item.className]} ${item.disabled ? contextMenu['disabled'] : ''}`}
                data-type={item.icon || ''}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  onClose();
                }}
              >
                {item.showContentLength ? `${item.label} (${item.contents ? item.contents.length : 0})` : item.label}
              </div>
              {item.showContent && item.contents && (
                <div className={styles['contents']}>
                  {item.contents.slice(0, 3).map((content, index) => (item.contentType === 'image' ? <img key={index} src={content} alt={content} /> : content))}
                  {item.contents.length > 3 && <span>...({item.contents.length - 3})</span>}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
});

NotifyMenu.displayName = 'NotifyMenu';

export default NotifyMenu;
