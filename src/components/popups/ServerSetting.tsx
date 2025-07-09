import React, { ChangeEvent, useEffect, useRef, useState, useCallback } from 'react';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';
import permission from '@/styles/permission.module.css';
import markdown from '@/styles/markdown.module.css';

// Types
import { MemberApplication, Server, PopupType, ServerMember, Member, User, SocketServerEvent } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';
import Sorter from '@/utils/sorter';
import { getPermissionText } from '@/utils/language';

interface ServerSettingPopupProps {
  serverId: Server['serverId'];
  userId: User['userId'];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(({ serverId, userId }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();
  const contextMenu = useContextMenu();

  // Constants
  const MEMBER_FIELDS = [
    { name: t('name'), field: 'name' },
    { name: t('permission'), field: 'permissionLevel' },
    { name: t('contribution'), field: 'contribution' },
    { name: t('join-date'), field: 'createdAt' },
  ];

  const APPLICATION_FIELDS = [
    { name: t('name'), field: 'name' },
    { name: t('description'), field: 'description' },
    { name: t('create-at'), field: 'createdAt' },
  ];
  const BLOCK_MEMBER_FIELDS = [
    { name: t('name'), field: 'name' },
    { name: t('unblock-date'), field: 'isBlocked' },
  ];

  // Refs
  const refreshRef = useRef(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // States
  const [server, setServer] = useState<Server>(Default.server());
  const [member, setMember] = useState<Member>(Default.member());
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [serverApplications, setServerApplications] = useState<MemberApplication[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
  // const [sortField, setSortField] = useState<string>('permissionLevel'); temp: not used
  const [searchText, setSearchText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedRowType, setSelectedRowType] = useState<string | null>(null);
  const [reloadAvatarKey, setReloadAvatarKey] = useState(0);

  // Variables
  const {
    name: serverName,
    avatar: serverAvatar,
    avatarUrl: serverAvatarUrl,
    announcement: serverAnnouncement,
    description: serverDescription,
    type: serverType,
    displayId: serverDisplayId,
    slogan: serverSlogan,
    level: serverLevel,
    wealth: serverWealth,
    createdAt: serverCreatedAt,
    visibility: serverVisibility,
  } = server;
  const { permissionLevel: userPermission } = member;
  const canSubmit = serverName.trim();
  const filteredMembers = serverMembers.filter((member) => {
    const searchLower = searchText.toLowerCase();
    return (
      member.permissionLevel > 1 &&
      (member.nickname?.toLowerCase().includes(searchLower) || member.name.toLowerCase().includes(searchLower))
    );
  });
  const filteredBlockMembers = serverMembers.filter((member) => {
    const searchLower = searchText.toLowerCase();
    return (
      (member.isBlocked === -1 || member.isBlocked > Date.now()) &&
      (member.nickname?.toLowerCase().includes(searchLower) || member.name.toLowerCase().includes(searchLower))
    );
  });
  const filteredApplications = serverApplications.filter((application) => {
    const searchLower = searchText.toLowerCase();
    return (
      application.name.toLowerCase().includes(searchLower) ||
      application.description.toLowerCase().includes(searchLower)
    );
  });

  // Handlers
  const handleServerMemberAdd = (member: ServerMember): void => {
    setServerMembers((prev) => [...prev, member]);
  };

  const handleServerMemberUpdate = (
    userId: ServerMember['userId'],
    serverId: ServerMember['serverId'],
    member: Partial<ServerMember>,
  ): void => {
    setServerMembers((prev) =>
      prev.map((item) => (item.userId === userId && item.serverId === serverId ? { ...item, ...member } : item)),
    );
  };

  const handleServerMemberRemove = (userId: ServerMember['userId'], serverId: ServerMember['serverId']): void => {
    setServerMembers((prev) => prev.filter((item) => !(item.userId === userId && item.serverId === serverId)));
  };

  const handleServerMemberApplicationAdd = (application: MemberApplication) => {
    setServerApplications((prev) => [...prev, application]);
  };

  const handleServerMemberApplicationUpdate = (
    userId: User['userId'],
    serverId: Server['serverId'],
    application: Partial<MemberApplication>,
  ) => {
    setServerApplications((prev) =>
      prev.map((item) => (item.serverId === serverId && item.userId === userId ? { ...item, ...application } : item)),
    );
  };

  const handleServerMemberApplicationRemove = (userId: User['userId'], serverId: Server['serverId']) => {
    setServerApplications((prev) => prev.filter((item) => !(item.userId === userId && item.serverId === serverId)));
  };

  const handleMemberApproval = (userId: User['userId'], serverId: Server['serverId']) => {
    setServerApplications((prev) => prev.filter((item) => !(item.userId === userId && item.serverId === serverId)));
  };

  const handleApproveMemberApplication = (
    userId: User['userId'],
    serverId: Server['serverId'],
    member?: Partial<Member>,
  ) => {
    if (!socket) return;
    socket.send.approveMemberApplication({ userId, serverId, member });
  };

  const handleDeleteMemberApplication = (userId: User['userId'], serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.deleteMemberApplication({ userId, serverId });
  };

  const handleSort = <T extends ServerMember | MemberApplication>(field: keyof T, array: T[], direction: 1 | -1) => {
    const newDirection = direction === 1 ? -1 : 1;
    // setSortField(String(field)); temp: not used
    setSortDirection(newDirection);
    return [...array].sort(Sorter(field, newDirection));
  };

  const handleEditServer = (server: Partial<Server>, serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.editServer({ server, serverId });
  };

  const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.editMember({ member, userId, serverId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', {
      message: message,
      submitTo: 'alertDialog',
    });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  const handleRemoveMembership = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-remove-membership').replace('{0}', userName), () => {
      handleEditMember({ permissionLevel: 1 }, userId, serverId);
    });
  };

  const handleRemoveBlockMember = (userId: User['userId'], userName: User['name'], serverId: Server['serverId']) => {
    if (!socket) return;
    handleOpenAlertDialog(t('confirm-unblock-user').replace('{0}', userName), () => {
      handleEditMember({ isBlocked: 0 }, userId, serverId);
    });
  };

  const handleOpenMemberApplySetting = () => {
    ipcService.popup.open(PopupType.MEMBER_APPLY_SETTING, 'memberApplySetting');
    ipcService.initialData.onRequest('memberApplySetting', {
      serverId,
    });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
    ipcService.initialData.onRequest('applyFriend', {
      userId,
      targetId,
    });
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open(PopupType.EDIT_NICKNAME, 'editNickname');
    ipcService.initialData.onRequest('editNickname', {
      serverId,
      userId,
    });
  };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    ipcService.popup.open(PopupType.BLOCK_MEMBER, `blockMember-${userId}`);
    ipcService.initialData.onRequest(`blockMember-${userId}`, {
      userId,
      serverId,
      userName,
    });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, {
      userId,
      targetId,
      targetName,
    });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, {
      userId,
      targetId,
    });
  };

  const handleOpenErrorDialog = (message: string) => {
    ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
    ipcService.initialData.onRequest('errorDialog', {
      message: message,
      submitTo: 'errorDialog',
    });
  };

  const handleMemberSort = (field: keyof ServerMember) => {
    const sortedMembers = handleSort(field, serverMembers, sortDirection);
    setServerMembers(sortedMembers);
  };

  const handleApplicationSort = (field: keyof MemberApplication) => {
    const sortedApplications = handleSort(field, serverApplications, sortDirection);
    setServerApplications(sortedApplications);
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const setSelectedRowIdAndType = useCallback(
    (id: string | null, type: string | null) => {
      setSelectedRowId(id);
      setSelectedRowType(type);
    },
    [setSelectedRowId, setSelectedRowType],
  );

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.SERVER_MEMBER_ADD]: handleServerMemberAdd,
      [SocketServerEvent.SERVER_MEMBER_UPDATE]: handleServerMemberUpdate,
      [SocketServerEvent.SERVER_MEMBER_REMOVE]: handleServerMemberRemove,
      [SocketServerEvent.SERVER_MEMBER_APPLICATION_ADD]: handleServerMemberApplicationAdd,
      [SocketServerEvent.SERVER_MEMBER_APPLICATION_UPDATE]: handleServerMemberApplicationUpdate,
      [SocketServerEvent.SERVER_MEMBER_APPLICATION_REMOVE]: handleServerMemberApplicationRemove,
      [SocketServerEvent.MEMBER_APPROVAL]: handleMemberApproval,
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

  useEffect(() => {
    if (!serverId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.server({
          serverId: serverId,
        }),
        getService.member({
          serverId: serverId,
          userId: userId,
        }),
        getService.serverMembers({
          serverId: serverId,
        }),
        getService.serverMemberApplications({
          serverId: serverId,
        }),
      ]).then(([server, member, members, applications]) => {
        if (server) {
          setServer(server);
        }
        if (member) {
          setMember(member);
        }
        if (members) {
          const sortedMembers = handleSort('permissionLevel', members, 1);
          setServerMembers(sortedMembers);
        }
        if (applications) {
          const sortedApplications = handleSort('createdAt', applications, 1);
          setServerApplications(sortedApplications);
        }
      });
    };
    refresh();
  }, [serverId, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.button === 2) {
        const targetElement = event.target as HTMLElement;
        const trElement = targetElement.closest('tr');
        if (trElement?.classList.contains(popup['selected'])) {
          return;
        }
      }
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedRowIdAndType(null, null);
      } else if (event.target instanceof HTMLElement) {
        const targetElement = event.target as HTMLElement;
        const isTableRow = targetElement.closest('tr');
        const isTableContainer =
          targetElement.closest('table') || targetElement.closest(`.${setting['tableContainer']}`);

        if (isTableContainer && !isTableRow) {
          setSelectedRowIdAndType(null, null);
        } else if (!isTableContainer) {
          setSelectedRowIdAndType(null, null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setSelectedRowIdAndType]);

  return (
    <div className={popup['popupContainer']} ref={popupRef}>
      {/* Body */}
      <div className={popup['popupBody']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[
              t('server-info'),
              t('server-announcement'),
              t('member-management'),
              t('access-permission'),
              `${t('member-application-management')} (${filteredApplications.length})`,
              `${t('blacklist-management')} (${filteredBlockMembers.length})`,
            ].map((title, index) => (
              <div
                className={`${setting['item']} ${activeTabIndex === index ? setting['active'] : ''}`}
                onClick={() => setActiveTabIndex(index)}
                key={index}
              >
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* Basic Info*/}
        <div className={setting['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['row']}>
              <div className={popup['col']}>
                <div className={popup['row']}>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('name')}</div>
                    <input
                      name="name"
                      type="text"
                      value={serverName}
                      maxLength={32}
                      onChange={(e) => {
                        setServer((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                      }}
                    />
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('id')}</div>
                    <input name="displayId" type="text" value={serverDisplayId} readOnly />
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('slogan')}</div>
                  <input
                    name="slogan"
                    type="text"
                    value={serverSlogan}
                    maxLength={100}
                    onChange={(e) => {
                      setServer((prev) => ({
                        ...prev,
                        slogan: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('type')}</div>
                  <div className={popup['selectBox']}>
                    <select
                      name="type"
                      value={serverType}
                      onChange={(e) => {
                        setServer((prev) => ({
                          ...prev,
                          type: e.target.value as Server['type'],
                        }));
                      }}
                    >
                      <option value="other">{t('other')}</option>
                      <option value="game">{t('game')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={setting['avatarWrapper']}>
                <div
                  key={reloadAvatarKey}
                  className={setting['avatarPicture']}
                  style={{
                    backgroundImage: `url(${serverAvatarUrl}?v=${reloadAvatarKey})`,
                  }}
                />
                <input
                  name="avatar"
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      handleOpenErrorDialog(t('can-not-read-image'));
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      handleOpenErrorDialog(t('image-too-large'));
                      return;
                    }

                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const formData = new FormData();
                      formData.append('_type', 'server');
                      formData.append('_fileName', serverAvatar);
                      formData.append('_file', reader.result as string);
                      const data = await apiService.post('/upload', formData);
                      if (data) {
                        setServer((prev) => ({
                          ...prev,
                          avatar: data.avatar,
                          avatarUrl: data.avatarUrl,
                        }));
                        setReloadAvatarKey((prev) => prev + 1);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <label htmlFor="avatar-upload" className={popup['button']} style={{ marginTop: '10px' }}>
                  {t('change-avatar')}
                </label>
              </div>
            </div>
            <div className={popup['col']}>
              <div className={popup['row']}>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('level')}</div>
                  <input name="level" type="text" value={serverLevel} readOnly />
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('create-at')}</div>
                  <input name="createdAt" type="text" value={new Date(serverCreatedAt).toLocaleString()} readOnly />
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={`${popup['label']} ${setting['wealthCoinIcon']}`}>{t('wealth')}</div>
                  <input name="wealth" type="text" value={serverWealth} readOnly />
                </div>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('group-link')}</div>
                <input name="link" type="text" value={`https://ricecall.com.tw/join?sid=${serverDisplayId}`} readOnly />
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('description')}</div>
                <textarea
                  name="description"
                  value={serverDescription}
                  onChange={(e) =>
                    setServer((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}>
              <div className={popup['label']}>{t('input-announcement')}</div>
              <div
                className={popup['button']}
                onClick={async () => {
                  if (showPreview) {
                    setShowPreview(false);
                  } else {
                    setShowPreview(true);
                  }
                }}
              >
                {showPreview ? t('edit') : t('preview')}
              </div>
            </div>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              {showPreview ? (
                <div className={markdown['settingMarkdownContainer']} style={{ minHeight: '330px' }}>
                  <MarkdownViewer markdownText={serverAnnouncement} />
                </div>
              ) : (
                <textarea
                  name="announcement"
                  style={{ minHeight: '330px' }}
                  value={serverAnnouncement}
                  maxLength={1000}
                  onChange={(e) =>
                    setServer((prev) => ({
                      ...prev,
                      announcement: e.target.value,
                    }))
                  }
                />
              )}
              <div className={setting['noteText']}>{t('markdown-support')}</div>
            </div>
          </div>
        </div>

        {/* Member Management */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}>
              <div className={popup['label']}>
                {t('member')} ({filteredMembers.length})
              </div>
              <div className={setting['searchBorder']}>
                <div className={setting['searchIcon']}></div>
                <input
                  name="query"
                  type="search"
                  className={setting['searchInput']}
                  placeholder={t('search-member-placeholder')}
                  value={searchText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_FIELDS.map((field) => (
                      <th key={field.field} onClick={() => handleMemberSort(field.field as keyof ServerMember)}>
                        {field.name}
                        {/* {sortField === field.field &&
                              (sortState === 1 ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))} */}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['tableContainer']}>
                  {filteredMembers.map((member) => {
                    const {
                      userId: memberUserId,
                      name: memberName,
                      nickname: memberNickname,
                      gender: memberGender,
                      permissionLevel: memberPermission,
                      contribution: memberContribution,
                      createdAt: memberJoinDate,
                    } = member;
                    const isCurrentUser = memberUserId === userId;
                    const canManageMember = !isCurrentUser && userPermission > 4 && userPermission > memberPermission;
                    const canEditNickname = canManageMember || (isCurrentUser && userPermission > 1);
                    const canChangeToGuest = canManageMember && memberPermission !== 1 && userPermission > 4;
                    const canChangeToMember =
                      canManageMember && memberPermission !== 2 && (memberPermission > 1 || userPermission > 5);
                    const canChangeToChannelAdmin =
                      canManageMember && memberPermission !== 3 && memberPermission > 1 && userPermission > 3;
                    const canChangeToCategoryAdmin =
                      canManageMember && memberPermission !== 4 && memberPermission > 1 && userPermission > 4;
                    const canChangeToAdmin =
                      canManageMember && memberPermission !== 5 && memberPermission > 1 && userPermission > 5;

                    return (
                      <tr
                        key={memberUserId}
                        className={`${
                          selectedRowId === memberUserId && selectedRowType === 'member' ? popup['selected'] : ''
                        }`}
                        onClick={() => setSelectedRowIdAndType(memberUserId, 'member')}
                        onContextMenu={(e) => {
                          const isCurrentUser = memberUserId === userId;
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, false, false, [
                            {
                              id: 'direct-message',
                              label: t('direct-message'),
                              show: !isCurrentUser,
                              onClick: () => handleOpenDirectMessage(userId, memberUserId, memberName),
                            },
                            {
                              id: 'view-profile',
                              label: t('view-profile'),
                              show: !isCurrentUser,
                              onClick: () => handleOpenUserInfo(userId, memberUserId),
                            },
                            {
                              id: 'add-friend',
                              label: t('add-friend'),
                              show: !isCurrentUser,
                              onClick: () => handleOpenApplyFriend(userId, memberUserId),
                            },
                            {
                              id: 'edit-nickname',
                              label: t('edit-nickname'),
                              show: canEditNickname,
                              onClick: () => handleOpenEditNickname(memberUserId, serverId),
                            },
                            {
                              id: 'separator',
                              label: '',
                              show: canManageMember,
                            },
                            {
                              id: 'block',
                              label: t('block'),
                              show: canManageMember,
                              onClick: () => {
                                handleOpenBlockMember(memberUserId, serverId, memberNickname || memberName);
                              },
                            },
                            {
                              id: 'member-management',
                              label: t('member-management'),
                              show: canManageMember,
                              icon: 'submenu',
                              hasSubmenu: true,
                              submenuItems: [
                                {
                                  id: 'set-guest',
                                  label: t('set-guest'),
                                  show: canChangeToGuest,
                                  onClick: () =>
                                    handleRemoveMembership(memberUserId, serverId, memberNickname || memberName),
                                },
                                {
                                  id: 'set-member',
                                  label: t('set-member'),
                                  show: canChangeToMember,
                                  onClick: () => handleEditMember({ permissionLevel: 2 }, memberUserId, serverId),
                                },
                                {
                                  id: 'set-channel-mod',
                                  label: t('set-channel-mod'),
                                  show: canChangeToChannelAdmin,
                                  onClick: () => handleEditMember({ permissionLevel: 3 }, memberUserId, serverId),
                                },
                                {
                                  id: 'set-channel-admin',
                                  label: t('set-channel-admin'),
                                  show: canChangeToCategoryAdmin,
                                  onClick: () => handleEditMember({ permissionLevel: 4 }, memberUserId, serverId),
                                },
                                {
                                  id: 'set-server-admin',
                                  label: t('set-server-admin'),
                                  show: canChangeToAdmin,
                                  onClick: () => handleEditMember({ permissionLevel: 5 }, memberUserId, serverId),
                                },
                              ],
                            },
                          ]);
                        }}
                      >
                        <td>
                          <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
                          <div
                            className={`${popup['p1']} ${memberNickname && memberName ? setting['memberName'] : ''}`}
                          >
                            {memberNickname || memberName}
                          </div>
                        </td>
                        <td>{getPermissionText(t, memberPermission)}</td>
                        <td>{memberContribution}</td>
                        <td>{new Date(memberJoinDate).toISOString().slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['noteText']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>

        {/* Access Permission */}
        <div className={setting['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['label']} ${popup['header']}`}>{t('access-permission')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="visibility"
                  type="radio"
                  value="public"
                  checked={serverVisibility === 'public'}
                  onChange={(e) => {
                    if (e.target.checked)
                      setServer((prev) => ({
                        ...prev,
                        visibility: 'public',
                      }));
                  }}
                />
                <div className={popup['label']}>{t('public-server')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="visibility"
                  type="radio"
                  value="private"
                  checked={serverVisibility === 'private'}
                  onChange={(e) => {
                    if (e.target.checked)
                      setServer((prev) => ({
                        ...prev,
                        visibility: 'private',
                      }));
                  }}
                />
                <div className={popup['label']}>{t('semi-public-server')}</div>
                <div className={popup['hint']}>{t('semi-public-server-description')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="visibility"
                  type="radio"
                  value="invisible"
                  checked={serverVisibility === 'invisible'}
                  onChange={(e) => {
                    if (e.target.checked)
                      setServer((prev) => ({
                        ...prev,
                        visibility: 'invisible',
                      }));
                  }}
                />
                <div className={popup['label']}>{t('private-server')}</div>
                <div className={popup['hint']}>{t('private-server-description')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Member Application Management */}
        <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('applicants')} (${filteredApplications.length})`}</div>
              <div className={popup['row']}>
                <div className={popup['button']} onClick={() => handleOpenMemberApplySetting()}>
                  {t('apply-setting')}
                </div>
                <div className={setting['searchBorder']}>
                  <div className={setting['searchIcon']}></div>
                  <input
                    name="query"
                    type="search"
                    className={setting['searchInput']}
                    placeholder={t('search-member-placeholder')}
                    value={searchText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {APPLICATION_FIELDS.map((field) => (
                      <th
                        key={field.field}
                        onClick={() => handleApplicationSort(field.field as keyof MemberApplication)}
                      >
                        {field.name}
                        {/* {sortField === field.field &&
                            (sortState === 1 ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))} */}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['tableContainer']}>
                  {filteredApplications.map((application) => {
                    const {
                      userId: applicationUserId,
                      name: applicationName,
                      description: applicationDescription,
                      createdAt: applicationCreatedAt,
                    } = application;
                    const isCurrentUser = applicationUserId === userId;
                    const canAccept = !isCurrentUser && userPermission > 4;
                    const canDeny = !isCurrentUser && userPermission > 4;
                    return (
                      <tr
                        key={applicationUserId}
                        className={`${
                          selectedRowId === applicationUserId && selectedRowType === 'application'
                            ? popup['selected']
                            : ''
                        }`}
                        onClick={() => setSelectedRowIdAndType(applicationUserId, 'application')}
                        onContextMenu={(e) => {
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, false, false, [
                            {
                              id: 'view-profile',
                              label: t('view-profile'),
                              show: !isCurrentUser,
                              onClick: () => handleOpenUserInfo(userId, applicationUserId),
                            },
                            {
                              id: 'accept-application',
                              label: t('accept-application'),
                              show: canAccept,
                              onClick: () => {
                                handleApproveMemberApplication(applicationUserId, serverId, { permissionLevel: 2 });
                              },
                            },
                            {
                              id: 'deny-application',
                              label: t('deny-application'),
                              show: canDeny,
                              onClick: () => {
                                handleDeleteMemberApplication(applicationUserId, serverId);
                              },
                            },
                          ]);
                        }}
                      >
                        <td>
                          <div className={popup['p1']}>{applicationName}</div>
                        </td>
                        <td>{applicationDescription}</td>
                        <td>{new Date(applicationCreatedAt).toISOString().slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['noteText']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>

        {/* Blacklist Management */}
        <div className={setting['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('blacklist')} (${filteredBlockMembers.length})`}</div>
              <div className={setting['searchBorder']}>
                <div className={setting['searchIcon']}></div>
                <input
                  name="query"
                  type="search"
                  className={setting['searchInput']}
                  placeholder={t('search-member-placeholder')}
                  value={searchText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {BLOCK_MEMBER_FIELDS.map((field) => (
                      <th key={field.field} onClick={() => handleMemberSort(field.field as keyof ServerMember)}>
                        {field.name}
                        {/* {sortField === field.field &&
                            (sortState === 1 ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            ))} */}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['tableContainer']}>
                  {filteredBlockMembers.map((member) => {
                    const {
                      userId: memberUserId,
                      nickname: memberNickname,
                      name: memberName,
                      isBlocked: memberIsBlocked,
                    } = member;
                    return (
                      <tr
                        key={memberUserId}
                        className={`${
                          selectedRowId === memberUserId && selectedRowType === 'blockedMember' ? popup['selected'] : ''
                        }`}
                        onClick={() => setSelectedRowIdAndType(memberUserId, 'blockedMember')}
                        onContextMenu={(e) => {
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, false, false, [
                            {
                              id: 'unblock',
                              label: t('unblock'),
                              show: true,
                              onClick: () => {
                                handleRemoveBlockMember(memberUserId, memberName, serverId);
                              },
                            },
                          ]);
                        }}
                      >
                        <td>{memberNickname || memberName}</td>
                        <td>
                          {memberIsBlocked === -1
                            ? t('permanent')
                            : new Date(memberIsBlocked).toISOString().slice(0, 10)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['noteText']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div
          className={`${popup['button']} ${!canSubmit ? popup['disabled'] : ''}`}
          onClick={() => {
            handleEditServer(
              {
                name: serverName,
                avatar: serverAvatar,
                avatarUrl: serverAvatarUrl,
                announcement: serverAnnouncement,
                description: serverDescription,
                type: serverType,
                slogan: serverSlogan,
                visibility: serverVisibility,
              },
              serverId,
            );
            handleClose();
          }}
        >
          {t('save')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;
