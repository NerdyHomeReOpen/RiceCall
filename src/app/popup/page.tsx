/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode, useRef } from 'react';

// CSS
import header from '@/styles/header.module.css';
import '@/styles/viewers/theme.css';

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
import About from '@/components/popups/AboutUs';
import FriendVerification from '@/components/popups/FriendVerification';

// Utils
import {
  THEME_CHANGE_EVENT,
  applyThemeToReactState,
} from '@/utils/themeStorage';
import { emojiList, convertEmojiPlaceholderToHtml } from '@/utils/emoji';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Providers
import { useLanguage } from '@/providers/Language';

// CSS
import directMessageStyles from '@/styles/popups/directMessage.module.css';

const directMessageHeader = (targetSignature: string) => (
  <div className={directMessageStyles['header']}>
    <div
      className={directMessageStyles['userSignature']}
      dangerouslySetInnerHTML={{
        __html: convertEmojiPlaceholderToHtml(targetSignature || '', emojiList),
      }}
    />
    <div className={directMessageStyles['directOptionButtons']}>
      <div className={`${directMessageStyles['fileShare']} ${directMessageStyles['disabled']}`} />
      <div className={`${directMessageStyles['blockUser']} ${directMessageStyles['disabled']}`} />
      <div className={`${directMessageStyles['unBlockUser']} ${directMessageStyles['disabled']}`} />
      <div className={`${directMessageStyles['inviteTempGroup']} ${directMessageStyles['disabled']}`} />
      <div className={`${directMessageStyles['report']} ${directMessageStyles['disabled']}`} />
    </div>
  </div>
);

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
  titleBoxContent?: ReactNode;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ title, buttons, titleBoxIcon, titleBoxContent }) => {
    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [themeClass, setThemeClass] = useState<string | null>(null);
    const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

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
      const offMaximize = ipcService.window.onMaximize(() =>
        setIsFullscreen(true),
      );
      const offUnmaximize = ipcService.window.onUnmaximize(() =>
        setIsFullscreen(false),
      );
      return () => {
        offMaximize();
        offUnmaximize();
      };
    }, []);
    useEffect(() => {
      applyThemeToReactState({
        setThemeClass,
        setBackgroundColor,
        setBackgroundImage,
      });
      const onThemeChange = () => {
        applyThemeToReactState({
          setThemeClass,
          setBackgroundColor,
          setBackgroundImage,
        });
      };
      window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.addEventListener('storage', onThemeChange);
      return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
        window.removeEventListener('storage', onThemeChange);
      };
    }, []);

    return (
      <header
        className={`${header['header']} ${header['popupHeader']} ${
          localStorage.getItem('token') && themeClass
        }`}
        style={{
          background:
            (localStorage.getItem('token') &&
              ((backgroundImage && `url(${backgroundImage})`) ||
                backgroundColor)) ||
            undefined,
        }}
      >
        <div className={header['titleWrapper']}>
          <div className={`${header['titleBox']} ${titleBoxIcon}`}>
            <div className={header['title']}>{title}</div>
          </div>
          <div className={header['buttons']}>
            {buttons.includes('minimize') && (
              <div className={header['minimize']} onClick={handleMinimize} />
            )}
            {buttons.includes('maxsize') && (
              <div
                className={isFullscreen ? header['restore'] : header['maxsize']}
                onClick={handleFullscreen}
              />
            )}
            {buttons.includes('close') && (
              <div className={header['close']} onClick={handleClose} />
            )}
          </div>
        </div>
        {titleBoxContent}
      </header>
    );
  },
);

Header.displayName = 'Header';

