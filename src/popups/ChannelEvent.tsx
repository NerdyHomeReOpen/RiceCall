import React, { useRef, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/channelEvent.module.css';
import permission from '@/styles/permission.module.css';

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

interface ChannelEventPopupProps {
  user: User;
  server: Server;
  channels: Channel[];
  serverMembers: OnlineMember[];
  channelEvents: ChannelEvent[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(({ user, channels, server, serverMembers, channelEvents }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const serverMembersRef = useRef(serverMembers);

  // States
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [channelsMap, setChannelsMap] = useState(() => new Map(channels.map((ch) => [ch.channelId, ch.name])));
  const [serverChannels, setServerChannels] = useState(channels);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>(serverMembers);
  const [serverChannelEvents, setServerChannelEvents] = useState<ChannelEvent[]>(channelEvents);
  const [selectMode, setSelectMode] = useState<'current' | 'all'>('current');

  // Variables
  const { userId, currentChannelId: userCurrentChannelId, permissionLevel: userPermissionLevel } = currentUser;
  const { serverId, permissionLevel: currentServerPermissionLevel } = server;
  const { channelId: currentChannelId, name: currentChannelName, permissionLevel: currentChannelPermissionLevel } = channels.filter((c) => c.channelId === userCurrentChannelId)[0];
  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);

  const currentChannelEvents = serverChannelEvents.filter((e) => e.prevChannelId === currentChannelId || e.nextChannelId === currentChannelId);

  // Effects
  useEffect(() => {
    serverMembersRef.current = onlineMembers;
    console.log(onlineMembers);
  }, [onlineMembers]);

  useEffect(() => {
    setChannelsMap(new Map(serverChannels.map((ch) => [ch.channelId, ch.name])));
  }, [serverChannels]);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<User> }[]) => {
      if (args[0].update.currentServerId === null) handleClose();
      setCurrentUser((prev) => ({ ...prev, ...args[0].update }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: OnlineMember }[]) => {
      setServerChannelEvents((prev) => [
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
      setOnlineMembers((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => {
      args.map((m) => {
        const originMember = serverMembersRef.current.find((om) => om.userId === m.userId);
        if (originMember) {
          const originChannelId = originMember.currentChannelId;
          const newMember = { ...originMember, ...m.update };
          setServerChannelEvents((prev) => [
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
      setOnlineMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
      args.map((m) => {
        const originMember = serverMembersRef.current.find((om) => om.userId === m.userId);
        if (originMember) {
          setServerChannelEvents((prev) => [
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
      setOnlineMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Channel }[]) => {
      setChannelsMap((prev) => {
        const next = new Map(prev);
        args.map((c) => next.set(c.data.channelId, c.data.name));
        return next;
      });
      const add = new Set(args.map((i) => `${i.data.channelId}`));
      setServerChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Channel> }[]) => {
      setChannelsMap((prev) => {
        const next = new Map(prev);
        args.map((c) => (c.update.name ? next.set(c.channelId, c.update.name) : null));
        return next;
      });
      const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
      setServerChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
      setChannelsMap((prev) => {
        const next = new Map(prev);
        args.map((c) => next.delete(c.channelId));
        return next;
      });
      const remove = new Set(args.map((i) => `${i.channelId}`));
      setServerChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
    });
    return () => unsub();
  }, []);

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  const getActionContent = (e: ChannelEvent) => {
    if (e.type === 'join') {
      return <span className={styles['green']}>{t('join-current-server')}</span>;
    } else if (e.type === 'leave') {
      return <span className={styles['red']}>{t('leave-current-server')}</span>;
    } else {
      const prevChannelName = e.prevChannelId ? channelsMap.get(e.prevChannelId) : '';
      const nextChannelName = e.nextChannelId ? channelsMap.get(e.nextChannelId) : '';
      return <span className={styles['green']}>{t('move-to-new-channel', { 0: prevChannelName, 1: nextChannelName })}</span>;
    }
  };

  const getCurrentActionContent = (e: ChannelEvent) => {
    if (e.type === 'join' || (e.type === 'move' && e.nextChannelId === currentChannelId)) {
      return <span className={styles['green']}>{t('join-current-channel')}</span>;
    } else if (e.type === 'leave' || (e.type === 'move' && e.prevChannelId === currentChannelId)) {
      return <span className={styles['red']}>{t('leave-current-channel')}</span>;
    }
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['options-viewer']}>
        <div className={`${styles['option-tab']} ${selectMode === 'current' ? styles['active'] : ''}`} onClick={() => setSelectMode('current')}>
          {t('current-channel')}
        </div>
        <div className={`${styles['option-tab']} ${selectMode === 'all' ? styles['active'] : ''}`} onClick={() => setSelectMode('all')}>
          {t('all-channel')}
        </div>
      </div>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={styles['event-list']} style={selectMode === 'current' ? {} : { display: 'none' }}>
          <div className={styles['current-channel']}>{currentChannelName}</div>
          {[...currentChannelEvents].reverse().map((e, index) => {
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
                show: isServerAdmin(permissionLevel),
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
                <div className={styles['action-content']}>{getCurrentActionContent(e)}</div>
                <div className={styles['time']} title={getFormatDate(e.timestamp, 'all')}>
                  {getFormatDate(e.timestamp, 't')}
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles['event-list']} style={selectMode === 'all' ? {} : { display: 'none' }}>
          {[...serverChannelEvents].reverse().map((e, index) => {
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
                show: isServerAdmin(permissionLevel),
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
                <div className={styles['action-content']}>{getActionContent(e)}</div>
                <div className={styles['time']} title={getFormatDate(e.timestamp, 'all')}>
                  {getFormatDate(e.timestamp, 't')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Footer */}
      <div className={popup['popup-footer']}></div>
    </div>
  );
});

ChannelEventPopup.displayName = 'ChannelEventPopup';

export default ChannelEventPopup;
