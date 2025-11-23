import React, { useEffect, useState, useMemo } from 'react';

// CSS
import setting from '@/styles/setting.module.css';
import popup from '@/styles/popup.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { MemberApplication, Server, Member, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import {
  handleOpenAlertDialog,
  handleOpenDirectMessage,
  handleOpenUserInfo,
  handleOpenMemberApplicationSetting,
  handleOpenEditNickname,
  handleOpenBlockMember,
  handleOpenImageCropper,
} from '@/utils/popup';
import Sorter from '@/utils/sorter';
import { getPermissionText } from '@/utils/language';
import { isMember, isServerAdmin, isServerOwner, isStaff } from '@/utils/permission';

// Components
import AnnouncementEditor from '@/components/AnnouncementEditor';

interface ServerSettingPopupProps {
  userId: User['userId'];
  user: User;
  serverId: Server['serverId'];
  server: Server;
  serverMembers: Member[];
  memberApplications: MemberApplication[];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(
  ({ userId, user, serverId, server: serverData, serverMembers: serverMembersData, memberApplications: memberApplicationsData }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();

    // States
    const [server, setServer] = useState<Server>(serverData);
    const [serverMembers, setServerMembers] = useState<Member[]>(serverMembersData);
    const [memberApplications, setMemberApplications] = useState<MemberApplication[]>(memberApplicationsData);
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
    const permissionLevel = useMemo(() => Math.max(globalPermission, serverPermission), [globalPermission, serverPermission]);
    const totalMembers = useMemo(() => serverMembers.filter((m) => isMember(m.permissionLevel) && !isStaff(m.permissionLevel)).length, [serverMembers]);
    const totalApplications = useMemo(() => memberApplications.length, [memberApplications]);
    const totalBlockMembers = useMemo(() => serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length, [serverMembers]);
    const canSubmit = useMemo(() => serverName.trim(), [serverName]);

    const filteredMembers = useMemo(
      () =>
        serverMembers
          .filter(
            (m) =>
              isMember(m.permissionLevel) && !isStaff(m.permissionLevel) && (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
          )
          .sort(Sorter(sortField as keyof Member, sortDirection)),
      [serverMembers, searchText, sortField, sortDirection],
    );

    const filteredBlockMembers = useMemo(
      () =>
        serverMembers
          .filter(
            (m) => (m.blockedUntil === -1 || m.blockedUntil > Date.now()) && (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
          )
          .sort(Sorter(sortField as keyof Member, sortDirection)),
      [serverMembers, searchText, sortField, sortDirection],
    );

    const filteredApplications = useMemo(
      () =>
        memberApplications
          .filter((a) => a.name.toLowerCase().includes(searchText.toLowerCase()) || a.description.toLowerCase().includes(searchText.toLowerCase()))
          .sort(Sorter(sortField as keyof MemberApplication, sortDirection)),
      [memberApplications, searchText, sortField, sortDirection],
    );

    const memberTableFields = useMemo(
      () => [
        { name: t('name'), field: 'name' },
        { name: t('permission'), field: 'permissionLevel' },
        { name: t('contribution'), field: 'contribution' },
        { name: t('join-date'), field: 'createdAt' },
      ],
      [t],
    );

    const applicationTableFields = useMemo(
      () => [
        { name: t('name'), field: 'name' },
        { name: t('description'), field: 'description' },
        { name: t('create-at'), field: 'createdAt' },
      ],
      [t],
    );

    const blockMemberTableFields = useMemo(
      () => [
        { name: t('name'), field: 'name' },
        { name: t('unblock-date'), field: 'isBlocked' },
      ],
      [t],
    );

    const settingPages = useMemo(
      () =>
        isServerAdmin(permissionLevel)
          ? [
              t('server-info'),
              t('server-announcement'),
              t('member-management'),
              t('access-permission'),
              `${t('member-application-management')} (${totalApplications})`,
              `${t('blacklist-management')} (${totalBlockMembers})`,
            ]
          : isMember(permissionLevel)
            ? [t('server-info'), t('server-announcement'), t('member-management')]
            : [t('server-info'), t('server-announcement')],
      [t, totalApplications, totalBlockMembers, permissionLevel],
    );

    // Handlers
    const handleApproveMemberApplication = (userId: User['userId'], serverId: Server['serverId']) => {
      ipc.socket.send('approveMemberApplication', { userId, serverId });
    };

    const handleRejectMemberApplication = (userId: User['userId'], serverId: Server['serverId']) => {
      ipc.socket.send('rejectMemberApplication', { userId, serverId });
    };

    const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
      ipc.socket.send('editServer', { serverId, update });
      ipc.window.close();
    };

    const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
      ipc.socket.send('editServerPermission', { userId, serverId, update });
    };

    const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
      handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
    };

    const handleUnblockUserFromServer = (userId: User['userId'], userName: User['name'], serverId: Server['serverId']) => {
      handleOpenAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromServer', { userId, serverId }));
    };

    const handleClose = () => {
      ipc.window.close();
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

    const handleServerUpdate = (...args: { serverId: string; update: Partial<Server> }[]) => {
      const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
      setServer((prev) => (update.has(`${prev.serverId}`) ? { ...prev, ...update.get(`${prev.serverId}`) } : prev));
    };

    const handleServerMemberAdd = (...args: { data: Member }[]) => {
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setServerMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
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
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setMemberApplications((prev) => prev.filter((a) => !add.has(`${a.userId}#${a.serverId}`)).concat(args.map((i) => i.data)));
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
      const unsubs = [
        ipc.socket.on('serverUpdate', handleServerUpdate),
        ipc.socket.on('serverMemberAdd', handleServerMemberAdd),
        ipc.socket.on('serverMemberUpdate', handleServerMemberUpdate),
        ipc.socket.on('serverMemberRemove', handleServerMemberRemove),
        ipc.socket.on('serverMemberApplicationAdd', handleServerMemberApplicationAdd),
        ipc.socket.on('serverMemberApplicationUpdate', handleServerMemberApplicationUpdate),
        ipc.socket.on('serverMemberApplicationRemove', handleServerMemberApplicationRemove),
      ];
      return () => unsubs.forEach((unsub) => unsub());
    }, []);

    return (
      <div className={popup['popup-wrapper']}>
        {/* Body */}
        <div className={popup['popup-body']}>
          {/* Sidebar */}
          <div className={setting['left']}>
            <div className={setting['tabs']}>
              {settingPages.map((title, index) => (
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
                      <input
                        name="name"
                        type="text"
                        value={serverName}
                        maxLength={32}
                        onChange={(e) => setServer((prev) => ({ ...prev, name: e.target.value }))}
                        readOnly={!isServerAdmin(permissionLevel)}
                      />
                    </div>
                    <div className={`${popup['input-box']} ${popup['col']}`}>
                      <div className={popup['label']}>{t('id')}</div>
                      <input name="server-display-id" type="text" value={serverDisplayId} readOnly />
                    </div>
                  </div>
                  <div className={`${popup['input-box']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('slogan')}</div>
                    <input
                      name="slogan"
                      type="text"
                      value={serverSlogan}
                      maxLength={100}
                      onChange={(e) => setServer((prev) => ({ ...prev, slogan: e.target.value }))}
                      readOnly={!isServerAdmin(permissionLevel)}
                    />
                  </div>
                  <div className={`${popup['input-box']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('type')}</div>
                    <div className={popup['select-box']}>
                      <select
                        name="type"
                        value={serverType}
                        onChange={(e) => setServer((prev) => ({ ...prev, type: e.target.value as Server['type'] }))}
                        datatype={!isServerAdmin(permissionLevel) ? 'read-only' : ''}
                      >
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
                      reader.onloadend = async () =>
                        handleOpenImageCropper(reader.result as string, async (imageDataUrl) => {
                          if (imageDataUrl.length > 5 * 1024 * 1024) {
                            handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
                            return;
                          }
                          const response = await ipc.data.upload('server', serverId, imageDataUrl);
                          if (response) {
                            setServer((prev) => ({ ...prev, avatar: response.avatar, avatarUrl: response.avatarUrl }));
                          }
                        });
                      reader.readAsDataURL(file);
                    }}
                  />
                  {isServerAdmin(permissionLevel) ? (
                    <label htmlFor="avatar-upload" className={popup['button']} style={{ marginTop: '10px', height: '2em' }}>
                      {t('change-avatar')}
                    </label>
                  ) : (
                    <div style={{ marginTop: '10px', height: '2em' }} />
                  )}
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={popup['label']}>{t('wealth')}</div>
                      <div className={setting['wealth-coin-icon']} />
                    </div>
                    <input name="wealth" type="text" value={serverWealth} readOnly />
                  </div>
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('server-link')}</div>
                  <input name="link" type="text" value={`https://ricecall.com.tw/join?sid=${serverDisplayId}`} readOnly />
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('description')}</div>
                  <textarea name="description" value={serverDescription} onChange={(e) => setServer((prev) => ({ ...prev, description: e.target.value }))} readOnly={!isServerAdmin(permissionLevel)} />
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
                {isServerAdmin(permissionLevel) && (
                  <div className={popup['button']} onClick={() => setShowPreview((prev) => !prev)}>
                    {showPreview ? t('edit') : t('preview')}
                  </div>
                )}
              </div>
              <AnnouncementEditor
                announcement={serverAnnouncement}
                showPreview={showPreview || !isServerAdmin(permissionLevel)}
                onChange={(value) => setServer((prev) => ({ ...prev, announcement: value }))}
              />
            </div>
          </div>

          {/* Member Management */}
          <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
                <div className={popup['label']}>{`${t('member')} (${totalMembers})`}</div>
                <div className={setting['search-box']}>
                  <div className={setting['search-icon']}></div>
                  <input name="search-query" type="text" className={setting['search-input']} placeholder={t('search-placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {memberTableFields.map((field) => (
                        <th key={field.field} onClick={() => handleMemberSort(field.field as keyof Member)}>
                          {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
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
                      const canUpdatePermission = !isUser && isSuperior && isMember(memberPermission);
                      return (
                        <tr
                          key={memberUserId}
                          className={`${selectedItemId === `member-${memberUserId}` ? popup['selected'] : ''}`}
                          onClick={() => {
                            if (selectedItemId === `member-${memberUserId}`) setSelectedItemId('');
                            else setSelectedItemId(`member-${memberUserId}`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const x = e.clientX;
                            const y = e.clientY;
                            contextMenu.showContextMenu(x, y, 'right-bottom', [
                              {
                                id: 'direct-message',
                                label: t('direct-message'),
                                show: !isUser,
                                onClick: () => handleOpenDirectMessage(userId, memberUserId),
                              },
                              {
                                id: 'view-profile',
                                label: t('view-profile'),
                                onClick: () => handleOpenUserInfo(userId, memberUserId),
                              },
                              {
                                id: 'edit-nickname',
                                label: t('edit-nickname'),
                                show: isMember(memberPermission) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
                                onClick: () => handleOpenEditNickname(memberUserId, serverId),
                              },
                              {
                                id: 'separator',
                                label: '',
                              },
                              {
                                id: 'block',
                                label: t('block'),
                                show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
                                onClick: () => handleOpenBlockMember(memberUserId, serverId),
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
                                    show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(memberPermission) && !isServerOwner(memberPermission),
                                    onClick: () => handleTerminateMember(memberUserId, serverId, memberName),
                                  },
                                  {
                                    id: 'set-server-admin',
                                    label: isServerAdmin(memberPermission) ? t('unset-server-admin') : t('set-server-admin'),
                                    show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(memberPermission),
                                    onClick: () =>
                                      isServerAdmin(memberPermission)
                                        ? handleEditServerPermission(memberUserId, serverId, { permissionLevel: 2 })
                                        : handleEditServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
                                  },
                                ],
                              },
                            ]);
                          }}
                        >
                          <td title={memberNickname || memberName}>
                            <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
                            <div className={`${popup['name']} ${memberNickname ? popup['highlight'] : ''}`}>{memberNickname || memberName}</div>
                          </td>
                          <td>{getPermissionText(t, memberPermission)}</td>
                          <td>{memberContribution}</td>
                          <td>{new Date(memberJoinDate).toLocaleString()}</td>
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
              <div className={popup['col']}>
                <div className={`${popup['input-box']} ${popup['row']}`}>
                  <input
                    name="visibility"
                    type="radio"
                    value="public"
                    checked={serverVisibility === 'public'}
                    onChange={() => setServer((prev) => ({ ...prev, visibility: 'public' }))}
                    readOnly={!isServerAdmin(permissionLevel)}
                  />
                  <div className={popup['label']}>{t('public-server')}</div>
                </div>
                <div>
                  <div className={`${popup['input-box']} ${popup['row']}`}>
                    <input
                      name="visibility"
                      type="radio"
                      value="private"
                      checked={serverVisibility === 'private'}
                      onChange={() => setServer((prev) => ({ ...prev, visibility: 'private' }))}
                      readOnly={!isServerAdmin(permissionLevel)}
                    />
                    <div className={popup['label']}>{t('semi-public-server')}</div>
                  </div>
                  <div className={popup['hint-text']}>{t('semi-public-server-description')}</div>
                </div>
                <div>
                  <div className={`${popup['input-box']} ${popup['row']}`}>
                    <input
                      name="visibility"
                      type="radio"
                      value="invisible"
                      checked={serverVisibility === 'invisible'}
                      onChange={() => setServer((prev) => ({ ...prev, visibility: 'invisible' }))}
                      readOnly={!isServerAdmin(permissionLevel)}
                    />
                    <div className={popup['label']}>{t('private-server')}</div>
                  </div>
                  <div className={popup['hint-text']}>{t('private-server-description')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Member Application Management */}
          <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
                <div className={popup['label']}>{`${t('applicants')} (${totalApplications})`}</div>
                <div className={popup['row']}>
                  <div className={popup['button']} onClick={() => handleOpenMemberApplicationSetting(userId, serverId)}>
                    {t('apply-setting')}
                  </div>
                  <div className={setting['search-box']}>
                    <div className={setting['search-icon']}></div>
                    <input
                      name="search-query"
                      type="text"
                      className={setting['search-input']}
                      placeholder={t('search-placeholder')}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {applicationTableFields.map((field) => (
                        <th key={field.field} onClick={() => handleApplicationSort(field.field as keyof MemberApplication)}>
                          {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
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
                            e.preventDefault();
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
                          <td>{new Date(applicationCreatedAt).toLocaleString()}</td>
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
                <div className={setting['search-box']}>
                  <div className={setting['search-icon']}></div>
                  <input name="search-query" type="text" className={setting['search-input']} placeholder={t('search-placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {blockMemberTableFields.map((field) => (
                        <th key={field.field} onClick={() => handleMemberSort(field.field as keyof Member)}>
                          {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={setting['table-container']}>
                    {filteredBlockMembers.map((member) => {
                      const { userId: memberUserId, nickname: memberNickname, name: memberName, blockedUntil: memberBlockedUntil } = member;
                      const isUser = memberUserId === userId;
                      return (
                        <tr
                          key={memberUserId}
                          className={`${selectedItemId === `blocked-${memberUserId}` ? popup['selected'] : ''}`}
                          onClick={() => {
                            if (selectedItemId === `blocked-${memberUserId}`) setSelectedItemId('');
                            else setSelectedItemId(`blocked-${memberUserId}`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const x = e.clientX;
                            const y = e.clientY;
                            contextMenu.showContextMenu(x, y, 'right-bottom', [
                              {
                                id: 'view-profile',
                                label: t('view-profile'),
                                show: !isUser,
                                onClick: () => handleOpenUserInfo(userId, memberUserId),
                              },
                              {
                                id: 'unblock',
                                label: t('unblock'),
                                show: true,
                                onClick: () => handleUnblockUserFromServer(memberUserId, memberName, serverId),
                              },
                            ]);
                          }}
                        >
                          <td>{memberNickname || memberName}</td>
                          <td>{memberBlockedUntil === -1 ? t('permanent') : new Date(memberBlockedUntil).toLocaleString()}</td>
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
        <div className={popup['popup-footer']} style={isServerAdmin(permissionLevel) ? {} : { display: 'none' }}>
          <div
            className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
            onClick={() =>
              handleEditServer(serverId, {
                name: serverName,
                avatar: serverAvatar,
                avatarUrl: serverAvatarUrl,
                announcement: serverAnnouncement,
                description: serverDescription,
                type: serverType,
                slogan: serverSlogan,
                visibility: serverVisibility,
              })
            }
          >
            {t('save')}
          </div>
          <div className={popup['button']} onClick={() => handleClose()}>
            {t('cancel')}
          </div>
        </div>
        <div className={popup['popup-footer']} style={!isServerAdmin(permissionLevel) ? {} : { display: 'none' }}>
          <div className={popup['button']} onClick={() => handleClose()}>
            {t('close')}
          </div>
        </div>
      </div>
    );
  },
);

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;
