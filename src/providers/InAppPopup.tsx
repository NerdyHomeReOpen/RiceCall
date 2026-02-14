import { EventEmitter } from 'events';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { eventEmitter } from '@/web/event';
import ipc from '@/ipc';
import Logger from '@/logger';

import * as Types from '@/types';

import About from '@/popups/About';
import ApplyFriend from '@/popups/ApplyFriend';
import ApproveFriend from '@/popups/ApproveFriend';
import ApplyMember from '@/popups/ApplyMember';
import BlockMember from '@/popups/BlockMember';
import ChangeTheme from '@/popups/ChangeTheme';
import ChannelEvent from '@/popups/ChannelEvent';
import ChannelPassword from '@/popups/ChannelPassword';
import ChannelSetting from '@/popups/ChannelSetting';
import ChatHistory from '@/popups/ChatHistory';
import CreateChannel from '@/popups/CreateChannel';
import CreateFriendGroup from '@/popups/CreateFriendGroup';
import CreateServer from '@/popups/CreateServer';
import Dialog from '@/popups/Dialog';
import DirectMessage from '@/popups/DirectMessage';
import EditChannelName from '@/popups/EditChannelName';
import EditChannelOrder from '@/popups/EditChannelOrder';
import EditNickname from '@/popups/EditNickname';
import EditFriendNote from '@/popups/EditFriendNote';
import EditFriendGroupName from '@/popups/EditFriendGroupName';
import FriendVerification from '@/popups/FriendVerification';
import KickMemberFromChannel from '@/popups/KickMemberFromChannel';
import KickMemberFromServer from '@/popups/KickMemberFromServer';
import MemberApplicationSetting from '@/popups/MemberApplicationSetting';
import MemberInvitation from '@/popups/MemberInvitation';
import NetworkDiagnosis from '@/popups/NetworkDiagnosis';
import ImageCropper from '@/popups/ImageCropper';
import InviteFriend from '@/popups/InviteFriend';
import InviteMember from '@/popups/InviteMember';
import SearchUser from '@/popups/SearchUser';
import ServerAnnouncement from '@/popups/ServerAnnouncement';
import ServerApplication from '@/popups/ServerApplication';
import ServerSetting from '@/popups/ServerSetting';
import ServerBroadcast from '@/popups/ServerBroadcast';
import SystemSetting from '@/popups/SystemSetting';
import UserInfo from '@/popups/UserInfo';

import { getPopupConfig } from '@/popup.config';

import header from '@/styles/header.module.css';

