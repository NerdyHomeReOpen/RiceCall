import React, { useEffect, useMemo, useRef, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { ContextMenuItem, User } from '@/types';

// Hooks
import { useTranslation } from 'react-i18next';

/**
 * Clean the menu items by removing duplicate separators and ensuring that separators are not placed at the beginning or end of the menu.
 * @param items - The menu items to clean.
 * @returns The cleaned menu items.
 */
export function cleanMenu(items: ContextMenuItem[]): ContextMenuItem[] {
  const preFiltered = items.filter((item) => item.id === 'separator' || item.show !== false);
  const result: ContextMenuItem[] = [];

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

interface ContextMenuProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onClose: () => void;
  onStatusSelect: (status: User['status']) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = React.memo(({ x, y, direction, onClose, onStatusSelect }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [dropdownX, setDropdownX] = useState(x);
  const [dropdownY, setDropdownY] = useState(y);

  // Memos
  const statusOptions = useMemo<{ status: User['status']; label: string }[]>(() => {
    return [
      { status: 'online', label: t('online') },
      { status: 'dnd', label: t('dnd') },
      { status: 'idle', label: t('idle') },
      { status: 'gn', label: t('gn') },
    ];
  }, [t]);

  // Effects
  useEffect(() => {
    if (!dropdownRef.current) return;
    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = dropdownRef.current;
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

    setDropdownX(newPosX);
    setDropdownY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div ref={dropdownRef} className={`context-menu-container ${header['status-dropdown']}`} style={display ? { top: dropdownY, left: dropdownX } : { opacity: 0 }}>
      {statusOptions.map((option) => (
        <div
          key={option.status}
          className={header['option']}
          datatype={option.status}
          onClick={() => {
            onStatusSelect(option.status as User['status']);
            onClose();
          }}
        />
      ))}
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
