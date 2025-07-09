/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import { PopupType } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import UserSetting from '@/components/popups/UserSetting';
import ServerSetting from '@/components/popups/ServerSetting';
import ServerBroadcast from '@/components/popups/ServerBroadcast';
import BlockMember from '@/components/popups/BlockMember';
import ChannelSetting from '@/components/popups/ChannelSetting';
import SystemSetting from '@/components/popups/SystemSetting';
import ChannelPassword from '@/components/popups/ChannelPassword';
import MemberApplySetting from '@/components/popups/MemberApplySetting';
import CreateServer from '@/components/popups/CreateServer';
import CreateChannel from '@/components/popups/CreateChannel';
import CreateFriendGroup from '@/components/popups/CreateFriendGroup';
import EditChannelName from '@/components/popups/EditChannelName';
import EditChannelOrder from '@/components/popups/EditChannelOrder';
import EditNickname from '@/components/popups/EditNickname';
import EditFriendGroup from '@/components/popups/EditFriendGroup';
import EditFriend from '@/components/popups/EditFriend';
import ApplyFriend from '@/components/popups/ApplyFriend';
import ApplyMember from '@/components/popups/ApplyMember';
import DirectMessage from '@/components/popups/DirectMessage';
import SearchUser from '@/components/popups/SearchUser';
import Dialog from '@/components/popups/Dialog';
import ChangeTheme from '@/components/popups/ChangeTheme';
import About from '@/components/popups/About';
import FriendVerification from '@/components/popups/FriendVerification';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons, titleBoxIcon }) => {
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    if (isFullscreen) {
      ipcService.window.unmaximize();
    } else {
      ipcService.window.maximize();
    }
  };
  const handleMinimize = () => {
    ipcService.window.minimize();
  };
  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    const offMaximize = ipcService.window.onMaximize(() => setIsFullscreen(true));
    const offUnmaximize = ipcService.window.onUnmaximize(() => setIsFullscreen(false));
    return () => {
      offMaximize();
      offUnmaximize();
    };
  }, []);

  return (
    <header className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{title}</div>
        </div>
        <div className={header['buttons']}>
          {buttons.includes('minimize') && <div className={header['minimize']} onClick={handleMinimize} />}
          {buttons.includes('maxsize') && (
            <div className={isFullscreen ? header['restore'] : header['maxsize']} onClick={handleFullscreen} />
          )}
          {buttons.includes('close') && <div className={header['close']} onClick={handleClose} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const Popup = React.memo(() => {
  // Language
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<PopupType | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('');
  const [headerButtons, setHeaderButtons] = useState<('minimize' | 'maxsize' | 'close')[]>([]);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);
  const [directMessageTargetSignature, setDirectMessageTargetSignature] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as PopupType;
      const id = params.get('id') as string;
      setType(type || null);
      setId(id || null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    ipcService.initialData.request(id, (data) => {
      setInitialData(data);
    });
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        ipcService.window.close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const currentTargetId = initialData?.targetId;
    if (type === PopupType.DIRECT_MESSAGE && currentTargetId) {
      let isActive = true;
      setDirectMessageTargetSignature(null);

      getService
        .user({ userId: currentTargetId })
        .then((targetUser) => {
          if (isActive) {
            setDirectMessageTargetSignature(targetUser?.signature || '');
          }
        })
        .catch((error) => {
          if (isActive) {
            console.error('Failed to fetch target user for DM header:', error);
            setDirectMessageTargetSignature('');
          }
        });
      return () => {
        isActive = false;
      };
    } else if (type !== PopupType.DIRECT_MESSAGE) {
      if (directMessageTargetSignature !== null) {
        setDirectMessageTargetSignature(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, initialData?.targetId]);

  useEffect(() => {
    const popupInitialData = initialData;

    if (
      type !== PopupType.SYSTEM_SETTING &&
      type !== PopupType.CHANGE_THEME &&
      type !== PopupType.ABOUTUS &&
      !popupInitialData
    ) {
      return;
    }

    switch (type) {
      case PopupType.CHANNEL_PASSWORD:
        setHeaderTitle(t('please-enter-the-channel-password'));
        setHeaderButtons(['close']);
        setContent(<ChannelPassword {...popupInitialData} />);
        break;
      case PopupType.USER_INFO:
        setHeaderTitle(t('user-info'));
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case PopupType.USER_SETTING:
        setHeaderTitle(t('edit-user'));
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case PopupType.SERVER_SETTING:
        setHeaderTitle(t('edit-server'));
        setHeaderButtons(['close']);
        setContent(<ServerSetting {...popupInitialData} />);
        break;
      case PopupType.SERVER_BROADCAST:
        setHeaderTitle(t('server-broadcast'));
        setHeaderButtons(['close']);
        setContent(<ServerBroadcast {...popupInitialData} />);
        break;
      case PopupType.BLOCK_MEMBER:
        setHeaderTitle(t('block'));
        setHeaderButtons(['close']);
        setContent(<BlockMember {...popupInitialData} />);
        break;
      case PopupType.CHANNEL_SETTING:
        setHeaderTitle(t('edit-channel'));
        setHeaderButtons(['close']);
        setContent(<ChannelSetting {...popupInitialData} />);
        break;
      case PopupType.MEMBER_APPLY_SETTING:
        setHeaderTitle(t('member-apply-setting'));
        setHeaderButtons(['close']);
        setContent(<MemberApplySetting {...popupInitialData} />);
        break;
      case PopupType.SYSTEM_SETTING:
        setHeaderTitle(t('system-setting'));
        setHeaderButtons(['close']);
        setContent(<SystemSetting {...popupInitialData} />);
        break;
      case PopupType.CREATE_SERVER:
        setHeaderTitle(t('create-server'));
        setHeaderButtons(['close']);
        setContent(<CreateServer {...popupInitialData} />);
        break;
      case PopupType.CREATE_CHANNEL:
        setHeaderTitle(t('create-channel'));
        setHeaderButtons(['close']);
        setContent(<CreateChannel {...popupInitialData} />);
        break;
      case PopupType.CREATE_FRIENDGROUP:
        setHeaderTitle(t('create-friend-group'));
        setHeaderButtons(['close']);
        setContent(<CreateFriendGroup {...popupInitialData} />);
        break;
      case PopupType.EDIT_CHANNEL_ORDER:
        setHeaderTitle(t('edit-channel-order'));
        setHeaderButtons(['close']);
        setContent(<EditChannelOrder {...popupInitialData} />);
        break;
      case PopupType.EDIT_CHANNEL_NAME:
        setHeaderTitle(t('edit-channel-name'));
        setHeaderButtons(['close']);
        setContent(<EditChannelName {...popupInitialData} />);
        break;
      case PopupType.EDIT_NICKNAME:
        setHeaderTitle(t('edit-member-card'));
        setHeaderButtons(['close']);
        setContent(<EditNickname {...popupInitialData} />);
        break;
      case PopupType.EDIT_FRIENDGROUP:
        setHeaderTitle(t('edit-friend-group'));
        setHeaderButtons(['close']);
        setContent(<EditFriendGroup {...popupInitialData} />);
        break;
      case PopupType.EDIT_FRIEND:
        setHeaderTitle(t('edit-friend'));
        setHeaderButtons(['close']);
        setContent(<EditFriend {...popupInitialData} />);
        break;
      case PopupType.APPLY_MEMBER:
        setHeaderTitle(t('apply-member'));
        setHeaderButtons(['close']);
        setContent(<ApplyMember {...popupInitialData} />);
        break;
      case PopupType.APPLY_FRIEND:
        setHeaderTitle(t('apply-friend'));
        setHeaderButtons(['close']);
        setContent(<ApplyFriend {...popupInitialData} />);
        break;
      case PopupType.SEARCH_USER:
        setHeaderTitle(t('add-friend'));
        setHeaderButtons(['close']);
        setContent(<SearchUser {...popupInitialData} />);
        break;
      case PopupType.DIRECT_MESSAGE:
        setHeaderTitle(popupInitialData?.targetName || t('direct-message'));
        setHeaderButtons(['close', 'minimize', 'maxsize']);
        setContent(<DirectMessage {...popupInitialData} />);
        break;
      case PopupType.DIALOG_ALERT:
      case PopupType.DIALOG_ALERT2:
        setHeaderTitle(t('dialog-alert'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ALERT' }} />);
        break;
      case PopupType.DIALOG_SUCCESS:
        setHeaderTitle(t('dialog-success'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'SUCCESS' }} />);
        break;
      case PopupType.DIALOG_WARNING:
        setHeaderTitle(t('dialog-warning'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'WARNING' }} />);
        break;
      case PopupType.DIALOG_ERROR:
        setHeaderTitle(t('dialog-error'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ERROR' }} />);
        break;
      case PopupType.DIALOG_INFO:
        setHeaderTitle(t('dialog-info'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'INFO' }} />);
        break;
      case PopupType.CHANGE_THEME:
        setHeaderTitle(t('change-theme'));
        setHeaderButtons(['close']);
        setContent(<ChangeTheme {...popupInitialData} />);
        break;
      case PopupType.ABOUTUS:
        setHeaderTitle(t('about-ricecall'));
        setHeaderButtons(['close']);
        setContent(<About {...popupInitialData} />);
        break;
      case PopupType.FRIEND_VERIFICATION:
        setHeaderTitle(t('friend-verification'));
        setHeaderButtons(['close']);
        setContent(<FriendVerification {...popupInitialData} />);
        break;
      default:
        break;
    }
  }, [t, initialData, type]);

  return (
    <>
      {(type !== PopupType.USER_INFO || headerTitle !== t('user-info')) && headerButtons.length > 0 && (
        <Header
          title={headerTitle}
          buttons={headerButtons}
          titleBoxIcon={
            type === PopupType.CHANGE_THEME
              ? header['title-box-skin-icon']
              : type === PopupType.DIRECT_MESSAGE
              ? header['title-box-direct-message-icon']
              : undefined
          }
        />
      )}
      {content}
    </>
  );
});

Popup.displayName = 'Popup';

export default Popup;
