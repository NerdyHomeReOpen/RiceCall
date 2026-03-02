import React, { useEffect, useContext, createContext, ReactNode, useCallback, useMemo } from 'react';

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
  // States
  const [contextMenu, setContextMenu] = React.useState<React.ReactNode | null>(null);
  const [micContextMenu, setMicContextMenu] = React.useState<React.ReactNode | null>(null);
  const [notificationMenu, setNotificationMenu] = React.useState<React.ReactNode | null>(null);
  const [userInfo, setUserInfo] = React.useState<React.ReactNode | null>(null);
  const [badgeInfo, setBadgeInfo] = React.useState<React.ReactNode | null>(null);
  const [emojiPicker, setEmojiPicker] = React.useState<React.ReactNode | null>(null);
  const [colorPicker, setColorPicker] = React.useState<React.ReactNode | null>(null);
  const [statusDropdown, setStatusDropdown] = React.useState<React.ReactNode | null>(null);
  const [embedLinkInput, setEmbedLinkInput] = React.useState<React.ReactNode | null>(null);

  // Functions
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const showContextMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
      setContextMenu(<ContextMenu x={x} y={y} direction={direction} items={items} onClose={closeContextMenu} />);
    },
    [closeContextMenu],
  );

  const closeMicContextMenu = useCallback(() => {
    setMicContextMenu(null);
  }, []);

  const showMicContextMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.ContextMenuItem[]) => {
      setMicContextMenu(<MicContextMenu x={x} y={y} direction={direction} items={items} onClose={closeMicContextMenu} />);
    },
    [closeMicContextMenu],
  );

  const closeNotificationMenu = useCallback(() => {
    setNotificationMenu(null);
  }, []);

  const showNotificationMenu = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', items: Types.NotificationMenuItem[]) => {
      setNotificationMenu(<NotificationMenu x={x} y={y} direction={direction} items={items} onClose={closeNotificationMenu} />);
    },
    [closeNotificationMenu],
  );

  const closeUserInfoBlock = useCallback(() => {
    setUserInfo(null);
  }, []);

  const showUserInfoBlock = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', member: Types.OnlineMember) => {
    setUserInfo(<UserInfoCard x={x} y={y} direction={direction} member={member} />);
  }, []);

  const closeBadgeInfoCard = useCallback(() => {
    setBadgeInfo(null);
  }, []);

  const showBadgeInfoCard = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', badge: Types.Badge) => {
    setBadgeInfo(<BadgeInfoCard x={x} y={y} direction={direction} badge={badge} />);
  }, []);

  const closeEmojiPicker = useCallback(() => {
    setEmojiPicker(null);
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
    },
    [],
  );

  const closeColorPicker = useCallback(() => {
    setColorPicker(null);
  }, []);

  const showColorPicker = useCallback((x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onColorSelect: (color: string) => void) => {
    setColorPicker(<ColorPicker x={x} y={y} direction={direction} onColorSelect={onColorSelect} />);
  }, []);

  const closeStatusDropdown = useCallback(() => {
    setStatusDropdown(null);
  }, []);

  const showStatusDropdown = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onStatusSelect: (status: Types.User['status']) => void) => {
      setStatusDropdown(<StatusDropdown x={x} y={y} direction={direction} onStatusSelect={onStatusSelect} onClose={closeStatusDropdown} />);
    },
    [closeStatusDropdown],
  );

  const closeEmbedLinkInput = useCallback(() => {
    setEmbedLinkInput(null);
  }, []);

  const showEmbedLinkInput = useCallback(
    (x: number, y: number, direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom', onSubmit: (linkUrl: string) => void) => {
      setEmbedLinkInput(<EmbedLinkInput x={x} y={y} direction={direction} onSubmit={onSubmit} onClose={closeEmbedLinkInput} />);
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
      {contextMenu}
      {micContextMenu}
      {notificationMenu}
      {userInfo}
      {badgeInfo}
      {emojiPicker}
      {colorPicker}
      {statusDropdown}
      {embedLinkInput}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;
