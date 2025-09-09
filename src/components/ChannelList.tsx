import React, { useState, useEffect, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import header from '@/styles/header.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Category, Friend, MemberApplication, QueueMember } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueMemberTab from '@/components/QueueMemberTab';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { isMember, isServerAdmin } from '@/utils/permission';

interface ChannelListProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  serverChannels: (Channel | Category)[];
  channel: Channel;
  queueMembers: QueueMember[];
}

const ChannelList: React.FC<ChannelListProps> = React.memo(({ user, friends, server, serverOnlineMembers, serverChannels, channel, queueMembers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // States
  const [viewType, setViewType] = useState<'all' | 'current'>('all');
  const [latency, setLatency] = useState<string>('0');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [memberApplicationsCount, setMemberApplicationsCount] = useState<number>(0);

  // Destructuring
  const { userId, permissionLevel: globalPermissionLevel } = user;
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, receiveApply: serverReceiveApply, permissionLevel: serverPermissionLevel, favorite: isFavorite } = server;
  const { channelId: currentChannelId, name: currentChannelName, voiceMode: currentChannelVoiceMode, isLobby: currentChannelIsLobby } = channel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel), [globalPermissionLevel, serverPermissionLevel]);
  const connectStatus = useMemo(() => 4 - Math.floor(Number(latency) / 50), [latency]);
  const filteredQueueMembers = useMemo(() => queueMembers.filter((member) => member.leftTime > 0), [queueMembers]);
  const filteredServerChannels = useMemo(
    () => serverChannels.filter((ch) => !!ch && !ch.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)),
    [serverChannels],
  );
  const isVerifiedServer = useMemo(() => false, []); // TODO: implement

  // Handlers
  const handleFavoriteServer = (serverId: Server['serverId']) => {
    ipc.socket.send('favoriteServer', { serverId });
  };

  const handleOpenServerSetting = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
  };

  const handleOpenApplyMember = (userId: User['userId'], serverId: Server['serverId']) => {
    if (!serverReceiveApply) handleOpenAlertDialog(t('cannot-apply-member'), () => {});
    else ipc.popup.open('applyMember', 'applyMember', { userId, serverId });
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenCreateChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
  };

  const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  const handleLocateUser = () => {
    findMe.findMe();
  };

  const handleServerMemberApplicationsSet = (...args: MemberApplication[]) => {
    setMemberApplicationsCount(args.length);
  };

  const handleServerMemberApplicationAdd = () => {
    setMemberApplicationsCount((prev) => prev + 1);
  };

  const handleServerMemberApplicationRemove = () => {
    setMemberApplicationsCount((prev) => Math.max(prev - 1, 0));
  };

  // Effects
  useEffect(() => {
    for (const channel of serverChannels) {
      setExpanded((prev) => ({ ...prev, [channel.channelId]: prev[channel.channelId] != undefined ? prev[channel.channelId] : true }));
    }
  }, [serverChannels]);

  useEffect(() => {
    let start = Date.now();
    let end = Date.now();
    ipc.socket.send('ping');
    const measure = setInterval(() => {
      start = Date.now();
      ipc.socket.send('ping');
    }, 10000);
    const clearPong = ipc.socket.on('pong', () => {
      end = Date.now();
      setLatency((end - start).toFixed(0));
    });
    return () => {
      clearInterval(measure);
      clearPong();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = [
      ipc.socket.on('serverMemberApplicationsSet', handleServerMemberApplicationsSet),
      ipc.socket.on('serverMemberApplicationAdd', handleServerMemberApplicationAdd),
      ipc.socket.on('serverMemberApplicationRemove', handleServerMemberApplicationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <>
      {/* Header */}
      <div className={styles['sidebar-header']}>
        <div className={styles['avatar-box']} onClick={() => handleOpenServerSetting(userId, serverId)}>
          <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {isVerifiedServer && <div className={styles['verify-icon']} title={t('official-verified-server')}></div>}
            <div className={styles['name-text']}>{serverName} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{serverDisplayId}</div>
            <div className={styles['member-text']}>{serverOnlineMembers.length}</div>
            <div className={styles['options']}>
              <div
                className={styles['invitation-icon']}
                onClick={() => {
                  // Handle invite friends
                }}
              />
              <div className={styles['saperator-1']} />
              <div
                className={styles['setting-icon']}
                onClick={(e) => {
                  const x = e.currentTarget.getBoundingClientRect().left;
                  const y = e.currentTarget.getBoundingClientRect().bottom;
                  contextMenu.showContextMenu(x, y, 'right-bottom', [
                    {
                      id: 'apply-member',
                      label: t('apply-member'),
                      show: !isMember(permissionLevel),
                      icon: 'applyMember',
                      onClick: () => handleOpenApplyMember(userId, serverId),
                    },
                    {
                      id: 'member-management',
                      label: t('member-management'),
                      show: isServerAdmin(permissionLevel),
                      icon: 'memberManagement',
                      onClick: () => handleOpenServerSetting(userId, serverId),
                    },
                    {
                      id: 'separator',
                      label: '',
                    },
                    {
                      id: 'edit-nickname',
                      label: t('edit-nickname'),
                      icon: 'editGroupcard',
                      show: isMember(permissionLevel),
                      onClick: () => handleOpenEditNickname(userId, serverId),
                    },
                    {
                      id: 'locate-me',
                      label: t('locate-me'),
                      icon: 'locateme',
                      onClick: () => handleLocateUser(),
                    },
                    {
                      id: 'separator',
                      label: '',
                    },
                    {
                      id: 'report',
                      label: t('report'),
                      disabled: true,
                      onClick: () => {
                        /* TODO: handleOpenReport */
                      },
                    },
                    {
                      id: 'favorite',
                      label: isFavorite ? t('unfavorite') : t('favorite'),
                      icon: isFavorite ? 'collect' : 'uncollect',
                      onClick: () => handleFavoriteServer(serverId),
                    },
                  ]);
                }}
              >
                <div className={`${header['overlay']} ${isServerAdmin(permissionLevel) && memberApplicationsCount > 0 ? header['new'] : ''}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Channel */}
      <div className={styles['current-channel-box']}>
        <div className={`${styles['current-channel-icon']} ${styles[`status${connectStatus}`]} has-hover-text`}>
          <div className={'hover-text'}>{`${latency}ms`}</div>
        </div>
        <div className={styles['current-channel-text']}>{currentChannelIsLobby ? t(`${currentChannelName}`) : currentChannelName}</div>
      </div>

      {/* Mic Queue */}
      {currentChannelVoiceMode === 'queue' && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div className={styles['queue-list']}>
            {filteredQueueMembers.map((member) => (
              <QueueMemberTab key={member.userId} user={user} queueMember={member} server={server} channel={channel} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
            ))}
          </div>
          <div className={styles['saperator-2']} />
        </>
      )}

      {/* Channel List Title */}
      <div className={styles['section-title-text']}>{viewType === 'current' ? t('current-channel') : t('all-channel')}</div>

      {/* Channel List */}
      <div
        className={styles['scroll-view']}
        onContextMenu={(e) => {
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'create-channel',
              label: t('create-channel'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(userId, serverId, ''),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenChangeChannelOrder(userId, serverId),
            },
          ]);
        }}
      >
        <div className={styles['channel-list']}>
          {viewType === 'current' ? (
            <ChannelTab
              key={currentChannelId}
              user={user}
              friends={friends}
              server={server}
              serverOnlineMembers={serverOnlineMembers}
              channel={channel}
              expanded={{ [currentChannelId]: true }}
              selectedItemId={selectedItemId}
              setExpanded={() => {}}
              setSelectedItemId={setSelectedItemId}
            />
          ) : (
            filteredServerChannels.map((item) =>
              item.type === 'category' ? (
                <CategoryTab
                  key={item.channelId}
                  user={user}
                  friends={friends}
                  server={server}
                  serverOnlineMembers={serverOnlineMembers}
                  serverChannels={serverChannels}
                  category={item as Category}
                  expanded={expanded}
                  selectedItemId={selectedItemId}
                  setExpanded={setExpanded}
                  setSelectedItemId={setSelectedItemId}
                />
              ) : (
                <ChannelTab
                  key={item.channelId}
                  user={user}
                  friends={friends}
                  server={server}
                  serverOnlineMembers={serverOnlineMembers}
                  channel={item as Channel}
                  expanded={expanded}
                  selectedItemId={selectedItemId}
                  setExpanded={setExpanded}
                  setSelectedItemId={setSelectedItemId}
                />
              ),
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles['sidebar-footer']}>
        <div className={`${styles['navegate-tab']} ${viewType === 'current' ? styles['active'] : ''}`} onClick={() => setViewType('current')}>
          {t('current-channel')}
        </div>
        <div className={`${styles['navegate-tab']} ${viewType === 'all' ? styles['active'] : ''}`} onClick={() => setViewType('all')}>
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ChannelList.displayName = 'ChannelList';

export default ChannelList;
