import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector, useAppDispatch } from '@/hooks/Store';
import { useChannelEventContextMenu } from '@/hooks/ContextMenus/ChannelEvent';

import { getFormatDate } from '@/utils/language';

import styles from './ChannelEvent.module.css';

interface ChannelEventPopupProps {
  channelEvents: Types.ChannelEvent[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(({ channelEvents: channelEventsData }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

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
  const currentChannelEvents = channelEvents
    .filter((e) => e.prevChannelId === currentChannel.channelId || e.nextChannelId === currentChannel.channelId)
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.nickname?.toLowerCase().includes(query.toLowerCase()));

  const handleCurrentChannelTabClick = () => {
    setSelectTab('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectTab('all');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    dispatch(Store.setChannelEvents(channelEventsData));
  }, [channelEventsData, dispatch]);

  return (
    <div className="popup-wrapper">
      <div className={styles['options-viewer']}>
        <div className={`${styles['option-tab']} ${isCurrentChannelTab ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={styles['spliter']} />
        <div className={`${styles['option-tab']} ${isAllChannelTab ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
      <div className="popup-body">
        <div className={styles['event-list']} style={isCurrentChannelTab ? {} : { display: 'none' }}>
          <div className={styles['current-channel']}>{currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}</div>
          {currentChannelEvents.map((event, index) => (
            <EventTab key={index} event={event} section="current" />
          ))}
        </div>
        <div className={styles['event-list']} style={isAllChannelTab ? {} : { display: 'none' }}>
          {filteredChannelEvents.map((event, index) => (
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

  const { buildContextMenu } = useChannelEventContextMenu({ user, currentServer, event, permissionLevel });

  const getChannelName = (channelId: string | null) => {
    const channel = channels.find((c) => c.channelId === channelId);
    if (!channel) return '';
    return channel.isLobby ? t(channel.name) : channel.name;
  };

  const getActionContent = (channelEvent: Types.ChannelEvent) => {
    if (channelEvent.type === 'join') {
      return (
        <div className={`${styles['action-content']} ${styles['green']}`} title={t('join-current-server')}>
          {t('join-current-server')}
        </div>
      );
    } else if (channelEvent.type === 'leave') {
      return (
        <div className={`${styles['action-content']} ${styles['red']}`} title={t('leave-current-server')}>
          {t('leave-current-server')}
        </div>
      );
    } else {
      const prevChannelName = getChannelName(channelEvent.prevChannelId);
      const nextChannelName = getChannelName(channelEvent.nextChannelId);
      return (
        <div className={`${styles['action-content']} ${styles['green']}`} title={t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}>
          {t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}
        </div>
      );
    }
  };

  const getCurrentActionContent = (channelEvent: Types.ChannelEvent) => {
    if (channelEvent.type === 'join' || (channelEvent.type === 'move' && channelEvent.nextChannelId === currentChannel.channelId)) {
      return (
        <div className={`${styles['action-content']} ${styles['green']}`} title={t('join-current-channel')}>
          {t('join-current-channel')}
        </div>
      );
    } else if (channelEvent.type === 'leave' || (channelEvent.type === 'move' && channelEvent.prevChannelId === currentChannel.channelId)) {
      return (
        <div className={`${styles['action-content']} ${styles['red']}`} title={t('leave-current-channel')}>
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
    <div className={styles['event-box']} onContextMenu={handleContextMenu}>
      <div className={styles['user-detail']}>
        <div className={`permission-${event.gender} permission-lv-${event.permissionLevel}`} />
        <div className={`${styles['name']} ${event.nickname ? styles['highlight'] : ''}`}>{event.nickname || event.name}</div>
      </div>
      {section === 'current' ? getCurrentActionContent(event) : getActionContent(event)}
      <div className={styles['time']} title={getFormatDate(event.timestamp, 'all')}>
        {getFormatDate(event.timestamp, 't')}
      </div>
    </div>
  );
});

EventTab.displayName = 'EventTab';
