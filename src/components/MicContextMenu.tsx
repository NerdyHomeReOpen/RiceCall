import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { cleanMenu } from '@/utils';

import styles from '@/styles/contextMenu.module.css';

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
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  // Variables
  const filteredItems = useMemo(() => cleanMenu(items).filter((item) => item?.show ?? true), [items]);

  // Effect
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
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={menuRef} className={`context-menu-container ${styles['mic-context-menu']}`} style={display ? { top: menuY, left: menuX } : { opacity: 0 }}>
      {filteredItems.map((item, index) => {
        return item.id === 'separator' ? <div key={index} className={styles['separator']} /> : <MicContextMenuItem key={item.id} direction={direction} item={item} onClose={onClose} />;
      })}
    </div>
  );
});

MicContextMenu.displayName = 'MicContextMenu';

export default MicContextMenu;

interface MicContextMenuItemProps {
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  item: Types.ContextMenuItem;
  onClose: () => void;
}

const MicContextMenuItem: React.FC<MicContextMenuItemProps> = React.memo(({ direction, item, onClose }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [subMenu, setSubMenu] = useState<React.ReactNode>(null);

  // Handlers
  const handleClick = () => {
    if (item.disabled) return;
    item.onClick?.();
    onClose();
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!item.hasSubmenu || !item.submenuItems) return;
    const { left, right, bottom, top } = e.currentTarget.getBoundingClientRect();
    const x = direction === 'left-top' || direction === 'left-bottom' ? left : right;
    const y = direction === 'left-top' || direction === 'right-top' ? bottom : top;
    setSubMenu(<MicContextMenu items={item.submenuItems || []} onClose={onClose} x={x} y={y} direction={direction} />);
  };

  const handleMouseLeave = () => {
    if (item.hasSubmenu) setSubMenu(null);
  };

  return (
    <div
      className={`${styles['option']} ${item.hasSubmenu ? styles['has-submenu'] : ''} ${item.disabled ? styles['disabled'] : ''}`}
      data-type={item.icon || ''}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {t(item.label)}
      {item.hasSubmenu && subMenu}
    </div>
  );
});

MicContextMenuItem.displayName = 'MicContextMenuItem';
