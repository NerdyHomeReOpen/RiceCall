import React, { useEffect, useRef, useState } from 'react';

// CSS
import contextMenu from '@/styles/contextMenu.module.css';

// Types
import { ContextMenuItem } from '@/types';

interface ContextMenuProps {
  items: ContextMenuItem[];
  onClose: () => void;
  x?: number;
  y?: number;
  preferTop?: boolean;
  preferLeft?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  onClose,
  x = 0,
  y = 0,
  preferTop = false,
  preferLeft = false,
}) => {
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
    <div
      ref={menuRef}
      className={`context-menu-container ${contextMenu['context-menu']}`}
      style={{ top: menuY, left: menuX }}
    >
      {items
        .filter((item) => item?.show ?? true)
        .map((item, index) => {
          if (item.id === 'separator') {
            return <div className={contextMenu['separator']} key={index} />;
          }
          return (
            <div
              key={index}
              className={`${contextMenu['option']} ${item.hasSubmenu ? contextMenu['has-submenu'] : ''} ${
                item.disabled ? contextMenu['disabled'] : ''
              }`}
              data-type={item.icon || ''}
              onClick={() => {
                if (item.disabled) return;
                item.onClick?.();
                onClose();
              }}
              onMouseEnter={(e) => {
                if (!item.hasSubmenu || !item.submenuItems) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setSubMenu(
                  <ContextMenu
                    items={item.submenuItems}
                    onClose={onClose}
                    x={rect.left}
                    y={rect.top}
                    preferTop={false}
                    preferLeft={true}
                  />,
                );
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
};

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
