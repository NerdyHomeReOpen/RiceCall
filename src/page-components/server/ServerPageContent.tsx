import React, { useState, useEffect, useRef, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openServerApplication, openChannelEvent, openServerAnnouncement } from '@/services';

import { MESSAGE_VIERER_DEVIATION } from '@/constants';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector, useAppDispatch } from '@/hooks/useStore';
import { useAnnouncementAreaCtxMenu } from '@/hooks/context-menus/useAnnouncementAreaCtxMenu';
import { useMessageAreaCtxMenu } from '@/hooks/context-menus/useMessageAreaCtxMenu';
import { useVoiceModeCtxMenu } from '@/hooks/context-menus/useVoiceModeCtxMenu';

import MicButton from './MicButton';
import MessageInputBox from './MessageInputBox';
import MicVolumeSlider from './MicVolumeSlider';
import SpeakerVolumeSlider from './SpeakerVolumeSlider';
import ShowFrame from './ShowFrame';
import MarkdownContent from '@/components/markdown-content';
import MessageContent from '@/components/message-content';
import UnreadMessageAlert from '@/components/unread-message-alert';

import { getFormatTimeFromSecond } from '@/utils/language';

const VOICE_MODE_TEXT_KEYS: Record<Types.Channel['voiceMode'], string> = { free: 'free-speech', admin: 'admin-speech', queue: 'queue-speech' };

