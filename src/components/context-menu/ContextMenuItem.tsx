import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ContextMenu from '@/components/context-menu';

interface ContextMenuItemProps {
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  item: Types.ContextMenuItem;
  onClose: () => void;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = React.memo(({ direction, item, onClose }) => {
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
    setSubMenu(<ContextMenu items={item.submenuItems || []} onClose={onClose} x={x} y={y} direction={direction} />);
  };

  const handleMouseLeave = () => {
    if (item.hasSubmenu) setSubMenu(null);
  };

  return (
    <div
      key={item.id}
      className={`relative flex items-center justify-start w-full px-[30px] py-[5px] my-[2px] text-text-color-secondary hover:bg-hover before:absolute before:left-[6px] before:self-center before:min-w-[16px] before:min-h-[16px] before:content-[''] before:bg-no-repeat before:bg-center before:bg-auto data-[type=system-setting]:before:bg-[url('/set.svg')] data-[type=feedback]:before:bg-[url('/message.svg')] data-[type=change-theme]:before:bg-[url('/skin.svg')] data-[type=logout]:before:bg-[url('/exit.svg')] data-[type=submenu-left]:before:bg-[url('/ctrl/icon_submenu.svg')] data-[type=submenu]:before:bg-[url('/ctrl/icon_submenu.svg')] data-[type=checked]:before:bg-[url('/ctrl/icon_menu_checked.svg')] data-[type=member-management]:before:bg-[url('/channel/icon_membermgr.svg')] data-[type=apply-member]:before:bg-[url('/channel/icon_memberapply.svg')] data-[type=edit-nickname]:before:bg-[url('/channel/icon_editGroupcard.svg')] data-[type=locate-me]:before:bg-[url('/channel/icon_locateme.svg')] data-[type=report]:before:bg-[url('/channel/icon_report.svg')] data-[type=unfavorite-server]:before:bg-[url('/channel/icon_uncollect.svg')] data-[type=favorite-server]:before:bg-[url('/channel/icon_collect.svg')] data-[type=submenu-left]:before:transform-[rotate(180deg)] data-[type=submenu]:before:right-[6px] data-[type=submenu]:before:left-auto ${item.disabled ? 'disabled' : ''}`}
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

ContextMenuItem.displayName = 'ContextMenuItem';

export default ContextMenuItem;
