import React, { useEffect, useRef, useState } from 'react';

// CSS
import contextMenu from '@/styles/contextMenu.module.css';

// Types
import { ContextMenuItem } from '@/types';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  side?: 'left' | 'right';
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  side = 'right',
  onClose,
}) => {
  // Ref
  const menuRef = useRef<HTMLDivElement>(null);

  // State
  const [subMenu, setSubMenu] = useState<React.ReactNode>(null);
  const [menuX, setMenuX] = useState(x);
  const [menuY, setMenuY] = useState(y);

  // Effect
  useEffect(() => {
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newMenuX = x;
      let newMenuY = y;

      if (side === 'left') {
        newMenuX = x - menuWidth;
        newMenuY = y;

        if (x < 20 + menuWidth) {
          newMenuX = 20;
        }

        if (y > windowHeight - menuHeight - 20) {
          newMenuY = windowHeight - menuHeight - 20;
        }
      } else {
        newMenuX = x;
        newMenuY = y;

        if (x + menuWidth > windowWidth - 20) {
          newMenuX = windowWidth - menuWidth - 20;
        }

        if (y > windowHeight - menuHeight - 20) {
          newMenuY = windowHeight - menuHeight - 20;
        }
      }

      setMenuX(newMenuX);
      setMenuY(newMenuY);
    }
  }, [x, y, side, menuRef]);

  return (
    <div
      ref={menuRef}
      className={`context-menu-container ${contextMenu['contextMenu']}`}
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
              key={item.id || index}
              className={`
                ${contextMenu['option']} 
                ${item.hasSubmenu ? contextMenu['hasSubmenu'] : ''}
              `}
              data-type={item.icon || ''}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              onMouseEnter={(e) => {
                if (!item.hasSubmenu) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setSubMenu(
                  <ContextMenu
                    x={rect.left}
                    y={rect.top}
                    items={item.submenuItems || []}
                    onClose={onClose}
                    side={'left'}
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
