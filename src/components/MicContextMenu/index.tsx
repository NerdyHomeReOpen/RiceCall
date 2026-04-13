import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type * as Types from '@/types';

import { cleanMenu } from '@/utils';

import MicContextMenuItem from './MicContextMenuItem';

import styles from '../ContextMenu/ContextMenu.module.css';

interface MicContextMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.ContextMenuItem[];
  onClose: () => void;
}

const MicContextMenu: React.FC<MicContextMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const [display, setDisplay] = useState(false);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  const filteredItems = useMemo(() => cleanMenu(items).filter((item) => item?.show ?? true), [items]);

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
