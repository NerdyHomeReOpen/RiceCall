/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Components
import MarkdownViewer from '@/components/viewers/Markdown';
import MessageViewer from '@/components/viewers/Message';
import ChannelListViewer from '@/components/viewers/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import {
  User,
  Server,
  Message,
  Channel,
  ServerMember,
  ChannelMessage,
  UserServer,
  UserFriend,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

interface ServerPageProps {
  user: User;
  currentServer: UserServer;
  serverMembers: ServerMember[];
  serverChannels: Channel[];
  friends: UserFriend[];
  currentChannel: Channel;
  channelMessages: ChannelMessage[];
  broadcastMessages: ChannelMessage[];
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({
    user,
    currentServer,
    serverMembers,
    serverChannels,
    friends,
    currentChannel,
    channelMessages,
    broadcastMessages,
    display,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const webRTC = useWebRTC();
    const contextMenu = useContextMenu();

    // Refs
    const announcementAreaRef = useRef<HTMLDivElement>(null);
    const voiceModeRef = useRef<HTMLDivElement>(null);

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [announcementAreaHeight, setAnnouncementAreaHeight] =
      useState<number>(200);
    const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
    const [isResizingAnnouncementArea, setIsResizingAnnouncementArea] =
      useState<boolean>(false);
    const [showMicVolume, setShowMicVolume] = useState(false);
    const [showSpeakerVolume, setShowSpeakerVolume] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());

    // Variables
    const { userId } = user;
    const {
      serverId,
      name: serverName,
      announcement: serverAnnouncement,
      permissionLevel: userPermission,
      lastJoinChannelTime: userLastJoinChannelTime,
      lastMessageTime: userLastMessageTime,
    } = currentServer;
    const {
      channelId,
      announcement: channelAnnouncement,
      bitrate: channelBitrate,
      voiceMode: channelVoiceMode,
      forbidText: channelForbidText,
      forbidGuestText: channelForbidGuestText,
      guestTextMaxLength: channelGuestTextMaxLength,
      guestTextWaitTime: channelGuestTextWaitTime,
      guestTextGapTime: channelGuestTextGapTime,
    } = currentChannel;
    const activeServerMembers = serverMembers.filter(
      (mb) => mb.currentServerId === serverId,
    );
    const announcement = channelAnnouncement || serverAnnouncement;
    const leftGapTime =
      channelGuestTextGapTime -
      Math.floor((currentTime - userLastJoinChannelTime) / 1000);
    const leftWaitTime =
      channelGuestTextWaitTime -
      Math.floor((currentTime - userLastMessageTime) / 1000);
    const isForbidByChatMode = channelForbidText && userPermission < 3;
    const isForbidByGuestText = channelForbidGuestText && userPermission === 1;
    const isForbidByGuestTextGap =
      channelGuestTextGapTime && leftGapTime > 0 && userPermission === 1;
    const isForbidByGuestTextWait =
      channelGuestTextWaitTime && leftWaitTime > 0 && userPermission === 1;
    const textMaxLength =
      userPermission === 1 ? channelGuestTextMaxLength : 9999;
    const canChangeToFreeSpeech =
      userPermission > 4 && channelVoiceMode !== 'free';
    const canChangeToForbiddenSpeech =
      userPermission > 4 && channelVoiceMode !== 'forbidden';
    const canChangeToForbiddenQueue =
      userPermission > 4 && channelVoiceMode !== 'queue';
    const canChangeToControlQueue =
      userPermission > 4 && channelVoiceMode !== 'forbidden';

    // Handlers
    const handleSendMessage = (
      message: Partial<Message>,
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ): void => {
      if (!socket) return;
      socket.send.message({ message, channelId, serverId, userId });
    };

    const handleUpdateChannel = (
      channel: Partial<Channel>,
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateChannel({ channel, channelId, serverId });
    };

    const handleResizeSidebar = useCallback(
      (e: MouseEvent) => {
        if (!isResizingSidebar) return;
        const newWidth = e.clientX;
        setSidebarWidth(newWidth);
      },
      [isResizingSidebar],
    );

    const handleResizeAnnouncementArea = useCallback(
      (e: MouseEvent) => {
        if (!isResizingAnnouncementArea) return;
        if (!announcementAreaRef.current) return;
        const newHeight = e.clientY - announcementAreaRef.current.offsetTop;
        setAnnouncementAreaHeight(newHeight);
      },
      [isResizingAnnouncementArea],
    );

    const handleClickOutside = useCallback((e: MouseEvent) => {
      const micContainer = document.querySelector(
        `.${styles['micVolumeContainer']}`,
      );
      const speakerContainer = document.querySelector(
        `.${styles['speakerVolumeContainer']}`,
      );

      if (
        !micContainer?.contains(e.target as Node) &&
        !speakerContainer?.contains(e.target as Node)
      ) {
        setShowMicVolume(false);
        setShowSpeakerVolume(false);
      }
    }, []);

    // Effects
    useEffect(() => {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [handleClickOutside]);

    useEffect(() => {
      window.addEventListener('mousemove', handleResizeSidebar);
      window.addEventListener('mouseup', () => setIsResizingSidebar(false));
      return () => {
        window.removeEventListener('mousemove', handleResizeSidebar);
        window.removeEventListener('mouseup', () =>
          setIsResizingSidebar(false),
        );
      };
    }, [handleResizeSidebar]);

    useEffect(() => {
      window.addEventListener('mousemove', handleResizeAnnouncementArea);
      window.addEventListener('mouseup', () =>
        setIsResizingAnnouncementArea(false),
      );
      return () => {
        window.removeEventListener('mousemove', handleResizeAnnouncementArea);
        window.removeEventListener('mouseup', () =>
          setIsResizingAnnouncementArea(false),
        );
      };
    }, [handleResizeAnnouncementArea]);

    useEffect(() => {
      if (!webRTC || !channelBitrate) return;
      webRTC.handleUpdateBitrate(channelBitrate);
    }, [channelBitrate]); // Please ignore this warning

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    useEffect(() => {
      if (serverName) {
        ipcService.discord.updatePresence({
          details: `${lang.tr.in} ${serverName}`,
          state: `${lang.tr.chatWithMembers.replace(
            '{0}',
            activeServerMembers.length.toString(),
          )}`,
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
      }
    }, [lang, serverName, activeServerMembers]);

    return (
      <div
        className={styles['serverWrapper']}
        style={display ? {} : { display: 'none' }}
      >
        {/* Main Content */}
        <main className={styles['serverContent']}>
          {/* Left Sidebar */}
          <div
            className={styles['sidebar']}
            style={{ width: `${sidebarWidth}px` }}
          >
            <ChannelListViewer
              currentServer={currentServer}
              currentChannel={currentChannel}
              serverMembers={activeServerMembers}
              serverChannels={serverChannels}
              friends={friends}
            />
          </div>
          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={() => setIsResizingSidebar(true)}
            onMouseUp={() => setIsResizingSidebar(false)}
          />
          {/* Right Content */}
          <div className={styles['mainContent']}>
            <div
              ref={announcementAreaRef}
              className={styles['announcementArea']}
              style={{ height: `${announcementAreaHeight}px` }}
            >
              <MarkdownViewer markdownText={announcement} />
            </div>
            {/* Resize Handle */}
            <div
              className="resizeHandleVertical"
              onMouseDown={() => setIsResizingAnnouncementArea(true)}
              onMouseUp={() => setIsResizingAnnouncementArea(false)}
            />
            <div className={styles['messageArea']}>
              <MessageViewer messages={channelMessages} />
            </div>
            <div className={styles['inputArea']}>
              <div
                className={styles['broadcastArea']}
                style={{ display: (broadcastMessages.length == 0 ? 'none' : 'flex') }}
              >
                <div className={styles['broadcastContent']}>
                  <MessageViewer messages={broadcastMessages} />
                </div>
              </div>
              <MessageInputBox
                onSendMessage={(msg) => {
                  handleSendMessage(
                    { type: 'general', content: msg },
                    userId,
                    serverId,
                    channelId,
                  );
                }}
                disabled={
                  isForbidByGuestText ||
                  isForbidByGuestTextGap ||
                  isForbidByGuestTextWait ||
                  isForbidByChatMode
                }
                placeholder={
                  isForbidByChatMode
                    ? lang.tr.forbidOnlyAdminText
                    : isForbidByGuestText
                    ? lang.tr.forbidGuestText
                    : isForbidByGuestTextGap
                    ? `${lang.tr.guestTextGapTime} ${leftGapTime} ${lang.tr.seconds}`
                    : isForbidByGuestTextWait
                    ? `${lang.tr.guestTextWaitTime} ${leftWaitTime} ${lang.tr.seconds}`
                    : lang.tr.inputMessage
                }
                maxLength={textMaxLength}
              />
            </div>
            <div className={styles['buttonArea']}>
              <div className={styles['buttons']}>
                <div
                  ref={voiceModeRef}
                  className={styles['voiceModeDropdown']}
                  style={userPermission >= 3 ? {} : { display: 'none' }}
                  onClick={() => {
                    if (!voiceModeRef.current) return;
                    const x = voiceModeRef.current.getBoundingClientRect().left;
                    const y = voiceModeRef.current.getBoundingClientRect().top;
                    contextMenu.showContextMenu(x, y, true, false, [
                      {
                        id: 'freeSpeech',
                        label: lang.tr.freeSpeech,
                        show: canChangeToFreeSpeech,
                        onClick: () => {
                          handleUpdateChannel(
                            { voiceMode: 'free' },
                            channelId,
                            serverId,
                          );
                        },
                      },
                      {
                        id: 'forbiddenSpeech',
                        label: lang.tr.forbiddenSpeech,
                        show: canChangeToForbiddenSpeech,
                        disabled: true,
                        onClick: () => {
                          handleUpdateChannel(
                            { voiceMode: 'forbidden' },
                            channelId,
                            serverId,
                          );
                        },
                      },
                      {
                        id: 'queue',
                        label: lang.tr.queue,
                        icon: 'submenu',
                        show:
                          canChangeToForbiddenQueue || canChangeToControlQueue,
                        hasSubmenu: true,
                        disabled: true,
                        onClick: () => {
                          handleUpdateChannel(
                            { voiceMode: 'queue' },
                            channelId,
                            serverId,
                          );
                        },
                        submenuItems: [
                          {
                            id: 'forbiddenQueue',
                            label: lang.tr.forbiddenQueue,
                            show: canChangeToForbiddenQueue,
                            disabled: true,
                            onClick: () => {
                              // handleUpdateChannel({ queueMode: 'forbidden' }, currentChannelId, serverId);
                            },
                          },
                          {
                            id: 'controlQueue',
                            label: lang.tr.controlQueue,
                            show: canChangeToControlQueue,
                            disabled: true,
                            onClick: () => {
                              // handleUpdateChannel({ queueMode: 'control' }, currentChannelId, serverId);
                            },
                          },
                        ],
                      },
                    ]);
                  }}
                >
                  {channelVoiceMode === 'queue'
                    ? lang.tr.queue
                    : channelVoiceMode === 'free'
                    ? lang.tr.freeSpeech
                    : channelVoiceMode === 'forbidden'
                    ? lang.tr.forbiddenSpeech
                    : ''}
                </div>
              </div>
              <div
                className={`
                  ${styles['micButton']} 
                  ${webRTC.isMute ? '' : styles['active']}`}
                onClick={() => webRTC.handleToggleMute()}
              >
                <div
                  className={`
                    ${styles['micIcon']} 
                    ${
                      webRTC.volumePercent
                        ? styles[
                            `level${Math.ceil(webRTC.volumePercent / 10) - 1}`
                          ]
                        : ''
                    }
                  `}
                />
                <div className={styles['micText']}>
                  {webRTC.isMute ? lang.tr.takeMic : lang.tr.takenMic}
                  <div className={styles['micSubText']}>
                    {!webRTC.isMute && webRTC.micVolume === 0
                      ? lang.tr.micMuted
                      : ''}
                  </div>
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkgModeButton']}>{lang.tr.mixing}</div>
                <div className={styles['saperator']} />
                <div className={styles['micVolumeContainer']}>
                  <div
                    className={`${styles['micModeButton']} ${
                      webRTC.isMute || webRTC.micVolume === 0
                        ? styles['muted']
                        : styles['active']
                    }`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setShowMicVolume(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMicVolume(!showMicVolume);
                    }}
                  />
                  {showMicVolume && (
                    <div
                      className={styles['volumeSlider']}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setShowMicVolume(false);
                      }}
                    >
                      <div className={styles['sliderContainer']}>
                        <input
                          className={styles['slider']}
                          type="range"
                          min="0"
                          max="200"
                          value={webRTC.micVolume}
                          onChange={(e) => {
                            webRTC.handleUpdateMicVolume?.(
                              parseInt(e.target.value),
                            );
                          }}
                        />
                      </div>
                      <div
                        className={`${styles['micModeButton']} ${
                          webRTC.isMute || webRTC.micVolume === 0
                            ? styles['muted']
                            : styles['active']
                        }`}
                      />
                    </div>
                  )}
                </div>
                <div className={styles['speakerVolumeContainer']}>
                  <div
                    className={`${styles['speakerButton']} ${
                      webRTC.speakerVolume === 0 ? styles['muted'] : ''
                    }`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setShowSpeakerVolume(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeakerVolume(!showSpeakerVolume);
                    }}
                  />
                  {showSpeakerVolume && (
                    <div
                      className={styles['volumeSlider']}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setShowSpeakerVolume(false);
                      }}
                    >
                      <div className={styles['sliderContainer']}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={webRTC.speakerVolume}
                          onChange={(e) => {
                            webRTC.handleUpdateSpeakerVolume(
                              parseInt(e.target.value),
                            );
                          }}
                          className={styles['slider']}
                        />
                      </div>

                      <div
                        className={`${styles['speakerButton']} ${
                          webRTC.speakerVolume === 0 ? styles['muted'] : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
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
