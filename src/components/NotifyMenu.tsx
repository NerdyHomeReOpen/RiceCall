/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/notifyMenu.module.css';
import contextMenu from '@/styles/contextMenu.module.css';

// Types
import type { NotifyMenuItem } from '@/types';

interface NotifyMenuProps {
  items: NotifyMenuItem[];
  onClose: () => void;
  x?: number;
  y?: number;
  preferTop?: boolean;
  preferLeft?: boolean;
}

const NotifyMenu: React.FC<NotifyMenuProps> = ({ items, onClose, x = 0, y = 0, preferTop = false, preferLeft = false }) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
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
      {items
        .filter((item) => item?.show ?? true)
        .map((item, index) => {
          return (
            <div
              key={index}
              className={`${styles['option']} ${item.className && styles[item.className]} ${item.disabled ? contextMenu['disabled'] : ''}`}
              data-type={item.icon || ''}
              onClick={() => {
                if (item.disabled) return;
                item.onClick?.();
                onClose();
              }}
            >
              {item.showContentLength ? `${item.label} (${item.contents ? item.contents.length : 0})` : item.label}
              <div className={`${styles['contents']}`}>
                {item.showContent &&
                  item.contents &&
                  item.contents.slice(0, 3).map((content) => {
                    switch (item.contentType) {
                      case 'image':
                        return <img src={content} alt={content} />;
                      default:
                        return content;
                    }
                  })}
                {item.showContent && item.contents && item.contents.length > 3 && <span>..({item.contents.length - 3})</span>}
              </div>
            </div>
          );
        })}
    </div>
  );
};

NotifyMenu.displayName = 'NotifyMenu';

export default NotifyMenu;
