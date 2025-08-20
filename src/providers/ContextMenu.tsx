import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import type { ContextMenuItem, NotifyMenuItem, OnlineMember, Badge } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import NotifyMenu from '@/components/NotifyMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';
import EmojiPicker from '@/components/EmojiPicker';
import ColorPicker from '@/components/ColorPicker';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => void;
  showNotifyMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: NotifyMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: OnlineMember) => void;
  showBadgeInfoCard: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Badge) => void;
  showEmojiPicker: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onEmojiSelect: (code: string, full: string) => void) => void;
  showColorPicker: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => void;
  closeContextMenu: () => void;
  closeNotifyMenu: () => void;
  closeUserInfoBlock: () => void;
  closeBadgeInfoCard: () => void;
  closeEmojiPicker: () => void;
  closeColorPicker: () => void;
  isContextMenuVisible: boolean;
  isNotifyMenuVisible: boolean;
  isUserInfoVisible: boolean;
  isBadgeInfoVisible: boolean;
  isEmojiPickerVisible: boolean;
  isColorPickerVisible: boolean;
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
  const [isColorPickerVisible, setIsColorPickerVisible] = React.useState(false);

  const [contextMenu, setContextMenu] = React.useState<ReactNode | null>(null);
  const [notifyMenu, setNotifyMenu] = React.useState<ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<ReactNode | null>(null);
  const [emojiPicker, setEmojiPicker] = React.useState<ReactNode | null>(null);
  const [colorPicker, setColorPicker] = React.useState<ReactNode | null>(null);

  // Handlers
  const showContextMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => {
    setContextMenu(<ContextMenu items={items} onClose={closeContextMenu} x={x} y={y} direction={direction} />);
    setIsContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsContextMenuVisible(false);
  };

  const showNotifyMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: NotifyMenuItem[]) => {
    setNotifyMenu(<NotifyMenu items={items} onClose={closeNotifyMenu} x={x} y={y} direction={direction} />);
    setIsNotifyMenuVisible(true);
  };

  const closeNotifyMenu = () => {
    setNotifyMenu(null);
    setIsNotifyMenuVisible(false);
  };

  const showUserInfoBlock = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: OnlineMember) => {
    setUserInfo(<UserInfoCard member={member} x={x} y={y} direction={direction} />);
    setIsUserInfoVisible(true);
  };

  const closeUserInfoBlock = () => {
    setUserInfo(null);
    setIsUserInfoVisible(false);
  };

  const showBadgeInfoCard = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Badge) => {
    setBadgeInfo(<BadgeInfoCard badge={badge} x={x} y={y} direction={direction} />);
    setIsBadgeInfoVisible(true);
  };

  const closeBadgeInfoCard = () => {
    setBadgeInfo(null);
    setIsBadgeInfoVisible(false);
  };

  const showEmojiPicker = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onEmojiSelect: (code: string, full: string) => void) => {
    setEmojiPicker(<EmojiPicker onEmojiSelect={onEmojiSelect} x={x} y={y} direction={direction} />);
    setIsEmojiPickerVisible(true);
  };

  const closeEmojiPicker = () => {
    setEmojiPicker(null);
    setIsEmojiPickerVisible(false);
  };

  const showColorPicker = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => {
    setColorPicker(<ColorPicker onColorSelect={onColorSelect} x={x} y={y} direction={direction} />);
    setIsColorPickerVisible(true);
  };

  const closeColorPicker = () => {
    setColorPicker(null);
    setIsColorPickerVisible(false);
  };

  // Effects
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.user-info-card-container')) {
        if (isUserInfoVisible) closeUserInfoBlock();
      }
      if (!(e.target as HTMLElement).closest('.badge-info-card-container')) {
        if (isBadgeInfoVisible) closeBadgeInfoCard();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.context-menu-container')) {
        if (isContextMenuVisible) closeContextMenu();
        if (isBadgeInfoVisible) closeBadgeInfoCard();
        if (isEmojiPickerVisible) closeEmojiPicker();
        if (isNotifyMenuVisible) closeNotifyMenu();
        if (isColorPickerVisible) closeColorPicker();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [isContextMenuVisible, isBadgeInfoVisible, isEmojiPickerVisible, isUserInfoVisible, isNotifyMenuVisible, isColorPickerVisible]);

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showNotifyMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        showEmojiPicker,
        showColorPicker,
        closeContextMenu,
        closeNotifyMenu,
        closeUserInfoBlock,
        closeBadgeInfoCard,
        closeEmojiPicker,
        closeColorPicker,
        isContextMenuVisible,
        isNotifyMenuVisible,
        isUserInfoVisible,
        isBadgeInfoVisible,
        isEmojiPickerVisible,
        isColorPickerVisible,
      }}
    >
      {isContextMenuVisible && contextMenu}
      {isNotifyMenuVisible && notifyMenu}
      {isUserInfoVisible && userInfo}
      {badgeInfo && badgeInfo}
      {isEmojiPickerVisible && emojiPicker}
      {isColorPickerVisible && colorPicker}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
