import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';
import MessageContent from '@/components/MessageContent';
import ChannelList from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import type { User, Server, Channel, OnlineMember, ChannelMessage, PromptMessage, SpeakingMode, Friend, QueueMember, ChannelUIMode } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { isMember, isChannelAdmin } from '@/utils/permission';

interface MessageInputBoxGuardProps {
  lastJoinChannelTime: number;
  lastMessageTime: number;
  permissionLevel: number;
  channelForbidText: boolean;
  channelForbidGuestText: boolean;
  channelGuestTextGapTime: number;
  channelGuestTextWaitTime: number;
  channelGuestTextMaxLength: number;
  channelIsTextMuted: boolean;
  onSend: (msg: string) => void;
}

const MessageInputBoxGuard = React.memo(
  ({
    lastJoinChannelTime,
    lastMessageTime,
    permissionLevel,
    channelForbidText,
    channelForbidGuestText,
    channelGuestTextGapTime,
    channelGuestTextWaitTime,
    channelGuestTextMaxLength,
    channelIsTextMuted,
    onSend,
  }: MessageInputBoxGuardProps) => {
    // Hooks
    const { t } = useTranslation();

    // States
    const [now, setNow] = useState(Date.now());

    // Effects
    useEffect(() => {
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }, []);

    const leftGapTime = channelGuestTextGapTime ? channelGuestTextGapTime - Math.floor((now - lastMessageTime) / 1000) : 0;
    const leftWaitTime = channelGuestTextWaitTime ? channelGuestTextWaitTime - Math.floor((now - lastJoinChannelTime) / 1000) : 0;

    const isForbidByMutedText = channelIsTextMuted;
    const isForbidByForbidText = !isChannelAdmin(permissionLevel) && channelForbidText;
    const isForbidByForbidGuestText = !isMember(permissionLevel) && channelForbidGuestText;
    const isForbidByForbidGuestTextGap = !isMember(permissionLevel) && leftGapTime > 0;
    const isForbidByForbidGuestTextWait = !isMember(permissionLevel) && leftWaitTime > 0;
    const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
    const maxLength = !isMember(permissionLevel) ? channelGuestTextMaxLength : 9999;
    const placeholder = useMemo(() => {
      if (isForbidByMutedText) return t('text-was-muted-in-channel-message');
      if (isForbidByForbidText) return t('channel-forbid-text-message');
      if (isForbidByForbidGuestText) return t('channel-forbid-guest-text-message');
      if (isForbidByForbidGuestTextGap) return t('channel-guest-text-gap-time-message', { '0': leftGapTime.toString() });
      if (isForbidByForbidGuestTextWait) return t('channel-guest-text-wait-time-message', { '0': leftWaitTime.toString() });
      return `${t('input-message')}...`;
    }, [t, isForbidByMutedText, isForbidByForbidText, isForbidByForbidGuestText, isForbidByForbidGuestTextGap, isForbidByForbidGuestTextWait, leftGapTime, leftWaitTime]);

    return <MessageInputBox disabled={disabled} maxLength={maxLength} placeholder={placeholder} onSend={onSend} />;
  },
);

MessageInputBoxGuard.displayName = 'MessageInputBoxGuard';

interface VolumeSliderProps {
  value: number;
  muted: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  railCls: string;
  btnCls: string;
}

const VolumeSlider = React.memo(
  function VolumeSlider({ value, muted, onChange, onToggleMute, railCls, btnCls }: VolumeSliderProps) {
    // Refs
    const sliderRef = useRef<HTMLInputElement>(null);
    const btnIsHoverRef = useRef<boolean>(false);

    return (
      <div className={railCls}>
        <div className={styles['slider-container']}>
          <input ref={sliderRef} type="range" min="0" max="100" value={value} onChange={onChange} className={styles['slider']} />
        </div>
        <div
          className={`${btnCls} ${muted ? styles['muted'] : styles['active']}`}
          onClick={onToggleMute}
          onMouseEnter={() => (btnIsHoverRef.current = true)}
          onMouseLeave={() => (btnIsHoverRef.current = false)}
          onWheel={(e) => {
            if (!btnIsHoverRef.current) return;
            const newValue = parseInt(sliderRef.current!.value);
            if (e.deltaY > 0) {
              sliderRef.current!.value = (newValue - 4).toString();
            } else {
              sliderRef.current!.value = (newValue + 4).toString();
            }
            onChange({ target: sliderRef.current! } as React.ChangeEvent<HTMLInputElement>);
          }}
        />
      </div>
    );
  },
  (prev, next) =>
    prev.value === next.value && // 比較關鍵 prop
    prev.muted === next.muted,
);

VolumeSlider.displayName = 'VolumeSlider';

