import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import MicContextMenu from './index';

import styles from '../ContextMenu/ContextMenu.module.css';

interface MicContextMenuItemProps {
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  item: Types.ContextMenuItem;
  onClose: () => void;
}

const MicContextMenuItem: React.FC<MicContextMenuItemProps> = React.memo(({ direction, item, onClose }) => {
  const { t } = useTranslation();

  const [subMenu, setSubMenu] = useState<React.ReactNode>(null);

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
      className={`${styles['mic-context-menu-option']} ${item.hasSubmenu ? styles['has-submenu'] : ''} ${item.disabled ? 'disabled' : ''}`}
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

export default MicContextMenuItem;
