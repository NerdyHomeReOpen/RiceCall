/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { webEventEmitter } from '@/web/event';
import ipc from '@/ipc';

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

import Logger from '@/utils/logger';

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
  const handleClose = () => {
    ipc.popup.close(id);
  };

  return (
    <header data-draggable className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{t(title)}</div>
        </div>
        <div className={header['buttons']}>{buttons.includes('close') && <div className={header['close']} onClick={handleClose} />}</div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

interface PopupProviderProps {
  children: ReactNode;
}

type Popup = {
  id: string;
  type: Types.PopupType;
  title: string;
  buttons: ('close' | 'minimize' | 'maxsize')[];
  node: () => React.ReactNode | null;
  hideHeader: boolean;
  size: { height: number; width: number };
  position: { top: number; left: number };
};

const PopupProvider = ({ children }: PopupProviderProps) => {
  // States
  const [popups, setPopups] = useState<Popup[]>([]);

  // Refs
  const holdingPopupIdRef = useRef<string | null>(null);
  const topZIndexRef = useRef(201);
  const popupsRef = useRef<Popup[]>([]);

  const close = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPopup = useCallback((type: Types.PopupType, id: string, initialData?: any): Popup => {
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

    return {
      id,
      type,
      ...getPopupConfig(type),
      node: node[type as keyof typeof node],
      position: { top: 0, left: 0 },
    };
  }, []);

  const open = useCallback(
    async (type: Types.PopupType, id: string, initialData: any = {}, force = true) => {
      new Logger('Popup').info(`Opening ${type} (${id})...`);

      // If force is true, destroy the popup
      if (force) {
        close(id);
      } else {
        if (popupsRef.current.findIndex((p) => p.id === id) !== -1) return;
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
    [getPopup, close],
  );

  // Effects
  useEffect(() => {
    webEventEmitter.on('open-popup', open);
    return () => {
      webEventEmitter.off('open-popup', open);
    };
  }, [open]);

  useEffect(() => {
    webEventEmitter.on('close-popup', close);
    return () => {
      webEventEmitter.off('close-popup', close);
    };
  }, [close]);

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
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: popup.position.top,
            left: popup.position.left,
            zIndex: topZIndexRef.current,
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
            height: popup.size.height,
            width: popup.size.width,
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
          {popup.node?.() ?? null}
        </div>
      ))}
      {children}
    </>
  );
};

PopupProvider.displayName = 'PopupProvider';

export default PopupProvider;
