import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';
import MessageViewer from '@/components/MessageViewer';
import ChannelListViewer from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import type { User, Server, Channel, Member, ChannelMessage, PromptMessage, SpeakingMode, Friend, QueueMember, ChannelUIMode } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

function MessageInputBoxGuard({
  userPermission,
  userLastJoinChannelTime,
  userLastMessageTime,
  channelForbidText,
  channelForbidGuestText,
  channelGuestTextGapTime,
  channelGuestTextWaitTime,
  channelGuestTextMaxLength,
  onSend,
}: {
  userPermission: number;
  userLastJoinChannelTime: number;
  userLastMessageTime: number;
  channelForbidText: boolean;
  channelForbidGuestText: boolean;
  channelGuestTextGapTime: number;
  channelGuestTextWaitTime: number;
  channelGuestTextMaxLength: number;
  onSend: (msg: string) => void;
}) {
  // Hooks
  const { t } = useTranslation();

  // States
  const [now, setNow] = useState(Date.now());

  // Effects
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const leftGapTime = channelGuestTextGapTime ? channelGuestTextGapTime - Math.floor((now - userLastJoinChannelTime) / 1000) : 0;
  const leftWaitTime = channelGuestTextWaitTime ? channelGuestTextWaitTime - Math.floor((now - userLastMessageTime) / 1000) : 0;

  const isGuest = userPermission === 1;
  const isAdmin = userPermission >= 3;
  const isForbidByForbidText = !isAdmin && channelForbidText;
  const isForbidByForbidGuestText = isGuest && channelForbidGuestText;
  const isForbidByForbidGuestTextGap = isGuest && leftGapTime > 0;
  const isForbidByForbidGuestTextWait = isGuest && leftWaitTime > 0;
  const disabled = isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
  const maxLength = isGuest ? channelGuestTextMaxLength : 9999;
  const placeholder = useMemo(() => {
    if (isForbidByForbidText) return t('channel-forbid-text-message');
    if (isForbidByForbidGuestText) return t('channel-forbid-guest-text-message');
    if (isForbidByForbidGuestTextGap) return t('channel-guest-text-gap-time-message', { '0': leftGapTime.toString() });
    if (isForbidByForbidGuestTextWait) return t('channel-guest-text-wait-time-message', { '0': leftWaitTime.toString() });
    return `${t('input-message')}...`;
  }, [t, isForbidByForbidText, isForbidByForbidGuestText, isForbidByForbidGuestTextGap, isForbidByForbidGuestTextWait, leftGapTime, leftWaitTime]);

  return <MessageInputBox disabled={disabled} maxLength={maxLength} placeholder={placeholder} onSend={onSend} />;
}

