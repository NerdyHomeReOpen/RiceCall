import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';
import { useChannelEventCtxMenu } from '@/hooks/context-menus/useChannelEventCtxMenu';

import { getFormatDate } from '@/utils/language';

const ChannelEventPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const [selectTab, setSelectTab] = useState<'current' | 'all'>('current');
  const [query, setQuery] = useState<string>('');

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      isLobby: state.currentChannel.data.isLobby,
      name: state.currentChannel.data.name,
    }),
    shallowEqual,
  );

  const channelEvents = useAppSelector((state) => state.channelEvents.data, shallowEqual);

  const isCurrentChannelTab = selectTab === 'current';
  const isAllChannelTab = selectTab === 'all';
  const filteredChannelEvents = channelEvents.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.nickname?.toLowerCase().includes(query.toLowerCase()));
  const sortedChannelEvents = filteredChannelEvents.sort((a, b) => b.timestamp - a.timestamp);
  const sortedCurrentChannelEvents = filteredChannelEvents
    .filter((e) => e.prevChannelId === currentChannel.channelId || e.nextChannelId === currentChannel.channelId)
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleCurrentChannelTabClick = () => {
    setSelectTab('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectTab('all');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="popup-wrapper">
      <div className="flex flex-1 items-center justify-center w-full max-h-[45px] border-b border-border">
        <div
          className={`z-1 flex items-center justify-center p-[8px] text-center cursor-pointer transition-[transform] duration-200 ease-[ease] ${isCurrentChannelTab ? "text-text-color-quaternary [transform:translateY(-1px)] after:absolute after:top-[24px] after:min-w-[70px] after:min-h-[20px] after:content-[''] after:bg-[url('/channel/switch_arrow.svg')] after:bg-no-repeat after:bg-position-[0_0] after:bg-auto after:transition-[left] after:duration-200 after:ease-[ease]" : 'text-text-color-quinary'}`}
          onClick={handleCurrentChannelTabClick}
        >
          {t('current-channel')}
        </div>
        <div className="min-w-[2px] min-h-[16px] bg-[url('/icon_v_split.svg')] bg-no-repeat bg-position-[0_0] bg-auto" />
        <div
          className={`z-1 flex items-center justify-center p-[8px] text-center cursor-pointer transition-[transform] duration-200 ease-[ease] ${isAllChannelTab ? "text-text-color-quaternary [transform:translateY(-1px)] after:absolute after:top-[24px] after:min-w-[70px] after:min-h-[20px] after:content-[''] after:bg-[url('/channel/switch_arrow.svg')] after:bg-no-repeat after:bg-position-[0_0] after:bg-auto after:transition-[left] after:duration-200 after:ease-[ease]" : 'text-text-color-quinary'}`}
          onClick={handleAllChannelTabClick}
        >
          {t('all-channel')}
        </div>
      </div>
      <div className="popup-body">
        <div className="flex flex-col w-full overflow-y-auto" style={isCurrentChannelTab ? {} : { display: 'none' }}>
          <div className="sticky top-0 flex items-center justify-start py-[5px] px-[15px] text-text-color-quaternary bg-popup-background border-b border-text-color-octonary before:inline-block before:w-[16px] before:min-w-[16px] before:h-[16px] before:min-h-[16px] before:mr-[4px] before:content-[''] before:bg-[url('/mylocation.svg')] before:bg-no-repeat before:bg-auto">
            {currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}
          </div>
          {sortedCurrentChannelEvents.map((event, index) => (
            <EventTab key={index} event={event} section="current" />
          ))}
        </div>
        <div className="flex flex-col w-full overflow-y-auto" style={isAllChannelTab ? {} : { display: 'none' }}>
          {sortedChannelEvents.map((event, index) => (
            <EventTab key={index} event={event} section="all" />
          ))}
        </div>
      </div>
      <div className="popup-footer">
        <div className="search-box">
          <div className="search-icon" />
          <input name="search-query" type="text" className="search-input" placeholder={t('search-placeholder')} value={query} onChange={handleQueryChange} />
        </div>
      </div>
    </div>
  );
});

