import React, { useEffect, useRef, useState } from 'react';

import type * as Types from '@/types';

import styles from '@/styles/contextMenu.module.css';

/**
 * Clean the menu items by removing duplicate separators and ensuring that separators are not placed at the beginning or end of the menu.
 * @param items - The menu items to clean.
 * @returns The cleaned menu items.
 */
export function cleanMenu(items: Types.ContextMenuItem[]): Types.ContextMenuItem[] {
  const preFiltered = items.filter((item) => item.id === 'separator' || item.show !== false);
  const result: Types.ContextMenuItem[] = [];

  for (let i = 0; i < preFiltered.length; i++) {
    const cur = preFiltered[i];
    if (cur.id === 'separator') {
      if (result.length === 0) continue;
      const hasVisibleAfter = preFiltered.slice(i + 1).some((it) => it.id !== 'separator');
      if (!hasVisibleAfter) continue;
      if (result[result.length - 1].id === 'separator') continue;
    }
    result.push(cur);
  }

  return result;
}

interface MicContextMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.ContextMenuItem[];
  onClose: () => void;
}

const MicContextMenu: React.FC<MicContextMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
  const [display, setDisplay] = useState(false);
  const [subMenu, setSubMenu] = useState<React.ReactNode>(null);
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
    <div ref={menuRef} className={`context-menu-container ${styles['mic-context-menu']}`} style={display ? { top: menuY, left: menuX } : { opacity: 0 }}>
      {cleanMenu(items)
        .filter((item) => item?.show ?? true)
        .map((item, index) => {
          if (item.id === 'separator') {
            return <div className={styles['separator']} key={index} />;
          }
          return (
            <div
              key={index}
              className={`${styles['option']} ${item.hasSubmenu ? styles['has-submenu'] : ''} ${item.disabled ? styles['disabled'] : ''}`}
              data-type={item.icon || ''}
              onClick={() => {
                if (item.disabled) return;
                item.onClick?.();
                onClose();
              }}
              onMouseEnter={(e) => {
                if (!item.hasSubmenu || !item.submenuItems) return;
                const { left, right, bottom, top } = e.currentTarget.getBoundingClientRect();
                const x = direction === 'left-top' || direction === 'left-bottom' ? left : right;
                const y = direction === 'left-top' || direction === 'right-top' ? bottom : top;
                setSubMenu(<MicContextMenu items={item.submenuItems} onClose={onClose} x={x} y={y} direction={direction} />);
              }}
              onMouseLeave={() => {
                if (item.hasSubmenu) setSubMenu(null);
              }}
            >
              {item.label}
              {item.hasSubmenu && subMenu}
            </div>
          );
        })}
    </div>
  );
});

MicContextMenu.displayName = 'MicContextMenu';

export default MicContextMenu;
