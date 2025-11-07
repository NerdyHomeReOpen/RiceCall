import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// CSS
import styles from '@/styles/server.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';
import ChannelMessageContent from '@/components/ChannelMessageContent';
import ChannelList from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import type { User, Server, Channel, OnlineMember, ChannelMessage, PromptMessage, SpeakingMode, Friend, QueueUser, ChannelUIMode, MemberApplication } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { isMember, isChannelMod } from '@/utils/permission';
import { getFormatTimeFromSecond } from '@/utils/language';
import MicModeMenu from '@/components/MicModeMenu';

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
    const isForbidByForbidText = !isChannelMod(permissionLevel) && channelForbidText;
    const isForbidByForbidGuestText = !isMember(permissionLevel) && channelForbidGuestText;
    const isForbidByForbidGuestTextGap = !isMember(permissionLevel) && leftGapTime > 0;
    const isForbidByForbidGuestTextWait = !isMember(permissionLevel) && leftWaitTime > 0;
    const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
    const maxLength = !isMember(permissionLevel) ? channelGuestTextMaxLength : 3000;

    return <MessageInputBox disabled={disabled} maxLength={maxLength} onSend={onSend} />;
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
  (prev, next) => prev.value === next.value && prev.muted === next.muted,
);

VolumeSlider.displayName = 'VolumeSlider';

