import React, { useEffect, useContext, createContext, ReactNode } from 'react';

import type * as Types from '@/types';

import ContextMenu from '@/components/ContextMenu';
import MicContextMenu from '@/components/MicContextMenu';
import NotificationMenu from '@/components/NotificationMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';
import EmojiPicker from '@/components/EmojiPicker';
import ColorPicker from '@/components/ColorPicker';
import StatusDropdown from '@/components/StatusDropdown';
import EmbedLinkInput from '@/components/EmbedLinkInput';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => void;
  showMicContextMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => void;
  showNotificationMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.NotificationMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: Types.OnlineMember) => void;
  showBadgeInfoCard: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Types.Badge) => void;
  showEmojiPicker: (
    x: number,
    y: number,
    position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom',
    anchorEl?: HTMLElement | null,
    showFontbar?: boolean,
    fontSize?: string,
    textColor?: string,
    onEmojiSelect?: (code: string, full: string) => void,
    onFontSizeChange?: (size: string) => void,
    onTextColorChange?: (color: string) => void,
  ) => void;
  showColorPicker: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => void;
  showStatusDropdown: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: Types.User['status']) => void) => void;
  showEmbedLinkInput: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (linkUrl: string) => void) => void;
  closeContextMenu: () => void;
  closeMicContextMenu: () => void;
  closeNotificationMenu: () => void;
  closeUserInfoBlock: () => void;
  closeBadgeInfoCard: () => void;
  closeEmojiPicker: () => void;
  closeColorPicker: () => void;
  closeStatusDropdown: () => void;
  closeEmbedLinkInput: () => void;
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
  // Refs
  const [isContextMenuVisible, setIsContextMenuVisible] = React.useState(false);
  const [isMicContextMenuVisible, setIsMicContextMenuVisible] = React.useState(false);
  const [isNotificationMenuVisible, setIsNotificationMenuVisible] = React.useState(false);
  const [isUserInfoVisible, setIsUserInfoVisible] = React.useState(false);
  const [isBadgeInfoVisible, setIsBadgeInfoVisible] = React.useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = React.useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = React.useState(false);
  const [isStatusDropdownVisible, setIsStatusDropdownVisible] = React.useState(false);
  const [isEmbedLinkInputVisible, setIsEmbedLinkInputVisible] = React.useState(false);

  // States
  const [contextMenu, setContextMenu] = React.useState<ReactNode | null>(null);
  const [micContextMenu, setMicContextMenu] = React.useState<ReactNode | null>(null);
  const [notificationMenu, setNotificationMenu] = React.useState<ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<ReactNode | null>(null);
  const [emojiPicker, setEmojiPicker] = React.useState<ReactNode | null>(null);
  const [colorPicker, setColorPicker] = React.useState<ReactNode | null>(null);
  const [statusDropdown, setStatusDropdown] = React.useState<ReactNode | null>(null);
  const [embedLinkInput, setEmbedLinkInput] = React.useState<ReactNode | null>(null);

  // Functions
  const showContextMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
    setContextMenu(<ContextMenu items={items} onClose={closeContextMenu} x={x} y={y} direction={direction} />);
    setIsContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsContextMenuVisible(false);
  };

  const showMicContextMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
    setMicContextMenu(<MicContextMenu items={items} onClose={closeMicContextMenu} x={x} y={y} direction={direction} />);
    setIsMicContextMenuVisible(true);
  };

  const closeMicContextMenu = () => {
    setMicContextMenu(null);
    setIsMicContextMenuVisible(false);
  };

  const showNotificationMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.NotificationMenuItem[]) => {
    setNotificationMenu(<NotificationMenu items={items} onClose={closeNotificationMenu} x={x} y={y} direction={direction} />);
    setIsNotificationMenuVisible(true);
  };

  const closeNotificationMenu = () => {
    setNotificationMenu(null);
    setIsNotificationMenuVisible(false);
  };

  const showUserInfoBlock = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: Types.OnlineMember) => {
    setUserInfo(<UserInfoCard member={member} x={x} y={y} direction={direction} />);
    setIsUserInfoVisible(true);
  };

  const closeUserInfoBlock = () => {
    setUserInfo(null);
    setIsUserInfoVisible(false);
  };

  const showBadgeInfoCard = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Types.Badge) => {
    setBadgeInfo(<BadgeInfoCard badge={badge} x={x} y={y} direction={direction} />);
    setIsBadgeInfoVisible(true);
  };

  const closeBadgeInfoCard = () => {
    setBadgeInfo(null);
    setIsBadgeInfoVisible(false);
  };

  const showEmojiPicker = (
    x: number,
    y: number,
    direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom',
    anchorEl?: HTMLElement | null,
    showFontbar?: boolean,
    fontSize?: string,
    textColor?: string,
    onEmojiSelect?: (code: string, full: string) => void,
    onFontSizeChange?: (size: string) => void,
    onTextColorChange?: (color: string) => void,
  ) => {
    setEmojiPicker(
      <EmojiPicker
        x={x}
        y={y}
        direction={direction}
        anchorEl={anchorEl}
        showFontbar={showFontbar}
        fontSize={fontSize}
        textColor={textColor}
        onEmojiSelect={onEmojiSelect}
        onFontSizeChange={onFontSizeChange}
        onTextColorChange={onTextColorChange}
      />,
    );
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

  const showStatusDropdown = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: Types.User['status']) => void) => {
    setStatusDropdown(<StatusDropdown onStatusSelect={onStatusSelect} onClose={closeStatusDropdown} x={x} y={y} direction={direction} />);
    setIsStatusDropdownVisible(true);
  };

  const closeStatusDropdown = () => {
    setStatusDropdown(null);
    setIsStatusDropdownVisible(false);
  };

  const showEmbedLinkInput = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (linkUrl: string) => void) => {
    setEmbedLinkInput(<EmbedLinkInput onSubmit={onSubmit} onClose={closeEmbedLinkInput} x={x} y={y} direction={direction} />);
    setIsEmbedLinkInputVisible(true);
  };

  const closeEmbedLinkInput = () => {
    setEmbedLinkInput(null);
    setIsEmbedLinkInputVisible(false);
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
        if (isMicContextMenuVisible) closeMicContextMenu();
        if (isEmojiPickerVisible) closeEmojiPicker();
        if (isNotificationMenuVisible) closeNotificationMenu();
        if (isStatusDropdownVisible) closeStatusDropdown();
        if (isEmbedLinkInputVisible) closeEmbedLinkInput();
      }
      if (!(e.target as HTMLElement).closest('.color-picker-container')) {
        if (isColorPickerVisible) closeColorPicker();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [
    isContextMenuVisible,
    isMicContextMenuVisible,
    isBadgeInfoVisible,
    isEmojiPickerVisible,
    isUserInfoVisible,
    isNotificationMenuVisible,
    isColorPickerVisible,
    isStatusDropdownVisible,
    isEmbedLinkInputVisible,
  ]);

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showMicContextMenu,
        showNotificationMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        showEmojiPicker,
        showColorPicker,
        showStatusDropdown,
        showEmbedLinkInput,
        closeContextMenu,
        closeMicContextMenu,
        closeNotificationMenu,
        closeUserInfoBlock,
        closeBadgeInfoCard,
        closeEmojiPicker,
        closeColorPicker,
        closeStatusDropdown,
        closeEmbedLinkInput,
      }}
    >
      {isContextMenuVisible && contextMenu}
      {isMicContextMenuVisible && micContextMenu}
      {isNotificationMenuVisible && notificationMenu}
      {isUserInfoVisible && userInfo}
      {badgeInfo && badgeInfo}
      {isEmojiPickerVisible && emojiPicker}
      {isColorPickerVisible && colorPicker}
      {isStatusDropdownVisible && statusDropdown}
      {isEmbedLinkInputVisible && embedLinkInput}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
