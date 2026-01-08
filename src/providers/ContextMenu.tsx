import React, { useEffect, useContext, createContext, ReactNode, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

import type * as Types from '@/types';

import ContextMenu, { ContextMenuProps } from '@/components/ContextMenu';
import MicContextMenu, { MicContextMenuProps } from '@/components/MicContextMenu';
import NotificationMenu, { NotificationMenuProps } from '@/components/NotificationMenu';
import UserInfoCard, { UserInfoCardProps } from '@/components/UserInfoCard';
import BadgeInfoCard, { BadgeInfoCardProps } from '@/components/BadgeInfoCard';
import EmojiPicker, { EmojiPickerProps } from '@/components/EmojiPicker';
import ColorPicker, { ColorPickerProps } from '@/components/ColorPicker';
import StatusDropdown, { StatusDropdownProps } from '@/components/StatusDropdown';
import EmbedLinkInput, { EmbedLinkInputProps } from '@/components/EmbedLinkInput';

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
  const [contextMenuProps, setContextMenuProps] = React.useState<ContextMenuProps | null>(null);
  const [micContextMenuProps, setMicContextMenuProps] = React.useState<MicContextMenuProps | null>(null);
  const [notificationMenuProps, setNotificationMenuProps] = React.useState<NotificationMenuProps | null>(null);
  const [userInfoProps, setUserInfoProps] = React.useState<UserInfoCardProps | null>(null);
  const [badgeInfoProps, setBadgeInfoProps] = React.useState<BadgeInfoCardProps | null>(null);
  const [emojiPickerProps, setEmojiPickerProps] = React.useState<EmojiPickerProps | null>(null);
  const [colorPickerProps, setColorPickerProps] = React.useState<ColorPickerProps | null>(null);
  const [statusDropdownProps, setStatusDropdownProps] = React.useState<StatusDropdownProps | null>(null);
  const [embedLinkInputProps, setEmbedLinkInputProps] = React.useState<EmbedLinkInputProps | null>(null);

  // Functions
  const closeContextMenu = useCallback(() => {
    setContextMenuProps(null);
    setIsContextMenuVisible(false);
  }, []);

  const showContextMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
      setContextMenuProps({ x, y, direction, items, onClose: closeContextMenu });
      setIsContextMenuVisible(true);
    },
    [closeContextMenu],
  );

  const closeMicContextMenu = useCallback(() => {
    setMicContextMenuProps(null);
    setIsMicContextMenuVisible(false);
  }, []);

  const showMicContextMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
      setMicContextMenuProps({ x, y, direction, items, onClose: closeMicContextMenu });
      setIsMicContextMenuVisible(true);
    },
    [closeMicContextMenu],
  );

  const closeNotificationMenu = useCallback(() => {
    setNotificationMenuProps(null);
    setIsNotificationMenuVisible(false);
  }, []);

  const showNotificationMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.NotificationMenuItem[]) => {
      setNotificationMenuProps({ x, y, direction, items, onClose: closeNotificationMenu });
      setIsNotificationMenuVisible(true);
    },
    [closeNotificationMenu],
  );

  const showUserInfoBlock = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: Types.OnlineMember) => {
    setUserInfoProps({ x, y, direction, member });
    setIsUserInfoVisible(true);
  }, []);

  const closeUserInfoBlock = useCallback(() => {
    setUserInfoProps(null);
    setIsUserInfoVisible(false);
  }, []);

  const showBadgeInfoCard = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Types.Badge) => {
    setBadgeInfoProps({ x, y, direction, badge });
    setIsBadgeInfoVisible(true);
  }, []);

  const closeBadgeInfoCard = useCallback(() => {
    setBadgeInfoProps(null);
    setIsBadgeInfoVisible(false);
  }, []);

  const showEmojiPicker = useCallback(
    (
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
      setEmojiPickerProps({ x, y, direction, anchorEl, showFontbar, fontSize, textColor, onEmojiSelect, onFontSizeChange, onTextColorChange });
      setIsEmojiPickerVisible(true);
    },
    [],
  );

  const closeEmojiPicker = useCallback(() => {
    setEmojiPickerProps(null);
    setIsEmojiPickerVisible(false);
  }, []);

  const showColorPicker = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => {
    setColorPickerProps({ x, y, direction, onColorSelect });
    setIsColorPickerVisible(true);
  }, []);

  const closeColorPicker = useCallback(() => {
    setColorPickerProps(null);
    setIsColorPickerVisible(false);
  }, []);

  const closeStatusDropdown = useCallback(() => {
    setStatusDropdownProps(null);
    setIsStatusDropdownVisible(false);
  }, []);

  const showStatusDropdown = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: Types.User['status']) => void) => {
      setStatusDropdownProps({ x, y, direction, onStatusSelect, onClose: closeStatusDropdown });
      setIsStatusDropdownVisible(true);
    },
    [closeStatusDropdown],
  );

  const closeEmbedLinkInput = useCallback(() => {
    setEmbedLinkInputProps(null);
    setIsEmbedLinkInputVisible(false);
  }, []);

  const showEmbedLinkInput = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (linkUrl: string) => void) => {
      setEmbedLinkInputProps({ x, y, direction, onSubmit, onClose: closeEmbedLinkInput });
      setIsEmbedLinkInputVisible(true);
    },
    [closeEmbedLinkInput],
  );

  // Effects
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.user-info-card-container')) {
        closeUserInfoBlock();
      }
      if (!(e.target as HTMLElement).closest('.badge-info-card-container')) {
        closeBadgeInfoCard();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.context-menu-container')) {
        closeContextMenu();
        closeMicContextMenu();
        closeEmojiPicker();
        closeNotificationMenu();
        closeStatusDropdown();
        closeEmbedLinkInput();
      }
      if (!(e.target as HTMLElement).closest('.color-picker-container')) {
        closeColorPicker();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [closeContextMenu, closeMicContextMenu, closeNotificationMenu, closeUserInfoBlock, closeBadgeInfoCard, closeEmojiPicker, closeColorPicker, closeStatusDropdown, closeEmbedLinkInput]);

  const contextValue = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <ContextMenuContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {isContextMenuVisible && contextMenuProps && <ContextMenu {...contextMenuProps} />}
            {isMicContextMenuVisible && micContextMenuProps && <MicContextMenu {...micContextMenuProps} />}
            {isNotificationMenuVisible && notificationMenuProps && <NotificationMenu {...notificationMenuProps} />}
            {isUserInfoVisible && userInfoProps && <UserInfoCard {...userInfoProps} />}
            {isBadgeInfoVisible && badgeInfoProps && <BadgeInfoCard {...badgeInfoProps} />}
            {isEmojiPickerVisible && emojiPickerProps && <EmojiPicker {...emojiPickerProps} />}
            {isColorPickerVisible && colorPickerProps && <ColorPicker {...colorPickerProps} />}
            {isStatusDropdownVisible && statusDropdownProps && <StatusDropdown {...statusDropdownProps} />}
            {isEmbedLinkInputVisible && embedLinkInputProps && <EmbedLinkInput {...embedLinkInputProps} />}
          </>,
          document.body,
        )}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
