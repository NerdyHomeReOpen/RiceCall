import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openBlockMember, openKickMemberFromServer, openUserInfo } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import ContextMenu from '@/utils/contextMenu';
import { getFormatDate } from '@/utils/language';

import styles from './ChannelEvent.module.css';

const ChannelEventPopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const [selectTab, setSelectTab] = useState<'current' | 'all'>('current');
  const [query, setQuery] = useState<string>('');

  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelIsLobby = useAppSelector((state) => state.currentChannel.data.isLobby);
  const currentChannelName = useAppSelector((state) => state.currentChannel.data.name);
  const channelEvents = useAppSelector((state) => state.channelEvents.data, shallowEqual);

  const isCurrentChannelTab = selectTab === 'current';
  const isAllChannelTab = selectTab === 'all';
  const filteredChannelEvents = channelEvents.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.nickname?.toLowerCase().includes(query.toLowerCase()));
  const sortedChannelEvents = filteredChannelEvents.sort((a, b) => b.timestamp - a.timestamp);
  const sortedCurrentChannelEvents = filteredChannelEvents.filter((e) => e.prevChannelId === currentChannelId || e.nextChannelId === currentChannelId).sort((a, b) => b.timestamp - a.timestamp);

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
      <div className={styles['options-viewer']}>
        <div className={`${styles['option-tab']} ${isCurrentChannelTab ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={styles['splitter']} />
        <div className={`${styles['option-tab']} ${isAllChannelTab ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
      <div className="popup-body">
        <div className={styles['event-list']} style={isCurrentChannelTab ? {} : { display: 'none' }}>
          <div className={styles['current-channel']}>{currentChannelIsLobby ? t(currentChannelName) : currentChannelName}</div>
          {sortedCurrentChannelEvents.map((event, index) => (
            <EventTab key={index} event={event} section="current" />
          ))}
        </div>
        <div className={styles['event-list']} style={isAllChannelTab ? {} : { display: 'none' }}>
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

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isSelf = event.userId === userId;
  const isLowerLevel = event.permissionLevel < permissionLevel;

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
    if (channelEvent.type === 'join' || (channelEvent.type === 'move' && channelEvent.nextChannelId === currentChannelId)) {
      return (
        <div className={`${styles['action-content']} ${styles['green']}`} title={t('join-current-channel')}>
          {t('join-current-channel')}
        </div>
      );
    } else if (channelEvent.type === 'leave' || (channelEvent.type === 'move' && channelEvent.prevChannelId === currentChannelId)) {
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

    const contextMenu = new ContextMenu()
      .addViewProfileOption(() => openUserInfo(userId, event.userId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openKickMemberFromServer(event.userId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(event.userId, currentServerId))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
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
