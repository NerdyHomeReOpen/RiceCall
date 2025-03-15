/* eslint-disable @typescript-eslint/no-unused-vars */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';
import MessageViewer from '@/components/viewers/MessageViewer';
import ChannelViewer from '@/components/viewers/ChannelViewer';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import {
  popupType,
  type User,
  type Server,
  type Message,
  type Channel,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';
import { useWebRTC } from '@/providers/WebRTCProvider';

const ServerPageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);
  const channel = useSelector((state: { channel: Channel }) => state.channel);

  // Language
  const lang = useLanguage();

  // Socket
  const socket = useSocket();

  // WebRTC
  const webRTC = useWebRTC();

  // Variables
  const serverName = server.name;
  const serverAvatar = server.avatar;
  const serverDisplayId = server.displayId;
  const serverAnnouncement = server.announcement;
  const serverUsers = server.users || [];
  const serverChannels = server.channels || [];
  const serverMembers = server.members || {};
  const serverUserCount = serverUsers.length;
  const channelMessages = channel.messages || [];
  const userId = user.id;
  const userCurrentChannelId = user.currentChannelId;
  const userMember = serverMembers[userId] || {
    id: '',
    isBlocked: false,
    nickname: '',
    contribution: 0,
    permissionLevel: 0,
    userId: '',
    serverId: '',
    createdAt: 0,
  };
  const userPermissionLevel = userMember.permissionLevel;

  // Sidebar Control
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(
          250,
          Math.min(mouseMoveEvent.clientX, maxWidth),
        );
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Update Discord Presence
  useEffect(() => {
    ipcService.discord.updatePresence({
      details: `${lang.tr.in} ${serverName}`,
      state: `${lang.tr.with} ${serverUserCount} `,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: lang.tr.RPCServer,
      timestamp: Date.now(),
      buttons: [
        {
          label: lang.tr.RPCJoinServer,
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [serverName, serverUserCount]);

  // Handlers
  const handleSendMessage = (message: Message): void => {
    socket?.send.message({ message });
  };

  const handleOpenServerSettings = () => {
    ipcService.popup.open(popupType.EDIT_SERVER);
    ipcService.initialData.onRequest(popupType.EDIT_SERVER, {
      server: server,
      mainUserId: userId,
    });
  };

  const handleOpenApplyMember = () => {
    ipcService.popup.open(popupType.APPLY_MEMBER);
    ipcService.initialData.onRequest(popupType.APPLY_MEMBER, {
      server: server,
    });
  };

  return (
    <div className={styles['serverWrapper']}>
      {/* Main Content */}
      <main className={styles['serverContent']}>
        {/* Left Sidebar */}
        <div
          className={styles['sidebar']}
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className={styles['sidebarHeader']}>
            <div className={styles['avatarBox']}>
              <div
                className={styles['avatarPicture']}
                style={
                  serverAvatar
                    ? { backgroundImage: `url(${serverAvatar})` }
                    : {}
                }
              />
            </div>
            <div className={styles['baseInfoBox']}>
              <div className={styles['container']}>
                <div className={styles['name']}>{serverName} </div>
              </div>
              <div className={styles['container']}>
                <div className={styles['idIcon']} />
                <div className={styles['idText']}>{serverDisplayId}</div>
                <div className={styles['memberIcon']} />
                <div className={styles['memberText']}>{serverUserCount}</div>
              </div>
            </div>
            <div className={styles['optionBox']}>
              <div
                className={styles['invitation']}
                onClick={() => {
                  handleOpenApplyMember();
                }}
              />
              <div className={styles['saperator']} />
              <div
                className={styles['setting']}
                onClick={() => {
                  handleOpenServerSettings();
                }}
              />
            </div>
          </div>
          <ChannelViewer channels={serverChannels} />
        </div>
        {/* Resize Handle */}
        <div className="resizeHandle" onMouseDown={startResizing} />
        {/* Right Content */}
        <div className={styles['mainContent']}>
          <div className={styles['announcementArea']}>
            <MarkdownViewer markdownText={serverAnnouncement} />
          </div>
          <div className={styles['messageArea']}>
            <MessageViewer messages={channelMessages} />
          </div>
          <div className={styles['inputArea']}>
            {/* FIXME: implement message input box here not components */}
            <MessageInputBox
              onSendMessage={(msg) => {
                handleSendMessage({
                  id: '',
                  type: 'general',
                  content: msg,
                  senderId: userId,
                  channelId: userCurrentChannelId,
                  permissionLevel: userPermissionLevel,
                  timestamp: 0,
                });
              }}
            />
          </div>
          <div className={styles['buttonArea']}>
            <div className={styles['buttons']}>
              <div className={styles['voiceModeButton']}>
                {lang.tr.freeSpeech}
              </div>
            </div>
            <div
              className={`${styles['micButton']} ${
                webRTC.isMute ? '' : styles['active']
              }`}
              onClick={() => webRTC.toggleMute?.()}
            >
              <div className={styles['micIcon']} />
              <div className={styles['micText']}>
                {webRTC.isMute ? lang.tr.takeMic : lang.tr.takenMic}
              </div>
            </div>
            <div className={styles['buttons']}>
              <div className={styles['bkgModeButton']}>{lang.tr.mixing}</div>
              <div className={styles['saperator']} />
              <div
                className={`${styles['micModeButton']} ${
                  webRTC.isMute ? '' : styles['active']
                }`}
                onClick={() => webRTC.toggleMute?.()}
              />
              <div className={styles['speakerButton']} />
              <div className={styles['recordModeButton']} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;
