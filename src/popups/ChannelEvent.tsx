import React, { useRef, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/channelEvent.module.css';
import permission from '@/styles/permission.module.css';
import setting from '@/styles/setting.module.css';

// Types
import type { Channel, OnlineMember, User, ChannelEvent, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenUserInfo, handleOpenBlockMember } from '@/utils/popup';
import { isServerAdmin } from '@/utils/permission';
import { getFormatDate } from '@/utils/language';
import Default from '@/utils/default';

interface ChannelEventPopupProps {
  user: User;
  server: Server;
  channels: Channel[];
  serverOnlineMembers: OnlineMember[];
  channelEvents: ChannelEvent[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(
  ({ user: userData, server, channels: channelsData, serverOnlineMembers: serverOnlineMembersData, channelEvents: channelEventsData }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();

    // Refs
    const serverOnlineMembersRef = useRef<OnlineMember[]>(serverOnlineMembersData);

    // States
    const [user, setUser] = useState<User>(userData);
    const [channels, setChannels] = useState<Channel[]>(channelsData);
    const [serverOnlineMembers, setServerOnlineMembers] = useState<OnlineMember[]>(serverOnlineMembersData);
    const [channelEvents, setChannelEvents] = useState<ChannelEvent[]>(channelEventsData);
    const [selectMode, setSelectMode] = useState<'current' | 'all'>('current');
    const [searchText, setSearchText] = useState<string>('');

    // Variables
    const currentChannel = channels.find((c) => c.channelId === user.currentChannelId) || Default.channel();
    const { userId } = user;
    const { serverId } = server;
    const { channelId: currentChannelId, name: currentChannelName } = currentChannel;
    const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel, currentChannel.permissionLevel);
    const filteredChannelEvents = channelEvents.filter((e) => e.name.toLowerCase().includes(searchText.toLowerCase()) || e.nickname?.toLowerCase().includes(searchText.toLowerCase()));
    const currentChannelEvents = channelEvents
      .filter((e) => e.prevChannelId === currentChannelId || e.nextChannelId === currentChannelId)
      .filter((e) => e.name.toLowerCase().includes(searchText.toLowerCase()) || e.nickname?.toLowerCase().includes(searchText.toLowerCase()));

    // Handlers
    const getChannelName = (channelId: string) => {
      return channels.find((c) => c.channelId === channelId)?.isLobby ? t('lobby') : channels.find((c) => c.channelId === channelId)?.name;
    };

    const getActionContent = (channelEvent: ChannelEvent) => {
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
        const prevChannelName = channelEvent.prevChannelId ? getChannelName(channelEvent.prevChannelId) : '';
        const nextChannelName = channelEvent.nextChannelId ? getChannelName(channelEvent.nextChannelId) : '';
        return (
          <div className={`${styles['action-content']} ${styles['green']}`} title={t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}>
            {t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}
          </div>
        );
      }
    };

    const getCurrentActionContent = (channelEvent: ChannelEvent) => {
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
      const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<User> }[]) => {
        setUser((prev) => ({ ...prev, ...args[0].update }));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: OnlineMember }[]) => {
        setChannelEvents((prev) => [
          ...prev,
          ...args.map((m) => ({
            ...m.data,
            type: 'join' as ChannelEvent['type'],
            prevChannelId: null,
            nextChannelId: m.data.currentChannelId,
            timestamp: Date.now(),
          })),
        ]);
        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setServerOnlineMembers((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => {
        args.map((m) => {
          const originMember = serverOnlineMembersRef.current.find((om) => om.userId === m.userId);
          if (originMember && m.update.currentChannelId) {
            const originChannelId = originMember.currentChannelId;
            const newMember = { ...originMember, ...m.update };
            setChannelEvents((prev) => [
              ...prev,
              {
                ...newMember,
                type: 'move' as ChannelEvent['type'],
                prevChannelId: originChannelId,
                nextChannelId: newMember.currentChannelId,
                timestamp: Date.now(),
              },
            ]);
          }
        });
        const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
        setServerOnlineMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
        args.map((m) => {
          const originMember = serverOnlineMembersRef.current.find((om) => om.userId === m.userId);
          if (originMember) {
            setChannelEvents((prev) => [
              ...prev,
              {
                ...originMember,
                type: 'leave' as ChannelEvent['type'],
                prevChannelId: originMember.currentChannelId,
                nextChannelId: null,
                timestamp: Date.now(),
              },
            ]);
          }
        });
        const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
        setServerOnlineMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('channelAdd', (...args: { data: Channel }[]) => {
        const add = new Set(args.map((i) => `${i.data.channelId}`));
        setChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Channel> }[]) => {
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
      <div className={popup['popup-wrapper']}>
        {/* Header */}
        <div className={styles['options-viewer']}>
          <div className={`${styles['option-tab']} ${selectMode === 'current' ? styles['active'] : ''}`} onClick={() => setSelectMode('current')}>
            {t('current-channel')}
          </div>
          <div className={styles['spliter']}></div>
          <div className={`${styles['option-tab']} ${selectMode === 'all' ? styles['active'] : ''}`} onClick={() => setSelectMode('all')}>
            {t('all-channel')}
          </div>
        </div>
        {/* Body */}
        <div className={popup['popup-body']}>
          <div className={styles['event-list']} style={selectMode === 'current' ? {} : { display: 'none' }}>
            <div className={styles['current-channel']}>{currentChannelName}</div>
            {currentChannelEvents.reverse().map((e, index) => {
              // Variables
              const isUser = e.userId === userId;
              const isSuperior = permissionLevel > e.permissionLevel;

              // Handlers
              const getContextMenuItems = () => [
                {
                  id: 'view-profile',
                  label: t('view-profile'),
                  show: true,
                  onClick: () => handleOpenUserInfo(userId, e.userId),
                },
                {
                  id: 'block',
                  label: t('block'),
                  show: !isUser && isSuperior && isServerAdmin(permissionLevel),
                  onClick: () => handleOpenBlockMember(e.userId, serverId),
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
                    <div className={`${permission[e.gender]} ${permission[`lv-${e.permissionLevel}`]}`} />
                    <div className={`${styles['name']} ${e.nickname ? styles['highlight'] : ''}`}>{e.nickname || e.name}</div>
                  </div>
                  {getCurrentActionContent(e)}
                  <div className={styles['time']} title={getFormatDate(e.timestamp, 'all')}>
                    {getFormatDate(e.timestamp, 't')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles['event-list']} style={selectMode === 'all' ? {} : { display: 'none' }}>
            {filteredChannelEvents.reverse().map((e, index) => {
              // Variables
              const isUser = e.userId === userId;
              const isSuperior = permissionLevel > e.permissionLevel;

              // Handlers
              const getContextMenuItems = () => [
                {
                  id: 'view-profile',
                  label: t('view-profile'),
                  show: true,
                  onClick: () => handleOpenUserInfo(userId, e.userId),
                },
                {
                  id: 'block',
                  label: t('block'),
                  show: !isUser && isSuperior && isServerAdmin(permissionLevel),
                  onClick: () => handleOpenBlockMember(e.userId, serverId),
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
                    <div className={`${permission[e.gender]} ${permission[`lv-${e.permissionLevel}`]}`} />
                    <div className={`${styles['name']} ${e.nickname ? styles['highlight'] : ''}`}>{e.nickname || e.name}</div>
                  </div>
                  {getActionContent(e)}
                  <div className={styles['time']} title={getFormatDate(e.timestamp, 'all')}>
                    {getFormatDate(e.timestamp, 't')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Footer */}
        <div className={popup['popup-footer']}>
          <div className={setting['search-box']}>
            <div className={setting['search-icon']}></div>
            <input name="search-query" type="text" className={setting['search-input']} placeholder={t('search-placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
        </div>
      </div>
    );
  },
);

ChannelEventPopup.displayName = 'ChannelEventPopup';

export default ChannelEventPopup;
