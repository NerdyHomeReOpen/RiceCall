import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/notifyMenu.module.css';
import contextMenu from '@/styles/contextMenu.module.css';

// Types
import type { ContextMenuItem } from '@/types';

interface NotifyMenuProps {
  items: ContextMenuItem[];
  hasNotify: boolean;
  onClose: () => void;
  x?: number;
  y?: number;
  preferTop?: boolean;
  preferLeft?: boolean;
}

const NotifyMenu: React.FC<NotifyMenuProps> = ({ items, hasNotify, onClose, x = 0, y = 0, preferTop = false, preferLeft = false }) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
  const [subMenu, setSubMenu] = useState<React.ReactNode>(null);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  // Effect
  useEffect(() => {
    if (!menuRef.current) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const marginEdge = 10;

    let newPosX = x;
    let newPosY = y;

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;

    if (preferTop) {
      newPosY -= menuHeight;
    }

    if (preferLeft) {
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
  }, [x, y, preferLeft, preferTop]);

  return (
    <div ref={menuRef} className={`context-menu-container ${styles['notify-menu']}`} style={{ top: menuY, left: menuX }}>
      {!hasNotify && <div className={styles['option']}>無未讀消息</div>}
      {hasNotify &&
        items
          .filter((item) => item?.show ?? true)
          .map((item, index) => {
            return (
              <div
                key={index}
                className={`${styles['option']} ${item.disabled ? contextMenu['disabled'] : ''}`}
                data-type={item.icon || ''}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  onClose();
                }}
              >
                {item.label}
              </div>
            );
          })}
    </div>
  );
};

NotifyMenu.displayName = 'NotifyMenu';

export default NotifyMenu;