ChannelEventPopup.displayName = 'ChannelEventPopup';

export default ChannelEventPopup;

interface EventTabProps {
  event: Types.ChannelEvent;
  section: 'current' | 'all';
}

const EventTab: React.FC<EventTabProps> = React.memo(({ event, section }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

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
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
    }),
    shallowEqual,
  );

  const channels = useAppSelector((state) => state.channels.data, shallowEqual);

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);

  const { buildContextMenu } = useChannelEventCtxMenu({ user, currentServer, event, permissionLevel });

  const getChannelName = (channelId: string | null) => {
    const channel = channels.find((c) => c.channelId === channelId);
    if (!channel) return '';
    return channel.isLobby ? t(channel.name) : channel.name;
  };

  const getActionContent = (channelEvent: Types.ChannelEvent) => {
    if (channelEvent.type === 'join') {
      return (
        <div className="flex-1 overflow-hidden text-ellipsis text-left whitespace-nowrap [&::-webkit-scrollbar]:h-[2px] text-[#0f8318]" title={t('join-current-server')}>
          {t('join-current-server')}
        </div>
      );
    } else if (channelEvent.type === 'leave') {
      return (
        <div className="flex-1 overflow-hidden text-ellipsis text-left whitespace-nowrap [&::-webkit-scrollbar]:h-[2px] text-[#cc2121]" title={t('leave-current-server')}>
          {t('leave-current-server')}
        </div>
      );
    } else {
      const prevChannelName = getChannelName(channelEvent.prevChannelId);
      const nextChannelName = getChannelName(channelEvent.nextChannelId);
      return (
        <div
          className="flex-1 overflow-hidden text-ellipsis text-left whitespace-nowrap [&::-webkit-scrollbar]:h-[2px] text-[#0f8318]"
          title={t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}
        >
          {t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}
        </div>
      );
    }
  };

  const getCurrentActionContent = (channelEvent: Types.ChannelEvent) => {
    if (channelEvent.type === 'join' || (channelEvent.type === 'move' && channelEvent.nextChannelId === currentChannel.channelId)) {
      return (
        <div className="flex-1 overflow-hidden text-ellipsis text-left whitespace-nowrap [&::-webkit-scrollbar]:h-[2px] text-[#0f8318]" title={t('join-current-channel')}>
          {t('join-current-channel')}
        </div>
      );
    } else if (channelEvent.type === 'leave' || (channelEvent.type === 'move' && channelEvent.prevChannelId === currentChannel.channelId)) {
      return (
        <div className="flex-1 overflow-hidden text-ellipsis text-left whitespace-nowrap [&::-webkit-scrollbar]:h-[2px] text-[#cc2121]" title={t('leave-current-channel')}>
          {t('leave-current-channel')}
        </div>
      );
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
  };

  return (
    <div className="flex flex-row gap-[5px] items-center justify-between py-[5px] px-[15px] cursor-pointer border-b border-text-color-octonary hover:bg-[#ddd]" onContextMenu={handleContextMenu}>
      <div className="flex flex-row items-center min-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
        <div className={`permission-${event.gender} permission-lv-${event.permissionLevel}`} />
        <div className={`pl-[5px] overflow-hidden text-ellipsis whitespace-nowrap ${event.nickname ? 'text-text-nickname' : 'text-text-color-quaternary'}`}>{event.nickname || event.name}</div>
      </div>
      {section === 'current' ? getCurrentActionContent(event) : getActionContent(event)}
      <div className="text-text-color-quaternary" title={getFormatDate(event.timestamp, 'all')}>
        {getFormatDate(event.timestamp, 't')}
      </div>
    </div>
  );
});

EventTab.displayName = 'EventTab';
