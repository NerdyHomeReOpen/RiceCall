/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit, Plus, Trash } from 'lucide-react';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import { popupType, type Channel, type Server, type User } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Services
import { ipcService } from '@/services/ipc.service';

interface CategoryTabProps {
  category: Channel;
  canEdit: boolean;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ category, canEdit }) => {
    // Language
    const lang = useLanguage();

    // Socket
    const socket = useSocket();

    // Context Menu
    const contextMenu = useContextMenu();

    // Variables
    const categoryName = category.name;
    const categoryIsRoot = category.isRoot;
    const categoryIsLobby = category.isLobby;
    const categoryVisibility = category.settings.visibility;
    const categoryChannels = category.subChannels || [];

    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Handlers
    const handleOpenEditChannelPopup = () => {
      ipcService.popup.open(popupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(popupType.EDIT_CHANNEL, {
        channel: category,
      });
    };

    const handleOpenCreateChannelPopup = () => {
      ipcService.popup.open(popupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(popupType.CREATE_CHANNEL, {
        serverId: category.serverId,
        parent: category,
      });
    };

    const handleOpenWarningPopup = () => {
      ipcService.popup.open(popupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: lang.tr.warningDeleteChannel,
        submitTo: popupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () =>
        handleDeleteChannel(category.id),
      );
    };

    const handleDeleteChannel = (channelId: string) => {
      socket?.send.deleteChannel({ channelId });
    };

    return (
      <div key={category.id}>
        {/* Category View */}
        <div
          className={`
            ${styles['channelTab']} 
            ${expanded ? styles['expanded'] : ''} 
            ${categoryIsLobby ? styles['lobby'] : styles[categoryVisibility]}`}
          onClick={() =>
            setExpanded(categoryVisibility != 'readonly' ? !expanded : false)
          }
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                icon: <Edit size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.edit,
                show: canEdit,
                onClick: handleOpenEditChannelPopup,
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.add,
                show: canEdit && !categoryIsLobby && categoryIsRoot,
                onClick: handleOpenCreateChannelPopup,
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                show: canEdit && !categoryIsLobby,
                onClick: handleOpenWarningPopup,
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{categoryName}</div>
        </div>

        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['channelList']}>
            {categoryChannels
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel, index) =>
                channel.isCategory ? (
                  <CategoryTab
                    key={channel.id}
                    category={channel}
                    canEdit={canEdit}
                  />
                ) : (
                  <ChannelTab
                    key={channel.id}
                    channel={channel}
                    canEdit={canEdit}
                  />
                ),
              )}
          </div>
        )}
      </div>
    );
  },
);

interface ChannelTabProps {
  channel: Channel;
  canEdit: boolean;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({ channel, canEdit }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const server = useSelector((state: { server: Server }) => state.server);

    // Language
    const lang = useLanguage();

    // Socket
    const socket = useSocket();

    // Context Menu
    const contextMenu = useContextMenu();

    // Variables
    const serverUsers = server.users || [];
    const channelName = channel.name;
    const channelIsRoot = channel.isRoot;
    const channelIsLobby = channel.isLobby;
    const channelVisibility = channel.settings.visibility;
    const channelUsers = serverUsers.filter(
      (u) => u.currentChannelId === channel.id,
    );
    const userInChannel = user.currentChannelId === channel.id;

    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Handlers
    const handleOpenEditChannelPopup = () => {
      ipcService.popup.open(popupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(popupType.EDIT_CHANNEL, {
        channel: channel,
      });
    };

    const handleOpenCreateChannelPopup = () => {
      ipcService.popup.open(popupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(popupType.CREATE_CHANNEL, {
        serverId: channel.serverId,
        parent: channel,
      });
    };

    const handleOpenWarningPopup = () => {
      ipcService.popup.open(popupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: lang.tr.warningDeleteChannel,
        submitTo: popupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () =>
        handleDeleteChannel(channel.id),
      );
    };

    const handleDeleteChannel = (channelId: string) => {
      socket?.send.deleteChannel({ channelId });
    };

    const handleJoinChannel = (channelId: string) => {
      socket?.send.connectChannel({ channelId });
    };

    return (
      <div key={channel.id}>
        {/* Channel View */}
        <div
          className={`
            ${styles['channelTab']} 
            ${expanded ? styles['expanded'] : ''} 
            ${channelIsLobby ? styles['lobby'] : styles[channelVisibility]}  
            ${channelIsRoot ? '' : styles['subChannel']}`}
          onClick={() =>
            setExpanded(channelVisibility != 'readonly' ? !expanded : false)
          }
          onDoubleClick={() => {
            if (userInChannel) return;
            if (channelVisibility === 'readonly') return;
            handleJoinChannel(channel.id);
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                icon: <Edit size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.edit,
                show: canEdit,
                onClick: handleOpenEditChannelPopup,
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.add,
                show: canEdit && !channelIsLobby && channelIsRoot,
                onClick: handleOpenCreateChannelPopup,
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                show: canEdit && !channelIsLobby,
                onClick: () => handleOpenWarningPopup,
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{channelName}</div>
          <div className={styles['channelTabCount']}>
            {`(${channelUsers.length})`}
          </div>
          {userInChannel && !expanded && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>
        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['userList']}>
            {channelUsers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((user: User) => (
                <UserTab key={user.id} channelUser={user} canEdit={canEdit} />
              ))}
          </div>
        )}
      </div>
    );
  },
);

interface UserTabProps {
  channelUser: User;
  canEdit: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ channelUser, canEdit }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const server = useSelector((state: { server: Server }) => state.server);

    // Language
    const lang = useLanguage();

    // Context
    const contextMenu = useContextMenu();

    // Variables
    const serverMembers = server.members || {};
    const channelUserMember = serverMembers[channelUser.id] || {
      id: '',
      isBlocked: false,
      nickname: '',
      permissionLevel: 0,
      userId: '',
      serverId: '',
      createdAt: 0,
    };
    const channelUserPermission = channelUserMember.permissionLevel;
    const channelUserNickname = channelUserMember.nickname;
    const channelUserLevel = channelUser.level;
    const channelUserGrade = Math.min(56, Math.ceil(channelUserLevel / 5)); // 56 is max level
    const channelUserGender = channelUser.gender;
    const channelUserBadges = channelUser.badges || [];
    const isCurrentUser = user.id === channelUser.id;

    // Handlers
    const handleOpenApplyFriendPopup = () => {
      ipcService.popup.open(popupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(popupType.APPLY_FRIEND, {
        user: user,
        targetUser: channelUser,
      });
    };

    return (
      <div key={channelUser.id}>
        {/* User View */}
        <div
          className={`${styles['userTab']}`}
          onDoubleClick={(e) => {
            contextMenu.showUserInfoBlock(
              e.pageX,
              e.pageY,
              channelUser,
              server,
            );
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'kick',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.kick,
                show: canEdit && user.id != channelUser.id,
                onClick: () => {
                  // handleKickUser(user.id);
                },
              },
              {
                id: 'addFriend',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.addFriend,
                show: canEdit && user.id != channelUser.id,
                onClick: () => {
                  handleOpenApplyFriendPopup();
                },
              },
            ]);
          }}
        >
          <div
            className={`${styles['userState']} ${
              false ? styles['unplay'] : ''
            }`}
          />
          <div
            className={`${styles['userIcon']} ${
              permission[channelUserGender]
            } ${permission[`lv-${channelUserPermission}`]}`}
          />
          <div className={styles['userTabName']}>{channelUserNickname}</div>
          <div
            className={`${styles['userGrade']} ${
              grade[`lv-${channelUserGrade}`]
            }`}
          />
          <BadgeViewer badges={channelUserBadges} maxDisplay={3} />
          {isCurrentUser && <div className={styles['myLocationIcon']} />}
        </div>
      </div>
    );
  },
);

