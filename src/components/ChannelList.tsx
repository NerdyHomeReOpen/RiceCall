import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import header from '@/styles/header.module.css';

// Types
import type { Member, Channel, Server, User, Category, Friend, MemberApplication, QueueMember } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueMemberTab from '@/components/QueueMemberTab';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelListProps {
  currentServer: Server;
  currentChannel: Channel;
  serverMembers: Member[];
  queueMembers: QueueMember[];
  serverChannels: (Channel | Category)[];
  friends: Friend[];
}

const ChannelList: React.FC<ChannelListProps> = React.memo(({ currentServer, currentChannel, serverMembers, serverChannels, friends, queueMembers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const settingButtonRef = useRef<HTMLDivElement>(null);

  // States
  const [viewType, setViewType] = useState<'all' | 'current'>('all');
  const [latency, setLatency] = useState<string>('0');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [memberApplicationsCount, setMemberApplicationsCount] = useState<number>(0);

  // Variables
  const connectStatus = 4 - Math.floor(Number(latency) / 50);
  const {
    userId,
    serverId,
    name: serverName,
    avatarUrl: serverAvatarUrl,
    displayId: serverDisplayId,
    receiveApply: serverReceiveApply,
    permissionLevel: userPermission,
    favorite: isFavorite,
  } = currentServer;
  const { channelId: currentChannelId, name: currentChannelName, voiceMode: currentChannelVoiceMode, isLobby: currentChannelIsLobby } = currentChannel;
  const isVerifiedServer = false;
  const canEditNickname = userPermission > 1;
  const canApplyMember = userPermission < 2;
  const canOpenSettings = userPermission > 4;
  const canManageChannel = userPermission > 4;

  // Handlers
  const handleFavoriteServer = (serverId: Server['serverId']) => {
    ipcService.socket.send('favoriteServer', { serverId });
  };

  const handleOpenServerSetting = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('serverSetting', 'serverSetting', { serverId, userId });
  };

  const handleOpenApplyMember = (userId: User['userId'], serverId: Server['serverId']) => {
    if (!serverReceiveApply) handleOpenAlertDialog(t('cannot-apply-member'), () => {});
    else ipcService.popup.open('applyMember', 'applyMember', { serverId, userId });
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenCreateChannel = (serverId: Server['serverId'], channelId: Category['categoryId'], userId: User['userId']) => {
    ipcService.popup.open('createChannel', 'createChannel', { serverId, channelId, userId });
  };

  const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
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
    ipcService.socket.send('ping');
    const measure = setInterval(() => {
      start = Date.now();
      ipcService.socket.send('ping');
    }, 10000);
    const clearPong = ipcService.socket.on('pong', () => {
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
      ipcService.socket.on('serverMemberApplicationsSet', handleServerMemberApplicationsSet),
      ipcService.socket.on('serverMemberApplicationAdd', handleServerMemberApplicationAdd),
      ipcService.socket.on('serverMemberApplicationRemove', handleServerMemberApplicationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <>
      {/* Header */}
      <div className={styles['sidebar-header']} ref={viewerRef}>
        <div
          className={styles['avatar-box']}
          onClick={() => {
            if (!canOpenSettings) return;
            handleOpenServerSetting(userId, serverId);
          }}
        >
          <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {isVerifiedServer && <div className={styles['verify-icon']} title={t('official-verified-server')}></div>}
            <div className={styles['name-text']}>{serverName} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{serverDisplayId}</div>
            <div className={styles['member-text']}>{serverMembers.length}</div>
            <div className={styles['options']}>
              <div
                className={styles['invitation-icon']}
                onClick={() => {
                  // Handle invite friends
                }}
              />
              <div className={styles['saperator-1']} />
              <div
                ref={settingButtonRef}
                className={styles['setting-icon']}
                onClick={() => {
                  if (!settingButtonRef.current) return;
                  const x = settingButtonRef.current.getBoundingClientRect().left;
                  const y = settingButtonRef.current.getBoundingClientRect().top + settingButtonRef.current.getBoundingClientRect().height;
                  contextMenu.showContextMenu(x, y, false, false, [
                    {
                      id: 'apply-member',
                      label: t('apply-member'),
                      show: canApplyMember,
                      icon: 'applyMember',
                      onClick: () => handleOpenApplyMember(userId, serverId),
                    },
                    {
                      id: 'member-management',
                      label: t('member-management'),
                      show: canOpenSettings,
                      icon: 'memberManagement',
                      onClick: () => handleOpenServerSetting(userId, serverId),
                    },
                    {
                      id: 'separator',
                      show: canOpenSettings || canApplyMember,
                      label: '',
                    },
                    {
                      id: 'edit-nickname',
                      label: t('edit-nickname'),
                      icon: 'editGroupcard',
                      show: canEditNickname,
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
                <div
                  className={`
                      ${header['overlay']}
                      ${canOpenSettings && memberApplicationsCount > 0 ? header['new'] : ''}
                    `}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Channel */}
      <div className={styles['current-channel-box']}>
        <div className={`${styles['current-channel-icon']} ${styles[`status${connectStatus}`]}`}>
          <div className={`${styles['current-channel-ping']}`}>{`${latency}ms`}</div>
        </div>
        <div className={styles['current-channel-text']}>{currentChannelIsLobby ? t(`${currentChannelName}`) : currentChannelName}</div>
      </div>

      {/* Mic Queue */}
      {currentChannelVoiceMode === 'queue' && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div className={styles['mic-queue-list']}>
            <div className={styles['mic-queue-list-users']}>
              {queueMembers.map((member) => (
                <QueueMemberTab
                  key={member.userId}
                  queueMember={member}
                  currentChannel={currentChannel}
                  currentServer={currentServer}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))}
            </div>
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
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'create-channel',
              label: t('create-channel'),
              show: canManageChannel,
              onClick: () => handleOpenCreateChannel(serverId, null, userId),
            },
            {
              id: 'separator',
              label: '',
              show: canManageChannel,
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: canManageChannel,
              onClick: () => handleOpenChangeChannelOrder(userId, serverId),
            },
          ]);
        }}
      >
        <div className={styles['channel-list']}>
          {viewType === 'current' ? (
            <ChannelTab
              key={currentChannelId}
              channel={currentChannel}
              friends={friends}
              currentChannel={currentChannel}
              currentServer={currentServer}
              serverMembers={serverMembers}
              expanded={{ [currentChannelId]: true }}
              selectedItemId={selectedItemId}
              setExpanded={() => {}}
              setSelectedItemId={setSelectedItemId}
            />
          ) : (
            serverChannels
              .filter((ch) => !!ch && !ch.categoryId)
              .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt))
              .map((item) =>
                item.type === 'category' ? (
                  <CategoryTab
                    key={item.channelId}
                    category={item as Category}
                    friends={friends}
                    currentChannel={currentChannel}
                    currentServer={currentServer}
                    serverMembers={serverMembers}
                    serverChannels={serverChannels}
                    expanded={expanded}
                    selectedItemId={selectedItemId}
                    setExpanded={setExpanded}
                    setSelectedItemId={setSelectedItemId}
                  />
                ) : (
                  <ChannelTab
                    key={item.channelId}
                    channel={item as Channel}
                    friends={friends}
                    currentChannel={currentChannel}
                    currentServer={currentServer}
                    serverMembers={serverMembers}
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
