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
import { objDiff } from '@/utils/objDiff';

// Components
import AnnouncementEditor from '@/components/AnnouncementEditor';

// Constants
import { MAX_FILE_SIZE } from '@/constant';

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
    const permissionLevel = Math.max(globalPermission, serverPermission);
    const totalMembers = useMemo(() => serverMembers.filter((m) => isMember(m.permissionLevel) && !isStaff(m.permissionLevel)).length, [serverMembers]);
    const totalApplications = memberApplications.length;
    const totalBlockMembers = useMemo(() => serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length, [serverMembers]);
    const canSubmit = serverName.trim();
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
    const memberTableFields = [
      { name: t('name'), field: 'name' },
      { name: t('permission'), field: 'permissionLevel' },
      { name: t('contribution'), field: 'contribution' },
      { name: t('join-date'), field: 'createdAt' },
    ];
    const applicationTableFields = [
      { name: t('name'), field: 'name' },
      { name: t('description'), field: 'description' },
      { name: t('create-at'), field: 'createdAt' },
    ];
    const blockMemberTableFields = [
      { name: t('name'), field: 'name' },
      { name: t('unblock-date'), field: 'isBlocked' },
    ];
    const settingPages = isServerAdmin(permissionLevel)
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
        : [t('server-info'), t('server-announcement')];

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

    // Effects
    useEffect(() => {
      const unsub = ipc.socket.on('serverUpdate', (...args: { serverId: string; update: Partial<Server> }[]) => {
        const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
        setServer((prev) => (update.has(`${prev.serverId}`) ? { ...prev, ...update.get(`${prev.serverId}`) } : prev));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberAdd', (...args: { data: Member }[]) => {
        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setServerMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => {
        const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
        setServerMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberRemove', (...args: { userId: string; serverId: string }[]) => {
        const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
        setServerMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: MemberApplication }[]) => {
        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setMemberApplications((prev) => prev.filter((a) => !add.has(`${a.userId}#${a.serverId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberApplicationUpdate', (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => {
        const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
        setMemberApplications((prev) => prev.map((a) => (update.has(`${a.userId}#${a.serverId}`) ? { ...a, ...update.get(`${a.userId}#${a.serverId}`) } : a)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberApplicationRemove', (...args: { userId: string; serverId: string }[]) => {
        const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
        setMemberApplications((prev) => prev.filter((a) => !remove.has(`${a.userId}#${a.serverId}`)));
      });
      return () => unsub();
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
                          if (imageDataUrl.length > MAX_FILE_SIZE) {
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
                      // Variables
                      const isUser = member.userId === userId;
                      const isSuperior = permissionLevel > member.permissionLevel;
                      const canUpdatePermission = !isUser && isSuperior && isMember(member.permissionLevel);

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'direct-message',
                          label: t('direct-message'),
                          show: !isUser,
                          onClick: () => handleOpenDirectMessage(userId, member.userId),
                        },
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          onClick: () => handleOpenUserInfo(userId, member.userId),
                        },
                        {
                          id: 'edit-nickname',
                          label: t('edit-nickname'),
                          show: isMember(member.permissionLevel) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
                          onClick: () => handleOpenEditNickname(member.userId, serverId),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'block',
                          label: t('block'),
                          show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
                          onClick: () => handleOpenBlockMember(member.userId, serverId),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'member-management',
                          label: t('member-management'),
                          show: !isUser && isMember(member.permissionLevel) && isSuperior,
                          icon: 'submenu',
                          hasSubmenu: true,
                          submenuItems: [
                            {
                              id: 'terminate-member',
                              label: t('terminate-member'),
                              show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(member.permissionLevel) && !isServerOwner(member.permissionLevel),
                              onClick: () => handleTerminateMember(member.userId, serverId, member.name),
                            },
                            {
                              id: 'set-server-admin',
                              label: isServerAdmin(member.permissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
                              show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(member.permissionLevel),
                              onClick: () =>
                                isServerAdmin(member.permissionLevel)
                                  ? handleEditServerPermission(member.userId, serverId, { permissionLevel: 2 })
                                  : handleEditServerPermission(member.userId, serverId, { permissionLevel: 5 }),
                            },
                          ],
                        },
                      ];

                      return (
                        <tr
                          key={member.userId}
                          className={`${selectedItemId === `member-${member.userId}` ? popup['selected'] : ''}`}
                          onClick={() => {
                            if (selectedItemId === `member-${member.userId}`) setSelectedItemId('');
                            else setSelectedItemId(`member-${member.userId}`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const x = e.clientX;
                            const y = e.clientY;
                            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                          }}
                        >
                          <td title={member.nickname || member.name}>
                            <div className={`${permission[member.gender]} ${permission[`lv-${member.permissionLevel}`]}`} />
                            <div className={`${popup['name']} ${member.nickname ? popup['highlight'] : ''}`}>{member.nickname || member.name}</div>
                          </td>
                          <td>{getPermissionText(t, member.permissionLevel)}</td>
                          <td>{member.contribution}</td>
                          <td>{new Date(member.createdAt).toLocaleString()}</td>
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
                      // Variables
                      const isUser = application.userId === userId;

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          show: !isUser,
                          onClick: () => handleOpenUserInfo(userId, application.userId),
                        },
                        {
                          id: 'accept-application',
                          label: t('accept-application'),
                          show: !isUser && isServerAdmin(permissionLevel),
                          onClick: () => {
                            handleApproveMemberApplication(application.userId, serverId);
                          },
                        },
                        {
                          id: 'deny-application',
                          label: t('deny-application'),
                          show: !isUser && isServerAdmin(permissionLevel),
                          onClick: () => {
                            handleRejectMemberApplication(application.userId, serverId);
                          },
                        },
                      ];

                      return (
                        <tr
                          key={application.userId}
                          className={`${selectedItemId === `application-${application.userId}` ? popup['selected'] : ''}`}
                          onClick={() => {
                            if (selectedItemId === `application-${application.userId}`) setSelectedItemId('');
                            else setSelectedItemId(`application-${application.userId}`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const x = e.clientX;
                            const y = e.clientY;
                            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                          }}
                        >
                          <td>{application.name}</td>
                          <td>{application.description}</td>
                          <td>{new Date(application.createdAt).toLocaleString()}</td>
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
                      // Variables
                      const isUser = member.userId === userId;

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          show: !isUser,
                          onClick: () => handleOpenUserInfo(userId, member.userId),
                        },
                        {
                          id: 'unblock',
                          label: t('unblock'),
                          show: true,
                          onClick: () => handleUnblockUserFromServer(member.userId, member.name, serverId),
                        },
                      ];

                      return (
                        <tr
                          key={member.userId}
                          className={`${selectedItemId === `blocked-${member.userId}` ? popup['selected'] : ''}`}
                          onClick={() => {
                            if (selectedItemId === `blocked-${member.userId}`) setSelectedItemId('');
                            else setSelectedItemId(`blocked-${member.userId}`);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const x = e.clientX;
                            const y = e.clientY;
                            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                          }}
                        >
                          <td>{member.nickname || member.name}</td>
                          <td>{member.blockedUntil === -1 ? t('permanent') : new Date(member.blockedUntil).toLocaleString()}</td>
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
          <div className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => handleEditServer(serverId, objDiff(server, serverData))}>
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
