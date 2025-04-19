import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import { ContextMenuItem, ServerMember, Badge } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, member: ServerMember) => void;
  showBadgeInfoCard: (badgeElement: HTMLElement, badge: Badge) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context)
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  return context;
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  // States
  const [isVisible, setIsVisible] = React.useState(false);
  const [content, setContent] = React.useState<ReactNode | null>(null);
  const [hoveredBadge, setHoveredBadge] = React.useState<{
    rect: DOMRect;
    badge: Badge;
  } | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.context-menu-container')) return;
      if (isVisible) closeContextMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key != 'Escape') return;
      if (isVisible) closeContextMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [isVisible]);

  const showContextMenu = (x: number, y: number, items: ContextMenuItem[]) => {
    setContent(
      <ContextMenu
        x={x}
        y={y}
        items={items}
        onClose={() => closeContextMenu()}
      />,
    );
    setIsVisible(true);
  };

  const showUserInfoBlock = (x: number, y: number, member: ServerMember) => {
    setContent(<UserInfoCard x={x} y={y} member={member} />);
    setIsVisible(true);
  };

  const showBadgeInfoCard = (badgeElement: HTMLElement, badge: Badge) => {
    const rect = badgeElement.getBoundingClientRect();
    setContent(<BadgeInfoCard rect={rect} badge={badge} />);
    setIsVisible(true);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        closeContextMenu,
      }}
    >
      {isVisible && content}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
