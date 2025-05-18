import React, {
  useEffect,
  useContext,
  createContext,
  ReactNode,
  useRef,
} from 'react';

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
    items: ContextMenuItem[],
    target?: HTMLElement,
  ) => void;
  showUserInfoBlock: (x: number, y: number, member: ServerMember) => void;
  showBadgeInfoCard: (
    badgeElement: HTMLElement,
    badge: Badge,
    preferBelow?: boolean,
  ) => void;
  closeContextMenu: () => void;
  closeUserInfoBlock: () => void;
  hideBadgeInfoCard: () => void;
  isContextMenuVisible: boolean;
  requestDelayedCloseUserInfoBlock: () => void;
  cancelDelayedCloseUserInfoBlock: () => void;
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

  const hideUserInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const HIDE_USER_INFO_DELAY = 100;

  const clearHideUserInfoTimeout = () => {
    if (hideUserInfoTimeoutRef.current) {
      clearTimeout(hideUserInfoTimeoutRef.current);
      hideUserInfoTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        (e.target as HTMLElement).closest('.context-menu-container') ||
        (e.target as HTMLElement).closest('.user-info-card-hover-wrapper')
      )
        return;
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

    const handleOuterContextMenu = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest('.context-menu-container') &&
        !(e.target as HTMLElement).closest('.user-info-card-hover-wrapper')
      ) {
        if (isVisible) closeContextMenu();
        if (userInfo) closeUserInfoBlock();
      }
    };
    document.addEventListener('contextmenu', handleOuterContextMenu);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleOuterContextMenu);
      clearHideUserInfoTimeout();
    };
  }, [isVisible, userInfo]);

  const showContextMenu = (
    x: number,
    y: number,
    items: ContextMenuItem[],
    target?: HTMLElement,
  ) => {
    if (userInfo) closeUserInfoBlock();

    setContent(
      <ContextMenu
        x={x}
        y={y}
        items={items}
        target={target}
        onClose={closeContextMenu}
      />,
    );

    setIsVisible(true);
  };

  const showUserInfoBlock = (x: number, y: number, member: ServerMember) => {
    clearHideUserInfoTimeout();
    setUserInfo({ x, y, member });
  };

  const closeUserInfoBlock = () => {
    clearHideUserInfoTimeout();
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

  const requestDelayedCloseUserInfoBlock = () => {
    clearHideUserInfoTimeout();
    hideUserInfoTimeoutRef.current = setTimeout(() => {
      closeUserInfoBlock();
    }, HIDE_USER_INFO_DELAY);
  };

  const cancelDelayedCloseUserInfoBlock = () => {
    clearHideUserInfoTimeout();
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
        isContextMenuVisible: isVisible,
        requestDelayedCloseUserInfoBlock,
        cancelDelayedCloseUserInfoBlock,
      }}
    >
      {isVisible && content}
      {userInfo && (
        <div
          className="user-info-card-hover-wrapper"
          onMouseEnter={cancelDelayedCloseUserInfoBlock}
          onMouseLeave={requestDelayedCloseUserInfoBlock}
        >
          <UserInfoCard
            x={userInfo.x}
            y={userInfo.y}
            member={userInfo.member}
          />
        </div>
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
