import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { clearChannelMessages } from '@/store/slices/channelMessagesSlice';
import { clearActionMessages } from '@/store/slices/actionMessagesSlice';

import MarkdownContent from '@/components/MarkdownContent';
import ChannelMessageContent from '@/components/ChannelMessageContent';
import ChannelList from '@/components/ChannelList';
import MessageInputBox from '@/components/MessageInputBox';
import MicModeMenu from '@/components/MicModeMenu';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import * as Permission from '@/utils/permission';
import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import { SHOW_FRAME_ORIGIN, MESSAGE_VIERER_DEVIATION } from '@/constant';

import styles from '@/styles/server.module.css';
import messageStyles from '@/styles/message.module.css';

interface ServerPageProps {
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(({ display }) => {
  // Hooks
  const { t } = useTranslation();
  const {
    isSpeakKeyPressed,
    isMixModeActive,
    isMicMuted,
    isSpeakerMuted,
    isRecording,
    micVolume,
    speakerVolume,
    recordTime,
    isSpeaking,
    getVolumePercent,
    changeBitrate,
    takeMic,
    releaseMic,
    stopMixing,
    toggleMixMode,
    toggleMicMuted,
    toggleSpeakerMuted,
    toggleRecording,
    changeMicVolume,
    changeSpeakerVolume,
  } = useWebRTC();
  const { showContextMenu, showMicContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const queueUsers = useAppSelector((state) => state.queueUsers.data);
  const channelMessages = useAppSelector((state) => state.channelMessages.data);
  const actionMessages = useAppSelector((state) => state.actionMessages.data);
  const channelEvents = useAppSelector((state) => state.channelEvents.data);

  // Refs
  const isResizingSidebarRef = useRef<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingAnnAreaRef = useRef<boolean>(false);
  const annAreaRef = useRef<HTMLDivElement>(null);
  const showAreaRef = useRef<HTMLIFrameElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef<{ userId: string; anchorId: string | null; channelMode: Types.Channel['voiceMode'] }>({ userId: '', anchorId: null, channelMode: 'free' });

  // States
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const [speakingMode, setSpeakingMode] = useState<Types.SpeakingMode>('key');
  const [speakingKey, setSpeakingKey] = useState<string>('');
  const [channelUIMode, setChannelUIMode] = useState<Types.ChannelUIMode>('three-line');
  const [lastJoinChannelTime, setLastJoinChannelTime] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [isMicModeMenuVisible, setIsMicModeMenuVisible] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [centralAreaMode, setCentralAreaMode] = useState<'none' | 'announcement' | 'show'>('announcement');

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, announcement: currentServerAnnouncement } = currentServer;
  const {
    channelId: currentChannelId,
    announcement: currentChannelAnnouncement,
    bitrate: currentChannelBitrate,
    voiceMode: currentChannelVoiceMode,
    forbidText: isCurrentChannelForbidText,
    forbidQueue: isCurrentChannelQueueForbidden,
    forbidGuestText: isCurrentChannelGuestTextForbidden,
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
  const isCentralAreaModeNone = centralAreaMode === 'none';
  const isCentralAreaModeAnnouncement = centralAreaMode === 'announcement';
  const isCentralAreaModeShow = centralAreaMode === 'show';
  const isChannelUIClassicMode = channelUIMode === 'classic';
  const isChannelUIThreeLineMode = channelUIMode === 'three-line';
  const volumeLevel = isSpeaking('user') ? Math.ceil(getVolumePercent('user') / 10) - 1 : 0;
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
        if (!Permission.isChannelMod(permissionLevel) && m.isQueueControlled) {
          isControlled = true;
        }
      } else if (m.position > 0) {
        isQueuing = true;
      }
    }
    const isIdling = !isMicTaken && !isQueuing;
    return { isMicTaken, isQueuing, isIdling, isControlled, isCurrentChannelQueueControlled };
  }, [queueUsers, userId, permissionLevel]);

  // Functions
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
    if (speakingMode === 'key' && !isSpeakKeyPressed) {
      return t('press-key-to-speak', { '0': speakingKey });
    }
    if (isMixModeActive) return t('speaking-with-mix');
    if (micVolume === 0) return t('mic-muted');
    return t('speaking');
  };

  const getMicBtnClass = () => {
    let className = styles['mic-button'];
    if (isMicTaken) className += ` ${styles['speaking']}`;
    if (isQueuing) className += ` ${styles['queuing']}`;
    if (isCurrentChannelVoiceMuted || isControlled) className += ` ${styles['muted']}`;
    if (!isCurrentChannelQueueMode || (!Permission.isChannelMod(permissionLevel) && isIdling)) className += ` ${styles['no-selection']}`;
    return className;
  };

  const clearMessages = () => {
    dispatch(clearChannelMessages());
    dispatch(clearActionMessages());
  };

  const clearUnreadMessageNotification = () => {
    setIsAtBottom(true);
    setUnreadMessageCount(0);
  };

  const scrollToBottom = useCallback(() => {
    if (!messageAreaRef.current) return;
    messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
    clearUnreadMessageNotification();
  }, []);

  const updateShowFrameState = useCallback(
    (userId: string, anchorId: string | null, channelMode: Types.Channel['voiceMode']) => {
      if (!showAreaRef.current?.contentWindow) return;
      prevStateRef.current = { userId, anchorId, channelMode };
      showAreaRef.current.contentWindow.postMessage({ uid: userId, aid: anchorId, channelMode: channelMode }, SHOW_FRAME_ORIGIN);
    },
    [showAreaRef],
  );

  const getContextMenuItems1 = () => new CtxMenuBuilder().addCloseAnnouncementOption({ permissionLevel }, () => setCentralAreaMode('none')).build();

  const getContextMenuItems2 = () =>
    new CtxMenuBuilder()
      .addCleanUpMessageOption({ permissionLevel }, () => clearMessages())
      .addOpenChannelEventOption({ permissionLevel }, () => Popup.openChannelEvent(userId, currentServer.serverId, channelEvents))
      .addOpenAnnouncementOption({ permissionLevel }, () => setCentralAreaMode('announcement'))
      .build();

  const getContextMenuItems3 = () =>
    new CtxMenuBuilder()
      .addFreeSpeechOption({ permissionLevel, isFreeMode: isCurrentChannelFreeMode }, () => Popup.editChannel(currentServerId, currentChannelId, { voiceMode: 'free' }))
      .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () => Popup.editChannel(currentServerId, currentChannelId, { voiceMode: 'admin' }))
      .addQueueSpeechOption(
        { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
        () => Popup.editChannel(currentServerId, currentChannelId, { voiceMode: 'queue' }),
        new CtxMenuBuilder()
          .addForbidQueueOption({ permissionLevel, isForbidQueue: isCurrentChannelQueueForbidden }, () =>
            Popup.editChannel(currentServerId, currentChannelId, { forbidQueue: !isCurrentChannelQueueForbidden }),
          )
          .addControlQueueOption({ permissionLevel, isQueueControlled: isCurrentChannelQueueControlled }, () => Popup.controlQueue(currentServerId, currentChannelId))
          .build(),
      )
      .build();

  const handleMicBtnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentChannelQueueMode) {
      if (!isIdling) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'untake-mic',
            label: t('untake-mic'),
            show: isCurrentChannelQueueMode,
            onClick: () => Popup.leaveQueue(currentServerId, currentChannelId),
          },
        ]);
      } else if (Permission.isChannelMod(permissionLevel)) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'take-mic-in-queue',
            label: t('take-mic-in-queue'),
            show: isCurrentChannelQueueMode,
            onClick: () => Popup.joinQueue(currentServerId, currentChannelId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'take-mic-directly',
            label: t('take-mic-directly'),
            show: isCurrentChannelQueueMode,
            onClick: () => Popup.joinQueue(currentServerId, currentChannelId, -2),
          },
        ]);
      } else {
        Popup.joinQueue(currentServerId, currentChannelId);
      }
    } else {
      if (isMicTaken) {
        Popup.leaveQueue(currentServerId, currentChannelId);
      } else {
        Popup.joinQueue(currentServerId, currentChannelId);
      }
    }
  };

  // Handlers
  const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingSidebarRef.current = true;
  };

  const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebarRef.current || !sidebarRef.current) return;
    sidebarRef.current.style.width = `${e.clientX}px`;
  };

  const getResizableAreaRef = () => {
    if (isCentralAreaModeAnnouncement) return annAreaRef;
    if (isCentralAreaModeShow) return showAreaRef;
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
    if (isChannelUIClassicMode) {
      targetRef.current.style.height = `${e.clientY - targetRef.current.offsetTop}px`;
    } else if (isChannelUIThreeLineMode) {
      targetRef.current.style.width = `${e.clientX - targetRef.current.offsetLeft}px`;
    }
  };

  const handleScroll = () => {
    if (!messageAreaRef.current) return;
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= MESSAGE_VIERER_DEVIATION;
    setIsAtBottom(isBottom);
  };

  const handleShowFrameLoad = () => {
    const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
    updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
  };

  const handleWidgetAnnClick = () => {
    if (isCentralAreaModeAnnouncement) setCentralAreaMode('none');
    else setCentralAreaMode('announcement');
    setIsWidgetExpanded(false);
  };

  const handleWidgetShowClick = () => {
    if (isCentralAreaModeShow) setCentralAreaMode('none');
    else setCentralAreaMode('show');
    setIsWidgetExpanded(false);
  };

  const handleWidgetMoreClick = () => {
    Popup.openServerApplication(userId, currentServerId, (action) => {
      if (action === 'openShowFrame') setCentralAreaMode('show');
      if (action === 'openChannelEvent') Popup.openChannelEvent(userId, currentServerId, channelEvents);
    });
    setIsWidgetExpanded(false);
  };

  const handleMessageAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getContextMenuItems2());
  };

  const handleAnnAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getContextMenuItems1());
  };

  const handleVoiceModeDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-top', getContextMenuItems3());
  };

  const handleMessageSend = (message: string) => {
    Popup.sendChannelMessage(currentServerId, currentChannelId, { type: 'general', content: message });
    setLastMessageTime(Date.now());
  };

  const handleNewMessageAlertClick = () => {
    clearUnreadMessageNotification();
  };

  const handleWidgetMoreBtnClick = () => {
    setIsWidgetExpanded(true);
  };

  const handleCloseActionMessageBtnClick = () => {
    setShowActionMessage(false);
  };

  const handleMixingBtnClick = () => {
    toggleMixMode();
  };

  const handleMicVolumeChange = (value: number) => {
    changeMicVolume(value);
  };

  const handleMicVolumeBtnClick = () => {
    toggleMicMuted();
  };

  const handleMicModeDropdownBtnClick = () => {
    setIsMicModeMenuVisible(true);
  };

  const handleSpeakerVolumeChange = (value: number) => {
    changeSpeakerVolume(value);
  };

  const handleSpeakerVolumeBtnClick = () => {
    toggleSpeakerMuted();
  };

  const handleRecordModeBtnClick = () => {
    toggleRecording();
  };

  // Effects
  useEffect(() => {
    const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
    if (prevStateRef.current.userId === userId && prevStateRef.current.anchorId === anchorId && prevStateRef.current.channelMode === currentChannelVoiceMode) return;
    updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
  }, [userId, queueUsers, currentChannelVoiceMode, updateShowFrameState]);

  useEffect(() => {
    changeBitrate(currentChannelBitrate);
  }, [currentChannelBitrate, changeBitrate]);

  useEffect(() => {
    if (isMicTaken && !isControlled) takeMic(currentChannelId);
    else releaseMic();
    stopMixing();
  }, [isMicTaken, isControlled, currentChannelId, takeMic, releaseMic, stopMixing]);

  useEffect(() => {
    if (actionMessages.length === 0) setShowActionMessage(false);
    else setShowActionMessage(true);
  }, [actionMessages]);

  useEffect(() => {
    if (currentChannelId) {
      setLastJoinChannelTime(Date.now());
      setLastMessageTime(0);
      setUnreadMessageCount(0);
    }
  }, [currentChannelId]);

  useEffect(() => {
    if (currentServerId && currentServerAnnouncement) Popup.openServerAnnouncement(currentServerAnnouncement);
  }, [currentServerId, currentServerAnnouncement]);

  useEffect(() => {
    if (isAtBottom) setUnreadMessageCount(0);
  }, [isAtBottom]);

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
      if (!(e.target as HTMLElement).closest(`.${styles['widget-bar']}`)) {
        setIsWidgetExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') scrollToBottom();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scrollToBottom]);

  useEffect(() => {
    if (!messageAreaRef.current || channelMessages.length === 0) return;

    const lastMessage = channelMessages[channelMessages.length - 1];
    const isBottom = messageAreaRef.current.scrollHeight - messageAreaRef.current.scrollTop - messageAreaRef.current.clientHeight <= MESSAGE_VIERER_DEVIATION;

    if (isBottom || lastMessage.type !== 'general' || lastMessage.userId === userId) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [channelMessages, userId, scrollToBottom]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      setSpeakingMode(speakingMode);
    };
    const changeDefaultSpeakingKey = (key: string) => {
      setSpeakingKey(key);
    };
    const changeChannelUIMode = (channelUIMode: Types.ChannelUIMode) => {
      setChannelUIMode(channelUIMode);
    };

    changeSpeakingMode(ipc.systemSettings.speakingMode.get());
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    changeChannelUIMode(ipc.systemSettings.channelUIMode.get());

    const unsubs = [
      ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode),
      ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey),
      ipc.systemSettings.channelUIMode.onUpdate(changeChannelUIMode),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <main className={styles['server']} style={display ? {} : { display: 'none' }}>
      <main className={styles['server-body']}>
        <aside ref={sidebarRef} className={styles['sidebar']}>
          <ChannelList />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={styles['content']}>
          <div className={`${styles['content-layout']} ${styles[channelUIMode]}`}>
            {!isCentralAreaModeNone &&
              (isCentralAreaModeAnnouncement ? (
                <div
                  ref={annAreaRef}
                  className={styles['announcement-area']}
                  style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
                  onContextMenu={handleAnnAreaContextMenu}
                >
                  <MarkdownContent markdownText={currentChannelAnnouncement || currentServerAnnouncement} imageSize={'big'} />
                </div>
              ) : isCentralAreaModeShow ? (
                <iframe
                  ref={showAreaRef}
                  className={styles['rcshow-area']}
                  style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
                  id="showFrame"
                  src={SHOW_FRAME_ORIGIN}
                  height="100%"
                  width="100%"
                  onLoad={handleShowFrameLoad}
                />
              ) : null)}
            <div
              className="resize-handle-vertical"
              style={isChannelUIClassicMode && !isCentralAreaModeNone ? {} : { display: 'none' }}
              onPointerDown={handleAnnAreaHandleDown}
              onPointerMove={handleAnnAreaHandleMove}
            />
            <div
              className="resize-handle"
              style={isChannelUIThreeLineMode && !isCentralAreaModeNone ? {} : { display: 'none' }}
              onPointerDown={handleAnnAreaHandleDown}
              onPointerMove={handleAnnAreaHandleMove}
            />
            <div className={styles['widget-close']}>
              <div className={styles['widget-bar-item']} onClick={handleWidgetMoreBtnClick}>
                <span className={`${styles['widget-bar-item-icon']} ${styles['arrow-down-icon']}`} />
              </div>
            </div>
            <div className={`${styles['widget-bar']} ${isWidgetExpanded ? styles['widget-bar-expanded'] : ''}`}>
              <div className={`${styles['widget-bar-item']} ${isCentralAreaModeAnnouncement ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetAnnClick}>
                <div className={`${styles['widget-bar-item-icon']} ${styles['announcement-icon']}`} />
                <span className={styles['widget-bar-item-text']}>{t('announcement')}</span>
              </div>
              <div className={styles['widget-bar-spliter']} />
              <div className={`${styles['widget-bar-item']} ${isCentralAreaModeShow ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetShowClick}>
                <div className={`${styles['widget-bar-item-icon']} ${styles['rcshow-icon']}`} />
                <span className={styles['widget-bar-item-text']}>{t('send-flower')}</span>
              </div>
              <div className={styles['widget-bar-spliter']} />
              <div className={styles['widget-bar-item']} onClick={handleWidgetMoreClick}>
                <div className={`${styles['widget-bar-item-icon']} ${styles['more-icon']}`} />
                <span className={styles['widget-bar-item-text']}>{t('more')}</span>
              </div>
            </div>
            <div className={styles['bottom-area']}>
              <div ref={messageAreaRef} className={styles['message-area']} onScroll={handleScroll} onContextMenu={handleMessageAreaContextMenu}>
                <ChannelMessageContent messages={channelMessages} />
                <div style={{ minHeight: '10px' }} />
                {unreadMessageCount > 0 && (
                  <div className={messageStyles['new-message-alert']} onClick={handleNewMessageAlertClick}>
                    {t('has-new-message', { 0: unreadMessageCount })}
                  </div>
                )}
              </div>
              <div className={styles['input-area']}>
                <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
                  <ChannelMessageContent messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} />
                  <div className={styles['close-button']} onClick={handleCloseActionMessageBtnClick} />
                </div>
                <MessageInputBoxGuard
                  lastJoinChannelTime={lastJoinChannelTime}
                  lastMessageTime={lastMessageTime}
                  permissionLevel={permissionLevel}
                  isChannelForbidText={isCurrentChannelForbidText}
                  isChannelForbidGuestText={isCurrentChannelGuestTextForbidden}
                  channelGuestTextGapTime={currentChannelGuestTextGapTime}
                  channelGuestTextWaitTime={currentChannelGuestTextWaitTime}
                  channelGuestTextMaxLength={currentChannelGuestTextMaxLength}
                  isChannelTextMuted={isCurrentChannelTextMuted}
                  onMessageSend={handleMessageSend}
                />
              </div>
            </div>
          </div>
          <div className={styles['button-area']}>
            <div className={styles['buttons']}>
              <div className={styles['voice-mode-dropdown']} style={Permission.isChannelMod(permissionLevel) ? {} : { display: 'none' }} onClick={handleVoiceModeDropdownClick}>
                {currentChannelVoiceMode === 'queue' ? t('queue-speech') : currentChannelVoiceMode === 'free' ? t('free-speech') : currentChannelVoiceMode === 'admin' ? t('admin-speech') : ''}
              </div>
            </div>
            <div className={getMicBtnClass()} onClick={handleMicBtnClick}>
              <div className={`${styles['mic-icon']} ${isMicTaken ? styles[`level${volumeLevel}`] : ''}`} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className={styles['mic-text']} style={{ fontSize: isIdling ? '1.3rem' : '1.1rem' }}>
                  {getMicText()}
                </div>
                <div className={styles['mic-sub-text']}>{getMicSubText()}</div>
              </div>
            </div>
            <div className={styles['buttons']}>
              <div className={`${styles['bkg-mode-btn']} ${isMixModeActive ? styles['active'] : ''}`} onClick={handleMixingBtnClick} title={isMixModeActive ? t('mixing-on') : t('mixing-off')}>
                {t('mixing')}
              </div>
              <div className={styles['saperator-1']} />
              <div className={styles['mic-volume-container']}>
                <div className={`${styles['mic-btn']} ${isMicMuted ? styles['muted'] : styles['active']}`} />
                <VolumeSlider value={micVolume} muted={isMicMuted} onChange={handleMicVolumeChange} onClick={handleMicVolumeBtnClick} railCls={styles['volume-slider']} btnCls={styles['mic-btn']} />
                <div className={styles['mic-mode-dropdown-btn']} onClick={handleMicModeDropdownBtnClick}>
                  {isMicModeMenuVisible ? <MicModeMenu /> : ''}
                </div>
              </div>
              <div className={styles['speaker-volume-container']}>
                <div className={`${styles['speaker-btn']} ${isSpeakerMuted ? styles['muted'] : ''}`} />
                <VolumeSlider
                  value={speakerVolume}
                  muted={isSpeakerMuted}
                  onChange={handleSpeakerVolumeChange}
                  onClick={handleSpeakerVolumeBtnClick}
                  railCls={styles['volume-slider']}
                  btnCls={styles['speaker-btn']}
                />
              </div>
              <div className={`${styles['record-mode']} ${isRecording ? styles['active'] : ''}`}>
                <div className={`${styles['record-mode-btn']} ${isRecording ? styles['active'] : ''}`} onClick={handleRecordModeBtnClick} />
                <div className={`${styles['record-mode-text']} ${isRecording ? styles['active'] : ''}`}>{Language.getFormatTimeFromSecond(recordTime)}</div>
              </div>
            </div>
          </div>
        </main>
      </main>
    </main>
  );
});

