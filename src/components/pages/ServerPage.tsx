import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';
import MessageViewer from '@/components/viewers/MessageViewer';
import ChannelViewer from '@/components/viewers/ChannelViewer';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import {
  PopupType,
  User,
  Server,
  Message,
  Channel,
  SocketServerEvent,
  ServerMember,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';
import { useWebRTC } from '@/providers/WebRTCProvider';

interface ServerPageProps {
  user: User;
  server: Server;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, server }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const webRTC = useWebRTC();

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(256);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [currentChannel, setCurrentChannel] = useState<Channel>({
      id: '',
      name: '',
      isLobby: false,
      isCategory: false,
      isRoot: false,
      serverId: '',
      voiceMode: 'free',
      chatMode: 'free',
      order: 0,
      settings: {
        bitrate: 0,
        visibility: 'public',
        slowmode: false,
        userLimit: 0,
      },
      createdAt: 0,
    });

    // Variables
    const channelMessages = currentChannel.messages || [];
    const serverName = server.name;
    const serverAvatar = server.avatar;
    const serverDisplayId = server.displayId;
    const serverAnnouncement = server.announcement;
    const serverUsers = server.users || [];
    const serverMember =
      serverUsers.find((s) => s.id === server.id) || ({} as ServerMember); // FIXME: this is not correct
    const serverUserCount = serverUsers.length;
    const userId = user.id;
    const userCurrentChannelId = user.currentChannelId;

    // Handlers
    const handleSendMessage = (message: Message): void => {
      if (!socket) return;
      socket.send.message({ message });
    };

    const handleChannelUpdate = (channel: Channel) => {
      setCurrentChannel(channel);
    };

    const handleOpenServerSettings = () => {
      ipcService.popup.open(PopupType.EDIT_SERVER);
      ipcService.initialData.onRequest(PopupType.EDIT_SERVER, {
        server: server,
        mainUserId: userId,
      });
    };

    const handleOpenApplyMember = () => {
      ipcService.popup.open(PopupType.APPLY_MEMBER);
      ipcService.initialData.onRequest(PopupType.APPLY_MEMBER, {
        server: server,
      });
    };

    const handleStartResizing = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    const handleStopResizing = useCallback(() => {
      setIsResizing(false);
    }, []);

    const handleResize = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(250, Math.min(e.clientX, maxWidth));
        setSidebarWidth(newWidth);
      },
      [isResizing],
    );

    // Effects
    useEffect(() => {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleStopResizing);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleStopResizing);
      };
    }, [handleResize, handleStopResizing]);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!socket) return;
      if (server.id) socket.send.refreshServer({ serverId: server.id });
      if (currentChannel.id)
        socket.send.refreshChannel({ channelId: currentChannel.id });
    }, [socket, server, currentChannel]);

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
    }, [lang, serverName, serverUserCount]);

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
                  style={{ backgroundImage: `url(${serverAvatar})` }}
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
            <ChannelViewer
              user={user}
              server={server}
              currentChannel={currentChannel}
            />
          </div>
          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={handleStartResizing}
            onMouseUp={handleStopResizing}
          />
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
                    ...serverMember,
                    id: '',
                    type: 'general',
                    content: msg,
                    senderId: userId,
                    channelId: userCurrentChannelId,
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
  },
);

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;
