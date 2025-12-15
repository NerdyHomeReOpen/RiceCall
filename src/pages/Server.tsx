import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// CSS
import styles from '@/styles/server.module.css';
import messageStyles from '@/styles/message.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';
import ChannelMessageContent from '@/components/ChannelMessageContent';
import ChannelList from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';
import MicModeMenu from '@/components/MicModeMenu';

// Types
import type { User, Server, Channel, OnlineMember, ChannelMessage, PromptMessage, SpeakingMode, Friend, QueueUser, ChannelUIMode, MemberApplication, ChannelEvent } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { isMember, isChannelMod } from '@/utils/permission';
import { getFormatTimeFromSecond } from '@/utils/language';
import { handleOpenChannelEvent, handleOpenServerApplication, handleOpenChatHistory } from '@/utils/popup';

// Constants
import { SHOW_FRAME_ORIGIN } from '@/constant';

const DEFAULT_DISPLAY_ACTION_MESSAGE_SECONDS = 8;
const MESSAGE_VIERER_DEVIATION = 100;

interface MessageInputBoxGuardProps {
  lastJoinChannelTime: number;
  lastMessageTime: number;
  permissionLevel: number;
  channelForbidText: boolean;
  channelForbidGuestText: boolean;
  channelGuestTextGapTime: number;
  channelGuestTextWaitTime: number;
  channelGuestTextMaxLength: number;
  isChannelTextMuted: boolean;
  onSendMessage: (msg: string) => void;
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
    isChannelTextMuted,
    onSendMessage,
  }: MessageInputBoxGuardProps) => {
    // States
    const [now, setNow] = useState(Date.now());

    // Effects
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);

    const leftGapTime = channelGuestTextGapTime ? channelGuestTextGapTime - Math.floor((now - lastMessageTime) / 1000) : 0;
    const leftWaitTime = channelGuestTextWaitTime ? channelGuestTextWaitTime - Math.floor((now - lastJoinChannelTime) / 1000) : 0;

    const isForbidByMutedText = isChannelTextMuted;
    const isForbidByForbidText = !isChannelMod(permissionLevel) && channelForbidText;
    const isForbidByForbidGuestText = !isMember(permissionLevel) && channelForbidGuestText;
    const isForbidByForbidGuestTextGap = !isMember(permissionLevel) && leftGapTime > 0;
    const isForbidByForbidGuestTextWait = !isMember(permissionLevel) && leftWaitTime > 0;
    const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
    const maxLength = !isMember(permissionLevel) ? channelGuestTextMaxLength : 3000;

    return <MessageInputBox disabled={disabled} maxLength={maxLength} onSendMessage={onSendMessage} />;
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
    const isBtnHoveredRef = useRef<boolean>(false);

    return (
      <div className={railCls}>
        <div className={styles['slider-container']}>
          <input ref={sliderRef} type="range" min="0" max="100" value={value} onChange={onChange} className={styles['slider']} />
        </div>
        <div
          className={`${btnCls} ${muted ? styles['muted'] : styles['active']}`}
          onClick={onToggleMute}
          onMouseEnter={() => (isBtnHoveredRef.current = true)}
          onMouseLeave={() => (isBtnHoveredRef.current = false)}
          onWheel={(e) => {
            if (!isBtnHoveredRef.current) return;
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
  currentServer: Server;
  currentChannel: Channel;
  friends: Friend[];
  queueUsers: QueueUser[];
  serverOnlineMembers: OnlineMember[];
  serverMemberApplications: MemberApplication[];
  channels: Channel[];
  channelMessages: (ChannelMessage | PromptMessage)[];
  actionMessages: PromptMessage[];
  channelEvents: ChannelEvent[];
  onClearMessages: () => void;
  display: boolean;
  latency: number;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({
    user,
    currentServer,
    currentChannel,
    friends,
    queueUsers,
    serverOnlineMembers,
    serverMemberApplications,
    channels,
    channelMessages,
    actionMessages,
    channelEvents,
    onClearMessages,
    display,
    latency,
  }) => {
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
    const showAreaRef = useRef<HTMLIFrameElement>(null);
    const actionMessageTimer = useRef<NodeJS.Timeout | null>(null);
    const messageAreaRef = useRef<HTMLDivElement>(null);
    const prevStateRef = useRef<{ userId: string; anchorId: string | null; channelMode: Channel['voiceMode'] }>({ userId: '', anchorId: null, channelMode: 'free' });

    // States
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
    const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('key');
    const [speakingKey, setSpeakingKey] = useState<string>('');
    const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>('three-line');
    const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
    const [lastMessageTime, setLastMessageTime] = useState<number>(0);
    const [isMicModeMenuVisible, setIsMicModeMenuVisible] = useState<boolean>(false);
    const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
    const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
    const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
    const [mode, setMode] = useState<'none' | 'announcement' | 'show'>('announcement');

    // Variables
    const { userId } = user;
    const { serverId: currentServerId, announcement: currentServerAnnouncement } = currentServer;
    const {
      channelId: currentChannelId,
      announcement: currentChannelAnnouncement,
      bitrate: currentChannelBitrate,
      voiceMode: currentChannelVoiceMode,
      forbidText: currentChannelForbidText,
      forbidQueue: currentChannelForbidQueue,
      forbidGuestText: currentChannelForbidGuestText,
      guestTextGapTime: currentChannelGuestTextGapTime,
      guestTextWaitTime: currentChannelGuestTextWaitTime,
      guestTextMaxLength: currentChannelGuestTextMaxLength,
      isTextMuted: isCurrentChannelTextMuted,
      isVoiceMuted: isCurrentChannelVoiceMuted,
    } = currentChannel;
    const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
    const queuePosition = useMemo(() => (queueUsers.find((m) => m.userId === userId)?.position ?? 0) + 1, [queueUsers, userId]);
    const isCurrentChannelFreeMode = currentChannelVoiceMode === 'free';
    const isCurrentChannelAdminMode = currentChannelVoiceMode === 'admin';
    const isCurrentChannelQueueMode = currentChannelVoiceMode === 'queue';
    const volumeLevel = webRTC.isSpeaking('user') ? Math.ceil(webRTC.getVolumePercent('user') / 10) - 1 : 0;
    const { isMicTaken, isQueuing, isIdling, isControlled, isCurrentChannelQueueControlled } = useMemo(() => {
      let isMicTaken = false;
      let isQueuing = false;
      let isControlled = false;
      let isCurrentChannelQueueControlled = false;
      for (const m of queueUsers) {
        if (m.isQueueControlled) isCurrentChannelQueueControlled = true;
        if (m.userId !== userId) continue;
        if (m.position <= 0) {
          isMicTaken = true;
          if (!isChannelMod(permissionLevel) && m.isQueueControlled) {
            isControlled = true;
          }
        } else if (m.position > 0) {
          isQueuing = true;
        }
      }
      const isIdling = !isMicTaken && !isQueuing;
      return { isMicTaken, isQueuing, isIdling, isControlled, isCurrentChannelQueueControlled };
    }, [queueUsers, userId, permissionLevel]);

    // Handlers
    const getMicText = () => {
      if (isMicTaken) return t('mic-taken');
      if (isQueuing) return t('mic-queued');
      return t('take-mic');
    };

    const getMicSubText = () => {
      if (isIdling) return '';
      if (isQueuing) return t('in-queue-position', { '0': queuePosition });
      if (isCurrentChannelVoiceMuted) return t('mic-forbidden');
      if (isControlled) return t('mic-controlled');
      if (speakingMode === 'key' && !webRTC.isSpeakKeyPressed) {
        return t('press-key-to-speak', { '0': speakingKey });
      }
      if (webRTC.isMixModeActive) return t('speaking-with-mix');
      if (webRTC.micVolume === 0) return t('mic-muted');
      return t('speaking');
    };

    const getMicBtnClass = () => {
      let className = styles['mic-button'];
      if (isMicTaken) className += ` ${styles['speaking']}`;
      if (isQueuing) className += ` ${styles['queuing']}`;
      if (isCurrentChannelVoiceMuted || isControlled) className += ` ${styles['muted']}`;
      if (!isCurrentChannelQueueMode || (!isChannelMod(permissionLevel) && isIdling)) className += ` ${styles['no-selection']}`;
      return className;
    };

    const getContextMenuItems1 = () => [
      {
        id: 'close-announcement',
        label: t('close-announcement'),
        onClick: () => setMode('none'),
      },
    ];

    const getContextMenuItems2 = () => [
      {
        id: 'clean-up-message',
        label: t('clean-up-message'),
        onClick: onClearMessages,
      },
      {
        id: 'open-channel-event',
        label: t('channel-event'),
        onClick: () => handleOpenChannelEvent(userId, currentServer.serverId, channelEvents),
      },
      {
        id: 'open-channel-history',
        label: t('channel-history'),
        onClick: () => handleOpenChatHistory(userId, userId),
      },
      {
        id: 'open-announcement',
        label: t('open-announcement'),
        show: mode !== 'announcement',
        onClick: () => setMode('announcement'),
      },
    ];

    const getContextMenuItems3 = () => [
      {
        id: 'free-speech',
        label: t('free-speech'),
        icon: isCurrentChannelFreeMode ? 'checked' : '',
        onClick: () => handleEditChannel(currentServerId, currentChannelId, { voiceMode: 'free' }),
      },
      {
        id: 'admin-speech',
        label: t('admin-speech'),
        icon: isCurrentChannelAdminMode ? 'checked' : '',
        onClick: () => handleEditChannel(currentServerId, currentChannelId, { voiceMode: 'admin' }),
      },
      {
        id: 'queue-speech',
        label: t('queue-speech'),
        icon: isCurrentChannelQueueMode ? 'submenu' : '',
        hasSubmenu: isCurrentChannelQueueMode,
        onClick: () => handleEditChannel(currentServerId, currentChannelId, { voiceMode: 'queue' }),
        submenuItems: [
          {
            id: 'forbid-guest-queue',
            label: t('forbid-queue'),
            icon: currentChannelForbidQueue ? 'checked' : '',
            disabled: !isCurrentChannelQueueMode,
            onClick: () => handleEditChannel(currentServerId, currentChannelId, { forbidQueue: !currentChannelForbidQueue }),
          },
          {
            id: 'control-queue',
            label: t('control-queue'),
            icon: isCurrentChannelQueueControlled ? 'checked' : '',
            disabled: !isCurrentChannelQueueMode,
            onClick: () => handleControlQueue(currentServerId, currentChannelId),
          },
        ],
      },
    ];

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
      if (!webRTC.isMicTaken) return;
      webRTC.toggleMixMode();
    };

    const handleToggleRecord = async () => {
      webRTC.toggleRecording();
    };

    const handleClickMicButton = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCurrentChannelQueueMode) {
        if (!isIdling) {
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showMicContextMenu(x, y, 'right-top', [
            {
              id: 'untake-mic',
              label: t('untake-mic'),
              show: isCurrentChannelQueueMode,
              onClick: () => handleLeaveQueue(currentServerId, currentChannelId),
            },
          ]);
        } else if (isChannelMod(permissionLevel)) {
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showMicContextMenu(x, y, 'right-top', [
            {
              id: 'take-mic-in-queue',
              label: t('take-mic-in-queue'),
              show: isCurrentChannelQueueMode,
              onClick: () => handleJoinQueue(currentServerId, currentChannelId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'take-mic-directly',
              label: t('take-mic-directly'),
              show: isCurrentChannelQueueMode,
              onClick: () => handleJoinQueue(currentServerId, currentChannelId, -2),
            },
          ]);
        } else {
          handleJoinQueue(currentServerId, currentChannelId);
        }
      } else {
        if (isMicTaken) {
          handleLeaveQueue(currentServerId, currentChannelId);
        } else {
          handleJoinQueue(currentServerId, currentChannelId);
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

    const getResizableAreaRef = () => {
      if (mode === 'announcement') return annAreaRef;
      if (mode === 'show') return showAreaRef;
      return null;
    };

    const handleAnnAreaHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const targetRef = getResizableAreaRef();
      if (!targetRef?.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingAnnAreaRef.current = true;
    };

    const handleAnnAreaHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const targetRef = getResizableAreaRef();
      if (!isResizingAnnAreaRef.current || !targetRef?.current) return;
      if (channelUIMode === 'classic') {
        targetRef.current.style.height = `${e.clientY - targetRef.current.offsetTop}px`;
      } else if (channelUIMode === 'three-line') {
        targetRef.current.style.width = `${e.clientX - targetRef.current.offsetLeft}px`;
      }
    };

    const handleScroll = () => {
      if (!messageAreaRef.current) return;
      const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= MESSAGE_VIERER_DEVIATION;
      setIsAtBottom(isBottom);
    };

    const handleScrollToBottom = useCallback(() => {
      if (!messageAreaRef.current) return;
      messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
      setIsAtBottom(true);
    }, []);

    const updateShowFrameState = useCallback(
      (userId: string, anchorId: string | null, channelMode: Channel['voiceMode']) => {
        if (!showAreaRef.current?.contentWindow) return;
        prevStateRef.current = { userId, anchorId, channelMode };
        showAreaRef.current.contentWindow.postMessage({ uid: userId, aid: anchorId, channelMode: channelMode }, SHOW_FRAME_ORIGIN);
      },
      [showAreaRef],
    );

    const handleShowFrameLoad = useCallback(() => {
      const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
      updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
    }, [userId, queueUsers, currentChannelVoiceMode, updateShowFrameState]);

    // Effects
    useEffect(() => {
      const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
      if (prevStateRef.current.userId === userId && prevStateRef.current.anchorId === anchorId && prevStateRef.current.channelMode === currentChannelVoiceMode) return;
      updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
    }, [userId, queueUsers, currentChannelVoiceMode, updateShowFrameState]);

    useEffect(() => {
      webRTCRef.current.changeBitrate(currentChannelBitrate);
    }, [currentChannelBitrate]);

    useEffect(() => {
      if (isMicTaken && !isControlled) webRTCRef.current.takeMic(currentChannelId);
      else webRTCRef.current.releaseMic();
      webRTCRef.current.stopMixing();
    }, [isMicTaken, isControlled, currentChannelId]);

    useEffect(() => {
      if (actionMessages.length === 0) {
        setShowActionMessage(false);
        return;
      }
      if (actionMessageTimer.current) clearTimeout(actionMessageTimer.current);
      const seconeds = actionMessages[actionMessages.length - 1].displaySeconds ?? DEFAULT_DISPLAY_ACTION_MESSAGE_SECONDS;
      setShowActionMessage(true);
      actionMessageTimer.current = setTimeout(() => setShowActionMessage(false), seconeds * 1000);
      return () => {
        if (actionMessageTimer.current) {
          clearTimeout(actionMessageTimer.current);
          actionMessageTimer.current = null;
        }
      };
    }, [actionMessages]);

    useEffect(() => {
      if (currentChannelId) {
        setLastJoinChannelTime(Date.now());
        setLastMessageTime(0);
      }
    }, [currentChannelId]);

    useEffect(() => {
      const onPointerup = () => {
        isResizingSidebarRef.current = false;
        isResizingAnnAreaRef.current = false;
      };
      document.addEventListener('pointerup', onPointerup);
      return () => document.removeEventListener('pointerup', onPointerup);
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
      if (!messageAreaRef.current || channelMessages.length === 0) return;

      const lastMessage = channelMessages[channelMessages.length - 1];
      const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= MESSAGE_VIERER_DEVIATION;

      if (isBottom || lastMessage.type !== 'general' || lastMessage.userId === userId) {
        setTimeout(() => handleScrollToBottom(), 50);
      } else {
        setUnreadMessageCount((prev) => prev + 1);
      }
    }, [channelMessages, userId, handleScrollToBottom]);

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleScrollToBottom();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleScrollToBottom]);

    useEffect(() => {
      if (isAtBottom) setUnreadMessageCount(0);
    }, [isAtBottom]);

    useEffect(() => {
      setUnreadMessageCount(0);
    }, [currentServerId]);

    useEffect(() => {
      const changeSpeakingMode = (speakingMode: SpeakingMode) => {
        setSpeakingMode(speakingMode);
      };
      changeSpeakingMode(ipc.systemSettings.speakingMode.get());
      const unsub = ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode);
      return () => unsub();
    }, []);

    useEffect(() => {
      const changeDefaultSpeakingKey = (key: string) => {
        setSpeakingKey(key);
      };
      changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
      const unsub = ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey);
      return () => unsub();
    }, []);

    useEffect(() => {
      const changeChannelUIMode = (channelUIMode: ChannelUIMode) => {
        setChannelUIMode(channelUIMode);
      };
      changeChannelUIMode(ipc.systemSettings.channelUIMode.get());
      const unsub = ipc.systemSettings.channelUIMode.onUpdate(changeChannelUIMode);
      return () => unsub();
    }, []);

    return (
      <main className={styles['server']} style={display ? {} : { display: 'none' }}>
        {/* Body */}
        <main className={styles['server-body']}>
          {/* Left Sidebar */}
          <aside ref={sidebarRef} className={styles['sidebar']}>
            <ChannelList
              user={user}
              currentServer={currentServer}
              currentChannel={currentChannel}
              friends={friends}
              queueUsers={queueUsers}
              serverOnlineMembers={serverOnlineMembers}
              serverMemberApplications={serverMemberApplications}
              channels={channels}
              latency={latency}
            />
          </aside>

          {/* Resize Handle */}
          <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />

          {/* Right Content */}
          <main className={styles['content']}>
            {/* Message Area */}
            <div className={`${styles['content-layout']} ${styles[channelUIMode]}`}>
              {mode !== 'none' &&
                (mode === 'announcement' ? (
                  <div
                    ref={annAreaRef}
                    className={styles['announcement-area']}
                    style={channelUIMode === 'classic' ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems1());
                    }}
                  >
                    <MarkdownContent markdownText={currentChannelAnnouncement || currentServerAnnouncement} imageSize={'big'} />
                  </div>
                ) : mode === 'show' ? (
                  <iframe
                    ref={showAreaRef}
                    className={styles['rcshow-area']}
                    style={channelUIMode === 'classic' ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
                    id="showFrame"
                    src={SHOW_FRAME_ORIGIN}
                    height="100%"
                    width="100%"
                    onLoad={handleShowFrameLoad}
                  />
                ) : null)}

              {/* Resize Handle */}
              <div
                className="resize-handle-vertical"
                style={channelUIMode === 'classic' && mode !== 'none' ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
              />
              <div
                className="resize-handle"
                style={channelUIMode === 'three-line' && mode !== 'none' ? {} : { display: 'none' }}
                onPointerDown={handleAnnAreaHandleDown}
                onPointerMove={handleAnnAreaHandleMove}
              />

              {/* Widget Bar */}
              <div className={`${styles['widget-bar']} ${!isWidgetExpanded ? styles['widget-close'] : ''}`}>
                {isWidgetExpanded ? (
                  <>
                    <div
                      className={`${styles['widget-bar-item']} ${mode === 'announcement' ? styles['widget-bar-item-active'] : ''}`}
                      onClick={() => {
                        if (mode === 'announcement') setMode('none');
                        else setMode('announcement');
                        setIsWidgetExpanded(false);
                      }}
                    >
                      <div className={`${styles['widget-bar-item-icon']} ${styles['announcement-icon']}`}></div>
                      <span className={styles['widget-bar-item-text']}>{t('announcement')}</span>
                    </div>
                    <div className={styles['widget-bar-spliter']}></div>
                    <div
                      className={`${styles['widget-bar-item']} ${mode === 'show' ? styles['widget-bar-item-active'] : ''}`}
                      onClick={() => {
                        if (mode === 'show') setMode('none');
                        else setMode('show');
                        setIsWidgetExpanded(false);
                      }}
                    >
                      <div className={`${styles['widget-bar-item-icon']} ${styles['rcshow-icon']}`}></div>
                      <span className={styles['widget-bar-item-text']}>{t('send-flower')}</span>
                    </div>
                    <div className={styles['widget-bar-spliter']}></div>
                    <div
                      className={styles['widget-bar-item']}
                      onClick={() => {
                        handleOpenServerApplication(userId, currentServerId, (action) => {
                          if (action === 'openShowFrame') setMode('show');
                          if (action === 'openChannelEvent') handleOpenChannelEvent(userId, currentServerId, channelEvents);
                        });
                        setIsWidgetExpanded(false);
                      }}
                    >
                      <div className={`${styles['widget-bar-item-icon']} ${styles['more-icon']}`}></div>
                      <span className={styles['widget-bar-item-text']}>{t('more')}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles['widget-bar-item']} onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}>
                    <span className={`${styles['widget-bar-item-icon']} ${styles['arrow-down-icon']}`}></span>
                  </div>
                )}
              </div>

              {/* Bottom Area */}
              <div className={styles['bottom-area']}>
                {/* Message Area */}
                <div
                  ref={messageAreaRef}
                  className={styles['message-area']}
                  onScroll={handleScroll}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    if (target.closest(`.${styles['username-text']}`)) return;
                    const { clientX: x, clientY: y } = e;
                    contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems2());
                  }}
                >
                  <ChannelMessageContent user={user} currentServer={currentServer} currentChannel={currentChannel} messages={channelMessages} />
                  <div style={{ minHeight: '10px' }}></div>
                  {unreadMessageCount > 0 && (
                    <div className={messageStyles['new-message-alert']} onClick={handleScrollToBottom}>
                      {t('has-new-message', { 0: unreadMessageCount })}
                    </div>
                  )}
                </div>

                {/* Broadcast Area */}
                <div className={styles['input-area']}>
                  <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
                    <ChannelMessageContent
                      user={user}
                      currentServer={currentServer}
                      currentChannel={currentChannel}
                      messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []}
                    />
                    <div className={styles['close-button']} onClick={() => setShowActionMessage(false)}></div>
                  </div>
                  <MessageInputBoxGuard
                    lastJoinChannelTime={lastJoinChannelTime}
                    lastMessageTime={lastMessageTime}
                    permissionLevel={permissionLevel}
                    channelForbidText={currentChannelForbidText}
                    channelForbidGuestText={currentChannelForbidGuestText}
                    channelGuestTextGapTime={currentChannelGuestTextGapTime}
                    channelGuestTextWaitTime={currentChannelGuestTextWaitTime}
                    channelGuestTextMaxLength={currentChannelGuestTextMaxLength}
                    isChannelTextMuted={isCurrentChannelTextMuted}
                    onSendMessage={(message) => handleSendMessage(currentServerId, currentChannelId, { type: 'general', content: message })}
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
                    contextMenu.showContextMenu(x, y, 'right-top', getContextMenuItems3());
                  }}
                >
                  {currentChannelVoiceMode === 'queue' ? t('queue-speech') : currentChannelVoiceMode === 'free' ? t('free-speech') : currentChannelVoiceMode === 'admin' ? t('admin-speech') : ''}
                </div>
              </div>
              <div className={getMicBtnClass()} onClick={handleClickMicButton}>
                <div className={`${styles['mic-icon']} ${isMicTaken ? styles[`level${volumeLevel}`] : ''}`} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={styles['mic-text']} style={{ fontSize: isIdling ? '1.3rem' : '1.1rem' }}>
                    {getMicText()}
                  </div>
                  <div className={styles['mic-sub-text']}>{getMicSubText()}</div>
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

const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), { ssr: false });

export default ServerPage;
