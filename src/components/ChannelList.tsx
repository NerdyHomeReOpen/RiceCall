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
import { useLanguage } from '@/providers/Language';
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
  ({
    currentServer,
    currentChannel,
    serverMembers,
    serverChannels,
    friends,
  }) => {
    // Hooks
    const lang = useLanguage();
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
    const [selectedItemId, setSelectedItemId] = useState<string | null>(
      currentChannel.channelId,
    );
    const [selectedItemType, setSelectedItemType] = useState<string | null>(
      'channel',
    );
    const [memberApplicationsCount, setMemberApplicationsCount] =
      useState<number>(0);

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
    const isVerifyServer = false;
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
      ipcService.initialData.onRequest('alertDialog', {
        title: message,
      });
    };

    const handleOpenServerSetting = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.SERVER_SETTING, 'serverSetting');
      ipcService.initialData.onRequest('serverSetting', {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!serverReceiveApply) {
        handleOpenAlertDialog(lang.tr.cannotApply);
        return;
      }
      ipcService.popup.open(PopupType.APPLY_MEMBER, 'applyMember');
      ipcService.initialData.onRequest('applyMember', {
        userId,
        serverId,
      });
    };

    const handleOpenEditNickname = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
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
          [channel.channelId]:
            prev[channel.channelId] != undefined
              ? prev[channel.channelId]
              : true,
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
        [SocketServerEvent.SERVER_MEMBER_APPLICATIONS_SET]:
          handleServerMemberApplicationsSet,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_ADD]:
          handleServerMemberApplicationAdd,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_REMOVE]:
          handleServerMemberApplicationRemove,
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
        <div className={styles['sidebarHeader']} ref={viewerRef}>
          <div
            className={styles['avatarBox']}
            onClick={() => {
              if (!canOpenSettings) return;
              handleOpenServerSetting(userId, serverId);
            }}
          >
            <div
              className={styles['avatarPicture']}
              style={{ backgroundImage: `url(${serverAvatarUrl})` }}
            />
          </div>
          <div className={styles['baseInfoBox']}>
            <div className={styles['container']}>
              {isVerifyServer ? (
                <div
                  className={styles['verifyIcon']}
                  title={'官方認證語音群' /* TODO: lang.tr */}
                ></div>
              ) : (
                ''
              )}
              <div className={styles['name']}>{serverName} </div>
            </div>
            <div className={styles['container']}>
              <div className={styles['idText']}>{serverDisplayId}</div>
              <div className={styles['memberText']}>{serverMembers.length}</div>
              <div className={styles['optionBox']}>
                <div
                  className={styles['invitation']}
                  onClick={() => {
                    // Handle invite friends
                  }}
                />
                <div className={styles['saperator']} />
                <div
                  ref={settingButtonRef}
                  className={styles['setting']}
                  onClick={() => {
                    if (!settingButtonRef.current) return;
                    const x =
                      settingButtonRef.current.getBoundingClientRect().left;
                    const y =
                      settingButtonRef.current.getBoundingClientRect().top +
                      settingButtonRef.current.getBoundingClientRect().height;
                    contextMenu.showContextMenu(x, y, false, false, [
                      {
                        id: 'invitation',
                        label: lang.tr.invitation,
                        show: canApplyMember,
                        icon: 'memberapply',
                        onClick: () => handleOpenApplyMember(userId, serverId),
                      },
                      {
                        id: 'memberManagement',
                        label: '會員管理',
                        show: canOpenSettings,
                        icon: 'memberManagement',
                        onClick: () =>
                          handleOpenServerSetting(userId, serverId),
                      },
                      {
                        id: 'separator',
                        show: canOpenSettings || canApplyMember,
                        label: '',
                      },
                      {
                        id: 'editNickname',
                        label: lang.tr.editNickname,
                        icon: 'editGroupcard',
                        show: canEditNickname,
                        onClick: () => handleOpenEditNickname(userId, serverId),
                      },
                      {
                        id: 'locateMe',
                        label: lang.tr.locateMe,
                        icon: 'locateme',
                        onClick: () => handleLocateUser(),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'report',
                        label: '舉報', // TODO: lang.tr
                        disabled: true,
                        onClick: () => {
                          /* TODO: handleOpenReport */
                        },
                      },
                      {
                        id: 'favorite',
                        label: isFavorite
                          ? lang.tr.unfavorite
                          : lang.tr.favorite,
                        icon: isFavorite ? 'collect' : 'uncollect',
                        onClick: () => handleFavoriteServer(serverId),
                      },
                    ]);
                  }}
                >
                  <div
                    className={`
                      ${header['overlay']}
                      ${
                        canOpenSettings && memberApplicationsCount > 0
                          ? header['new']
                          : ''
                      }
                    `}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Channel */}
        <div className={styles['currentChannelBox']}>
          <div
            className={`
              ${styles['currentChannelIcon']} 
              ${styles[`status${connectStatus}`]}
            `}
          >
            <div
              className={`${styles['currentChannelPing']}`}
            >{`${latency}ms`}</div>
          </div>
          <div className={styles['currentChannelText']}>
            {currentChannelName}
          </div>
        </div>

        {/* Mic Queue */}
        {currentChannelVoiceMode === 'queue' && (
          <>
            <div className={styles['sectionTitle']}>{lang.tr.micOrder}</div>
            <div className={styles['micQueueBox']}>
              <div className={styles['userList']}>
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
        <div className={styles['sectionTitle']}>
          {view === 'current' ? lang.tr.currentChannel : lang.tr.allChannel}
        </div>

        {/* Channel List */}
        <div className={styles['scrollView']}>
          <div className={styles['channelList']}>
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
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                )
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

        {/* Bottom Navigation */}
        <div className={styles['bottomNav']}>
          <div
            className={`
              ${styles['navItem']} 
              ${styles['navItemLeft']} 
              ${view === 'current' ? styles['active'] : ''}
            `}
            onClick={() => setView('current')}
          >
            {lang.tr.currentChannel}
          </div>
          <div
            className={`
              ${styles['navItem']} 
              ${styles['navItemRight']} 
              ${view === 'all' ? styles['active'] : ''}
            `}
            onClick={() => setView('all')}
          >
            {lang.tr.allChannel}
          </div>
        </div>
      </>
    );
  },
);

ChannelList.displayName = 'ChannelList';

export default ChannelList;