const Popup = React.memo(() => {
  // Language
  const lang = useLanguage();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<PopupType | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('');
  const [headerButtons, setHeaderButtons] = useState<
    ('minimize' | 'maxsize' | 'close')[]
  >([]);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);
  const [directMessageTargetSignature, setDirectMessageTargetSignature] =
    useState<string | null>(null);

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

      refreshService
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
    if (type === PopupType.SYSTEM_SETTING || type === PopupType.CHANGE_THEME) {
    } else if (!popupInitialData || !type) {
      return;
    }
    switch (type) {
      case PopupType.CHANNEL_PASSWORD:
        setHeaderTitle(lang.tr.pleaseEnterTheChannelPassword);
        setHeaderButtons(['close']);
        setContent(<ChannelPassword {...popupInitialData} />);
        break;
      case PopupType.USER_INFO:
        setHeaderTitle(lang.tr.userInfo);
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case PopupType.USER_SETTING:
        setHeaderTitle(lang.tr.editUser);
        setHeaderButtons(['close']);
        setContent(<UserSetting {...popupInitialData} />);
        break;
      case PopupType.SERVER_SETTING:
        setHeaderTitle(lang.tr.editServer);
        setHeaderButtons(['close']);
        setContent(<ServerSetting {...popupInitialData} />);
        break;
      case PopupType.CHANNEL_SETTING:
        setHeaderTitle(lang.tr.editChannel);
        setHeaderButtons(['close']);
        setContent(<ChannelSetting {...popupInitialData} />);
        break;
      case PopupType.MEMBERAPPLY_SETTING:
        setHeaderTitle(lang.tr.editApplySettings);
        setHeaderButtons(['close']);
        setContent(<MemberApplySetting {...popupInitialData} />);
        break;
      case PopupType.SYSTEM_SETTING:
        setHeaderTitle(lang.tr.systemSetting);
        setHeaderButtons(['close']);
        setContent(<SystemSetting {...popupInitialData} />);
        break;
      case PopupType.CREATE_SERVER:
        setHeaderTitle(lang.tr.createServer);
        setHeaderButtons(['close']);
        setContent(<CreateServer {...popupInitialData} />);
        break;
      case PopupType.CREATE_CHANNEL:
        setHeaderTitle(lang.tr.createChannel);
        setHeaderButtons(['close']);
        setContent(<CreateChannel {...popupInitialData} />);
        break;
      case PopupType.CREATE_FRIENDGROUP:
        setHeaderTitle(lang.tr.addFriendGroup);
        setHeaderButtons(['close']);
        setContent(<CreateFriendGroup {...popupInitialData} />);
        break;
      case PopupType.EDIT_CHANNEL_ORDER:
        setHeaderTitle(lang.tr.editChannelOrder);
        setHeaderButtons(['close']);
        setContent(<EditChannelOrder {...popupInitialData} />);
        break;
      case PopupType.EDIT_CHANNEL_NAME:
        setHeaderTitle(lang.tr.editChannelName);
        setHeaderButtons(['close']);
        setContent(<EditChannelName {...popupInitialData} />);
        break;
      case PopupType.EDIT_NICKNAME:
        setHeaderTitle(lang.tr.editMemberCard);
        setHeaderButtons(['close']);
        setContent(<EditNickname {...popupInitialData} />);
        break;
      case PopupType.EDIT_FRIENDGROUP:
        setHeaderTitle(lang.tr.editFriendGroup);
        setHeaderButtons(['close']);
        setContent(<EditFriendGroup {...popupInitialData} />);
        break;
      case PopupType.EDIT_FRIEND:
        setHeaderTitle(lang.tr.editFriend);
        setHeaderButtons(['close']);
        setContent(<EditFriend {...popupInitialData} />);
        break;
      case PopupType.APPLY_MEMBER:
        setHeaderTitle(lang.tr.applyMember);
        setHeaderButtons(['close']);
        setContent(<ApplyMember {...popupInitialData} />);
        break;
      case PopupType.APPLY_FRIEND:
        setHeaderTitle(lang.tr.applyFriend);
        setHeaderButtons(['close']);
        setContent(<ApplyFriend {...popupInitialData} />);
        break;
      case PopupType.SEARCH_USER:
        setHeaderTitle(lang.tr.addFriend);
        setHeaderButtons(['close']);
        setContent(<SearchUser {...popupInitialData} />);
        break;
      case PopupType.DIRECT_MESSAGE:
        setHeaderTitle(popupInitialData?.targetName || lang.tr.directMessage);
        setHeaderButtons(['close', 'minimize', 'maxsize']);
        setContent(<DirectMessage {...{ ...popupInitialData, windowRef }} />);
        break;
      case PopupType.DIALOG_ALERT:
      case PopupType.DIALOG_ALERT2:
        setHeaderTitle(lang.tr.dialogAlert);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ALERT' }} />);
        break;
      case PopupType.DIALOG_SUCCESS:
        setHeaderTitle(lang.tr.dialogSuccess);
        setHeaderButtons(['close']);
        setContent(
          <Dialog {...{ ...popupInitialData, iconType: 'SUCCESS' }} />,
        );
        break;
      case PopupType.DIALOG_WARNING:
        setHeaderTitle(lang.tr.dialogWarning);
        setHeaderButtons(['close']);
        setContent(
          <Dialog {...{ ...popupInitialData, iconType: 'WARNING' }} />,
        );
        break;
      case PopupType.DIALOG_ERROR:
        setHeaderTitle(lang.tr.dialogError);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'ERROR' }} />);
        break;
      case PopupType.DIALOG_INFO:
        setHeaderTitle(lang.tr.dialogInfo);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...popupInitialData, iconType: 'INFO' }} />);
        break;
      case PopupType.ANTHOR_DEVICE_LOGIN:
        setHeaderTitle(lang.tr.dialogWarning);
        setHeaderButtons(['close']);
        setContent(
          <Dialog {...{ ...popupInitialData, iconType: 'WARNING' }} />,
        );
        break;
      case PopupType.CHANGE_THEME:
        setHeaderTitle(lang.tr.changeTheme);
        setHeaderButtons(['close']);
        setContent(<ChangeTheme {...popupInitialData} />);
        break;
      case PopupType.ABOUTUS:
        setHeaderTitle(lang.tr.aboutUs);
        setHeaderButtons(['close']);
        setContent(<About {...popupInitialData} />);
        break;
      case PopupType.FRIEND_VERIFICATION:
        setHeaderTitle(lang.tr.friendVerification);
        setHeaderButtons(['close']);
        setContent(<FriendVerification {...popupInitialData} />);
        break;
      default:
        break;
    }
  }, [lang, initialData, type, windowRef]);

  return (
    <div className="wrapper" ref={windowRef}>
      {/* Top Nevigation */}
      {(type !== PopupType.USER_INFO || headerTitle !== lang.tr.userInfo) &&
        headerButtons.length > 0 && (
          <Header
            title={headerTitle}
            buttons={headerButtons}
            titleBoxIcon={
              type === PopupType.CHANGE_THEME
                ? header['titleBoxSkinIcon']
                : type === PopupType.DIRECT_MESSAGE
                ? header['titleBoxDirectMessageIcon']
                : undefined
            }
            titleBoxContent={
              type === PopupType.DIRECT_MESSAGE &&
              directMessageTargetSignature !== null
                ? directMessageHeader(directMessageTargetSignature)
                : undefined
            }
          />
        )}
      {/* Main Content */}
      <div className="content">{content}</div>
    </div>
  );
});

Popup.displayName = 'Popup';

export default Popup;