interface ServerPageProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  serverMemberApplications: MemberApplication[];
  currentChannel: Channel;
  channels: Channel[];
  channelMessages: (ChannelMessage | PromptMessage)[];
  clearMessages: () => void;
  actionMessages: PromptMessage[];
  queueUsers: QueueUser[];
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, friends, server, serverOnlineMembers, serverMemberApplications, currentChannel, channels, channelMessages, clearMessages, actionMessages, queueUsers, display }) => {
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

    // States
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
    const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('key');
    const [speakingKey, setSpeakingKey] = useState<string>('');
    const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>('three-line');
    const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
    const [lastMessageTime, setLastMessageTime] = useState<number>(0);
    const [isMicModeMenuVisible, setIsMicModeMenuVisible] = useState<boolean>(false);
    const [isScrollToBottom, setIsScrollToBottom] = useState<boolean>(true);
    const [isAnnouncementVisible, setIsAnnouncementVisible] = useState<boolean>(true);

    // Variables
    const { userId, permissionLevel: globalPermissionLevel } = user;
    const { serverId, announcement: serverAnnouncement, permissionLevel: serverPermissionLevel } = server;
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
      isVoiceMuted: channelIsVoiceMuted,
    } = currentChannel;
    const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel, channelPermissionLevel), [globalPermissionLevel, serverPermissionLevel, channelPermissionLevel]);
    const queueUser = useMemo(() => queueUsers.find((m) => m.userId === userId), [queueUsers, userId]);
    const queuePosition = useMemo(() => (queueUser?.position ?? 0) + 1, [queueUser]);
    const channelIsQueueMode = useMemo(() => channelVoiceMode === 'queue', [channelVoiceMode]);
    const channelIsQueueControlled = useMemo(() => queueUsers.some((m) => m.isQueueControlled), [queueUsers]);
    const volumeLevel = useMemo(() => (webRTC.isSpeaking('user') ? Math.ceil(webRTC.getVolumePercent('user') / 10) - 1 : 0), [webRTC]);
    const isMicTaken = useMemo(() => queueUsers.some((m) => m.userId === userId && m.position <= 0), [queueUsers, userId]);
    const isQueuing = useMemo(() => queueUsers.some((m) => m.userId === userId && m.position > 0), [queueUsers, userId]);
    const isIdling = useMemo(() => !isMicTaken && !isQueuing, [isMicTaken, isQueuing]);
    const isControlled = useMemo(() => queueUsers.some((m) => m.userId === userId && m.position === 0 && !isChannelMod(permissionLevel) && m.isQueueControlled), [queueUsers, userId, permissionLevel]);

    const micText = useMemo(() => {
      if (isMicTaken) return t('mic-taken');
      if (isQueuing) return t('mic-queued');
      return t('take-mic');
    }, [isMicTaken, isQueuing, t]);

    const micSubText = useMemo(() => {
      if (isIdling) return '';
      if (isQueuing) return t('in-queue-position', { '0': queuePosition });
      if (channelIsVoiceMuted) return t('mic-forbidden');
      if (isControlled) return t('mic-controlled');
      if (speakingMode === 'key' && !webRTC.isSpeakKeyPressed) {
        return t('press-key-to-speak', { '0': speakingKey });
      }
      if (webRTC.isMixModeActive) return t('speaking-with-mix');
      if (webRTC.micVolume === 0) return t('mic-muted');
      return t('speaking');
    }, [speakingMode, speakingKey, webRTC.isSpeakKeyPressed, webRTC.micVolume, isQueuing, isIdling, channelIsVoiceMuted, isControlled, queuePosition, t, webRTC.isMixModeActive]);

    const micBtnClass = useMemo(() => {
      let className = styles['mic-button'];
      if (isMicTaken) className += ` ${styles['speaking']}`;
      if (isQueuing) className += ` ${styles['queuing']}`;
      if (channelIsVoiceMuted || isControlled) className += ` ${styles['muted']}`;
      if (!channelIsQueueMode || (!isChannelMod(permissionLevel) && isIdling)) className += ` ${styles['no-selection']}`;
      return className;
    }, [isMicTaken, isQueuing, channelIsVoiceMuted, isControlled, channelIsQueueMode, permissionLevel, isIdling]);

    // Handlers
    const handleSendMessage = (serverId: Server['serverId'], channelId: Channel['channelId'], preset: Partial<ChannelMessage>): void => {
      ipc.socket.send('channelMessage', { serverId, channelId, preset });
      setLastMessageTime(Date.now());
    };

    const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
      ipc.socket.send('editChannel', { serverId, channelId, update });
    };

    const handleJoinQueue = (serverId: Server['serverId'], channelId: Channel['channelId'], position?: number) => {
      ipc.socket.send('joinQueue', { serverId, channelId, position });
    };

    const handleLeaveQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipc.socket.send('leaveQueue', { serverId, channelId });
    };

    const handleControlQueue = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipc.socket.send('controlQueue', { serverId, channelId });
    };

    const handleToggleSpeakerMute = () => {
      webRTC.toggleSpeakerMuted();
    };

    const handleEditSpeakerVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      webRTC.changeSpeakerVolume(parseInt(e.target.value));
    };

    const handleToggleMicMute = () => {
      webRTC.toggleMicMuted();
    };

    const handleEditMicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      webRTC.changeMicVolume(parseInt(e.target.value));
    };

    const handleToggleMixingMode = async () => {
      webRTC.toggleMixMode();
    };

    const handleToggleRecord = async () => {
      webRTC.toggleRecording();
    };

    const handleClickMicButton = (e: React.MouseEvent<HTMLDivElement>) => {
      if (channelIsQueueMode) {
        if (!isIdling) {
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showMicContextMenu(x, y, 'right-top', [
            {
              id: 'untake-mic',
              label: t('untake-mic'),
              show: channelIsQueueMode,
              onClick: () => handleLeaveQueue(serverId, channelId),
            },
          ]);
        } else if (isChannelMod(permissionLevel)) {
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showMicContextMenu(x, y, 'right-top', [
            {
              id: 'take-mic-in-queue',
              label: t('take-mic-in-queue'),
              show: channelIsQueueMode,
              onClick: () => handleJoinQueue(serverId, channelId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'take-mic-directly',
              label: t('take-mic-directly'),
              show: channelIsQueueMode,
              onClick: () => handleJoinQueue(serverId, channelId, -2),
            },
          ]);
        } else {
          handleJoinQueue(serverId, channelId);
        }
      } else {
        if (isMicTaken) {
          handleLeaveQueue(serverId, channelId);
        } else {
          handleJoinQueue(serverId, channelId);
        }
      }
    };

    const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingSidebarRef.current = true;
    };

    const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizingSidebarRef.current || !sidebarRef.current) return;
      sidebarRef.current.style.width = `${e.clientX}px`;
    };

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

    const handleMessageAreaScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const isScrollToBottom = Math.abs(e.currentTarget.scrollTop + e.currentTarget.clientHeight - e.currentTarget.scrollHeight) < 1;
      setIsScrollToBottom(isScrollToBottom);
    };

    // Effects
    useEffect(() => {
      webRTCRef.current.changeBitrate(channelBitrate);
    }, [channelBitrate]);

    useEffect(() => {
      webRTCRef.current.setMicTaken(isMicTaken && !isControlled, channelId);
      webRTCRef.current.setMixMode(false);
    }, [isMicTaken, isControlled, channelId]);

    useEffect(() => {
      if (actionMessages.length === 0) {
        setShowActionMessage(false);
        return;
      }
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
      if (channelId) {
        setLastJoinChannelTime(Date.now());
        setLastMessageTime(0);
      }
    }, [channelId]);

    useEffect(() => {
      const resetResizing = () => {
        isResizingSidebarRef.current = false;
        isResizingAnnAreaRef.current = false;
      };
      document.addEventListener('pointerup', resetResizing);
      return () => document.removeEventListener('pointerup', resetResizing);
    }, []);

    useEffect(() => {
      const onPointerDown = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(`.${styles['mic-mode-menu']}`)) {
          setIsMicModeMenuVisible(false);
        }
      };
      document.addEventListener('pointerdown', onPointerDown);
      return () => document.removeEventListener('pointerdown', onPointerDown);
    }, []);

    useEffect(() => {
      const changeSpeakingMode = (speakingMode: SpeakingMode) => {
        console.info('[ServerPage] speaking mode updated: ', speakingMode);
        setSpeakingMode(speakingMode);
      };
      const changeSpeakingKey = (key: string) => {
        console.info('[ServerPage] speaking key updated: ', key);
        setSpeakingKey(key);
      };
      const changeChannelUIMode = (channelUIMode: ChannelUIMode) => {
        console.info('[ServerPage] channel UI mode updated: ', channelUIMode);
        setChannelUIMode(channelUIMode);
      };

      changeSpeakingMode(ipc.systemSettings.speakingMode.get());
      changeSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
      changeChannelUIMode(ipc.systemSettings.channelUIMode.get());

      const unsubscribe = [
        ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode),
        ipc.systemSettings.defaultSpeakingKey.onUpdate(changeSpeakingKey),
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
            <ChannelList
              user={user}
              friends={friends}
              server={server}
              serverOnlineMembers={serverOnlineMembers}
              serverMemberApplications={serverMemberApplications}
              channels={channels}
              currentChannel={currentChannel}
              queueUsers={queueUsers}
            />
          </aside>

          {/* Resize Handle */}
          <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />

          {/* Right Content */}
          <main className={styles['content']}>
            {/* Message Area */}
            <div className={`${styles['content-layout']} ${styles[channelUIMode]}`}>
              {/* Announcement Area */}
              {isAnnouncementVisible && (
                <div
                  ref={annAreaRef}
                  className={styles['announcement-area']}
                  style={isAnnouncementVisible ? (channelUIMode === 'classic' ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }) : { display: 'none' }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const { clientX: x, clientY: y } = e;
                    contextMenu.showContextMenu(x, y, 'right-bottom', [
                      {
                        id: 'close-announcement',
                        label: t('close-announcement'),
                        onClick: () => setIsAnnouncementVisible(false),
                      },
                    ]);
                  }}
                >
                  <MarkdownContent markdownText={channelAnnouncement || serverAnnouncement} />
                </div>
              )}

              {/* Resize Handle */}
              <div
                className="resize-handle-vertical"
                style={channelUIMode === 'classic' && isAnnouncementVisible ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
              />
              <div
                className="resize-handle"
                style={channelUIMode === 'three-line' && isAnnouncementVisible ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
              />

              {/* Bottom Area */}
              <div className={styles['bottom-area']}>
                {/* Message Area */}
                <div
                  className={styles['message-area']}
                  onScroll={handleMessageAreaScroll}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    if (target.closest(`.${styles['username-text']}`)) return;
                    const { clientX: x, clientY: y } = e;
                    contextMenu.showContextMenu(x, y, 'right-bottom', [
                      {
                        id: 'clean-up-message',
                        label: t('clean-up-message'),
                        onClick: () => clearMessages(),
                      },
                      {
                        id: 'open-announcement',
                        label: t('open-announcement'),
                        show: !isAnnouncementVisible,
                        onClick: () => setIsAnnouncementVisible(true),
                      },
                    ]);
                  }}
                >
                  <ChannelMessageContent messages={channelMessages} user={user} channel={currentChannel} server={server} isScrollToBottom={isScrollToBottom} />
                </div>

                {/* Broadcast Area */}
                <div className={styles['input-area']}>
                  <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
                    <ChannelMessageContent messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} user={user} channel={currentChannel} server={server} />
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
                    onSend={(message) => handleSendMessage(serverId, channelId, { type: 'general', content: message })}
                  />
                </div>
              </div>
            </div>

            {/* Button Area */}
            <div className={styles['button-area']}>
              <div className={styles['buttons']}>
                <div
                  className={styles['voice-mode-dropdown']}
                  style={isChannelMod(permissionLevel) ? {} : { display: 'none' }}
                  onClick={(e) => {
                    const x = e.currentTarget.getBoundingClientRect().left;
                    const y = e.currentTarget.getBoundingClientRect().top;
                    contextMenu.showContextMenu(x, y, 'right-top', [
                      {
                        id: 'free-speech',
                        label: t('free-speech'),
                        icon: channelVoiceMode === 'free' ? 'checked' : '',
                        onClick: () => handleEditChannel(serverId, channelId, { voiceMode: 'free' }),
                      },
                      {
                        id: 'admin-speech',
                        label: t('admin-speech'),
                        icon: channelVoiceMode === 'admin' ? 'checked' : '',
                        onClick: () => handleEditChannel(serverId, channelId, { voiceMode: 'admin' }),
                      },
                      {
                        id: 'queue-speech',
                        label: t('queue-speech'),
                        icon: channelVoiceMode === 'queue' ? 'submenu' : '',
                        hasSubmenu: channelVoiceMode === 'queue',
                        onClick: () => handleEditChannel(serverId, channelId, { voiceMode: 'queue' }),
                        submenuItems: [
                          {
                            id: 'forbid-guest-queue',
                            label: t('forbid-queue'),
                            icon: channelForbidQueue ? 'checked' : '',
                            disabled: channelVoiceMode !== 'queue',
                            onClick: () => handleEditChannel(serverId, channelId, { forbidQueue: !channelForbidQueue }),
                          },
                          {
                            id: 'control-queue',
                            label: t('control-queue'),
                            icon: channelIsQueueControlled ? 'checked' : '',
                            disabled: channelVoiceMode !== 'queue',
                            onClick: () => handleControlQueue(serverId, channelId),
                          },
                        ],
                      },
                    ]);
                  }}
                >
                  {channelVoiceMode === 'queue' ? t('queue-speech') : channelVoiceMode === 'free' ? t('free-speech') : channelVoiceMode === 'admin' ? t('admin-speech') : ''}
                </div>
              </div>
              <div className={micBtnClass} onClick={handleClickMicButton}>
                <div className={`${styles['mic-icon']} ${isMicTaken ? styles[`level${volumeLevel}`] : ''}`} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={styles['mic-text']} style={{ fontSize: isIdling ? '1.3rem' : '1.1rem' }}>
                    {micText}
                  </div>
                  <div className={styles['mic-sub-text']}>{micSubText}</div>
                </div>
              </div>
              <div className={styles['buttons']}>
                <div
                  className={`${styles['bkg-mode-btn']} ${webRTC.isMixModeActive ? styles['active'] : ''}`}
                  onClick={handleToggleMixingMode}
                  title={webRTC.isMixModeActive ? t('mixing-on') : t('mixing-off')}
                >
                  {t('mixing')}
                </div>
                <div className={styles['saperator-1']} />
                <div className={styles['mic-volume-container']}>
                  <div className={`${styles['mic-btn']} ${webRTC.isMicMuted || webRTC.micVolume === 0 ? styles['muted'] : styles['active']}`} />
                  <VolumeSlider
                    value={webRTC.micVolume}
                    muted={webRTC.isMicMuted || webRTC.micVolume === 0}
                    onChange={handleEditMicVolume}
                    onToggleMute={handleToggleMicMute}
                    railCls={styles['volume-slider']}
                    btnCls={styles['mic-btn']}
                  />
                  <div className={styles['mic-mode-dropdown-btn']} onClick={() => setIsMicModeMenuVisible(true)}>
                    {isMicModeMenuVisible ? <MicModeMenu /> : ''}
                  </div>
                </div>
                <div className={styles['speaker-volume-container']}>
                  <div className={`${styles['speaker-btn']} ${webRTC.speakerVolume === 0 ? styles['muted'] : ''}`} />
                  <VolumeSlider
                    value={webRTC.speakerVolume}
                    muted={webRTC.isSpeakerMuted || webRTC.speakerVolume === 0}
                    onChange={handleEditSpeakerVolume}
                    onToggleMute={handleToggleSpeakerMute}
                    railCls={styles['volume-slider']}
                    btnCls={styles['speaker-btn']}
                  />
                </div>
                <div className={`${styles['record-mode']} ${webRTC.isRecording ? styles['active'] : ''}`}>
                  <div className={`${styles['record-mode-btn']} ${webRTC.isRecording ? styles['active'] : ''}`} onClick={handleToggleRecord} />
                  <div className={`${styles['record-mode-text']} ${webRTC.isRecording ? styles['active'] : ''}`}>{getFormatTimeFromSecond(webRTC.recordTime)}</div>
                </div>
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