ServerPageComponent.displayName = 'ServerPageComponent';

const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), { ssr: false });

export default ServerPage;

interface MessageInputBoxGuardProps {
  lastJoinChannelTime: number;
  lastMessageTime: number;
  permissionLevel: number;
  isChannelForbidText: boolean;
  isChannelForbidGuestText: boolean;
  channelGuestTextGapTime: number;
  channelGuestTextWaitTime: number;
  channelGuestTextMaxLength: number;
  isChannelTextMuted: boolean;
  onMessageSend: (msg: string) => void;
}

const MessageInputBoxGuard = React.memo(
  ({
    lastJoinChannelTime,
    lastMessageTime,
    permissionLevel,
    isChannelForbidText,
    isChannelForbidGuestText,
    channelGuestTextGapTime,
    channelGuestTextWaitTime,
    channelGuestTextMaxLength,
    isChannelTextMuted,
    onMessageSend,
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
    const isForbidByForbidText = !Permission.isChannelMod(permissionLevel) && isChannelForbidText;
    const isForbidByForbidGuestText = !Permission.isMember(permissionLevel) && isChannelForbidGuestText;
    const isForbidByForbidGuestTextGap = !Permission.isMember(permissionLevel) && leftGapTime > 0;
    const isForbidByForbidGuestTextWait = !Permission.isMember(permissionLevel) && leftWaitTime > 0;
    const disabled = isForbidByMutedText || isForbidByForbidText || isForbidByForbidGuestText || isForbidByForbidGuestTextGap || isForbidByForbidGuestTextWait;
    const maxLength = !Permission.isMember(permissionLevel) ? channelGuestTextMaxLength : 3000;

    return <MessageInputBox disabled={disabled} maxLength={maxLength} onMessageSend={onMessageSend} />;
  },
);

MessageInputBoxGuard.displayName = 'MessageInputBoxGuard';

interface VolumeSliderProps {
  value: number;
  muted: boolean;
  onChange: (value: number) => void;
  onClick: () => void;
  railCls: string;
  btnCls: string;
}

const VolumeSlider = React.memo(
  function VolumeSlider({ value, muted, onChange, onClick, railCls, btnCls }: VolumeSliderProps) {
    // Refs
    const sliderRef = useRef<HTMLInputElement>(null);
    const isBtnHoveredRef = useRef<boolean>(false);

    // Handlers
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value));
    };

    const handleBtnClick = () => {
      onClick();
    };

    const handleBtnMouseDown = () => {
      isBtnHoveredRef.current = true;
    };

    const handleBtnMouseUp = () => {
      isBtnHoveredRef.current = false;
    };

    const handleBtnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (!isBtnHoveredRef.current) return;
      const newValue = parseInt(sliderRef.current!.value);
      if (e.deltaY > 0) {
        sliderRef.current!.value = (newValue - 4).toString();
      } else {
        sliderRef.current!.value = (newValue + 4).toString();
      }
      onChange(parseInt(sliderRef.current!.value));
    };

    return (
      <div className={railCls}>
        <div className={styles['slider-container']}>
          <input ref={sliderRef} type="range" min="0" max="100" value={value} onChange={handleSliderChange} className={styles['slider']} />
        </div>
        <div
          className={`${btnCls} ${muted ? styles['muted'] : styles['active']}`}
          onClick={handleBtnClick}
          onMouseEnter={handleBtnMouseDown}
          onMouseLeave={handleBtnMouseUp}
          onWheel={handleBtnWheel}
        />
      </div>
    );
  },
  (prev, next) => prev.value === next.value && prev.muted === next.muted,
);

VolumeSlider.displayName = 'VolumeSlider';
