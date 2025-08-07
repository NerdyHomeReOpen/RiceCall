import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import type { ContextMenuItem, NotifyMenuItem, Member, Badge } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import NotifyMenu from '@/components/NotifyMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';
import EmojiPicker from '@/components/EmojiPicker';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, preferTop: boolean, preferLeft: boolean, items: ContextMenuItem[]) => void;
  showNotifyMenu: (x: number, y: number, preferTop: boolean, preferLeft: boolean, items: NotifyMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, preferTop: boolean, member: Member) => void;
  showBadgeInfoCard: (x: number, y: number, preferTop: boolean, preferLeft: boolean, badge: Badge) => void;
  showEmojiPicker: (x: number, y: number, preferTop: boolean, type: 'custom' | 'unicode', onEmojiSelect: (emoji: string) => void) => void;
  closeContextMenu: () => void;
  closeNotifyMenu: () => void;
  closeUserInfoBlock: () => void;
  closeBadgeInfoCard: () => void;
  closeEmojiPicker: () => void;
  isContextMenuVisible: boolean;
  isNotifyMenuVisible: boolean;
  isUserInfoVisible: boolean;
  isBadgeInfoVisible: boolean;
  isEmojiPickerVisible: boolean;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error('useContextMenu must be used within a ContextMenuProvider');
  return context;
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  // States
  const [isContextMenuVisible, setIsContextMenuVisible] = React.useState(false);
  const [isNotifyMenuVisible, setIsNotifyMenuVisible] = React.useState(false);
  const [isUserInfoVisible, setIsUserInfoVisible] = React.useState(false);
  const [isBadgeInfoVisible, setIsBadgeInfoVisible] = React.useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = React.useState(false);

  const [contextMenu, setContextMenu] = React.useState<ReactNode | null>(null);
  const [notifyMenu, setNotifyMenu] = React.useState<ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<ReactNode | null>(null);
  const [emojiPicker, setEmojiPicker] = React.useState<ReactNode | null>(null);

  // Handlers
  const showContextMenu = (x: number, y: number, preferTop: boolean, preferLeft: boolean, items: ContextMenuItem[]) => {
    setContextMenu(<ContextMenu items={items} onClose={closeContextMenu} x={x} y={y} preferTop={preferTop} preferLeft={preferLeft} />);
    setIsContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsContextMenuVisible(false);
  };

  const showNotifyMenu = (x: number, y: number, preferTop: boolean, preferLeft: boolean, items: ContextMenuItem[]) => {
    setNotifyMenu(<NotifyMenu items={items} onClose={closeNotifyMenu} x={x} y={y} preferTop={preferTop} preferLeft={preferLeft} />);
    setIsNotifyMenuVisible(true);
  };

  const closeNotifyMenu = () => {
    setNotifyMenu(null);
    setIsNotifyMenuVisible(false);
  };

  const showUserInfoBlock = (x: number, y: number, preferTop: boolean, member: Member) => {
    setUserInfo(<UserInfoCard member={member} x={x} y={y} preferTop={preferTop} />);
    setIsUserInfoVisible(true);
  };

  const closeUserInfoBlock = () => {
    setUserInfo(null);
    setIsUserInfoVisible(false);
  };

  const showBadgeInfoCard = (x: number, y: number, preferTop: boolean, preferLeft: boolean, badge: Badge) => {
    setBadgeInfo(<BadgeInfoCard badge={badge} x={x} y={y} preferTop={preferTop} preferLeft={preferLeft} />);
    setIsBadgeInfoVisible(true);
  };

  const closeBadgeInfoCard = () => {
    setBadgeInfo(null);
    setIsBadgeInfoVisible(false);
  };

  const showEmojiPicker = (x: number, y: number, preferTop: boolean, type: 'custom' | 'unicode', onEmojiSelect: (emoji: string) => void) => {
    setEmojiPicker(<EmojiPicker type={type} onEmojiSelect={onEmojiSelect} x={x} y={y} preferTop={preferTop} />);
    setIsEmojiPickerVisible(true);
  };

  const closeEmojiPicker = () => {
    setEmojiPicker(null);
    setIsEmojiPickerVisible(false);
  };

  // Effects
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.context-menu-container')) return;
      if (isUserInfoVisible) closeUserInfoBlock();
    };
    const onPointerDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.context-menu-container')) return;
      if (isContextMenuVisible) closeContextMenu();
      if (isBadgeInfoVisible) closeBadgeInfoCard();
      if (isEmojiPickerVisible) closeEmojiPicker();
      if (isNotifyMenuVisible) closeNotifyMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [isContextMenuVisible, isBadgeInfoVisible, isEmojiPickerVisible, isUserInfoVisible, isNotifyMenuVisible]);

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showNotifyMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        showEmojiPicker,
        closeContextMenu,
        closeNotifyMenu,
        closeUserInfoBlock,
        closeBadgeInfoCard,
        closeEmojiPicker,
        isContextMenuVisible,
        isNotifyMenuVisible,
        isUserInfoVisible,
        isBadgeInfoVisible,
        isEmojiPickerVisible,
      }}
    >
      {isContextMenuVisible && contextMenu}
      {isNotifyMenuVisible && notifyMenu}
      {isUserInfoVisible && userInfo}
      {badgeInfo && badgeInfo}
      {isEmojiPickerVisible && emojiPicker}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