interface ChannelViewerProps {
  channels: Channel[];
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ channels }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

  // Language
  const lang = useLanguage();

  // Context
  const contextMenu = useContextMenu();

  // Variables
  const connectStatus = 3;
  const serverMembers = server.members || {};
  const userCurrentChannelId = user.currentChannelId;
  const userCurrentChannel = channels.find(
    (ch) => ch.id === userCurrentChannelId,
  ) || {
    id: '',
    name: lang.tr.unknownChannel,
    isRoot: false,
    isCategory: false,
    isLobby: false,
    voiceMode: 'free',
    chatMode: 'free',
    order: 0,
    serverId: '',
    settings: {
      bitrate: 0,
      slowmode: false,
      userLimit: -1,
      visibility: 'public',
    },
    createdAt: 0,
  };
  const userCurrentChannelName = userCurrentChannel.name;
  const userCurrentChannelVoiceMode = userCurrentChannel.voiceMode;
  const userMember = serverMembers[user.id] || {
    id: '',
    isBlocked: false,
    nickname: '',
    permissionLevel: 0,
    userId: '',
    serverId: '',
    createdAt: 0,
  };
  const userPermission = userMember.permissionLevel;
  const canEdit = userPermission >= 5;

  // Handlers
  const handleOpenCreateChannelPopup = () => {
    ipcService.popup.open(popupType.CREATE_CHANNEL);
    ipcService.initialData.onRequest(popupType.CREATE_CHANNEL, {
      serverId: server.id,
      parent: null,
    });
  };

  return (
    <>
      {/* Current Channel */}
      <div className={styles['currentChannelBox']}>
        <div
          className={`${styles['currentChannelIcon']} ${
            styles[`status${connectStatus}`]
          }`}
        />
        <div className={styles['currentChannelText']}>
          {userCurrentChannelName}
        </div>
      </div>
      {/* Mic Queue */}
      {userCurrentChannelVoiceMode === 'queue' && (
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
        </>
      )}

      {/* Saperator */}
      <div className={styles['saperator-2']} />
      {/* All Channels */}
      <div
        className={styles['sectionTitle']}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'addChannel',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: lang.tr.add,
              show: canEdit,
              onClick: handleOpenCreateChannelPopup,
            },
          ]);
        }}
      >
        {lang.tr.allChannel}
      </div>
      {/* Channel List */}
      <div className={styles['channelList']}>
        {channels
          .filter((c) => c.isRoot)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((channel, index) =>
            channel.isCategory ? (
              <CategoryTab
                key={channel.id}
                category={channel}
                canEdit={canEdit}
              />
            ) : (
              <ChannelTab
                key={channel.id}
                channel={channel}
                canEdit={canEdit}
              />
            ),
          )}
      </div>
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;
