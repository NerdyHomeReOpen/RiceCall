import React, { useState, useEffect, useRef, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openServerApplication, openChannelEvent, openServerAnnouncement, editChannel, controlQueue } from '@/services';

import { MESSAGE_VIERER_DEVIATION } from '@/constants';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector, useAppDispatch } from '@/hooks/useStore';

import MicButton from './MicButton';
import MessageInputBox from './MessageInputBox';
import MicVolumeSlider from './MicVolumeSlider';
import SpeakerVolumeSlider from './SpeakerVolumeSlider';
import ShowFrame from './ShowFrame';
import MarkdownContent from '@/components/MarkdownContent';
import MessageContent from '@/components/MessageContent';
import UnreadMessageAlert from '@/components/UnreadMessageAlert';

import ContextMenu from '@/utils/contextMenu';
import { getFormatTimeFromSecond } from '@/utils/language';

import styles from './Server.module.css';

const ServerPageContent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { changeBitrate, toggleMixMode, toggleRecording } = useWebRTC();
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerAnnouncement = useAppSelector((state) => state.currentServer.data.announcement);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const currentChannelAnnouncement = useAppSelector((state) => state.currentChannel.data.announcement);
  const currentChannelVoiceMode = useAppSelector((state) => state.currentChannel.data.voiceMode);
  const currentChannelBitrate = useAppSelector((state) => state.currentChannel.data.bitrate);
  const currentChannelForbidQueue = useAppSelector((state) => state.currentChannel.data.forbidQueue);
  const isQueueControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled));
  const channelMessages = useAppSelector((state) => state.channelMessages.data, shallowEqual);
  const actionMessages = useAppSelector((state) => state.actionMessages.data, shallowEqual);
  const isMixModeActive = useAppSelector((state) => state.webrtc.isMixModeActive);
  const isRecording = useAppSelector((state) => state.webrtc.isRecording);
  const recordTime = useAppSelector((state) => state.webrtc.recordTime);

  const annAreaRef = useRef<HTMLDivElement>(null);
  const showAreaRef = useRef<HTMLIFrameElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const isResizingAnnAreaRef = useRef<boolean>(false);

  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const [channelUIMode, setChannelUIMode] = useState<Types.ChannelUIMode>('three-line');
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [centralAreaMode, setCentralAreaMode] = useState<'none' | 'announcement' | 'show'>('announcement');

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isChannelMod = permissionLevel >= Types.Permission.ChannelMod;
  const isCentralAreaNoneMode = centralAreaMode === 'none';
  const isCentralAreaAnnouncementMode = centralAreaMode === 'announcement';
  const isCentralAreaShowMode = centralAreaMode === 'show';
  const isChannelUIClassicMode = channelUIMode === 'classic' || (channelUIMode === 'auto' && isCentralAreaAnnouncementMode);
  const isChannelUIThreeLineMode = channelUIMode === 'three-line' || (channelUIMode === 'auto' && isCentralAreaShowMode);
  const isCurrentChannelFreeMode = currentChannelVoiceMode === 'free';
  const isCurrentChannelAdminMode = currentChannelVoiceMode === 'admin';
  const isCurrentChannelQueueMode = currentChannelVoiceMode === 'queue';

  const clearUnreadMessageNotification = () => {
    setIsAtBottom(true);
    setUnreadMessageCount(0);
  };

  const scrollToBottom = useCallback(() => {
    if (!messageAreaRef.current) return;
    messageAreaRef.current.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'smooth' });
    clearUnreadMessageNotification();
  }, []);

  const getResizableAreaRef = () => {
    if (isCentralAreaAnnouncementMode) return annAreaRef;
    if (isCentralAreaShowMode) return showAreaRef;
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

  const handleWidgetAnnClick = () => {
    if (isCentralAreaAnnouncementMode) setCentralAreaMode('none');
    else setCentralAreaMode('announcement');
    setIsWidgetExpanded(false);
  };

  const handleWidgetShowClick = () => {
    if (isCentralAreaShowMode) setCentralAreaMode('none');
    else setCentralAreaMode('show');
    setIsWidgetExpanded(false);
  };

  const handleWidgetMoreClick = () => {
    openServerApplication(userId, currentServerId, (action) => {
      if (action === 'openShowFrame') setCentralAreaMode('show');
      if (action === 'openChannelEvent') openChannelEvent();
    });
    setIsWidgetExpanded(false);
  };

  const handleMessageAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addCleanUpMessageOption(() => {
        dispatch(Store.clearChannelMessages());
        dispatch(Store.clearActionMessages());
      })
      .addOpenChannelEventOption(() => openChannelEvent())
      .addOpenAnnouncementOption(() => setCentralAreaMode('announcement'))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleAnnAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu().addCloseAnnouncementOption(() => setCentralAreaMode('none')).build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleVoiceModeDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addFreeSpeechOption({ permissionLevel, isFreeMode: isCurrentChannelFreeMode }, () => editChannel(currentServerId, currentChannelId, { voiceMode: 'free' }))
      .addAdminSpeechOption({ permissionLevel, isAdminMode: isCurrentChannelAdminMode }, () => editChannel(currentServerId, currentChannelId, { voiceMode: 'admin' }))
      .addQueueSpeechOption(
        { permissionLevel, isQueueMode: isCurrentChannelQueueMode },
        () => editChannel(currentServerId, currentChannelId, { voiceMode: 'queue' }),
        new ContextMenu()
          .addForbidQueueOption({ permissionLevel, isForbidQueue: currentChannelForbidQueue }, () => editChannel(currentServerId, currentChannelId, { forbidQueue: !currentChannelForbidQueue }))
          .addControlQueueOption({ permissionLevel, isQueueControlled }, () => controlQueue(currentServerId, currentChannelId))
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-top', contextMenu);
  };

  const handleUnreadMessageAlertClick = () => {
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

  const handleRecordModeBtnClick = () => {
    toggleRecording();
  };

  useEffect(() => {
    changeBitrate(currentChannelBitrate);
  }, [currentChannelBitrate, changeBitrate]);

  useEffect(() => {
    if (actionMessages.length === 0) setShowActionMessage(false);
    else setShowActionMessage(true);
  }, [actionMessages]);

  useEffect(() => {
    if (currentServerId && currentServerAnnouncement) openServerAnnouncement(currentServerAnnouncement);
  }, [currentServerId, currentServerAnnouncement]);

  useEffect(() => {
    if (isAtBottom) setUnreadMessageCount(0);
  }, [isAtBottom]);

  useEffect(() => {
    const onPointerup = () => {
      isResizingAnnAreaRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
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
    const changeChannelUIMode = (channelUIMode: Types.ChannelUIMode) => {
      setChannelUIMode(channelUIMode);
    };
    changeChannelUIMode(ipc.systemSettings.channelUIMode.get());
    const unsub = ipc.systemSettings.channelUIMode.onUpdate(changeChannelUIMode);
    return () => unsub();
  }, []);

  return (
    <>
      <div className={`${styles['content-layout']} ${isChannelUIClassicMode ? styles['classic'] : ''} ${isChannelUIThreeLineMode ? styles['three-line'] : ''}`}>
        <div className={styles['widget-bar-toggle-button']}>
          <div className={styles['widget-bar-item']} onClick={handleWidgetMoreBtnClick}>
            <span className={`${styles['widget-bar-item-icon']} ${styles['arrow-down-icon']}`} />
          </div>
        </div>
        <div className={`${styles['widget-bar']} ${isWidgetExpanded ? styles['widget-bar-expanded'] : ''}`}>
          <div className={`${styles['widget-bar-item']} ${isCentralAreaAnnouncementMode ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetAnnClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['announcement-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('announcement')}</span>
          </div>
          <div className={styles['widget-bar-splitter']} />
          <div className={`${styles['widget-bar-item']} ${isCentralAreaShowMode ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetShowClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['show-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('send-flower')}</span>
          </div>
          <div className={styles['widget-bar-splitter']} />
          <div className={styles['widget-bar-item']} onClick={handleWidgetMoreClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['more-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('more')}</span>
          </div>
        </div>
        {!isCentralAreaNoneMode &&
          (isCentralAreaAnnouncementMode ? (
            <div
              ref={annAreaRef}
              className={styles['announcement-area']}
              style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
              onContextMenu={handleAnnAreaContextMenu}
            >
              <MarkdownContent markdownText={currentChannelAnnouncement} imageSize={'big'} />
            </div>
          ) : isCentralAreaShowMode ? (
            <div ref={showAreaRef} className={styles['show-area']} style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}>
              <ShowFrame />
            </div>
          ) : null)}
        <div
          className="resize-handle-vertical"
          style={isChannelUIClassicMode && !isCentralAreaNoneMode ? {} : { display: 'none' }}
          onPointerDown={handleAnnAreaHandleDown}
          onPointerMove={handleAnnAreaHandleMove}
        />
        <div
          className="resize-handle"
          style={isChannelUIThreeLineMode && !isCentralAreaNoneMode ? {} : { display: 'none' }}
          onPointerDown={handleAnnAreaHandleDown}
          onPointerMove={handleAnnAreaHandleMove}
        />
        <div className={styles['chat-area']}>
          <div ref={messageAreaRef} className={styles['message-area']} onScroll={handleScroll} onContextMenu={handleMessageAreaContextMenu}>
            <MessageContent messages={channelMessages} />
            <div style={{ minHeight: '10px' }} />
            <UnreadMessageAlert unreadMessageCount={unreadMessageCount} onAlertClick={handleUnreadMessageAlertClick} />
          </div>
          <div className={styles['input-area']}>
            <div className={styles['broadcast-area']} style={!showActionMessage ? { display: 'none' } : {}}>
              <MessageContent messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} />
              <div className={styles['broadcast-close-button']} onClick={handleCloseActionMessageBtnClick} />
            </div>
            <MessageInputBox />
          </div>
        </div>
      </div>
      <div className={styles['control-area']}>
        <div className={styles['control-buttons']}>
          <div className={styles['voice-mode-dropdown']} style={isChannelMod ? {} : { display: 'none' }} onClick={handleVoiceModeDropdownClick}>
            {isCurrentChannelQueueMode ? t('queue-speech') : isCurrentChannelFreeMode ? t('free-speech') : isCurrentChannelAdminMode ? t('admin-speech') : ''}
          </div>
        </div>
        <MicButton />
        <div className={styles['control-buttons']}>
          <div className={`${styles['mixing-mode-button']} ${isMixModeActive ? styles['active'] : ''}`} onClick={handleMixingBtnClick} title={isMixModeActive ? t('mixing-on') : t('mixing-off')}>
            {t('mixing')}
          </div>
          <div className={styles['control-button-separator']} />
          <MicVolumeSlider />
          <SpeakerVolumeSlider />
          <div className={`${styles['record-box']} ${isRecording ? styles['active'] : ''}`}>
            <div className={`${styles['record-button']} ${isRecording ? styles['active'] : ''}`} onClick={handleRecordModeBtnClick} />
            <div className={`${styles['record-text']} ${isRecording ? styles['active'] : ''}`}>{getFormatTimeFromSecond(recordTime)}</div>
          </div>
        </div>
      </div>
    </>
  );
});

ServerPageContent.displayName = 'ServerPageContent';

export default ServerPageContent;
