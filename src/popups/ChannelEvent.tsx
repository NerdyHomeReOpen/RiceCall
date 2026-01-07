import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hook';

import type * as Types from '@/types';

import { setChannelEvents } from '@/store/slices/channelEventsSlice';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import popupStyles from '@/styles/popup.module.css';
import styles from '@/styles/channelEvent.module.css';
import permissionStyles from '@/styles/permission.module.css';
import settingStyles from '@/styles/setting.module.css';

interface ChannelEventPopupProps {
  channelEvents: Types.ChannelEvent[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(({ channelEvents: channelEventsData }) => {
  // Hooks
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Refs
  const [selectTab, setSelectTab] = useState<'current' | 'all'>('current');
  const [query, setQuery] = useState<string>('');

  // Selectors
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const channelEvents = useAppSelector((state) => state.channelEvents.data);

  // Variables
  const { channelId: currentChannelId, name: currentChannelName, isLobby: isCurrentChannelLobby } = currentChannel;
  const isCurrentChannelTab = selectTab === 'current';
  const isAllChannelTab = selectTab === 'all';
  const filteredChannelEvents = channelEvents.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.nickname?.toLowerCase().includes(query.toLowerCase()));
  const currentChannelEvents = channelEvents
    .filter((e) => e.prevChannelId === currentChannelId || e.nextChannelId === currentChannelId)
    .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.nickname?.toLowerCase().includes(query.toLowerCase()));

  // Handlers
  const handleCurrentChannelTabClick = () => {
    setSelectTab('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectTab('all');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Effect
  useEffect(() => {
    dispatch(setChannelEvents(channelEventsData));
  }, [channelEventsData, dispatch]);

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={styles['options-viewer']}>
        <div className={`${styles['option-tab']} ${isCurrentChannelTab ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={styles['spliter']} />
        <div className={`${styles['option-tab']} ${isAllChannelTab ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
      <div className={popupStyles['popup-body']}>
        <div className={styles['event-list']} style={isCurrentChannelTab ? {} : { display: 'none' }}>
          <div className={styles['current-channel']}>{isCurrentChannelLobby ? t(currentChannelName) : currentChannelName}</div>
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
      <div className={popupStyles['popup-footer']}>
        <div className={settingStyles['search-box']}>
          <div className={settingStyles['search-icon']} />
          <input name="search-query" type="text" className={settingStyles['search-input']} placeholder={t('search-placeholder')} value={query} onChange={handleQueryChange} />
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
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const channels = useAppSelector((state) => state.channels.data);

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const { userId } = user;
  const { serverId: currentServerId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const isSelf = event.userId === userId;
  const isSuperior = permissionLevel > event.permissionLevel;

  // Functions
  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addViewProfileOption(() => Popup.openUserInfo(userId, event.userId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openKickMemberFromServer(event.userId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(event.userId, currentServerId))
      .build();

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

  // Handlers
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getContextMenuItems());
  };

  return (
    <div className={styles['event-box']} onContextMenu={handleContextMenu}>
      <div className={styles['user-detail']}>
        <div className={`${permissionStyles[event.gender]} ${permissionStyles[`lv-${event.permissionLevel}`]}`} />
        <div className={`${styles['name']} ${event.nickname ? styles['highlight'] : ''}`}>{event.nickname || event.name}</div>
      </div>
      {section === 'current' ? getCurrentActionContent(event) : getActionContent(event)}
      <div className={styles['time']} title={Language.getFormatDate(event.timestamp, 'all')}>
        {Language.getFormatDate(event.timestamp, 't')}
      </div>
    </div>
  );
});

EventTab.displayName = 'EventTab';
