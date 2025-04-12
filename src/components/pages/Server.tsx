/* eslint-disable react-hooks/exhaustive-deps */

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/Markdown';
import MessageViewer from '@/components/viewers/Message';
import ChannelViewer from '@/components/viewers/Channel';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import {
  User,
  Server,
  Message,
  Channel,
  Member,
  ServerMember,
  ChannelMessage,
  SocketServerEvent,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ServerPageProps {
  user: User;
  server: Server;
  channel: Channel;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, server, channel }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const webRTC = useWebRTC();
    const contextMenu = useContextMenu();

    // Refs
    const refreshed = useRef(false);

    // States
    const [serverChannels, setServerChannels] = useState<Channel[]>([]);
    const [serverActiveMembers, setServerActiveMembers] = useState<
      ServerMember[]
    >([]);
    const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>(
      [],
    );
    const [member, setMember] = useState<Member>(createDefault.member());
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [showMicVolume, setShowMicVolume] = useState(false);
    const [showSpeakerVolume, setShowSpeakerVolume] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [displayChannelMessages, setDisplayChannelMessages] = useState<
      ChannelMessage[]
    >([]);

    // Variables
    const { userId } = user;
    const {
      serverId,
      name: serverName,
      announcement: serverAnnouncement,
    } = server;
    const {
      channelId,
      bitrate: channelBitrate,
      voiceMode: channelVoiceMode,
      forbidText: channelForbidText,
      forbidGuestText: channelForbidGuestText,
      guestTextMaxLength: channelGuestTextMaxLength,
      guestTextWaitTime: channelGuestTextWaitTime,
      guestTextGapTime: channelGuestTextGapTime,
    } = channel;

    member.lastJoinChannelTime =
      member.lastJoinChannelTime > 0 ? member.lastJoinChannelTime : Date.now();
    const {
      permissionLevel: memberPermissionLevel,
      lastJoinChannelTime: memberLastJoinChannelTime,
      lastMessageTime: memberLastMessageTime,
    } = member;
    const leftGapTime =
      channelGuestTextGapTime -
      Math.floor((currentTime - memberLastJoinChannelTime) / 1000);
    const leftWaitTime =
      channelGuestTextWaitTime -
      Math.floor((currentTime - memberLastMessageTime) / 1000);
    const isForbidByChatMode = channelForbidText && memberPermissionLevel < 3;
    const isForbidByGuestText =
      channelForbidGuestText && memberPermissionLevel === 1;
    const isForbidByGuestTextGap =
      channelGuestTextGapTime && leftGapTime > 0 && memberPermissionLevel === 1;
    const isForbidByGuestTextWait =
      channelGuestTextWaitTime &&
      leftWaitTime > 0 &&
      memberPermissionLevel === 1;
    const textMaxLength =
      memberPermissionLevel === 1 ? channelGuestTextMaxLength || 100 : 2000;

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

    const handleMemberUpdate = (data: Partial<Member> | null): void => {
      if (!data) data = createDefault.member();
      setMember((prev) => ({ ...prev, ...data }));
    };

    const handleServerChannelsUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      setServerChannels(data);
    };

    const handleServerActiveMembersUpdate = (
      data: ServerMember[] | null,
    ): void => {
      if (!data) data = [];
      setServerActiveMembers(data);
    };

    const handleChannelMessagesUpdate = (
      data: ChannelMessage[] | null,
    ): void => {
      if (!data) data = [];
      setChannelMessages(data);
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
        const newWidth = Math.max(270, Math.min(e.clientX, maxWidth));
        setSidebarWidth(newWidth);
      },
      [isResizing],
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
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleStopResizing);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleStopResizing);
      };
    }, [handleResize, handleStopResizing]);

    useEffect(() => {
      if (!webRTC || !channelBitrate) return;
      webRTC.handleUpdateBitrate(channelBitrate);
    }, [channelBitrate]); // Please ignore this warrning

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.MEMBER_UPDATE]: handleMemberUpdate,
        [SocketServerEvent.SERVER_CHANNELS_UPDATE]: handleServerChannelsUpdate,
        [SocketServerEvent.SERVER_ACTIVE_MEMBERS_UPDATE]:
          handleServerActiveMembersUpdate,
        [SocketServerEvent.CHANNEL_MESSAGES_UPDATE]:
          handleChannelMessagesUpdate,
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
      if (!userId || !serverId || !channelId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.member({
            userId: userId,
            serverId: serverId,
          }),
          refreshService.serverActiveMembers({
            serverId: serverId,
          }),
          refreshService.serverChannels({
            serverId: serverId,
          }),
          refreshService.channelMessages({
            channelId: channelId,
          }),
        ]).then(
          ([member, serverActiveMembers, serverChannels, channelMessages]) => {
            handleMemberUpdate(member);
            handleServerActiveMembersUpdate(serverActiveMembers);
            handleServerChannelsUpdate(serverChannels);
            handleChannelMessagesUpdate(channelMessages);
          },
        );
      };
      refresh();
    }, [userId, serverId, channelId]);

    useEffect(() => {
      ipcService.discord.updatePresence({
        details: `${lang.tr.in} ${serverName}`,
        state: `${lang.tr.chatWithMembers.replace(
          '{0}',
          serverActiveMembers.length.toString(),
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
    }, [lang, serverName, serverActiveMembers]);

    useEffect(() => {
      if (channelMessages && channelMessages.length > 0) {
        setDisplayChannelMessages(() => {
          const lastVisitTime =
            memberLastJoinChannelTime === 0
              ? Date.now()
              : memberLastJoinChannelTime;

          const currentChannelMessages = channelMessages.filter(
            (msg, index, self) =>
              msg.timestamp >= lastVisitTime &&
              index === self.findIndex((m) => m.messageId === msg.messageId),
          );

          return currentChannelMessages;
        });
      }
    }, [channelMessages, memberLastJoinChannelTime]);

    return (
      <div className={styles['serverWrapper']}>
        {/* Main Content */}
        <main className={styles['serverContent']}>
          {/* Left Sidebar */}
          <div
            className={styles['sidebar']}
            style={{ width: `${sidebarWidth}px` }}
          >
            <ChannelViewer
              user={user}
              server={server}
              channel={channel}
              serverActiveMembers={serverActiveMembers}
              serverChannels={serverChannels}
              permissionLevel={memberPermissionLevel}
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
              <MessageViewer messages={displayChannelMessages} />
            </div>
            <div className={styles['inputArea']}>
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
                {memberPermissionLevel >= 3 && (
                  <div
                    className={styles['voiceModeDropdown']}
                    onClick={(e) =>
                      contextMenu.showContextMenu(e.clientX, e.clientY, [
                        {
                          id: 'freeSpeech',
                          label: lang.tr.freeSpeech,
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
                          show: false,
                          disabled: true,
                          hasSubmenu: true,
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
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'forbidden' }, currentChannelId, serverId);
                              },
                            },
                            {
                              id: 'controlQueue',
                              label: lang.tr.controlQueue,
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'control' }, currentChannelId, serverId);
                              },
                            },
                          ],
                        },
                      ])
                    }
                  >
                    {channelVoiceMode === 'queue'
                      ? lang.tr.queue
                      : channelVoiceMode === 'free'
                      ? lang.tr.freeSpeech
                      : channelVoiceMode === 'forbidden'
                      ? lang.tr.forbiddenSpeech
                      : ''}
                  </div>
                )}
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
                    {!webRTC.isMute && webRTC.micVolume === 0 ? '麥已靜音' : ''}
                  </div>
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkgModeButton']}>{lang.tr.mixing}</div>
                <div className={styles['saperator']} />
                <div className={styles['micVolumeContainer']}>
                  <div
                    className={`
                      ${styles['micModeButton']} 
                      ${
                        webRTC.isMute || webRTC.micVolume === 0
                          ? styles['muted']
                          : styles['active']
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMicVolume(!showMicVolume);
                      setShowSpeakerVolume(false);
                    }}
                  />
                  {showMicVolume && (
                    <div className={styles['volumeSlider']}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={webRTC.micVolume}
                        onChange={(e) => {
                          webRTC.handleUpdateMicVolume?.(
                            parseInt(e.target.value),
                          );
                        }}
                        className={styles['slider']}
                      />
                    </div>
                  )}
                </div>
                <div className={styles['speakerVolumeContainer']}>
                  <div
                    className={`${styles['speakerButton']} ${
                      webRTC.speakerVolume === 0 ? styles['muted'] : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeakerVolume(!showSpeakerVolume);
                      setShowMicVolume(false);
                    }}
                  />
                  {showSpeakerVolume && (
                    <div className={styles['volumeSlider']}>
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