interface ServerPageProps {
  user: User;
  currentServer: Server;
  serverMembers: Member[];
  serverChannels: Channel[];
  queueMembers: QueueMember[];
  friends: Friend[];
  currentChannel: Channel;
  channelMessages: ChannelMessage[];
  actionMessages: PromptMessage[];
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, currentServer, serverMembers, serverChannels, friends, currentChannel, channelMessages, actionMessages, display, queueMembers }) => {
    // Hooks
    const { t } = useTranslation();
    const webRTC = useWebRTC();
    const contextMenu = useContextMenu();

    // Refs
    const webRTCRef = useRef(webRTC);
    const isResizingSidebarRef = useRef<boolean>(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizingAnnAreaRef = useRef<boolean>(false);
    const annAreaRef = useRef<HTMLDivElement>(null);
    const voiceModeMenuRef = useRef<HTMLDivElement>(null);
    const actionMessageTimer = useRef<NodeJS.Timeout | null>(null);
    const isMicTakenRef = useRef<boolean>(false);

    // States
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
    const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
    const [speakMode, setSpeakMode] = useState<SpeakingMode>('key');
    const [speakHotKey, setSpeakHotKey] = useState<string>('');
    const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>('three-line');

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
      forbidQueue: channelForbidQueue,
      forbidGuestText: channelForbidGuestText,
      guestTextGapTime: channelGuestTextGapTime,
      guestTextWaitTime: channelGuestTextWaitTime,
      guestTextMaxLength: channelGuestTextMaxLength,
    } = currentChannel;
    const announcement = channelAnnouncement || serverAnnouncement;

    // Handlers
    const handleSendMessage = (serverId: Server['serverId'], channelId: Channel['channelId'], preset: Partial<ChannelMessage>): void => {
      ipcService.socket.send('channelMessage', { serverId, channelId, preset });
    };

    const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
      ipcService.socket.send('editChannel', { serverId, channelId, update });
    };

    const handleJoinQueue = () => {
      ipcService.socket.send('addToQueue', { serverId, channelId: currentChannel.channelId, userId });
    };

    const handleLeaveQueue = () => {
      ipcService.socket.send('leaveQueue', { serverId, channelId: currentChannel.channelId });
    };

    const handleControlQueue = () => {
      ipcService.socket.send('controlQueue', { serverId, channelId: currentChannel.channelId });
    };

    const handleToggleSpeakerMute = () => {
      webRTC.toggleSpeakerMute();
    };

    const handleEditSpeakerVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      webRTC.changeSpeakerVolume(parseInt(e.target.value));
    };

    const handleToggleMicMute = () => {
      webRTC.toggleMicMute();
    };

    const handleEditMicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      webRTC.changeMicVolume(parseInt(e.target.value));
    };

    const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingSidebarRef.current = true;
    };

    const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizingSidebarRef.current || !sidebarRef.current) return;
      sidebarRef.current.style.width = `${e.clientX}px`;
    };

    const handleSidebarHandleUp = () => (isResizingSidebarRef.current = false);

    const handleAnnAreaHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingAnnAreaRef.current = true;
    };

    const handleAnnAreaHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizingAnnAreaRef.current || !annAreaRef.current) return;
      if (channelUIMode === 'classic') {
        annAreaRef.current.style.height = `${e.clientY - annAreaRef.current.offsetTop}px`;
      } else if (channelUIMode === 'three-line') {
        annAreaRef.current.style.width = `${e.clientX - annAreaRef.current.offsetLeft}px`;
      }
    };

    const handleAnnAreaHandleUp = () => (isResizingAnnAreaRef.current = false);

    // Effects
    useEffect(() => {
      webRTCRef.current.changeBitrate(channelBitrate);
    }, [channelBitrate]);

    useEffect(() => {
      if (actionMessages.length === 0) return;
      if (actionMessageTimer.current) clearTimeout(actionMessageTimer.current);
      setShowActionMessage(true);
      actionMessageTimer.current = setTimeout(() => setShowActionMessage(false), 8000);
      return () => {
        if (actionMessageTimer.current) {
          clearTimeout(actionMessageTimer.current);
          actionMessageTimer.current = null;
        }
      };
    }, [actionMessages]);

    useEffect(() => {
      const newMicTaken = queueMembers.some((m) => m.position === 0 && m.userId === userId);
      setIsMicTaken(newMicTaken);
      if (newMicTaken !== isMicTakenRef.current) {
        isMicTakenRef.current = newMicTaken;
        if (newMicTaken) webRTC.takeMic();
        else webRTC.untakeMic();
      }
    }, [queueMembers, userId, webRTC]);

    useEffect(() => {
      if (channelUIMode === 'classic') {
        annAreaRef.current!.style.minWidth = '100%';
        annAreaRef.current!.style.minHeight = '60px';
      } else if (channelUIMode === 'three-line') {
        annAreaRef.current!.style.minHeight = '100%';
        annAreaRef.current!.style.minWidth = '200px';
      }
    }, [channelUIMode]);

    useEffect(() => {
      ipcService.discord.updatePresence({
        details: `${t('in')} ${serverName}`,
        state: `${t('rpc:chat-with-members', { '0': serverMembers.length.toString() })}`,
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
    }, [t, serverName, serverMembers]);

    useEffect(() => {
      const unsubscribe = [
        ipcService.systemSettings.speakingMode.get(setSpeakMode),
        ipcService.systemSettings.defaultSpeakingKey.get(setSpeakHotKey),
        ipcService.systemSettings.channelUIMode.get(setChannelUIMode),
      ];
      return () => unsubscribe.forEach((unsub) => unsub());
    }, []);

    return (
      <main className={styles['server']} style={display ? {} : { display: 'none' }}>
        {/* Body */}
        <main className={styles['server-body']}>
          {/* Left Sidebar */}
          <aside ref={sidebarRef} className={styles['sidebar']}>
            <ChannelListViewer
              currentServer={currentServer}
              currentChannel={currentChannel}
              serverMembers={serverMembers}
              serverChannels={serverChannels}
              friends={friends}
              queueMembers={queueMembers}
            />
          </aside>

          {/* Resize Handle */}
          <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} onPointerUp={handleSidebarHandleUp} />

          {/* Right Content */}
          <main className={styles['content']}>
            {/* Message Area */}
            <div className={`${styles['content-layout']} ${styles[channelUIMode]}`}>
              {/* Announcement Area */}
              <div ref={annAreaRef} className={styles['announcement-area']}>
                <MarkdownViewer markdownText={announcement} />
              </div>

              {/* Resize Handle */}
              <div
                className="resize-handle-vertical"
                style={channelUIMode === 'classic' ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
                onPointerUp={handleAnnAreaHandleUp}
              />
              <div
                className="resize-handle"
                style={channelUIMode === 'three-line' ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
                onPointerUp={handleAnnAreaHandleUp}
              />

              {/* Bottom Area */}
              <div className={styles['bottom-area']}>
                {/* Message Area */}
                <div className={styles['message-area']}>
                  <MessageViewer messages={channelMessages} userId={userId} />
                </div>

                {/* Broadcast Area */}
                <div className={styles['input-area']}>
                  <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
                    <div className={styles['broadcast-content']}>
                      <MessageViewer messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} userId={userId} />
                    </div>
                  </div>
                  <MessageInputBoxGuard
                    onSend={(msg) => handleSendMessage(serverId, channelId, { type: 'general', content: msg })}
                    userPermission={userPermission}
                    userLastJoinChannelTime={userLastJoinChannelTime}
                    userLastMessageTime={userLastMessageTime}
                    channelForbidText={channelForbidText}
                    channelForbidGuestText={channelForbidGuestText}
                    channelGuestTextGapTime={channelGuestTextGapTime}
                    channelGuestTextWaitTime={channelGuestTextWaitTime}
                    channelGuestTextMaxLength={channelGuestTextMaxLength}
                  />
                </div>
              </div>
            </div>

            {/* Button Area */}
            <div className={styles['button-area']}>
              <div className={styles['buttons']}>
                <div
                  ref={voiceModeMenuRef}
                  className={styles['voice-mode-dropdown']}
                  style={userPermission >= 3 ? {} : { display: 'none' }}
                  onClick={() => {
                    if (!voiceModeMenuRef.current) return;
                    const x = voiceModeMenuRef.current.getBoundingClientRect().left;
                    const y = voiceModeMenuRef.current.getBoundingClientRect().top;
                    contextMenu.showContextMenu(x, y, true, false, [
                      {
                        id: 'free-speech',
                        label: t('free-speech'),
                        icon: channelVoiceMode === 'free' ? 'checked' : '',
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'free' });
                        },
                      },
                      {
                        id: 'admin-speech',
                        label: t('admin-speech'),
                        icon: channelVoiceMode === 'admin' ? 'checked' : '',
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'admin' });
                        },
                      },
                      {
                        id: 'queue-speech',
                        label: t('queue-speech'),
                        icon: channelVoiceMode === 'queue' ? 'submenu' : '',
                        hasSubmenu: channelVoiceMode === 'queue',
                        onClick: () => {
                          handleEditChannel(serverId, channelId, { voiceMode: 'queue' });
                        },
                        submenuItems: [
                          {
                            id: 'forbid-guest-queue',
                            label: t('forbid-queue'),
                            icon: channelForbidQueue ? 'checked' : '',
                            disabled: channelVoiceMode !== 'queue',
                            onClick: () => {
                              handleEditChannel(serverId, channelId, { forbidQueue: !channelForbidQueue });
                            },
                          },
                          {
                            id: 'control-queue',
                            label: t('control-queue'),
                            disabled: channelVoiceMode !== 'queue',
                            onClick: () => {
                              handleControlQueue();
                            },
                          },
                        ],
                      },
                    ]);
                  }}
                >
                  {channelVoiceMode === 'queue' ? t('queue-speech') : channelVoiceMode === 'free' ? t('free-speech') : channelVoiceMode === 'admin' ? t('admin-speech') : ''}
                </div>
              </div>
              <div className={`${styles['mic-button']} ${isMicTaken ? styles['active'] : ''}`} onClick={isMicTaken ? handleLeaveQueue : handleJoinQueue}>
                <div className={`${styles['mic-icon']} ${webRTC.volumePercent ? styles[`level${Math.ceil(webRTC.volumePercent[userId] / 10) - 1}`] : ''}`} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={styles['mic-text']}>{isMicTaken ? t('mic-taken') : t('take-mic')}</div>
                  <div className={styles['mic-sub-text']}>
                    {isMicTaken
                      ? speakMode === 'key'
                        ? webRTC.isPressSpeakKey
                          ? webRTC.micVolume === 0
                            ? t('mic-muted')
                            : t('speaking')
                          : t('press-key-to-speak', { '0': speakHotKey })
                        : webRTC.micVolume === 0
                          ? t('mic-muted')
                          : t('speaking')
                      : ''}
                  </div>
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkg-mode-btn']}>{t('mixing')}</div>
                <div className={styles['saperator-1']} />
                <div className={styles['mic-volume-container']}>
                  <div className={`${styles['mic-mode-btn']} ${webRTC.isMicMute || webRTC.micVolume === 0 ? styles['muted'] : styles['active']}`} />
                  <div className={styles['volume-slider']}>
                    <div className={styles['slider-container']}>
                      <input className={styles['slider']} type="range" min="0" max="100" value={webRTC.micVolume} onChange={handleEditMicVolume} />
                    </div>
                    <div className={`${styles['mic-mode-btn']} ${webRTC.isMicMute || webRTC.micVolume === 0 ? styles['muted'] : styles['active']}`} onClick={handleToggleMicMute} />
                  </div>
                </div>
                <div className={styles['speaker-volume-container']}>
                  <div className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`} />
                  <div className={styles['volume-slider']}>
                    <div className={styles['slider-container']}>
                      <input type="range" min="0" max="100" value={webRTC.speakerVolume} onChange={handleEditSpeakerVolume} className={styles['slider']} />
                    </div>
                    <div className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`} onClick={handleToggleSpeakerMute} />
                  </div>
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
