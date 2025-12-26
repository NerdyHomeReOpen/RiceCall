import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import * as Language from '@/utils/language';
import * as Default from '@/utils/default';

import popupStyles from '@/styles/popup.module.css';
import styles from '@/styles/channelEvent.module.css';
import permissionStyles from '@/styles/permission.module.css';
import settingStyles from '@/styles/setting.module.css';

interface ChannelEventPopupProps {
  user: Types.User;
  server: Types.Server;
  channels: Types.Channel[];
  serverOnlineMembers: Types.OnlineMember[];
  channelEvents: Types.ChannelEvent[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(
  ({ user: userData, server, channels: channelsData, serverOnlineMembers: serverOnlineMembersData, channelEvents: channelEventsData }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();

    // Refs
    const serverOnlineMembersRef = useRef<Types.OnlineMember[]>(serverOnlineMembersData);

    // States
    const [user, setUser] = useState<Types.User>(userData);
    const [channels, setChannels] = useState<Types.Channel[]>(channelsData);
    const [serverOnlineMembers, setServerOnlineMembers] = useState<Types.OnlineMember[]>(serverOnlineMembersData);
    const [channelEvents, setChannelEvents] = useState<Types.ChannelEvent[]>(channelEventsData);
    const [selectMode, setSelectMode] = useState<'current' | 'all'>('current');
    const [searchText, setSearchText] = useState<string>('');

    // Variables
    const currentChannel = channels.find((c) => c.channelId === user.currentChannelId) || Default.channel();
    const { userId } = user;
    const { serverId } = server;
    const { channelId: currentChannelId, name: currentChannelName, isLobby: isCurrentChannelLobby } = currentChannel;
    const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel, currentChannel.permissionLevel);
    const filteredChannelEvents = channelEvents.filter((e) => e.name.toLowerCase().includes(searchText.toLowerCase()) || e.nickname?.toLowerCase().includes(searchText.toLowerCase()));
    const currentChannelEvents = channelEvents
      .filter((e) => e.prevChannelId === currentChannelId || e.nextChannelId === currentChannelId)
      .filter((e) => e.name.toLowerCase().includes(searchText.toLowerCase()) || e.nickname?.toLowerCase().includes(searchText.toLowerCase()));

    // Handlers
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

    // Effects
    useEffect(() => {
      serverOnlineMembersRef.current = serverOnlineMembers;
    }, [serverOnlineMembers]);

    useEffect(() => {
      const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<Types.User> }[]) => {
        setUser((prev) => ({ ...prev, ...args[0].update }));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: Types.OnlineMember }[]) => {
        // Add channel events
        const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
          const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.data.userId && om.serverId === curr.data.serverId);
          if (!originMember) {
            acc.push({ ...curr.data, type: 'join' as Types.ChannelEvent['type'], prevChannelId: null, nextChannelId: curr.data.currentChannelId, timestamp: Date.now() });
          }
          return acc;
        }, []);
        setChannelEvents((prev) => [...newChannelEvents, ...prev]);

        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setServerOnlineMembers((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.OnlineMember> }[]) => {
        // Add channel events
        const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
          const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
          if (originMember && curr.update.currentChannelId) {
            acc.push({ ...originMember, type: 'move' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: curr.update.currentChannelId, timestamp: Date.now() });
          }
          return acc;
        }, []);
        setChannelEvents((prev) => [...newChannelEvents, ...prev]);

        const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
        setServerOnlineMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
        // Add channel events
        const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
          const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
          if (originMember) {
            acc.push({ ...originMember, type: 'leave' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: null, timestamp: Date.now() });
          }
          return acc;
        }, []);
        setChannelEvents((prev) => [...newChannelEvents, ...prev]);

        const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
        setServerOnlineMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('channelAdd', (...args: { data: Types.Channel }[]) => {
        const add = new Set(args.map((i) => `${i.data.channelId}`));
        setChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Types.Channel> }[]) => {
        const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
        setChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
        const remove = new Set(args.map((i) => `${i.channelId}`));
        setChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
      });
      return () => unsub();
    }, []);

    return (
      <div className={popupStyles['popup-wrapper']}>
        <div className={styles['options-viewer']}>
          <div className={`${styles['option-tab']} ${selectMode === 'current' ? styles['active'] : ''}`} onClick={() => setSelectMode('current')}>
            {t('current-channel')}
          </div>
          <div className={styles['spliter']}></div>
          <div className={`${styles['option-tab']} ${selectMode === 'all' ? styles['active'] : ''}`} onClick={() => setSelectMode('all')}>
            {t('all-channel')}
          </div>
        </div>
        <div className={popupStyles['popup-body']}>
          <div className={styles['event-list']} style={selectMode === 'current' ? {} : { display: 'none' }}>
            <div className={styles['current-channel']}>{isCurrentChannelLobby ? t(currentChannelName) : currentChannelName}</div>
            {currentChannelEvents.reverse().map((e, index) => {
              // Variables
              const isSelf = e.userId === userId;
              const isSuperior = permissionLevel > e.permissionLevel;

              // Handlers
              const getContextMenuItems = () => [
                {
                  id: 'view-profile',
                  label: t('view-profile'),
                  show: true,
                  onClick: () => Popup.handleOpenUserInfo(userId, e.userId),
                },
                {
                  id: 'kick-server',
                  label: t('kick-server'),
                  show: !isSelf && Permission.isServerAdmin(permissionLevel) && isSuperior,
                  onClick: () => Popup.handleOpenKickMemberFromServer(e.userId, serverId),
                },
                {
                  id: 'block',
                  label: t('block'),
                  show: !isSelf && isSuperior && Permission.isServerAdmin(permissionLevel),
                  onClick: () => Popup.handleOpenBlockMember(e.userId, serverId),
                },
              ];

              return (
                <div
                  key={index}
                  className={styles['event-box']}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const x = e.clientX;
                    const y = e.clientY;
                    contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                  }}
                >
                  <div className={styles['user-detail']}>
                    <div className={`${permissionStyles[e.gender]} ${permissionStyles[`lv-${e.permissionLevel}`]}`} />
                    <div className={`${styles['name']} ${e.nickname ? styles['highlight'] : ''}`}>{e.nickname || e.name}</div>
                  </div>
                  {getCurrentActionContent(e)}
                  <div className={styles['time']} title={Language.getFormatDate(e.timestamp, 'all')}>
                    {Language.getFormatDate(e.timestamp, 't')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles['event-list']} style={selectMode === 'all' ? {} : { display: 'none' }}>
            {filteredChannelEvents.reverse().map((e, index) => {
              // Variables
              const isSelf = e.userId === userId;
              const isSuperior = permissionLevel > e.permissionLevel;

              // Handlers
              const getContextMenuItems = () => [
                {
                  id: 'view-profile',
                  label: t('view-profile'),
                  show: true,
                  onClick: () => Popup.handleOpenUserInfo(userId, e.userId),
                },
                {
                  id: 'block',
                  label: t('block'),
                  show: !isSelf && isSuperior && Permission.isServerAdmin(permissionLevel),
                  onClick: () => Popup.handleOpenBlockMember(e.userId, serverId),
                },
              ];

              return (
                <div
                  key={index}
                  className={styles['event-box']}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const x = e.clientX;
                    const y = e.clientY;
                    contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                  }}
                >
                  <div className={styles['user-detail']}>
                    <div className={`${permissionStyles[e.gender]} ${permissionStyles[`lv-${e.permissionLevel}`]}`} />
                    <div className={`${styles['name']} ${e.nickname ? styles['highlight'] : ''}`}>{e.nickname || e.name}</div>
                  </div>
                  {getActionContent(e)}
                  <div className={styles['time']} title={Language.getFormatDate(e.timestamp, 'all')}>
                    {Language.getFormatDate(e.timestamp, 't')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={popupStyles['popup-footer']}>
          <div className={settingStyles['search-box']}>
            <div className={settingStyles['search-icon']}></div>
            <input name="search-query" type="text" className={settingStyles['search-input']} placeholder={t('search-placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
        </div>
      </div>
    );
  },
);

ChannelEventPopup.displayName = 'ChannelEventPopup';

export default ChannelEventPopup;