const ServerPageContent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { changeBitrate, toggleMixMode, toggleRecording } = useWebRTC();
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
      announcement: state.currentServer.data.announcement,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      announcement: state.currentChannel.data.announcement,
      voiceMode: state.currentChannel.data.voiceMode,
      bitrate: state.currentChannel.data.bitrate,
      forbidQueue: state.currentChannel.data.forbidQueue,
    }),
    shallowEqual,
  );

  const isQueueControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled), shallowEqual);
  const channelMessages = useAppSelector((state) => state.channelMessages.data, shallowEqual);
  const actionMessages = useAppSelector((state) => state.actionMessages.data, shallowEqual);
  const isMixModeActive = useAppSelector((state) => state.webrtc.isMixModeActive, shallowEqual);
  const isRecording = useAppSelector((state) => state.webrtc.isRecording, shallowEqual);
  const recordTime = useAppSelector((state) => state.webrtc.recordTime, shallowEqual);

  const annAreaRef = useRef<HTMLDivElement>(null);
  const showAreaRef = useRef<HTMLIFrameElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const isResizingAnnAreaRef = useRef<boolean>(false);

  const [isActionMessageVisible, setIsActionMessageVisible] = useState<boolean>(false);
  const [channelUIMode, setChannelUIMode] = useState<Types.ChannelUIMode>('three-line');
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [centralAreaMode, setCentralAreaMode] = useState<'none' | 'announcement' | 'show'>('announcement');

  const { buildContextMenu: buildAnnouncementAreaContextMenu } = useAnnouncementAreaCtxMenu({
    onCloseAnnouncement: () => setCentralAreaMode('none'),
  });
  const { buildContextMenu: buildMessageAreaContextMenu } = useMessageAreaCtxMenu({
    onOpenAnnouncement: () => setCentralAreaMode('announcement'),
    onClearMessages: () => {
      dispatch(Store.clearChannelMessages());
      dispatch(Store.clearActionMessages());
    },
  });
  const { buildContextMenu: buildVoiceModeContextMenu } = useVoiceModeCtxMenu({
    currentServer,
    currentChannel,
    permissionLevel: Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel),
    isQueueControlled,
  });

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isChannelMod = permissionLevel >= Permission.ChannelMod;
  const isCentralAreaNoneMode = centralAreaMode === 'none';
  const isCentralAreaAnnouncementMode = centralAreaMode === 'announcement';
  const isCentralAreaShowMode = centralAreaMode === 'show';
  const isChannelUIClassicMode = channelUIMode === 'classic' || (channelUIMode === 'auto' && isCentralAreaAnnouncementMode);
  const isChannelUIThreeLineMode = channelUIMode === 'three-line' || (channelUIMode === 'auto' && isCentralAreaShowMode);

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
    openServerApplication(user.userId, currentServer.serverId, (action) => {
      if (action === 'openShowFrame') setCentralAreaMode('show');
      if (action === 'openChannelEvent') openChannelEvent();
    });
    setIsWidgetExpanded(false);
  };

  const handleMessageAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildMessageAreaContextMenu());
  };

  const handleAnnAreaContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildAnnouncementAreaContextMenu());
  };

  const handleVoiceModeDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-top', buildVoiceModeContextMenu());
  };

  const handleUnreadMessageAlertClick = () => {
    clearUnreadMessageNotification();
  };

  const handleWidgetMoreBtnClick = () => {
    setIsWidgetExpanded(true);
  };

  const handleCloseActionMessageBtnClick = () => {
    setIsActionMessageVisible(false);
  };

  const handleMixingBtnClick = () => {
    toggleMixMode();
  };

  const handleRecordModeBtnClick = () => {
    toggleRecording();
  };

  useEffect(() => {
    changeBitrate(currentChannel.bitrate);
  }, [currentChannel.bitrate, changeBitrate]);

  useEffect(() => {
    if (actionMessages.length === 0) setIsActionMessageVisible(false);
    else setIsActionMessageVisible(true);
  }, [actionMessages]);

  useEffect(() => {
    if (currentServer.serverId && currentServer.announcement) openServerAnnouncement(currentServer.announcement);
  }, [currentServer.serverId, currentServer.announcement]);

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
      if (!(e.target as HTMLElement).closest('.widget-bar')) {
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

    if (isBottom || lastMessage.type !== 'general' || lastMessage.userId === user.userId) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, [channelMessages, user.userId, scrollToBottom]);

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
      <div className={`flex flex-1 min-h-0 ${isChannelUIThreeLineMode ? 'flex-row' : 'flex-col'}`}>
        <div className="absolute right-[15px] z-1 bg-white rounded-b-[5px] shadow-box-shadow">
          <div className="group/item flex gap-[5px] place-items-center p-0 cursor-pointer" onClick={handleWidgetMoreBtnClick}>
            <span className="flex w-[20px] h-[16px] bg-[url('/channel/widgetBar_Stretch.svg')] bg-[position:0_0] bg-auto group-hover/item:bg-[position:-20px_0] group-active/item:bg-[position:-20px_0]" />
          </div>
        </div>
        <div
          className={`widget-bar absolute right-[10px] z-1 flex gap-[5px] items-center overflow-hidden bg-white rounded-b-[5px] shadow-box-shadow transition-transform duration-500 ease-linear ${isWidgetExpanded ? 'translate-y-[0%]' : 'translate-y-[-110%]'}`}
        >
          <div className="group/item flex gap-[5px] place-items-center px-[25px] py-[3px] cursor-pointer" onClick={handleWidgetAnnClick}>
            <div
              className={`flex w-[12px] h-[12px] bg-auto group-hover/item:bg-[position:-12px_0] group-[:active:not(:hover)]/item:bg-[position:-24px_0] bg-[url('/channel/widgetbar_bullet.svg')] ${isCentralAreaAnnouncementMode ? 'bg-[position:-24px_0]' : 'bg-[position:0_0]'}`}
            />
            <span className={`text-[12px] whitespace-nowrap select-none ${isCentralAreaAnnouncementMode ? 'font-bold text-black' : 'text-[#333]'}`}>{t('announcement')}</span>
          </div>
          <div className="w-[2px] h-[16px] bg-[url('/channel/widgetbar_spliter.svg')] bg-no-repeat bg-center" />
          <div className="group/item flex gap-[5px] place-items-center px-[25px] py-[3px] cursor-pointer" onClick={handleWidgetShowClick}>
            <div
              className={`flex w-[12px] h-[12px] bg-auto group-hover/item:bg-[position:-12px_0] group-[:active:not(:hover)]/item:bg-[position:-24px_0] bg-[url('/channel/widgetbar_rcshow.svg')] ${isCentralAreaShowMode ? 'bg-[position:-24px_0]' : 'bg-[position:0_0]'}`}
            />
            <span className={`text-[12px] whitespace-nowrap select-none ${isCentralAreaShowMode ? 'font-bold text-black' : 'text-[#333]'}`}>{t('send-flower')}</span>
          </div>
          <div className="w-[2px] h-[16px] bg-[url('/channel/widgetbar_spliter.svg')] bg-no-repeat bg-center" />
          <div className="group/item flex gap-[5px] place-items-center px-[25px] py-[3px] cursor-pointer" onClick={handleWidgetMoreClick}>
            <div className="flex w-[12px] h-[12px] bg-auto group-hover/item:bg-[position:-12px_0] group-[:active:not(:hover)]/item:bg-[position:-24px_0] bg-[url('/channel/widgetbar_more.svg')] bg-[position:0_0]" />
            <span className="text-[12px] whitespace-nowrap select-none text-[#333]">{t('more')}</span>
          </div>
        </div>
        {isCentralAreaAnnouncementMode && (
          <div
            ref={annAreaRef}
            className="w-full min-w-[200px] h-full min-h-[60px] p-[10px] overflow-y-auto"
            style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
            onContextMenu={handleAnnAreaContextMenu}
          >
            <MarkdownContent markdownText={currentChannel.announcement} imageSize={'big'} />
          </div>
        )}
        {isCentralAreaShowMode && (
          <div
            ref={showAreaRef}
            className="w-full min-w-[200px] h-full min-h-[60px] p-0 overflow-hidden"
            style={isChannelUIClassicMode ? { minWidth: '100%', minHeight: '60px' } : { minWidth: '200px', minHeight: '100%' }}
          >
            <ShowFrame />
          </div>
        )}
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
        <div className="flex flex-[5] flex-col min-w-[260px] min-h-[200px] overflow-y-hidden bg-background-secondary">
          <div ref={messageAreaRef} className="flex flex-col h-full px-[10px] pt-[10px] pb-0 overflow-x-hidden overflow-y-scroll" onScroll={handleScroll} onContextMenu={handleMessageAreaContextMenu}>
            <MessageContent messages={channelMessages} />
            <div style={{ minHeight: '10px' }} />
            <UnreadMessageAlert unreadMessageCount={unreadMessageCount} onAlertClick={handleUnreadMessageAlertClick} />
          </div>
          <div className="relative flex min-h-[70px] max-h-[50%] px-[10px] pb-[10px]">
            <div
              className="absolute bottom-[calc(100%+10px)] left-[10px] flex justify-center w-[calc(100%-20px)] min-h-[25px] p-[3px] bg-notification-toaster-background border-[1.5px] border-notification-toaster-border rounded-[2px]"
              style={!isActionMessageVisible ? { display: 'none' } : {}}
            >
              <MessageContent messages={actionMessages.length !== 0 ? [actionMessages[actionMessages.length - 1]] : []} />
              <div
                className="w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/loading_close.svg')] bg-[position:0_0] bg-cover hover:bg-[position:-18px_0] active:bg-[position:-36px_0]"
                onClick={handleCloseActionMessageBtnClick}
              />
            </div>
            <MessageInputBox />
          </div>
        </div>
      </div>
      <div className="flex flex-none items-center justify-between w-full h-[55px] px-[10px] py-[4px] bg-[url('/channel/chn_toolbar_bg.svg')]">
        <div className="flex gap-[10px] items-center justify-between">
          <div
            className="relative flex gap-[5px] items-center p-[5px] text-text-color-quaternary text-center cursor-pointer rounded-[4px] after:block after:min-w-[8px] after:min-h-[8px] after:cursor-pointer after:content-[''] after:bg-[url('/channel/triangle.svg')] after:bg-no-repeat after:bg-[position:0_0] after:rotate-180 hover:after:bg-[position:-9px_0] active:after:bg-[position:-18px_0]"
            style={isChannelMod ? {} : { display: 'none' }}
            onClick={handleVoiceModeDropdownClick}
          >
            {t(VOICE_MODE_TEXT_KEYS[currentChannel.voiceMode])}
          </div>
        </div>
        <MicButton />
        <div className="flex gap-[10px] items-center justify-between">
          <div
            className={`flex items-center text-text-color-quaternary cursor-pointer before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/channel/music_bkg.svg')] before:bg-no-repeat ${isMixModeActive ? `before:bg-[position:-18px_0] before:animate-mixing` : 'before:bg-[position:0_0]'}`}
            onClick={handleMixingBtnClick}
            title={isMixModeActive ? t('mixing-on') : t('mixing-off')}
          >
            {t('mixing')}
          </div>
          <div className="min-w-[2px] min-h-[16px] bg-[url('/icon_v_split.svg')] bg-no-repeat bg-[position:0_0] bg-auto" />
          <MicVolumeSlider />
          <SpeakerVolumeSlider />
          <div className="flex flex-row">
            <div
              className={`relative min-w-[18px] min-h-[18px] cursor-pointer bg-[url('/channel/recorder.svg')] bg-no-repeat ${isRecording ? "bg-[position:-18px_0] after:absolute after:top-[-5px] after:left-[-5px] after:z-[-1] after:min-w-[28px] after:min-h-[28px] after:content-[''] after:bg-[url('/channel/recorder_bg.svg')] after:bg-no-repeat after:bg-[position:0_0]" : 'bg-[position:0_0]'}`}
              onClick={handleRecordModeBtnClick}
            />
            <div className={`items-center ml-[5px] text-text-color-quaternary ${isRecording ? 'flex' : 'hidden'}`}>{getFormatTimeFromSecond(recordTime)}</div>
          </div>
        </div>
      </div>
    </>
  );
});

ServerPageContent.displayName = 'ServerPageContent';

export default ServerPageContent;
