/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode, useRef } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import { PopupType } from '@/types';

// Components
import UserSetting from '@/components/popups/UserSetting';
import ServerSetting from '@/components/popups/ServerSetting';
import ChannelSetting from '@/components/popups/ChannelSetting';
import SystemSetting from '@/components/popups/SystemSetting';
import ChannelPassword from '@/components/popups/ChannelPassword';
import MemberApplySetting from '@/components/popups/MemberApplySetting';
import CreateServer from '@/components/popups/CreateServer';
import CreateChannel from '@/components/popups/CreateChannel';
import CreateFriendGroup from '@/components/popups/CreateFriendGroup';
import EditNickname from '@/components/popups/EditNickname';
import EditFriendGroup from '@/components/popups/EditFriendGroup';
import EditFriend from '@/components/popups/EditFriend';
import ApplyFriend from '@/components/popups/ApplyFriend';
import ApplyMember from '@/components/popups/ApplyMember';
import DirectMessage from '@/components/popups/DirectMessage';
import SearchUser from '@/components/popups/SearchUser';
import Dialog from '@/components/popups/Dialog';
import ChangeChannelOrder from '@/components/popups/ChangeChannelOrder';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons }) => {
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    if (isFullscreen) ipcService.window.unmaximize();
    else ipcService.window.maximize();
    setIsFullscreen(!isFullscreen);
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={header['header']}>
      <div className={header['titleBox']}>
        <div className={header['title']}>{title}</div>
      </div>
      <div className={header['buttons']}>
        {buttons.includes('minimize') && (
          <div
            className={header['minimize']}
            onClick={() => handleMinimize()}
          />
        )}
        {buttons.includes('maxsize') && (
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={() => handleFullscreen()}
          />
        )}
        {buttons.includes('close') && (
          <div className={header['close']} onClick={() => handleClose()} />
        )}
      </div>
    </div>
  );
});

Header.displayName = 'Header';

const Popup = React.memo(() => {
  // Language
  const lang = useLanguage();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);

  // States
  const [type, setType] = useState<PopupType | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('');
  const [headerButtons, setHeaderButtons] = useState<
    ('minimize' | 'maxsize' | 'close')[]
  >([]);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as PopupType;
      setType(type || null);
    }
  }, []);

  useEffect(() => {
    if (!type) return;
    ipcService.initialData.request(type, (data) => {
      setInitialData(data);
    });
  }, [type]);

  useEffect(() => {
    if (!initialData || !type) return;

    switch (type) {
      case PopupType.CHANNEL_PASSWORD:
        setHeaderTitle(lang.tr.pleaseEnterTheChannelPassword);
        setHeaderButtons(['close']);
        setContent(<ChannelPassword {...initialData} />);
        break;
      case PopupType.USER_SETTING:
        setHeaderTitle(lang.tr.editUser);
        setHeaderButtons(['close']);
        setContent(<UserSetting {...initialData} />);
        break;
      case PopupType.SERVER_SETTING:
        setHeaderTitle(lang.tr.editServer);
        setHeaderButtons(['close']);
        setContent(<ServerSetting {...initialData} />);
        break;
      case PopupType.CHANNEL_SETTING:
        setHeaderTitle(lang.tr.editChannel);
        setHeaderButtons(['close']);
        setContent(<ChannelSetting {...initialData} />);
        break;
      case PopupType.MEMBERAPPLY_SETTING:
        setHeaderTitle(lang.tr.editApplySettings);
        setHeaderButtons(['close']);
        setContent(<MemberApplySetting {...initialData} />);
        break;
      case PopupType.SYSTEM_SETTING:
        setHeaderTitle(lang.tr.systemSetting);
        setHeaderButtons(['close']);
        setContent(<SystemSetting {...initialData} />);
        break;
      case PopupType.CREATE_SERVER:
        setHeaderTitle(lang.tr.createServer);
        setHeaderButtons(['close']);
        setContent(<CreateServer {...initialData} />);
        break;
      case PopupType.CREATE_CHANNEL:
        setHeaderTitle(lang.tr.createChannel);
        setHeaderButtons(['close']);
        setContent(<CreateChannel {...initialData} />);
        break;
      case PopupType.CREATE_FRIENDGROUP:
        setHeaderTitle(lang.tr.addFriendGroup);
        setHeaderButtons(['close']);
        setContent(<CreateFriendGroup {...initialData} />);
        break;
      case PopupType.EDIT_NICKNAME:
        setHeaderTitle(lang.tr.editMemberCard);
        setHeaderButtons(['close']);
        setContent(<EditNickname {...initialData} />);
        break;
      case PopupType.EDIT_FRIENDGROUP:
        setHeaderTitle(lang.tr.editFriendGroup);
        setHeaderButtons(['close']);
        setContent(<EditFriendGroup {...initialData} />);
        break;
      case PopupType.EDIT_FRIEND:
        setHeaderTitle(lang.tr.editFriend);
        setHeaderButtons(['close']);
        setContent(<EditFriend {...initialData} />);
        break;
      case PopupType.APPLY_MEMBER:
        setHeaderTitle(lang.tr.applyMember);
        setHeaderButtons(['close']);
        setContent(<ApplyMember {...initialData} />);
        break;
      case PopupType.APPLY_FRIEND:
        setHeaderTitle(lang.tr.applyFriend);
        setHeaderButtons(['close']);
        setContent(<ApplyFriend {...initialData} />);
        break;
      case PopupType.SEARCH_USER:
        setHeaderTitle(lang.tr.addFriend);
        setHeaderButtons(['close']);
        setContent(<SearchUser {...initialData} />);
        break;
      case PopupType.DIRECT_MESSAGE:
        setHeaderTitle(initialData.targetName || lang.tr.directMessage);
        setHeaderButtons(['close', 'minimize', 'maxsize']);
        setContent(<DirectMessage {...{ ...initialData, windowRef }} />);
        break;
      case PopupType.DIALOG_ALERT:
      case PopupType.DIALOG_ALERT2:
        setHeaderTitle(lang.tr.dialogAlert);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'ALERT' }} />);
        break;
      case PopupType.DIALOG_SUCCESS:
        setHeaderTitle(lang.tr.dialogSuccess);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />);
        break;
      case PopupType.DIALOG_WARNING:
        setHeaderTitle(lang.tr.dialogWarning);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'WARNING' }} />);
        break;
      case PopupType.DIALOG_ERROR:
        setHeaderTitle(lang.tr.dialogError);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'ERROR' }} />);
        break;
      case PopupType.DIALOG_INFO:
        setHeaderTitle(lang.tr.dialogInfo);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'INFO' }} />);
        break;
      case PopupType.CHANGE_CHANNEL_ORDER:
        setHeaderTitle(lang.tr.changeChannelOrder);
        setHeaderButtons(['close']);
        setContent(<ChangeChannelOrder {...initialData} />);
        break;
      default:
        break;
    }
  }, [lang, initialData, type]);

  return (
    <div className="wrapper" ref={windowRef}>
      {/* Top Nevigation */}
      {<Header title={headerTitle} buttons={headerButtons} />}
      {/* Main Content */}
      <div className="content">{content}</div>
    </div>
  );
});

Popup.displayName = 'Popup';

export default Popup;