interface ServerPageProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  serverChannels: Channel[];
  queueMembers: QueueMember[];
  channel: Channel;
  channelMessages: ChannelMessage[];
  actionMessages: PromptMessage[];
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(({ user, friends, server, serverOnlineMembers, serverChannels, channel, channelMessages, actionMessages, display, queueMembers }) => {
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
  const actionMessageTimer = useRef<NodeJS.Timeout | null>(null);
  const isMicTakenRef = useRef<boolean>(false);

  // States
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [speakMode, setSpeakMode] = useState<SpeakingMode>('key');
  const [speakHotKey, setSpeakHotKey] = useState<string>('');
  const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>('three-line');
  const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  // Variables
  const { userId, permissionLevel: globalPermissionLevel } = user;
  const { serverId, name: serverName, announcement: serverAnnouncement, permissionLevel: serverPermissionLevel } = server;
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
    permissionLevel: channelPermissionLevel,
    isTextMuted: channelIsTextMuted,
  } = channel;
  const announcement = channelAnnouncement || serverAnnouncement;
  const permissionLevel = Math.max(globalPermissionLevel, serverPermissionLevel, channelPermissionLevel);

  // Handlers
  const handleSendMessage = (serverId: Server['serverId'], channelId: Channel['channelId'], preset: Partial<ChannelMessage>): void => {
    ipc.socket.send('channelMessage', { serverId, channelId, preset });
    setLastMessageTime(Date.now());
  };

  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
  };

  const handleJoinQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('joinQueue', { serverId, channelId });
  };

  const handleLeaveQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('leaveQueue', { serverId, channelId });
  };

  const handleControlQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('controlQueue', { serverId, channelId });
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
    if (channelId) {
      setLastJoinChannelTime(Date.now());
      setLastMessageTime(0);
    }
  }, [channelId]);

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
    ipc.discord.updatePresence({
      details: `${t('in')} ${serverName}`,
      state: `${t('rpc:chat-with-members', { '0': serverOnlineMembers.length.toString() })}`,
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
  }, [t, serverName, serverOnlineMembers]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: SpeakingMode) => {
      console.info('[ServerPage] speak mode updated: ', speakingMode);
      setSpeakMode(speakingMode);
    };
    const changeDefaultSpeakingKey = (key: string) => {
      console.info('[ServerPage] default speaking key updated: ', key);
      setSpeakHotKey(key);
    };
    const changeChannelUIMode = (channelUIMode: ChannelUIMode) => {
      console.info('[ServerPage] channel UI mode updated: ', channelUIMode);
      setChannelUIMode(channelUIMode);
    };

    changeSpeakingMode(ipc.systemSettings.speakingMode.get());
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    changeChannelUIMode(ipc.systemSettings.channelUIMode.get());

    const unsubscribe = [
      ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode),
      ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey),
      ipc.systemSettings.channelUIMode.onUpdate(changeChannelUIMode),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <main className={styles['server']} style={display ? {} : { display: 'none' }}>
      {/* Body */}
      <main className={styles['server-body']}>
        {/* Left Sidebar */}
        <aside ref={sidebarRef} className={styles['sidebar']}>
          <ChannelList user={user} friends={friends} server={server} serverOnlineMembers={serverOnlineMembers} serverChannels={serverChannels} channel={channel} queueMembers={queueMembers} />
        </aside>

        {/* Resize Handle */}
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} onPointerUp={handleSidebarHandleUp} />

        {/* Right Content */}
        <main className={styles['content']}>
          {/* Message Area */}
          <div className={`${styles['content-layout']} ${styles[channelUIMode]}`}>
            {/* Announcement Area */}
            <div ref={annAreaRef} className={styles['announcement-area']}>
              <MarkdownContent markdownText={announcement} escapeHtml={false} />
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
                <MessageContent messages={channelMessages} userId={userId} />
              </div>

              {/* Broadcast Area */}
              <div className={styles['input-area']}>
                <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
                  <MessageContent messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} userId={userId} />
                </div>
                <MessageInputBoxGuard
                  lastJoinChannelTime={lastJoinChannelTime}
                  lastMessageTime={lastMessageTime}
                  permissionLevel={permissionLevel}
                  channelForbidText={channelForbidText}
                  channelForbidGuestText={channelForbidGuestText}
                  channelGuestTextGapTime={channelGuestTextGapTime}
                  channelGuestTextWaitTime={channelGuestTextWaitTime}
                  channelGuestTextMaxLength={channelGuestTextMaxLength}
                  channelIsTextMuted={channelIsTextMuted}
                  onSend={(msg) => handleSendMessage(serverId, channelId, { type: 'general', content: msg })}
                />
              </div>
            </div>
          </div>

          {/* Button Area */}
          <div className={styles['button-area']}>
            <div className={styles['buttons']}>
              <div
                className={styles['voice-mode-dropdown']}
                style={isChannelAdmin(permissionLevel) ? {} : { display: 'none' }}
                onClick={(e) => {
                  const x = e.currentTarget.getBoundingClientRect().left;
                  const y = e.currentTarget.getBoundingClientRect().top;
                  contextMenu.showContextMenu(x, y, 'right-top', [
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
                            handleControlQueue(serverId, channelId);
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
            <div
              className={`${styles['mic-button']} ${isMicTaken ? styles['active'] : ''}`}
              onClick={isMicTaken ? () => handleLeaveQueue(serverId, channelId) : () => handleJoinQueue(serverId, channelId)}
            >
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
                <VolumeSlider
                  value={webRTC.micVolume}
                  muted={webRTC.isMicMute || webRTC.micVolume === 0}
                  onChange={handleEditMicVolume}
                  onToggleMute={handleToggleMicMute}
                  railCls={styles['volume-slider']}
                  btnCls={styles['mic-mode-btn']}
                />
              </div>
              <div className={styles['speaker-volume-container']}>
                <div className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`} />
                <VolumeSlider
                  value={webRTC.speakerVolume}
                  muted={webRTC.isSpeakerMute || webRTC.speakerVolume === 0}
                  onChange={handleEditSpeakerVolume}
                  onToggleMute={handleToggleSpeakerMute}
                  railCls={styles['volume-slider']}
                  btnCls={styles['speaker-btn']}
                />
              </div>
              <div className={styles['record-mode-btn']} />
            </div>
          </div>
        </main>
      </main>
    </main>
  );
});

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;