const PopupEmitter = new EventEmitter();
PopupEmitter.setMaxListeners(100);

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
  id: string;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons, titleBoxIcon, id }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  const handleMinimizeBtnClick = () => {
    ipc.window.minimize(id);
  };

  return (
    <header data-draggable className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{t(title)}</div>
        </div>
        <div className={header['buttons']}>
          {buttons.includes('minimize') && <div className={header['minimize']} onClick={handleMinimizeBtnClick} title={t('minimize')} />}
          {buttons.includes('maxsize') && <div className={header['maxsize']} title={t('maximize')} />}
          {buttons.includes('close') && <div className={header['close']} onClick={handleCloseBtnClick} title={t('close')} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

interface MaximizedPopupProps {
  id: string;
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  onRestore: () => void;
}

const MaximizedPopup: React.FC<MaximizedPopupProps> = React.memo(({ title, buttons, id, onRestore }) => {
  // Hooks
  const { t } = useTranslation();

  // Handlers
  const handleRestoreBtnClick = () => {
    onRestore();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <button key={id} type="button" onClick={handleRestoreBtnClick} title={t(title)} className={header['maximized-popup-header']}>
      <div className={header['title']}>{t(title)}</div>
      {buttons.includes('close') && <div className={header['close']} onClick={handleCloseBtnClick} title={t('close')} />}
    </button>
  );
});

MaximizedPopup.displayName = 'MaximizedPopup';

interface PopupProviderProps {
  children: ReactNode;
}

const PopupProvider = ({ children }: PopupProviderProps) => {
  // States
  const [popups, setPopups] = useState<Types.Popup[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set());

  // Refs
  const holdingPopupIdRef = useRef<string | null>(null);
  const topZIndexRef = useRef(201);
  const popupsRef = useRef<Types.Popup[]>([]);

  // Variables
  const minimizedPopups = popups.filter((p) => minimizedIds.has(p.id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPopup = useCallback((type: Types.PopupType, id: string, initialData: any): Types.Popup => {
    const node: Record<Types.PopupType, () => React.ReactNode> = {
      aboutus: () => <About id={id} {...initialData} />,
      applyFriend: () => <ApplyFriend id={id} {...initialData} />,
      applyMember: () => <ApplyMember id={id} {...initialData} />,
      approveFriend: () => <ApproveFriend id={id} {...initialData} />,
      blockMember: () => <BlockMember id={id} {...initialData} />,
      changeTheme: () => <ChangeTheme id={id} {...initialData} />,
      channelEvent: () => <ChannelEvent id={id} {...initialData} />,
      channelPassword: () => <ChannelPassword id={id} {...initialData} />,
      channelSetting: () => <ChannelSetting id={id} {...initialData} />,
      chatHistory: () => <ChatHistory id={id} {...initialData} />,
      createChannel: () => <CreateChannel id={id} {...initialData} />,
      createFriendGroup: () => <CreateFriendGroup id={id} {...initialData} />,
      createServer: () => <CreateServer id={id} {...initialData} />,
      dialogAlert: () => <Dialog id={id} iconType="ALERT" {...initialData} />,
      dialogAlert2: () => <Dialog id={id} iconType="ALERT" {...initialData} />,
      dialogError: () => <Dialog id={id} iconType="ERROR" {...initialData} />,
      dialogInfo: () => <Dialog id={id} iconType="INFO" {...initialData} />,
      dialogSuccess: () => <Dialog id={id} iconType="SUCCESS" {...initialData} />,
      dialogWarning: () => <Dialog id={id} iconType="WARNING" {...initialData} />,
      directMessage: () => <DirectMessage id={id} {...initialData} />,
      editChannelOrder: () => <EditChannelOrder id={id} {...initialData} />,
      editChannelName: () => <EditChannelName id={id} {...initialData} />,
      editFriendNote: () => <EditFriendNote id={id} {...initialData} />,
      editFriendGroupName: () => <EditFriendGroupName id={id} {...initialData} />,
      editNickname: () => <EditNickname id={id} {...initialData} />,
      friendVerification: () => <FriendVerification id={id} {...initialData} />,
      imageCropper: () => <ImageCropper id={id} {...initialData} />,
      inviteFriend: () => <InviteFriend id={id} {...initialData} />,
      inviteMember: () => <InviteMember id={id} {...initialData} />,
      kickMemberFromChannel: () => <KickMemberFromChannel id={id} {...initialData} />,
      kickMemberFromServer: () => <KickMemberFromServer id={id} {...initialData} />,
      memberApplicationSetting: () => <MemberApplicationSetting id={id} {...initialData} />,
      memberInvitation: () => <MemberInvitation id={id} {...initialData} />,
      networkDiagnosis: () => <NetworkDiagnosis id={id} {...initialData} />,
      searchUser: () => <SearchUser id={id} {...initialData} />,
      serverAnnouncement: () => <ServerAnnouncement id={id} {...initialData} />,
      serverApplication: () => <ServerApplication id={id} {...initialData} />,
      serverBroadcast: () => <ServerBroadcast id={id} {...initialData} />,
      serverSetting: () => <ServerSetting id={id} {...initialData} />,
      systemSetting: () => <SystemSetting id={id} {...initialData} />,
      userInfo: () => <UserInfo id={id} {...initialData} />,
      userSetting: () => <UserInfo id={id} {...initialData} />,
    };

    const config = getPopupConfig(type);

    switch (type) {
      case 'channelSetting':
        config.title = initialData?.channel?.name ?? config.title;
        break;
      case 'directMessage':
        config.title = initialData?.target?.name ?? config.title;
        break;
      case 'userInfo':
        config.title = initialData?.target?.name ?? config.title;
        break;
      case 'serverSetting':
        config.title = initialData?.server?.name ?? config.title;
        break;
    }

    return {
      id,
      type,
      position: { top: 0, left: 0 },
      ...config,
      node: node[type as keyof typeof node],
    };
  }, []);

  const close = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const restore = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const open = useCallback(
    async (type: Types.PopupType, id: string, initialData: unknown = {}, force = true) => {
      new Logger('Popup').info(`Opening ${type} (${id})...`);

      // If force is true, destroy the popup
      if (force) {
        close(id);
      } else {
        if (popupsRef.current.findIndex((p) => p.id === id) !== -1) {
          restore(id);

          const popupEl = document.querySelector(`[data-popup-id="${id}"]`) as HTMLElement;
          if (!popupEl) return;

          topZIndexRef.current++;
          popupEl.style.zIndex = `${topZIndexRef.current}`;

          return;
        }
      }

      const popup = getPopup(type, id, initialData);

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const popupWidth = popup.size.width;
      const popupHeight = popup.size.height;

      const centerX = Math.max(0, (screenWidth - popupWidth) / 2);
      const centerY = Math.max(0, (screenHeight - popupHeight) / 2);

      setPopups((prev) => [...prev, { ...popup, position: { top: centerY, left: centerX } }]);
    },
    [getPopup, close, restore],
  );

  // Effects
  useEffect(() => {
    eventEmitter.on('open-popup', open);
    return () => {
      eventEmitter.off('open-popup', open);
    };
  }, [open]);

  useEffect(() => {
    eventEmitter.on('close-popup', close);
    return () => {
      eventEmitter.off('close-popup', close);
    };
  }, [close]);

  useEffect(() => {
    eventEmitter.on('minimize-popup', minimize);
    return () => {
      eventEmitter.off('minimize-popup', minimize);
    };
  }, [minimize]);

  useEffect(() => {
    eventEmitter.on('restore-popup', restore);
    return () => {
      eventEmitter.off('restore-popup', restore);
    };
  }, [restore]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let popupStartX = 0;
    let popupStartY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;

      const popupEl = el.closest('[data-popup-id]') as HTMLElement | null;
      if (!popupEl) return;

      topZIndexRef.current++;
      popupEl.style.zIndex = `${topZIndexRef.current}`;

      if (!el.closest('[data-draggable]')) return;

      const id = popupEl.getAttribute('data-popup-id');
      if (!id) return;

      holdingPopupIdRef.current = id;

      startX = e.clientX;
      startY = e.clientY;
      popupStartX = popupEl.offsetLeft;
      popupStartY = popupEl.offsetTop;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const id = holdingPopupIdRef.current;
      if (!id) return;

      const popupEl = document.querySelector(`[data-popup-id="${id}"]`) as HTMLElement;
      if (!popupEl) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = popupStartX + dx;
      let newTop = popupStartY + dy;

      const popupWidth = popupEl.offsetWidth;
      const popupHeight = popupEl.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - popupWidth));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - popupHeight));

      popupEl.style.left = `${newLeft}px`;
      popupEl.style.top = `${newTop}px`;
    };

    const handleMouseUp = () => {
      holdingPopupIdRef.current = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    popupsRef.current = popups;
  }, [popups]);

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          data-popup-id={popup.id}
          style={{
            display: minimizedIds.has(popup.id) ? 'none' : 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: popup.position.top,
            left: popup.position.left,
            zIndex: topZIndexRef.current,
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
            height: popup.size.height,
            width: popup.size.width,
            overflow: 'hidden',
          }}
        >
          {!popup.hideHeader && (
            <Header
              title={popup.title}
              buttons={popup.buttons}
              titleBoxIcon={popup.type === 'changeTheme' ? header['title-box-skin-icon'] : popup.type === 'directMessage' ? header['title-box-direct-message-icon'] : undefined}
              id={popup.id}
            />
          )}
          {popup.node()}
        </div>
      ))}
      {minimizedPopups.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {minimizedPopups.map((popup) => (
            <MaximizedPopup key={popup.id} id={popup.id} title={popup.title} buttons={popup.buttons} onRestore={() => restore(popup.id)} />
          ))}
        </div>
      )}
      {children}
    </>
  );
};

PopupProvider.displayName = 'PopupProvider';

export default PopupProvider;
