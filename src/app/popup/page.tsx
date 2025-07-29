/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { PopupType } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import UserSetting from '@/components/popups/UserSetting';
import ServerSetting from '@/components/popups/ServerSetting';
import ServerBroadcast from '@/components/popups/ServerBroadcast';
import BlockMember from '@/components/popups/BlockMember';
import ChannelSetting from '@/components/popups/ChannelSetting';
import SystemSetting from '@/components/popups/SystemSetting';
import AvatarCropper from '@/components/popups/AvatarCropper';
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
          {buttons.includes('maxsize') && <div className={isFullscreen ? header['restore'] : header['maxsize']} onClick={handleFullscreen} />}
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
    if (type === 'directMessage' && currentTargetId) {
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
    } else if (type !== 'directMessage') {
      if (directMessageTargetSignature !== null) {
        setDirectMessageTargetSignature(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, initialData?.targetId]);

  useEffect(() => {
    const popupInitialData = initialData;

    if (type !== 'systemSetting' && type !== 'changeTheme' && type !== 'aboutus' && !popupInitialData) {
      return;
    }

    switch (type) {
      case 'avatarCropper':
        setHeaderTitle(t('avatar-cropper'));
        setHeaderButtons(['close']);
        setContent(<AvatarCropper {...popupInitialData} />);
        break;
      case 'channelPassword':
        setHeaderTitle(t('please-enter-the-channel-password'));
        setHeaderButtons(['close']);
        setContent(<ChannelPassword {...popupInitialData} />);
        break;
      case 'userInfo':
        setHeaderTitle(t('user-info'));
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case 'userSetting':
        setHeaderTitle(t('edit-user'));
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case 'serverSetting':
        setHeaderTitle(t('edit-server'));
        setHeaderButtons(['close']);
        setContent(<ServerSetting {...popupInitialData} />);
        break;
      case 'serverBroadcast':
        setHeaderTitle(t('server-broadcast'));
        setHeaderButtons(['close']);
        setContent(<ServerBroadcast {...popupInitialData} />);
        break;
      case 'blockMember':
        setHeaderTitle(t('block'));
        setHeaderButtons(['close']);
        setContent(<BlockMember {...popupInitialData} />);
        break;
      case 'channelSetting':
        setHeaderTitle(t('edit-channel'));
        setHeaderButtons(['close']);
        setContent(<ChannelSetting {...popupInitialData} />);
        break;
      case 'memberApplySetting':
        setHeaderTitle(t('member-apply-setting'));
        setHeaderButtons(['close']);
        setContent(<MemberApplySetting {...popupInitialData} />);
        break;
      case 'systemSetting':
        setHeaderTitle(t('system-setting'));
        setHeaderButtons(['close']);
        setContent(<SystemSetting {...popupInitialData} />);
        break;
      case 'createServer':
        setHeaderTitle(t('create-server'));
        setHeaderButtons(['close']);
        setContent(<CreateServer {...popupInitialData} />);
        break;
      case 'createChannel':
        setHeaderTitle(t('create-channel'));
        setHeaderButtons(['close']);
        setContent(<CreateChannel {...popupInitialData} />);
        break;
      case 'createFriendGroup':
        setHeaderTitle(t('create-friend-group'));
        setHeaderButtons(['close']);
        setContent(<CreateFriendGroup {...popupInitialData} />);
        break;
      case 'editChannelOrder':
        setHeaderTitle(t('edit-channel-order'));
        setHeaderButtons(['close']);
        setContent(<EditChannelOrder {...popupInitialData} />);
        break;
      case 'editChannelName':
        setHeaderTitle(t('edit-channel-name'));
        setHeaderButtons(['close']);
        setContent(<EditChannelName {...popupInitialData} />);
        break;
      case 'editNickname':
        setHeaderTitle(t('edit-member-card'));
        setHeaderButtons(['close']);
        setContent(<EditNickname {...popupInitialData} />);
        break;
      case 'editFriendGroup':
        setHeaderTitle(t('edit-friend-group'));
        setHeaderButtons(['close']);
        setContent(<EditFriendGroup {...popupInitialData} />);
        break;
      case 'editFriend':
        setHeaderTitle(t('edit-friend'));
        setHeaderButtons(['close']);
        setContent(<EditFriend {...popupInitialData} />);
        break;
      case 'applyMember':
        setHeaderTitle(t('apply-member'));
        setHeaderButtons(['close']);
        setContent(<ApplyMember {...popupInitialData} />);
        break;
      case 'applyFriend':
        setHeaderTitle(t('apply-friend'));
        setHeaderButtons(['close']);
        setContent(<ApplyFriend {...popupInitialData} />);
        break;
      case 'searchUser':
        setHeaderTitle(t('add-friend'));
        setHeaderButtons(['close']);
        setContent(<SearchUser {...popupInitialData} />);
        break;
      case 'directMessage':
        setHeaderTitle(popupInitialData?.targetName || t('direct-message'));
        setHeaderButtons(['close', 'minimize', 'maxsize']);
        setContent(<DirectMessage {...popupInitialData} />);
        break;
      case 'dialogAlert':
      case 'dialogAlert2':
        setHeaderTitle(t('dialog-alert'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ALERT' }} />);
        break;
      case 'dialogSuccess':
        setHeaderTitle(t('dialog-success'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'SUCCESS' }} />);
        break;
      case 'dialogWarning':
        setHeaderTitle(t('dialog-warning'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'WARNING' }} />);
        break;
      case 'dialogError':
        setHeaderTitle(t('dialog-error'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ERROR' }} />);
        break;
      case 'dialogInfo':
        setHeaderTitle(t('dialog-info'));
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'INFO' }} />);
        break;
      case 'changeTheme':
        setHeaderTitle(t('change-theme'));
        setHeaderButtons(['close']);
        setContent(<ChangeTheme {...popupInitialData} />);
        break;
      case 'aboutus':
        setHeaderTitle(t('about-ricecall'));
        setHeaderButtons(['close']);
        setContent(<About {...popupInitialData} />);
        break;
      case 'friendVerification':
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
      {(type !== 'userInfo' || headerTitle !== t('user-info')) && headerButtons.length > 0 && (
        <Header
          title={headerTitle}
          buttons={headerButtons}
          titleBoxIcon={type === 'changeTheme' ? header['title-box-skin-icon'] : type === 'directMessage' ? header['title-box-direct-message-icon'] : undefined}
        />
      )}
      {content}
    </>
  );
});

Popup.displayName = 'Popup';

export default Popup;
