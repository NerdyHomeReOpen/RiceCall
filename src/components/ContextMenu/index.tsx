import React, { useLayoutEffect, useRef, useState } from 'react';

import * as Types from '@/types';

import { cleanMenu } from '@/utils';

import ContextMenuItem from './ContextMenuItem';

import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  items: Types.ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = React.memo(({ x, y, direction, items, onClose }) => {
  const menuEl = useRef<HTMLDivElement>(null);

  const [isDisplayed, setIsDisplayed] = useState(false);
  const [positionX, setPositionX] = useState<number>(x);
  const [positionY, setPositionY] = useState<number>(y);

  const displayedItems = cleanMenu(items).filter((item) => item?.show ?? true);

  useLayoutEffect(() => {
    if (!menuEl.current) return;

    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuEl.current;
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
    setIsDisplayed(true);
  }, [x, y, direction]);

  return (
    <div ref={menuEl} className={`context-menu-container ${styles['context-menu']}`} style={isDisplayed ? { top: positionY, left: positionX } : { opacity: 0 }}>
      {displayedItems.map((item, index) =>
        item.id === 'separator' ? <div key={index} className={styles['separator']} /> : <ContextMenuItem key={item.id} direction={direction} item={item} onClose={onClose} />,
      )}
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
