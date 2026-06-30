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
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerAnnouncement = useAppSelector((state) => state.currentServer.data.announcement);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelAnnouncement = useAppSelector((state) => state.currentChannel.data.announcement);
  const currentChannelVoiceMode = useAppSelector((state) => state.currentChannel.data.voiceMode);
  const currentChannelBitrate = useAppSelector((state) => state.currentChannel.data.bitrate);
  const currentChannelForbidQueue = useAppSelector((state) => state.currentChannel.data.forbidQueue);
  const channelMessages = useAppSelector((state) => state.channelMessages.data, shallowEqual);
  const actionMessages = useAppSelector((state) => state.actionMessages.data, shallowEqual);
  const isQueueControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled));
  const isMixModeActive = useAppSelector((state) => state.webrtc.isMixModeActive);
  const isRecorderActive = useAppSelector((state) => state.webrtc.isRecorderActive);
  const recordTime = useAppSelector((state) => state.webrtc.recordTime);

  const annAreaEl = useRef<HTMLDivElement>(null);
  const showAreaEl = useRef<HTMLIFrameElement>(null);
  const messageAreaEl = useRef<HTMLDivElement>(null);
  const isAnnAreaResizing = useRef<boolean>(false);

  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);
  const [channelUIMode, setChannelUIMode] = useState<Types.ChannelUIMode>('three-line');
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [centralAreaMode, setCentralAreaMode] = useState<'none' | 'announcement' | 'show'>('announcement');

  const isChannelMod = permissionLevel >= Types.Permission.ChannelMod;
  const isChannelUIClassicMode = channelUIMode === 'classic' || (channelUIMode === 'auto' && centralAreaMode === 'announcement');
  const isChannelUIThreeLineMode = channelUIMode === 'three-line' || (channelUIMode === 'auto' && centralAreaMode === 'show');

  const scrollToBottom = useCallback(() => {
    if (!messageAreaEl.current) return;

    messageAreaEl.current.scrollTo({ top: messageAreaEl.current.scrollHeight, behavior: 'smooth' });
    setUnreadMessageCount(0);
  }, []);

  const getResizableAreaRef = () => {
    if (centralAreaMode === 'announcement') return annAreaEl;
    if (centralAreaMode === 'show') return showAreaEl;
    return null;
  };

  const handleAnnAreaHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetRef = getResizableAreaRef();
    if (!targetRef?.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    isAnnAreaResizing.current = true;
  };

  const handleAnnAreaHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetRef = getResizableAreaRef();
    if (!isAnnAreaResizing.current || !targetRef?.current) return;

    if (isChannelUIClassicMode) {
      targetRef.current.style.height = `${e.clientY - targetRef.current.offsetTop}px`;
    } else if (isChannelUIThreeLineMode) {
      targetRef.current.style.width = `${e.clientX - targetRef.current.offsetLeft}px`;
    }
  };

  const handleScroll = () => {
    if (!messageAreaEl.current) return;

    const isBottom = messageAreaEl.current.scrollHeight - messageAreaEl.current.scrollTop - messageAreaEl.current.clientHeight <= MESSAGE_VIERER_DEVIATION;
    if (isBottom) setUnreadMessageCount(0);
  };

  const handleWidgetAnnClick = () => {
    if (centralAreaMode === 'announcement') {
      setCentralAreaMode('none');
    } else {
      setCentralAreaMode('announcement');
    }

    setIsWidgetExpanded(false);
  };

  const handleWidgetShowClick = () => {
    if (centralAreaMode === 'show') {
      setCentralAreaMode('none');
    } else {
      setCentralAreaMode('show');
    }

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
      .addOpenChannelEventOption(() => {
        openChannelEvent();
      })
      .addOpenAnnouncementOption(() => {
        setCentralAreaMode('announcement');
      })
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleAnnAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addCloseAnnouncementOption(() => {
        setCentralAreaMode('none');
      })
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleVoiceModeDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addFreeSpeechOption(
        {
          permissionLevel,
          isChannelVoiceFreeMode: currentChannelVoiceMode === 'free',
        },
        () => {
          editChannel(currentServerId, currentChannelId, { voiceMode: 'free' });
        },
      )
      .addAdminSpeechOption(
        {
          permissionLevel,
          isChannelVoiceAdminMode: currentChannelVoiceMode === 'admin',
        },
        () => {
          editChannel(currentServerId, currentChannelId, { voiceMode: 'admin' });
        },
      )
      .addQueueSpeechOption(
        {
          permissionLevel,
          isChannelVoiceQueueMode: currentChannelVoiceMode === 'queue',
        },
        () => {
          editChannel(currentServerId, currentChannelId, { voiceMode: 'queue' });
        },
        new ContextMenu()
          .addForbidQueueOption(
            {
              permissionLevel,
              isChannelForbidQueue: currentChannelForbidQueue,
            },
            () => {
              editChannel(currentServerId, currentChannelId, { forbidQueue: !currentChannelForbidQueue });
            },
          )
          .addControlQueueOption(
            {
              permissionLevel,
              isQueueControlled,
            },
            () => {
              controlQueue(currentServerId, currentChannelId);
            },
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-top', contextMenu);
  };

  const handleUnreadMessageAlertClick = () => {
    scrollToBottom();
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
    const handlePointerUp = () => {
      isAnnAreaResizing.current = false;
    };

    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles['widget-bar']}`)) {
        setIsWidgetExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') scrollToBottom();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToBottom]);

  useEffect(() => {
    if (!messageAreaEl.current || channelMessages.length === 0) return;

    const lastMessage = channelMessages[channelMessages.length - 1];
    const isBottom = messageAreaEl.current.scrollHeight - messageAreaEl.current.scrollTop - messageAreaEl.current.clientHeight <= MESSAGE_VIERER_DEVIATION;

    if (isBottom || lastMessage.type !== 'general' || lastMessage.userId === userId) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [channelMessages, userId, scrollToBottom]);

  useEffect(() => {
    const handleChannelUIModeUpdate = (channelUIMode: Types.ChannelUIMode) => {
      setChannelUIMode(channelUIMode);
    };

    handleChannelUIModeUpdate(ipc.systemSettings.channelUIMode.get());

    const unsub = ipc.systemSettings.channelUIMode.onUpdate(handleChannelUIModeUpdate);
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
          <div className={`${styles['widget-bar-item']} ${centralAreaMode === 'announcement' ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetAnnClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['announcement-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('announcement')}</span>
          </div>
          <div className={styles['widget-bar-splitter']} />
          <div className={`${styles['widget-bar-item']} ${centralAreaMode === 'show' ? styles['widget-bar-item-active'] : ''}`} onClick={handleWidgetShowClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['show-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('send-flower')}</span>
          </div>
          <div className={styles['widget-bar-splitter']} />
          <div className={styles['widget-bar-item']} onClick={handleWidgetMoreClick}>
            <div className={`${styles['widget-bar-item-icon']} ${styles['more-icon']}`} />
            <span className={styles['widget-bar-item-text']}>{t('more')}</span>
          </div>
        </div>
        {centralAreaMode !== 'none' &&
          (centralAreaMode === 'announcement' ? (
            <div
              ref={annAreaEl}
              className={styles['announcement-area']}
              style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
              onContextMenu={handleAnnAreaContextMenu}
            >
              <MarkdownContent markdownText={currentChannelAnnouncement} imageSize={'big'} />
            </div>
          ) : centralAreaMode === 'show' ? (
            <div ref={showAreaEl} className={styles['show-area']} style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}>
              <ShowFrame />
            </div>
          ) : null)}
        <div
          className="resize-handle-vertical"
          style={isChannelUIClassicMode && centralAreaMode !== 'none' ? {} : { display: 'none' }}
          onPointerDown={handleAnnAreaHandleDown}
          onPointerMove={handleAnnAreaHandleMove}
        />
        <div
          className="resize-handle"
          style={isChannelUIThreeLineMode && centralAreaMode !== 'none' ? {} : { display: 'none' }}
          onPointerDown={handleAnnAreaHandleDown}
          onPointerMove={handleAnnAreaHandleMove}
        />
        <div className={styles['chat-area']}>
          <div ref={messageAreaEl} className={styles['message-area']} onScroll={handleScroll} onContextMenu={handleMessageAreaContextMenu}>
            <MessageContent messages={channelMessages} />
            <div style={{ minHeight: '10px' }} />
            <UnreadMessageAlert unreadMessageCount={unreadMessageCount} onClick={handleUnreadMessageAlertClick} />
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
            {currentChannelVoiceMode === 'queue' ? t('queue-speech') : currentChannelVoiceMode === 'free' ? t('free-speech') : currentChannelVoiceMode === 'admin' ? t('admin-speech') : ''}
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
          <div className={`${styles['record-box']} ${isRecorderActive ? styles['active'] : ''}`}>
            <div className={`${styles['record-button']} ${isRecorderActive ? styles['active'] : ''}`} onClick={handleRecordModeBtnClick} />
            <div className={`${styles['record-text']} ${isRecorderActive ? styles['active'] : ''}`}>{getFormatTimeFromSecond(recordTime)}</div>
          </div>
        </div>
      </div>
    </>
  );
});

ServerPageContent.displayName = 'ServerPageContent';

export default ServerPageContent;
