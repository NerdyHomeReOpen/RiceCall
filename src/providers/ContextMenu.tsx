import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import { ContextMenuItem, ServerMember, Badge } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';

interface ContextMenuContextType {
  showContextMenu: (
    x: number,
    y: number,
    preferTop: boolean,
    preferLeft: boolean,
    items: ContextMenuItem[],
  ) => void;
  showUserInfoBlock: (
    x: number,
    y: number,
    preferTop: boolean,
    member: ServerMember,
  ) => void;
  showBadgeInfoCard: (
    x: number,
    y: number,
    preferTop: boolean,
    preferLeft: boolean,
    badge: Badge,
  ) => void;
  closeContextMenu: () => void;
  closeUserInfoBlock: () => void;
  closeBadgeInfoCard: () => void;
  isContextMenuVisible: boolean;
  isUserInfoVisible: boolean;
  isBadgeInfoVisible: boolean;
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
  const [isContextMenuVisible, setIsContextMenuVisible] = React.useState(false);
  const [isUserInfoVisible, setIsUserInfoVisible] = React.useState(false);
  const [isBadgeInfoVisible, setIsBadgeInfoVisible] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<ReactNode | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        (e.target as HTMLElement).closest('.context-menu-container') ||
        (e.target as HTMLElement).closest('.user-info-card-hover-wrapper')
      )
        return;
      if (isContextMenuVisible) closeContextMenu();
      if (isUserInfoVisible) closeUserInfoBlock();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (isContextMenuVisible) closeContextMenu();
      if (isUserInfoVisible) closeUserInfoBlock();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    const handleOuterContextMenu = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest('.context-menu-container') &&
        !(e.target as HTMLElement).closest('.user-info-card-hover-wrapper')
      ) {
        if (isContextMenuVisible) closeContextMenu();
        if (isUserInfoVisible) closeUserInfoBlock();
      }
    };
    document.addEventListener('contextmenu', handleOuterContextMenu);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleOuterContextMenu);
    };
  }, [isContextMenuVisible, isUserInfoVisible]);

  const showContextMenu = (
    x: number,
    y: number,
    preferTop: boolean,
    preferLeft: boolean,
    items: ContextMenuItem[],
  ) => {
    if (isUserInfoVisible) closeUserInfoBlock();
    setContextMenu(
      <ContextMenu
        items={items}
        onClose={closeContextMenu}
        x={x}
        y={y}
        preferTop={preferTop}
        preferLeft={preferLeft}
      />,
    );
    setIsContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsContextMenuVisible(false);
  };

  const showUserInfoBlock = (
    x: number,
    y: number,
    preferTop: boolean,
    member: ServerMember,
  ) => {
    if (isContextMenuVisible) return;
    if (isBadgeInfoVisible) closeBadgeInfoCard();
    setUserInfo(
      <UserInfoCard member={member} x={x} y={y} preferTop={preferTop} />,
    );
    setIsUserInfoVisible(true);
  };

  const closeUserInfoBlock = () => {
    setUserInfo(null);
    setIsUserInfoVisible(false);
  };

  const showBadgeInfoCard = (
    x: number,
    y: number,
    preferTop: boolean,
    preferLeft: boolean,
    badge: Badge,
  ) => {
    setBadgeInfo(
      <BadgeInfoCard
        badge={badge}
        x={x}
        y={y}
        preferTop={preferTop}
        preferLeft={preferLeft}
      />,
    );
    setIsBadgeInfoVisible(true);
  };

  const closeBadgeInfoCard = () => {
    setBadgeInfo(null);
    setIsBadgeInfoVisible(false);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        closeUserInfoBlock,
        closeBadgeInfoCard,
        closeContextMenu,
        isContextMenuVisible,
        isUserInfoVisible,
        isBadgeInfoVisible,
      }}
    >
      {isContextMenuVisible && contextMenu}
      {isUserInfoVisible && userInfo}
      {badgeInfo && badgeInfo}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
