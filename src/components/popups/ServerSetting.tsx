import React, { ChangeEvent, useEffect, useRef, useState, useMemo } from 'react';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { MemberApplication, Server, Member, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';
import Sorter from '@/utils/sorter';
import { getPermissionText } from '@/utils/language';
import { isMember, isServerAdmin } from '@/utils/permission';

//Components
import AnnouncementEditor from '../AnnouncementEditor';

interface ServerSettingPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(({ serverId, userId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [server, setServer] = useState<Server>(Default.server());
  const [serverMembers, setServerMembers] = useState<Member[]>([]);
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
  const [sortField, setSortField] = useState<string>('permissionLevel');
  const [searchText, setSearchText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Variables
  const { permissionLevel: globalPermission } = user;
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
    permissionLevel: serverPermission,
  } = server;

  // Memos
  const MEMBER_FIELDS = useMemo(
    () => [
      { name: t('name'), field: 'name' },
      { name: t('permission'), field: 'permissionLevel' },
      { name: t('contribution'), field: 'contribution' },
      { name: t('join-date'), field: 'createdAt' },
    ],
    [t],
  );
  const APPLICATION_FIELDS = useMemo(
    () => [
      { name: t('name'), field: 'name' },
      { name: t('description'), field: 'description' },
      { name: t('create-at'), field: 'createdAt' },
    ],
    [t],
  );
  const BLOCK_MEMBER_FIELDS = useMemo(
    () => [
      { name: t('name'), field: 'name' },
      { name: t('unblock-date'), field: 'isBlocked' },
    ],
    [t],
  );

  const permissionLevel = useMemo(() => {
    return Math.max(globalPermission, serverPermission);
  }, [globalPermission, serverPermission]);

  const filteredMembers = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    const list = serverMembers.filter((m) => m.permissionLevel > 1 && (m.nickname?.toLowerCase().includes(searchLower) || m.name.toLowerCase().includes(searchLower)));
    return list.sort(Sorter(sortField as keyof Member, sortDirection));
  }, [serverMembers, searchText, sortField, sortDirection]);

  const filteredBlockMembers = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    const list = serverMembers.filter((m) => (m.blockedUntil === -1 || m.blockedUntil > Date.now()) && (m.nickname?.toLowerCase().includes(searchLower) || m.name.toLowerCase().includes(searchLower)));
    return list.sort(Sorter(sortField as keyof Member, sortDirection));
  }, [serverMembers, searchText, sortField, sortDirection]);

  const filteredApplications = useMemo(() => {
    const searchLower = searchText.toLowerCase();
    const list = memberApplications.filter((a) => a.name.toLowerCase().includes(searchLower) || a.description.toLowerCase().includes(searchLower));
    return list.sort(Sorter(sortField as keyof MemberApplication, sortDirection));
  }, [memberApplications, searchText, sortField, sortDirection]);

  const totalMembers = useMemo(() => {
    return serverMembers.filter((m) => m.permissionLevel > 1).length;
  }, [serverMembers]);

  const totalApplications = useMemo(() => {
    return memberApplications.length;
  }, [memberApplications]);

  const totalBlockMembers = useMemo(() => {
    return serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length;
  }, [serverMembers]);

  const canSubmit = useMemo(() => {
    return serverName.trim();
  }, [serverName]);

  // Handlers
  const handleApproveMemberApplication = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.socket.send('approveMemberApplication', { userId, serverId });
  };

  const handleRejectMemberApplication = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.socket.send('rejectMemberApplication', { userId, serverId });
  };

  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipcService.socket.send('editServer', { serverId, update });
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipcService.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipcService.socket.send('terminateMember', { userId, serverId }));
  };

  const handleUnblockFromServer = (userId: User['userId'], userName: User['name'], serverId: Server['serverId']) => {
    handleOpenAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipcService.socket.send('unblockFromServer', { userId, serverId }));
  };

  const handleOpenMemberApplySetting = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('memberApplySetting', 'memberApplySetting', { serverId, userId });
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    ipcService.popup.open('blockMember', `blockMember-${userId}`, { userId, serverId, userName });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleAvatarCropper = (avatarData: string) => {
    ipcService.popup.open('avatarCropper', 'avatarCropper', { avatarData, submitTo: 'avatarCropper' });
    ipcService.popup.onSubmit('avatarCropper', async (data) => {
      if (data.imageDataUrl.length > 5 * 1024 * 1024) {
        handleOpenErrorDialog(t('image-too-large', { '0': '5MB' }));
        return;
      }

      const formData = new FormData();
      formData.append('_type', 'server');
      formData.append('_fileName', serverId);
      formData.append('_file', data.imageDataUrl as string);
      const response = await apiService.post('/upload', formData);
      if (response) {
        setServer((prev) => ({ ...prev, avatar: response.avatar, avatarUrl: response.avatarUrl }));
      }
    });
  };

  const handleOpenErrorDialog = (message: string) => {
    ipcService.popup.open('dialogError', 'dialogError', { message, submitTo: 'dialogError' });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleSort = <T extends Member | MemberApplication>(field: keyof T) => {
    setSortField(String(field));
    setSortDirection((d) => (field === sortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleMemberSort = (field: keyof Member) => {
    handleSort(field);
  };

  const handleApplicationSort = (field: keyof MemberApplication) => {
    handleSort(field);
  };

  const handleServerMemberAdd = (...args: { data: Member }[]) => {
    setServerMembers((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerMemberUpdate = (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => {
    const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
    setServerMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
  };

  const handleServerMemberRemove = (...args: { userId: string; serverId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
    setServerMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
  };

  const handleServerMemberApplicationAdd = (...args: { data: MemberApplication }[]) => {
    setMemberApplications((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerMemberApplicationUpdate = (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => {
    const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
    setMemberApplications((prev) => prev.map((a) => (update.has(`${a.userId}#${a.serverId}`) ? { ...a, ...update.get(`${a.userId}#${a.serverId}`) } : a)));
  };

  const handleServerMemberApplicationRemove = (...args: { userId: string; serverId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
    setMemberApplications((prev) => prev.filter((a) => !remove.has(`${a.userId}#${a.serverId}`)));
  };

  // Effects
  useEffect(() => {
    if (!serverId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: userId }).then((user) => {
        if (user) setUser(user);
      });
      getService.server({ userId: userId, serverId: serverId }).then((server) => {
        if (server) setServer(server);
      });
      getService.serverMembers({ serverId: serverId }).then((serverMembers) => {
        if (serverMembers) setServerMembers(serverMembers);
      });
      getService.memberApplications({ serverId: serverId }).then((applications) => {
        if (applications) setMemberApplications(applications);
      });
    };
    refresh();
  }, [serverId, userId]);

  useEffect(() => {
    const unsubscribe = [
      ipcService.socket.on('serverMemberAdd', handleServerMemberAdd),
      ipcService.socket.on('serverMemberUpdate', handleServerMemberUpdate),
      ipcService.socket.on('serverMemberRemove', handleServerMemberRemove),
      ipcService.socket.on('serverMemberApplicationAdd', handleServerMemberApplicationAdd),
      ipcService.socket.on('serverMemberApplicationUpdate', handleServerMemberApplicationUpdate),
      ipcService.socket.on('serverMemberApplicationRemove', handleServerMemberApplicationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[
              t('server-info'),
              t('server-announcement'),
              t('member-management'),
              t('access-permission'),
              `${t('member-application-management')} (${totalApplications})`,
              `${t('blacklist-management')} (${totalBlockMembers})`,
            ].map((title, index) => (
              <div className={`${setting['tab']} ${activeTabIndex === index ? setting['active'] : ''}`} onClick={() => setActiveTabIndex(index)} key={index}>
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
                  <div className={`${popup['input-box']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('name')}</div>
                    <input name="name" type="text" value={serverName} maxLength={32} onChange={(e) => setServer((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className={`${popup['input-box']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('id')}</div>
                    <input name="server-display-id" type="text" value={serverDisplayId} readOnly />
                  </div>
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('slogan')}</div>
                  <input name="slogan" type="text" value={serverSlogan} maxLength={100} onChange={(e) => setServer((prev) => ({ ...prev, slogan: e.target.value }))} />
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('type')}</div>
                  <div className={popup['select-box']}>
                    <select name="type" value={serverType} onChange={(e) => setServer((prev) => ({ ...prev, type: e.target.value as Server['type'] }))}>
                      <option value="other">{t('other')}</option>
                      <option value="game">{t('game')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={setting['avatar-wrapper']}>
                <div className={setting['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
                <input
                  name="avatar"
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  accept="image/png, image/jpg, image/jpeg, image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => handleAvatarCropper(reader.result as string);
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
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('level')}</div>
                  <input name="level" type="text" value={serverLevel} readOnly />
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('create-at')}</div>
                  <input name="created-at" type="text" value={new Date(serverCreatedAt).toLocaleString()} readOnly />
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={`${popup['label']} ${setting['wealth-coin-icon']}`}>{t('wealth')}</div>
                  <input name="wealth" type="text" value={serverWealth} readOnly />
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('server-link')}</div>
                <input name="link" type="text" value={`https://ricecall.com.tw/join?sid=${serverDisplayId}`} readOnly />
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('description')}</div>
                <textarea name="description" value={serverDescription} onChange={(e) => setServer((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Header */}
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{t('input-announcement')}</div>
              <div className={popup['button']} onClick={() => setShowPreview((prev) => !prev)}>
                {showPreview ? t('edit') : t('preview')}
              </div>
            </div>

            <AnnouncementEditor announcement={serverAnnouncement} showPreview={showPreview} onChange={(value) => setServer((prev) => ({ ...prev, announcement: value }))} />
          </div>
        </div>

        {/* Member Management */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('member')} (${totalMembers})`}</div>
              <div className={setting['search-border']}>
                <div className={setting['search-icon']}></div>
                <input
                  name="search-query"
                  type="search"
                  className={setting['search-input']}
                  placeholder={t('search-placeholder')}
                  value={searchText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_FIELDS.map((field) => (
                      <th key={field.field} onClick={() => handleMemberSort(field.field as keyof Member)}>
                        {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '↑' : '↓') : ''}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['table-container']}>
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
                    const isUser = memberUserId === userId;
                    const isSuperior = permissionLevel > memberPermission;
                    return (
                      <tr
                        key={memberUserId}
                        className={`${selectedItemId === `member-${memberUserId}` ? popup['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `member-${memberUserId}`) setSelectedItemId('');
                          else setSelectedItemId(`member-${memberUserId}`);
                        }}
                        onContextMenu={(e) => {
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', [
                            {
                              id: 'direct-message',
                              label: t('direct-message'),
                              show: !isUser,
                              onClick: () => handleOpenDirectMessage(userId, memberUserId, memberName),
                            },
                            {
                              id: 'view-profile',
                              label: t('view-profile'),
                              onClick: () => handleOpenUserInfo(userId, memberUserId),
                            },
                            // {
                            //   id: 'add-friend',
                            //   label: t('add-friend'),
                            //   show: !isUser && !isFriend,
                            //   onClick: () => handleOpenApplyFriend(userId, memberUserId),
                            // },
                            {
                              id: 'edit-nickname',
                              label: t('edit-nickname'),
                              show: isMember(permissionLevel) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
                              onClick: () => handleOpenEditNickname(memberUserId, serverId),
                            },
                            {
                              id: 'separator',
                              label: '',
                            },
                            {
                              id: 'separator',
                              label: '',
                            },
                            {
                              id: 'forbid-voice',
                              label: t('forbid-voice'),
                              show: !isUser && isMember(permissionLevel) && isSuperior,
                              disabled: true,
                              onClick: () => {},
                            },
                            {
                              id: 'forbid-text',
                              label: t('forbid-text'),
                              show: !isUser && isMember(permissionLevel) && isSuperior,
                              disabled: true,
                              onClick: () => {},
                            },
                            {
                              id: 'block',
                              label: t('block'),
                              show: !isUser && isMember(permissionLevel) && isSuperior,
                              onClick: () => {
                                handleOpenBlockMember(memberUserId, serverId, memberNickname || memberName);
                              },
                            },
                            {
                              id: 'separator',
                              label: '',
                            },
                            {
                              id: 'member-management',
                              label: t('member-management'),
                              show: !isUser && isMember(memberPermission) && isSuperior,
                              icon: 'submenu',
                              hasSubmenu: true,
                              submenuItems: [
                                {
                                  id: 'terminate-member',
                                  label: t('terminate-member'),
                                  show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(memberPermission),
                                  onClick: () => handleTerminateMember(memberUserId, serverId, memberName),
                                },
                                {
                                  id: 'set-member',
                                  label: t('set-member'),
                                  show: !isUser && isMember(memberPermission) && isSuperior && !isMember(memberPermission, false),
                                  onClick: () => handleEditServerPermission(memberUserId, serverId, { permissionLevel: 2 }),
                                },
                                {
                                  id: 'set-server-admin',
                                  label: t('set-server-admin'),
                                  show: !isUser && isMember(memberPermission) && isSuperior && !isServerAdmin(memberPermission, false),
                                  onClick: () => handleEditServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
                                },
                              ],
                            },
                          ]);
                        }}
                      >
                        <td>
                          <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
                          <div className={`${popup['name']} ${memberNickname ? popup['highlight'] : ''}`}>{memberNickname || memberName}</div>
                        </td>
                        <td>{getPermissionText(t, memberPermission)}</td>
                        <td>{memberContribution}</td>
                        <td>{new Date(memberJoinDate).toISOString().slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['note-text']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>

        {/* Access Permission */}
        <div className={setting['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('access-permission')}</div>
            </div>
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="visibility" type="radio" value="public" checked={serverVisibility === 'public'} onChange={() => setServer((prev) => ({ ...prev, visibility: 'public' }))} />
                <div className={popup['label']}>{t('public-server')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="visibility" type="radio" value="private" checked={serverVisibility === 'private'} onChange={() => setServer((prev) => ({ ...prev, visibility: 'private' }))} />
                <div className={popup['label']}>{t('semi-public-server')}</div>
              </div>
              <div className={popup['hint-text']}>{t('semi-public-server-description')}</div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="visibility" type="radio" value="invisible" checked={serverVisibility === 'invisible'} onChange={() => setServer((prev) => ({ ...prev, visibility: 'invisible' }))} />
                <div className={popup['label']}>{t('private-server')}</div>
              </div>
              <div className={popup['hint-text']}>{t('private-server-description')}</div>
            </div>
          </div>
        </div>

        {/* Member Application Management */}
        <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('applicants')} (${totalApplications})`}</div>
              <div className={popup['row']}>
                <div className={popup['button']} onClick={() => handleOpenMemberApplySetting(userId, serverId)}>
                  {t('apply-setting')}
                </div>
                <div className={setting['search-border']}>
                  <div className={setting['search-icon']}></div>
                  <input
                    name="search-query"
                    type="search"
                    className={setting['search-input']}
                    placeholder={t('search-placeholder')}
                    value={searchText}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {APPLICATION_FIELDS.map((field) => (
                      <th key={field.field} onClick={() => handleApplicationSort(field.field as keyof MemberApplication)}>
                        {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '↑' : '↓') : ''}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['table-container']}>
                  {filteredApplications.map((application) => {
                    const { userId: applicationUserId, name: applicationName, description: applicationDescription, createdAt: applicationCreatedAt } = application;
                    const isUser = applicationUserId === userId;
                    return (
                      <tr
                        key={applicationUserId}
                        className={`${selectedItemId === `application-${applicationUserId}` ? popup['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `application-${applicationUserId}`) setSelectedItemId('');
                          else setSelectedItemId(`application-${applicationUserId}`);
                        }}
                        onContextMenu={(e) => {
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', [
                            {
                              id: 'view-profile',
                              label: t('view-profile'),
                              show: !isUser,
                              onClick: () => handleOpenUserInfo(userId, applicationUserId),
                            },
                            {
                              id: 'accept-application',
                              label: t('accept-application'),
                              show: !isUser && isServerAdmin(permissionLevel),
                              onClick: () => {
                                handleApproveMemberApplication(applicationUserId, serverId);
                              },
                            },
                            {
                              id: 'deny-application',
                              label: t('deny-application'),
                              show: !isUser && isServerAdmin(permissionLevel),
                              onClick: () => {
                                handleRejectMemberApplication(applicationUserId, serverId);
                              },
                            },
                          ]);
                        }}
                      >
                        <td>{applicationName}</td>
                        <td>{applicationDescription}</td>
                        <td>{new Date(applicationCreatedAt).toISOString().slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['note-text']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>

        {/* Blacklist Management */}
        <div className={setting['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('blacklist')} (${filteredBlockMembers.length})`}</div>
              <div className={setting['search-border']}>
                <div className={setting['search-icon']}></div>
                <input
                  name="search-query"
                  type="search"
                  className={setting['search-input']}
                  placeholder={t('search-placeholder')}
                  value={searchText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {BLOCK_MEMBER_FIELDS.map((field) => (
                      <th key={field.field} onClick={() => handleMemberSort(field.field as keyof Member)}>
                        {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '↑' : '↓') : ''}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['table-container']}>
                  {filteredBlockMembers.map((member) => {
                    const { userId: memberUserId, nickname: memberNickname, name: memberName, blockedUntil: memberBlockedUntil } = member;
                    return (
                      <tr
                        key={memberUserId}
                        className={`${selectedItemId === `blocked-${memberUserId}` ? popup['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `blocked-${memberUserId}`) setSelectedItemId('');
                          else setSelectedItemId(`blocked-${memberUserId}`);
                        }}
                        onContextMenu={(e) => {
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', [
                            {
                              id: 'unblock',
                              label: t('unblock'),
                              show: true,
                              onClick: () => handleUnblockFromServer(memberUserId, memberName, serverId),
                            },
                          ]);
                        }}
                      >
                        <td>{memberNickname || memberName}</td>
                        <td>{memberBlockedUntil === -1 ? t('permanent') : new Date(memberBlockedUntil).toISOString().slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={setting['note-text']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleEditServer(serverId, {
              name: serverName,
              avatar: serverAvatar,
              avatarUrl: serverAvatarUrl,
              announcement: serverAnnouncement,
              description: serverDescription,
              type: serverType,
              slogan: serverSlogan,
              visibility: serverVisibility,
            });
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
