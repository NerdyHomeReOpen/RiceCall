import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';
import MessageViewer from '@/components/MessageViewer';
import ChannelListViewer from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import type { User, Server, Channel, Member, ChannelMessage, PromptMessage, SpeakingMode, Friend, QueueMember } from '@/types';

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
  channelGuestTextGapTime,
  channelGuestTextWaitTime,
  channelGuestTextMaxLength,
  onSend,
}: {
  userPermission: number;
  userLastJoinChannelTime: number;
  userLastMessageTime: number;
  channelForbidText: boolean;
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
  const isForbidByChatMode = channelForbidText && userPermission < 3;
  const isForbidByGuestText = isGuest && isForbidByChatMode;
  const isForbidByGuestTextGap = isGuest && leftGapTime > 0;
  const isForbidByGuestTextWait = isGuest && leftWaitTime > 0;
  const disabled = isForbidByChatMode || isForbidByGuestText || isForbidByGuestTextGap || isForbidByGuestTextWait;
  const maxLength = isGuest ? channelGuestTextMaxLength : 9999;
  const placeholder = isForbidByChatMode
    ? t('forbid-only-admin-text')
    : isForbidByGuestText
      ? t('forbid-guest-text')
      : isForbidByGuestTextGap
        ? `${t('guest-text-gap-time')} ${leftGapTime} ${t('seconds')}`
        : isForbidByGuestTextWait
          ? `${t('guest-text-wait-time')} ${leftWaitTime} ${t('seconds')}`
          : t('input-message');

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
      annAreaRef.current.style.height = `${e.clientY - annAreaRef.current.offsetTop}px`;
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
      ipcService.discord.updatePresence({
        details: `${t('in')} ${serverName}`,
        state: `${t('chat-with-members', { '0': serverMembers.length.toString() })}`,
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
      const unsubscribe = [ipcService.systemSettings.speakingMode.get(setSpeakMode), ipcService.systemSettings.defaultSpeakingKey.get(setSpeakHotKey)];
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
            {/* Announcement Area */}
            <div ref={annAreaRef} className={styles['announcement-area']}>
              <MarkdownViewer markdownText={announcement} />
            </div>

            {/* Resize Handle */}
            <div className="resize-handle-vertical" onPointerDown={handleAnnAreaHandleDown} onPointerMove={handleAnnAreaHandleMove} onPointerUp={handleAnnAreaHandleUp} />

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
              <MessageInputBoxGuard
                onSend={(msg) => handleSendMessage(serverId, channelId, { type: 'general', content: msg })}
                userPermission={userPermission}
                userLastJoinChannelTime={userLastJoinChannelTime}
                userLastMessageTime={userLastMessageTime}
                channelGuestTextGapTime={channelGuestTextGapTime}
                channelGuestTextWaitTime={channelGuestTextWaitTime}
                channelGuestTextMaxLength={channelGuestTextMaxLength}
                channelForbidText={channelForbidText}
              />
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
                  <div className={styles['mic-text']}>{isMicTaken ? t('taken-mic') : t('take-mic')}</div>
                  <div className={styles['mic-sub-text']}>
                    {isMicTaken && webRTC.micVolume === 0 && t('mic-muted')}
                    {isMicTaken && webRTC.micVolume !== 0 && speakMode === 'key' && !webRTC.isPressSpeakKey && t('press-key-to-speak', { '0': speakHotKey })}
                    {isMicTaken && webRTC.micVolume !== 0 && speakMode === 'key' && webRTC.isPressSpeakKey && t('speaking')}
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
