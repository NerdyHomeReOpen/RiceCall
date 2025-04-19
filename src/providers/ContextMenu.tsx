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
  showBadgeInfoCard: (
    badgeElement: HTMLElement,
    badge: Badge,
    preferBelow?: boolean,
  ) => void;
  closeContextMenu: () => void;
  closeUserInfoBlock: () => void;
  hideBadgeInfoCard: () => void;
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
  const [userInfo, setUserInfo] = React.useState<{
    x: number;
    y: number;
    member: ServerMember;
  } | null>(null);

  const [badgeInfo, setBadgeInfo] = React.useState<{
    rect: DOMRect;
    badge: Badge;
    preferBelow: boolean;
  } | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.context-menu-container')) return;
      if (isVisible) closeContextMenu();
      if (userInfo) closeUserInfoBlock();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (isVisible) closeContextMenu();
      if (userInfo) closeUserInfoBlock();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [isVisible, userInfo]);

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
    setUserInfo({ x, y, member });
  };

  const closeUserInfoBlock = () => {
    setUserInfo(null);
    setBadgeInfo(null);
  };

  const showBadgeInfoCard = (
    badgeElement: HTMLElement,
    badge: Badge,
    preferBelow: boolean = false,
  ) => {
    const rect = badgeElement.getBoundingClientRect();
    setBadgeInfo({ rect, badge, preferBelow });
  };

  const hideBadgeInfoCard = () => {
    setBadgeInfo(null);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showUserInfoBlock,
        closeUserInfoBlock,
        showBadgeInfoCard,
        hideBadgeInfoCard,
        closeContextMenu,
      }}
    >
      {isVisible && content}
      {userInfo && (
        <UserInfoCard x={userInfo.x} y={userInfo.y} member={userInfo.member} />
      )}
      {badgeInfo && (
        <BadgeInfoCard
          rect={badgeInfo.rect}
          badge={badgeInfo.badge}
          preferBelow={badgeInfo.preferBelow}
        />
      )}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
