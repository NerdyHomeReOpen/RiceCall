import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import type { ContextMenuItem, NotifyMenuItem, OnlineMember, Badge, User } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import MicContextMenu from '@/components/MicContextMenu';
import NotifyMenu from '@/components/NotifyMenu';
import UserInfoCard from '@/components/UserInfoCard';
import BadgeInfoCard from '@/components/BadgeInfoCard';
import EmojiPicker from '@/components/EmojiPicker';
import ColorPicker from '@/components/ColorPicker';
import StatusDropdown from '@/components/StatusDropdown';
import EmbedLinkInput from '@/components/EmbedLinkInput';
import UserTagInput from '@/components/UserTagInput';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => void;
  showMicContextMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => void;
  showNotifyMenu: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: NotifyMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: OnlineMember) => void;
  showBadgeInfoCard: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Badge) => void;
  showEmojiPicker: (
    x: number,
    y: number,
    position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom',
    onEmojiSelect: (code: string, full: string) => void,
    anchorEl?: HTMLElement | null,
    showFontbar?: boolean,
    isUserInfo?: boolean,
    fontSize?: 'small' | 'medium' | 'large',
    textColor?: string,
    onFontSizeChange?: (size: 'small' | 'medium' | 'large') => void,
    onTextColorChange?: (color: string) => void,
  ) => void;
  showColorPicker: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => void;
  showStatusDropdown: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: User['status']) => void) => void;
  showEmbedLinkInput: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (linkUrl: string) => void) => void;
  showUserTagInput: (x: number, y: number, position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (username: string) => void) => void;
  closeContextMenu: () => void;
  closeMicContextMenu: () => void;
  closeNotifyMenu: () => void;
  closeUserInfoBlock: () => void;
  closeBadgeInfoCard: () => void;
  closeEmojiPicker: () => void;
  closeColorPicker: () => void;
  closeStatusDropdown: () => void;
  closeEmbedLinkInput: () => void;
  closeUserTagInput: () => void;
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
  const [isNotifyMenuVisible, setIsNotifyMenuVisible] = React.useState(false);
  const [isUserInfoVisible, setIsUserInfoVisible] = React.useState(false);
  const [isBadgeInfoVisible, setIsBadgeInfoVisible] = React.useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = React.useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = React.useState(false);
  const [isStatusDropdownVisible, setIsStatusDropdownVisible] = React.useState(false);
  const [isEmbedLinkInputVisible, setIsEmbedLinkInputVisible] = React.useState(false);
  const [isUserTagInputVisible, setIsUserTagInputVisible] = React.useState(false);

  // States
  const [contextMenu, setContextMenu] = React.useState<ReactNode | null>(null);
  const [micContextMenu, setMicContextMenu] = React.useState<ReactNode | null>(null);
  const [notifyMenu, setNotifyMenu] = React.useState<ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<ReactNode | null>(null);
  const [emojiPicker, setEmojiPicker] = React.useState<ReactNode | null>(null);
  const [colorPicker, setColorPicker] = React.useState<ReactNode | null>(null);
  const [statusDropdown, setStatusDropdown] = React.useState<ReactNode | null>(null);
  const [embedLinkInput, setEmbedLinkInput] = React.useState<ReactNode | null>(null);
  const [userTagInput, setUserTagInput] = React.useState<ReactNode | null>(null);

  // Handlers
  const showContextMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => {
    setContextMenu(<ContextMenu items={items} onClose={closeContextMenu} x={x} y={y} direction={direction} />);
    setIsContextMenuVisible(true);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsContextMenuVisible(false);
  };

  const showMicContextMenu = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: ContextMenuItem[]) => {
    setMicContextMenu(<MicContextMenu items={items} onClose={closeMicContextMenu} x={x} y={y} direction={direction} />);
    setIsMicContextMenuVisible(true);
  };

  const closeMicContextMenu = () => {
    setMicContextMenu(null);
    setIsMicContextMenuVisible(false);
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

  const showEmojiPicker = (
    x: number,
    y: number,
    direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom',
    onEmojiSelect: (code: string, full: string) => void,
    anchorEl?: HTMLElement | null,
    showFontbar?: boolean,
    isUserInfo?: boolean,
    fontSize?: 'small' | 'medium' | 'large',
    textColor?: string,
    onFontSizeChange?: (size: 'small' | 'medium' | 'large') => void,
    onTextColorChange?: (color: string) => void,
  ) => {
    setEmojiPicker(
      <EmojiPicker
        onEmojiSelect={onEmojiSelect}
        x={x}
        y={y}
        direction={direction}
        anchorEl={anchorEl}
        showFontbar={showFontbar}
        isUserInfo={isUserInfo}
        fontSize={fontSize}
        textColor={textColor}
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

  const showStatusDropdown = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: User['status']) => void) => {
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

  const showUserTagInput = (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (username: string) => void) => {
    setUserTagInput(<UserTagInput onSubmit={onSubmit} onClose={closeUserTagInput} x={x} y={y} direction={direction} />);
    setIsUserTagInputVisible(true);
  };

  const closeUserTagInput = () => {
    setUserTagInput(null);
    setIsUserTagInputVisible(false);
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
        if (isNotifyMenuVisible) closeNotifyMenu();
        if (isColorPickerVisible) closeColorPicker();
        if (isStatusDropdownVisible) closeStatusDropdown();
        if (isEmbedLinkInputVisible) closeEmbedLinkInput();
        if (isUserTagInputVisible) closeUserTagInput();
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
    isNotifyMenuVisible,
    isColorPickerVisible,
    isStatusDropdownVisible,
    isEmbedLinkInputVisible,
    isUserTagInputVisible,
  ]);

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        showMicContextMenu,
        showNotifyMenu,
        showUserInfoBlock,
        showBadgeInfoCard,
        showEmojiPicker,
        showColorPicker,
        showStatusDropdown,
        showEmbedLinkInput,
        showUserTagInput,
        closeContextMenu,
        closeMicContextMenu,
        closeNotifyMenu,
        closeUserInfoBlock,
        closeBadgeInfoCard,
        closeEmojiPicker,
        closeColorPicker,
        closeStatusDropdown,
        closeEmbedLinkInput,
        closeUserTagInput,
      }}
    >
      {isContextMenuVisible && contextMenu}
      {isMicContextMenuVisible && micContextMenu}
      {isNotifyMenuVisible && notifyMenu}
      {isUserInfoVisible && userInfo}
      {badgeInfo && badgeInfo}
      {isEmojiPickerVisible && emojiPicker}
      {isColorPickerVisible && colorPicker}
      {isStatusDropdownVisible && statusDropdown}
      {isEmbedLinkInputVisible && embedLinkInput}
      {isUserTagInputVisible && userTagInput}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
