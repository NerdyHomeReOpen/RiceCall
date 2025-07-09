import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import header from '@/styles/header.module.css';

// Types
import {
  PopupType,
  ServerMember,
  Channel,
  Server,
  User,
  Category,
  UserFriend,
  UserServer,
  SocketServerEvent,
} from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelListProps {
  currentServer: UserServer;
  currentChannel: Channel;
  serverMembers: ServerMember[];
  serverChannels: (Channel | Category)[];
  friends: UserFriend[];
}

const ChannelList: React.FC<ChannelListProps> = React.memo(
  ({ currentServer, currentChannel, serverMembers, serverChannels, friends }) => {
    // Hooks
    const { t } = useTranslation();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Refs
    const viewerRef = useRef<HTMLDivElement>(null);
    const settingButtonRef = useRef<HTMLDivElement>(null);

    // States
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<'all' | 'current'>('all');
    const [latency, setLatency] = useState<string>('0');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(currentChannel.channelId);
    const [selectedItemType, setSelectedItemType] = useState<string | null>('channel');
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
    const {
      channelId: currentChannelId,
      name: currentChannelName,
      voiceMode: currentChannelVoiceMode,
    } = currentChannel;
    const isVerifiedServer = false;
    const canEditNickname = userPermission > 1;
    const canApplyMember = userPermission < 2;
    const canOpenSettings = userPermission > 4;

    // Handlers
    const handleFavoriteServer = (serverId: Server['serverId']) => {
      if (!socket) return;
      socket.send.favoriteServer({
        serverId,
      });
    };

    const handleOpenAlertDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
      ipcService.initialData.onRequest('alertDialog', { message: message });
    };

    const handleOpenServerSetting = (userId: User['userId'], serverId: Server['serverId']) => {
      ipcService.popup.open(PopupType.SERVER_SETTING, 'serverSetting');
      ipcService.initialData.onRequest('serverSetting', {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (userId: User['userId'], serverId: Server['serverId']) => {
      if (!serverReceiveApply) {
        handleOpenAlertDialog(t('cannot-apply'));
        return;
      }
      ipcService.popup.open(PopupType.APPLY_MEMBER, 'applyMember');
      ipcService.initialData.onRequest('applyMember', {
        userId,
        serverId,
      });
    };

    const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME, 'editNickname');
      ipcService.initialData.onRequest('editNickname', {
        serverId,
        userId,
      });
    };

    const handleLocateUser = () => {
      if (!findMe) return;
      findMe.findMe();
    };

    const handleServerMemberApplicationsSet = (data: { count: number }) => {
      setMemberApplicationsCount(data.count);
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
        setExpanded((prev) => ({
          ...prev,
          [channel.channelId]: prev[channel.channelId] != undefined ? prev[channel.channelId] : true,
        }));
      }
    }, [serverChannels]);

    useEffect(() => {
      if (!socket) return;
      let start = Date.now();
      let end = Date.now();
      socket.send.ping('ping');
      const measure = setInterval(() => {
        start = Date.now();
        socket.send.ping('ping');
      }, 10000);
      const clearPong = socket.on.pong(() => {
        end = Date.now();
        setLatency((end - start).toFixed(0));
      });
      return () => {
        clearInterval(measure);
        clearPong();
      };
    }, [socket]);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.SERVER_MEMBER_APPLICATIONS_SET]: handleServerMemberApplicationsSet,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_ADD]: handleServerMemberApplicationAdd,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_REMOVE]: handleServerMemberApplicationRemove,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

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
                    const y =
                      settingButtonRef.current.getBoundingClientRect().top +
                      settingButtonRef.current.getBoundingClientRect().height;
                    contextMenu.showContextMenu(x, y, false, false, [
                      {
                        id: 'invitation',
                        label: t('invitation'),
                        show: canApplyMember,
                        icon: 'memberapply',
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
                        label: t('edit-member-card'),
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
          <div className={styles['current-channel-text']}>{currentChannelName}</div>
        </div>

        {/* Mic Queue */}
        {currentChannelVoiceMode === 'queue' && (
          <>
            <div className={styles['section-title-text']}>{t('mic-order')}</div>
            <div className={styles['mic-queue-list']}>
              <div className={styles['user-list']}>
                {/* {micQueueUsers.map((user) => (
                    <UserTab
                      key={user.id}
                      user={user}
                      server={server}
                      mainUser={user}
                    />
                  ))} */}
              </div>
            </div>
            <div className={styles['saperator-2']} />
          </>
        )}

        {/* Channel List Title */}
        <div className={styles['section-title-text']}>
          {view === 'current' ? t('current-channel') : t('all-channel')}
        </div>

        {/* Channel List */}
        <div className={styles['scroll-view']}>
          <div className={styles['channel-list']}>
            {view === 'current' ? (
              <ChannelTab
                key={currentChannelId}
                channel={currentChannel}
                friends={friends}
                currentChannel={currentChannel}
                currentServer={currentServer}
                serverMembers={serverMembers}
                expanded={{ [currentChannelId]: true }}
                selectedItemId={selectedItemId}
                selectedItemType={selectedItemType}
                setExpanded={() => {}}
                setSelectedItemId={setSelectedItemId}
                setSelectedItemType={setSelectedItemType}
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
                      selectedItemType={selectedItemType}
                      setExpanded={setExpanded}
                      setSelectedItemId={setSelectedItemId}
                      setSelectedItemType={setSelectedItemType}
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
                      selectedItemType={selectedItemType}
                      setExpanded={setExpanded}
                      setSelectedItemId={setSelectedItemId}
                      setSelectedItemType={setSelectedItemType}
                    />
                  ),
                )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles['sidebar-footer']}>
          <div
            className={`${styles['navegate-tab']} ${view === 'current' ? styles['active'] : ''}`}
            onClick={() => setView('current')}
          >
            {t('current-channel')}
          </div>
          <div
            className={`${styles['navegate-tab']} ${view === 'all' ? styles['active'] : ''}`}
            onClick={() => setView('all')}
          >
            {t('all-channel')}
          </div>
        </div>
      </>
    );
  },
);

ChannelList.displayName = 'ChannelList';

export default ChannelList;
