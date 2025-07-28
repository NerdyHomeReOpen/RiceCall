/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';
import MessageViewer from '@/components/MessageViewer';
import ChannelListViewer from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import type { User, Server, Channel, Member, ChannelMessage, PromptMessage, SpeakingMode, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

interface ServerPageProps {
  user: User;
  currentServer: Server;
  serverMembers: Member[];
  serverChannels: Channel[];
  friends: Friend[];
  currentChannel: Channel;
  channelMessages: ChannelMessage[];
  actionMessages: PromptMessage[];
  display: boolean;
  queueUsers: QueueUser[]
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, currentServer, serverMembers, serverChannels, friends, currentChannel, channelMessages, actionMessages, display, queueUsers }) => {
    // Hooks
    const { t } = useTranslation();
    const webRTC = useWebRTC();
    const contextMenu = useContextMenu();

    // Refs
    const announcementAreaRef = useRef<HTMLDivElement>(null);
    const voiceModeRef = useRef<HTMLDivElement>(null);
    const actionMessageTimer = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [announcementAreaHeight, setAnnouncementAreaHeight] = useState<number>(200);
    const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
    const [isResizingAnnouncementArea, setIsResizingAnnouncementArea] = useState<boolean>(false);
    const [showMicVolume, setShowMicVolume] = useState(false);
    const [showSpeakerVolume, setShowSpeakerVolume] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

    const [speakMode, setSpeakMode] = useState<SpeakingMode>('key');
    const [speakHotKey, setSpeakHotKey] = useState<string>('');

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
    const activeServerMembers = serverMembers.filter((mb) => mb.currentServerId === serverId);
    const announcement = channelAnnouncement || serverAnnouncement;
    const leftGapTime = channelGuestTextGapTime - Math.floor((currentTime - userLastJoinChannelTime) / 1000);
    const leftWaitTime = channelGuestTextWaitTime - Math.floor((currentTime - userLastMessageTime) / 1000);
    const isForbidByChatMode = channelForbidText && userPermission < 3;
    const isForbidByGuestText = channelForbidGuestText && userPermission === 1;
    const isForbidByGuestTextGap = channelGuestTextGapTime && leftGapTime > 0 && userPermission === 1;
    const isForbidByGuestTextWait = channelGuestTextWaitTime && leftWaitTime > 0 && userPermission === 1;
    const textMaxLength = userPermission === 1 ? channelGuestTextMaxLength : 9999;
    const canChangeToFreeSpeech = userPermission > 4 && channelVoiceMode !== 'free';
    const canChangeToForbiddenSpeech = userPermission > 4 && channelVoiceMode !== 'forbidden';
    const canChangeToForbiddenQueue = userPermission > 4 && channelVoiceMode !== 'queue';
    const canChangeToControlQueue = userPermission > 4 && channelVoiceMode !== 'forbidden';

    // Handlers
    const handleSendMessage = (serverId: Server['serverId'], channelId: Channel['channelId'], preset: Partial<ChannelMessage>): void => {
      ipcService.socket.send('channelMessage', { serverId, channelId, preset });
    };

    const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
      ipcService.socket.send('editChannel', { serverId, channelId, update });
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

    const handleToggleSpeakerMute = () => {
      if (webRTC.speakerVolume === 0) {
        const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
        webRTC.handleEditSpeakerVolume(prevVolume);
      } else {
        localStorage.setItem('previous-speaker-volume', webRTC.speakerVolume.toString());
        webRTC.handleEditSpeakerVolume(0);
      }
    };

    const handleEditSpeakerVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const volume = parseInt(e.target.value);
      webRTC.handleEditSpeakerVolume(volume);
    };

    const handleToggleMicMute = () => {
      if (webRTC.micVolume === 0) {
        const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
        webRTC.handleEditMicVolume(prevVolume);
      } else {
        localStorage.setItem('previous-mic-volume', webRTC.micVolume.toString());
        webRTC.handleEditMicVolume(0);
      }
    };

    const handleEditMicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const volume = parseInt(e.target.value);
      webRTC.handleEditMicVolume(volume);
    };

    const handleToggleTakeMic = () => {
      if (!webRTC) return;
      webRTC.handleToggleTakeMic();
    };

    // Effects
    useEffect(() => {
      window.addEventListener('mousemove', handleResizeSidebar);
      window.addEventListener('mouseup', () => setIsResizingSidebar(false));
      return () => {
        window.removeEventListener('mousemove', handleResizeSidebar);
        window.removeEventListener('mouseup', () => setIsResizingSidebar(false));
      };
    }, [handleResizeSidebar]);

    useEffect(() => {
      window.addEventListener('mousemove', handleResizeAnnouncementArea);
      window.addEventListener('mouseup', () => setIsResizingAnnouncementArea(false));
      return () => {
        window.removeEventListener('mousemove', handleResizeAnnouncementArea);
        window.removeEventListener('mouseup', () => setIsResizingAnnouncementArea(false));
      };
    }, [handleResizeAnnouncementArea]);

    useEffect(() => {
      if (!webRTC || !channelBitrate) return;
      webRTC.handleEditBitrate(channelBitrate);
    }, [channelBitrate]); // Please ignore this warning

    useEffect(() => {
      if (actionMessages.length == 0) return;
      if (actionMessageTimer.current) {
        clearTimeout(actionMessageTimer.current);
      }
      if (!showActionMessage) setShowActionMessage(true);

      actionMessageTimer.current = setTimeout(() => {
        setShowActionMessage(false);
      }, 8000);
    }, [actionMessages]);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    useEffect(() => {
      ipcService.discord.updatePresence({
        details: `${t('in')} ${serverName}`,
        state: `${t('chat-with-members', { '0': activeServerMembers.length.toString() })}`,
        largeImageKey: 'app_icon',
        largeImageText: 'RC Voice',
        smallImageKey: 'home_icon',
        smallImageText: t('rpc:viewing-server-page'),
        timestamp: Date.now(),
        buttons: [
          {
            label: t('rpc:join-discord-server'),
            url: 'https://discord.gg/adCWzv6wwS',
          },
        ],
      });
    }, [t, serverName, activeServerMembers]);

    useEffect(() => {
      const unsubscribe: (() => void)[] = [ipcService.systemSettings.speakingMode.get(setSpeakMode), ipcService.systemSettings.defaultSpeakingKey.get(setSpeakHotKey)];
      return () => unsubscribe.forEach((unsub) => unsub());
    }, []);

    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!showSpeakerVolume) {
        setShowSpeakerVolume(true);
      }

      timeoutRef.current = setTimeout(() => {
        setShowSpeakerVolume(false);
        timeoutRef.current = null;
      }, 1000);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [webRTC.speakerVolume]);

    return (
      <main className={styles['server']} style={display ? {} : { display: 'none' }}>
        {/* Body */}
        <main className={styles['server-body']}>
          {/* Left Sidebar */}
          <aside className={styles['sidebar']} style={{ width: `${sidebarWidth}px` }}>
            <ChannelListViewer
              currentServer={currentServer}
              currentChannel={currentChannel}
              serverMembers={activeServerMembers}
              serverChannels={serverChannels}
              friends={friends}
              queueUsers={queueUsers}
            />
          </aside>

          {/* Resize Handle */}
          <div className="resize-handle" onMouseDown={() => setIsResizingSidebar(true)} onMouseUp={() => setIsResizingSidebar(false)} />

          {/* Right Content */}
          <main className={styles['content']}>
            {/* Announcement Area */}
            <div ref={announcementAreaRef} className={styles['announcement-area']} style={{ height: `${announcementAreaHeight}px` }}>
              <MarkdownViewer markdownText={announcement} />
            </div>

            {/* Resize Handle */}
            <div className="resize-handle-vertical" onMouseDown={() => setIsResizingAnnouncementArea(true)} onMouseUp={() => setIsResizingAnnouncementArea(false)} />

            {/* Message Area */}
            <div className={styles['message-area']}>
              <MessageViewer messages={channelMessages} userId={userId} />
            </div>

            {/* Input Area */}
            <div className={styles['input-area']}>
              <div className={styles['broadcast-area']} style={{ display: showActionMessage ? 'flex' : 'none' }}>
                <div className={styles['broadcast-content']}>
                  <MessageViewer messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} userId={userId} />
                </div>
              </div>
              <MessageInputBox
                onSendMessage={(msg) => {
                  handleSendMessage(serverId, channelId, { type: 'general', content: msg });
                }}
                disabled={isForbidByGuestText || isForbidByGuestTextGap || isForbidByGuestTextWait || isForbidByChatMode}
                placeholder={
                  isForbidByChatMode
                    ? t('forbid-only-admin-text')
                    : isForbidByGuestText
                      ? t('forbid-guest-text')
                      : isForbidByGuestTextGap
                        ? `${t('guest-text-gap-time')} ${leftGapTime} ${t('seconds')}`
                        : isForbidByGuestTextWait
                          ? `${t('guest-text-wait-time')} ${leftWaitTime} ${t('seconds')}`
                          : t('input-message')
                }
                maxLength={textMaxLength}
              />
            </div>

            {/* Button Area */}
            <div className={styles['button-area']}>
              <div className={styles['buttons']}>
                <div
                  ref={voiceModeRef}
                  className={styles['voice-mode-dropdown']}
                  style={userPermission >= 3 ? {} : { display: 'none' }}
                  onClick={() => {
                    if (!voiceModeRef.current) return;
                    const x = voiceModeRef.current.getBoundingClientRect().left;
                    const y = voiceModeRef.current.getBoundingClientRect().top;
                    contextMenu.showContextMenu(x, y, true, false, [
                      {
                        id: 'free-speech',
                        label: t('free-speech'),
                        show: canChangeToFreeSpeech,
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'free' });
                        },
                      },
                      {
                        id: 'forbid-speech',
                        label: t('forbid-speech'),
                        show: canChangeToForbiddenSpeech,
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'forbidden' });
                        },
                      },
                      {
                        id: 'queue-mode',
                        label: t('queue'),
                        icon: 'submenu',
                        show: canChangeToForbiddenQueue || canChangeToControlQueue,
                        hasSubmenu: true,
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'queue' });
                        },
                        submenuItems: [
                          {
                            id: 'forbid-queue',
                            label: t('forbid-queue'),
                            show: canChangeToForbiddenQueue,
                            onClick: () => {
                              // handleEditChannel({ queueMode: 'forbidden' }, currentChannelId, serverId);
                            },
                          },
                          {
                            id: 'control-queue',
                            label: t('control-queue'),
                            show: canChangeToControlQueue,
                            onClick: () => {
                              // handleEditChannel({ queueMode: 'control' }, currentChannelId, serverId);
                            },
                          },
                        ],
                      },
                    ]);
                  }}
                >
                  {channelVoiceMode === 'queue' ? t('queue') : channelVoiceMode === 'free' ? t('free-speech') : channelVoiceMode === 'forbidden' ? t('forbid-speech') : ''}
                </div>
              </div>
              <div className={`${styles['mic-button']} ${webRTC.isMicTaken ? styles['active'] : ''}`} onClick={handleToggleTakeMic}>
                <div className={`${styles['mic-icon']} ${webRTC.volumePercent ? styles[`level${Math.ceil(webRTC.volumePercent[userId] / 10) - 1}`] : ''}`} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={styles['mic-text']}>{webRTC.isMicTaken ? t('taken-mic') : t('take-mic')}</div>
                  <div className={styles['mic-sub-text']}>
                    {webRTC.isMicTaken && webRTC.micVolume === 0 && t('mic-muted')}
                    {webRTC.isMicTaken && webRTC.micVolume !== 0 && speakMode === 'key' && !webRTC.isPressSpeakKey && t('press-key-to-speak', { '0': speakHotKey })}
                    {webRTC.isMicTaken && webRTC.micVolume !== 0 && speakMode === 'key' && webRTC.isPressSpeakKey && t('speaking')}
                  </div>
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkg-mode-btn']}>{t('mixing')}</div>
                <div className={styles['saperator-1']} />
                <div className={styles['mic-volume-container']}>
                  <div
                    className={`${styles['mic-mode-btn']} ${webRTC.isMicMute || webRTC.micVolume === 0 ? styles['muted'] : styles['active']}`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setShowMicVolume(true);
                    }}
                  />
                  {showMicVolume && (
                    <div
                      className={styles['volume-slider']}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setShowMicVolume(false);
                      }}
                    >
                      <div className={styles['slider-container']}>
                        <input className={styles['slider']} type="range" min="0" max="100" value={webRTC.micVolume} onChange={handleEditMicVolume} />
                      </div>
                      <div className={`${styles['mic-mode-btn']} ${webRTC.isMicMute || webRTC.micVolume === 0 ? styles['muted'] : styles['active']}`} onClick={handleToggleMicMute} />
                    </div>
                  )}
                </div>
                <div className={styles['speaker-volume-container']}>
                  <div
                    className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setShowSpeakerVolume(true);
                    }}
                  />
                  {showSpeakerVolume && (
                    <div
                      className={styles['volume-slider']}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setShowSpeakerVolume(false);
                      }}
                    >
                      <div className={styles['slider-container']}>
                        <input type="range" min="0" max="100" value={webRTC.speakerVolume} onChange={handleEditSpeakerVolume} className={styles['slider']} />
                      </div>
                      <div className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`} onClick={handleToggleSpeakerMute} />
                    </div>
                  )}
                </div>
                <div className={styles['record-mode-btn']} />
              </div>
            </div>
          </main>
        </main>
      </main>
    );
  },
);

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;
