import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';
import * as Permission from '@/utils/permission';
import Sorter from '@/utils/sorter';
import ObjDiff from '@/utils/objDiff';

import { MAX_FILE_SIZE, MEMBER_MANAGEMENT_TABLE_FIELDS, MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constant';

import settingStyles from '@/styles/setting.module.css';
import popupStyles from '@/styles/popup.module.css';
import permissionStyles from '@/styles/permission.module.css';

interface ServerSettingPopupProps {
  userId: Types.User['userId'];
  user: Types.User;
  serverId: Types.Server['serverId'];
  server: Types.Server;
  serverMembers: Types.Member[];
  memberApplications: Types.MemberApplication[];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(
  ({ userId, user, serverId, server: serverData, serverMembers: serverMembersData, memberApplications: memberApplicationsData }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();

    // Refs
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);
    const isResizingMemberColumn = useRef<boolean>(false);
    const isResizingApplicationColumn = useRef<boolean>(false);
    const isResizingBlockMemberColumn = useRef<boolean>(false);
    const isUploadingRef = useRef<boolean>(false);

    // States
    const [server, setServer] = useState<Types.Server>(serverData);
    const [serverMembers, setServerMembers] = useState<Types.Member[]>(serverMembersData);
    const [memberApplications, setMemberApplications] = useState<Types.MemberApplication[]>(memberApplicationsData);
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
    const [sortField, setSortField] = useState<string>('permissionLevel');
    const [searchText, setSearchText] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [memberColumnWidths, setMemberColumnWidths] = useState<number[]>(MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
    const [applicationColumnWidths, setApplicationColumnWidths] = useState<number[]>(MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
    const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>(BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));

    // Variables
    const {
      name: serverName,
      avatarUrl: serverAvatarUrl,
      announcement: serverAnnouncement,
      description: serverDescription,
      type: serverType,
      displayId: serverDisplayId,
      specialId: serverSpecialId,
      slogan: serverSlogan,
      level: serverLevel,
      wealth: serverWealth,
      createdAt: serverCreatedAt,
      visibility: serverVisibility,
    } = server;
    const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel);
    const totalMembers = useMemo(() => serverMembers.filter((m) => Permission.isMember(m.permissionLevel) && !Permission.isStaff(m.permissionLevel)).length, [serverMembers]);
    const totalApplications = memberApplications.length;
    const totalBlockMembers = useMemo(() => serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length, [serverMembers]);
    const canSubmit = serverName.trim();
    const filteredMembers = useMemo(
      () =>
        serverMembers
          .filter(
            (m) =>
              Permission.isMember(m.permissionLevel) &&
              !Permission.isStaff(m.permissionLevel) &&
              (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
          )
          .sort(Sorter(sortField as keyof Types.Member, sortDirection)),
      [serverMembers, searchText, sortField, sortDirection],
    );
    const filteredBlockMembers = useMemo(
      () =>
        serverMembers
          .filter(
            (m) => (m.blockedUntil === -1 || m.blockedUntil > Date.now()) && (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
          )
          .sort(Sorter(sortField as keyof Types.Member, sortDirection)),
      [serverMembers, searchText, sortField, sortDirection],
    );
    const filteredApplications = useMemo(
      () =>
        memberApplications
          .filter((a) => a.name.toLowerCase().includes(searchText.toLowerCase()) || a.description.toLowerCase().includes(searchText.toLowerCase()))
          .sort(Sorter(sortField as keyof Types.MemberApplication, sortDirection)),
      [memberApplications, searchText, sortField, sortDirection],
    );
    const settingPages = Permission.isServerAdmin(permissionLevel)
      ? [
          t('server-info'),
          t('server-announcement'),
          t('member-management'),
          t('access-permission'),
          `${t('member-application-management')} (${totalApplications})`,
          `${t('blacklist-management')} (${totalBlockMembers})`,
        ]
      : Permission.isMember(permissionLevel)
        ? [t('server-info'), t('server-announcement'), t('member-management')]
        : [t('server-info'), t('server-announcement')];

    // Handlers
    const handleApproveMemberApplication = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
      ipc.socket.send('approveMemberApplication', { userId, serverId });
    };

    const handleRejectMemberApplication = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
      ipc.socket.send('rejectMemberApplication', { userId, serverId });
    };

    const handleEditServer = (serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
      ipc.socket.send('editServer', { serverId, update });
      ipc.window.close();
    };

    const handleEditServerPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
      ipc.socket.send('editServerPermission', { userId, serverId, update });
    };

    const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
      Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
    };

    const handleUnblockUserFromServer = (userId: Types.User['userId'], userName: Types.User['name'], serverId: Types.Server['serverId']) => {
      Popup.handleOpenAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromServer', { userId, serverId }));
    };

    const handleClose = () => {
      ipc.window.close();
    };

    const handleSort = <T extends Types.Member | Types.MemberApplication>(field: keyof T) => {
      setSortField(String(field));
      setSortDirection((d) => (field === sortField ? (d === 1 ? -1 : 1) : -1));
    };

    const handleMemberSort = (field: keyof Types.Member) => {
      handleSort(field);
    };

    const handleApplicationSort = (field: keyof Types.MemberApplication) => {
      handleSort(field);
    };

    const handleMemberColumnHandleDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingMemberColumn.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = memberColumnWidths[index];
    };

    const handleMemberColumnHandleMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!isResizingMemberColumn.current) return;
      const deltaX = e.clientX - startXRef.current;
      const minWidth = MEMBER_MANAGEMENT_TABLE_FIELDS[index].minWidth;
      const maxWidth = minWidth * 2.5;
      setMemberColumnWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
        return next;
      });
    };

    const handleApplicationColumnHandleDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingApplicationColumn.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = applicationColumnWidths[index];
    };

    const handleApplicationColumnHandleMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!isResizingApplicationColumn.current) return;
      const deltaX = e.clientX - startXRef.current;
      const minWidth = MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS[index].minWidth;
      const maxWidth = minWidth * 2.5;
      setApplicationColumnWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
        return next;
      });
    };

    const handleBlockMemberColumnHandleDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isResizingBlockMemberColumn.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = blockMemberColumnWidths[index];
    };

    const handleBlockMemberColumnHandleMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!isResizingBlockMemberColumn.current) return;
      const deltaX = e.clientX - startXRef.current;
      const minWidth = BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS[index].minWidth;
      const maxWidth = minWidth * 2.5;
      setBlockMemberColumnWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
        return next;
      });
    };

    const handleUploadImage = (imageUnit8Array: Uint8Array) => {
      isUploadingRef.current = true;
      if (imageUnit8Array.length > MAX_FILE_SIZE) {
        Popup.handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
        isUploadingRef.current = false;
        return;
      }
      ipc.data.uploadImage({ folder: 'server', imageName: serverId, imageUnit8Array }).then((response) => {
        if (response) {
          setServer((prev) => ({ ...prev, avatar: response.imageName, avatarUrl: response.imageUrl }));
        }
        isUploadingRef.current = false;
      });
    };

    // Effects
    useEffect(() => {
      const onPointerup = () => {
        isResizingMemberColumn.current = false;
        isResizingApplicationColumn.current = false;
        isResizingBlockMemberColumn.current = false;
      };
      window.addEventListener('pointerup', onPointerup);
      return () => window.removeEventListener('pointerup', onPointerup);
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverUpdate', (...args: { serverId: string; update: Partial<Types.Server> }[]) => {
        const match = args.find((i) => String(i.serverId) === String(serverId));
        if (match) setServer((prev) => ({ ...prev, ...match.update }));
      });
      return () => unsub();
    }, [serverId]);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberAdd', (...args: { data: Types.Member }[]) => {
        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setServerMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.Member> }[]) => {
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
      const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: Types.MemberApplication }[]) => {
        const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
        setMemberApplications((prev) => prev.filter((a) => !add.has(`${a.userId}#${a.serverId}`)).concat(args.map((i) => i.data)));
      });
      return () => unsub();
    }, []);

    useEffect(() => {
      const unsub = ipc.socket.on('serverMemberApplicationUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.MemberApplication> }[]) => {
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
      <div className={popupStyles['popup-wrapper']}>
        <div className={popupStyles['popup-body']}>
          <div className={settingStyles['left']}>
            <div className={settingStyles['tabs']}>
              {settingPages.map((title, index) => (
                <div className={`${settingStyles['tab']} ${activeTabIndex === index ? settingStyles['active'] : ''}`} onClick={() => setActiveTabIndex(index)} key={index}>
                  {title}
                </div>
              ))}
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={popupStyles['row']}>
                <div className={popupStyles['col']}>
                  <div className={popupStyles['row']}>
                    <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                      <div className={popupStyles['label']}>{t('name')}</div>
                      <input
                        name="name"
                        type="text"
                        value={serverName}
                        maxLength={32}
                        onChange={(e) => setServer((prev) => ({ ...prev, name: e.target.value }))}
                        readOnly={!Permission.isServerAdmin(permissionLevel)}
                      />
                    </div>
                    <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                      <div className={popupStyles['label']}>{t('id')}</div>
                      <input name="server-display-id" type="text" value={serverSpecialId || serverDisplayId} readOnly />
                    </div>
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('slogan')}</div>
                    <input
                      name="slogan"
                      type="text"
                      value={serverSlogan}
                      maxLength={100}
                      onChange={(e) => setServer((prev) => ({ ...prev, slogan: e.target.value }))}
                      readOnly={!Permission.isServerAdmin(permissionLevel)}
                    />
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('type')}</div>
                    <div className={popupStyles['select-box']}>
                      <select
                        name="type"
                        value={serverType}
                        onChange={(e) => setServer((prev) => ({ ...prev, type: e.target.value as Types.Server['type'] }))}
                        datatype={!Permission.isServerAdmin(permissionLevel) ? 'read-only' : ''}
                      >
                        <option value="other">{t('other')}</option>
                        <option value="game">{t('game')}</option>
                        <option value="entertainment">{t('entertainment')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className={settingStyles['avatar-wrapper']}>
                  <div className={settingStyles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
                  <input
                    name="avatar"
                    type="file"
                    id="avatar-upload"
                    style={{ display: 'none' }}
                    accept="image/png, image/jpg, image/jpeg, image/webp, image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || isUploadingRef.current) return;
                      file.arrayBuffer().then((arrayBuffer) => {
                        Popup.handleOpenImageCropper(new Uint8Array(arrayBuffer), handleUploadImage);
                      });
                    }}
                  />
                  {Permission.isServerAdmin(permissionLevel) ? (
                    <label htmlFor="avatar-upload" className={popupStyles['button']} style={{ marginTop: '10px', height: '2em' }}>
                      {t('change-avatar')}
                    </label>
                  ) : (
                    <div style={{ marginTop: '10px', height: '2em' }} />
                  )}
                </div>
              </div>
              <div className={popupStyles['col']}>
                <div className={popupStyles['row']}>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('level')}</div>
                    <input name="level" type="text" value={serverLevel} readOnly />
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('create-at')}</div>
                    <input name="created-at" type="text" value={new Date(serverCreatedAt).toLocaleString()} readOnly />
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={popupStyles['label']}>{t('wealth')}</div>
                      <div className={settingStyles['wealth-coin-icon']} />
                    </div>
                    <input name="wealth" type="text" value={serverWealth} readOnly />
                  </div>
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('server-link')}</div>
                  <input name="link" type="text" value={`https://ricecall.com.tw/join?sid=${serverSpecialId || serverDisplayId}`} readOnly />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('description')}</div>
                  <textarea
                    name="description"
                    value={serverDescription}
                    onChange={(e) => setServer((prev) => ({ ...prev, description: e.target.value }))}
                    readOnly={!Permission.isServerAdmin(permissionLevel)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>{t('input-announcement')}</div>
                {Permission.isServerAdmin(permissionLevel) && (
                  <div className={popupStyles['button']} onClick={() => setShowPreview((prev) => !prev)}>
                    {showPreview ? t('edit') : t('preview')}
                  </div>
                )}
              </div>
              <AnnouncementEditor
                announcement={serverAnnouncement}
                showPreview={showPreview || !Permission.isServerAdmin(permissionLevel)}
                onChange={(value) => setServer((prev) => ({ ...prev, announcement: value }))}
              />
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>{`${t('member')} (${totalMembers})`}</div>
                <div className={settingStyles['search-box']}>
                  <div className={settingStyles['search-icon']}></div>
                  <input
                    name="search-query"
                    type="text"
                    className={settingStyles['search-input']}
                    placeholder={t('search-placeholder')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                        <th key={field.key} style={{ width: `${memberColumnWidths[index]}px` }} onClick={() => handleMemberSort(field.key as keyof Types.Member)}>
                          {`${t(field.tKey)} ${sortField === field.key ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                          <div className={popupStyles['resizer']} onPointerDown={(e) => handleMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleMemberColumnHandleMove(e, index)} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={settingStyles['table-container']}>
                    {filteredMembers.map((member) => {
                      // Variables
                      const isUser = member.userId === userId;
                      const isSuperior = permissionLevel > member.permissionLevel;
                      const canUpdatePermission = !isUser && isSuperior && Permission.isMember(member.permissionLevel);

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'direct-message',
                          label: t('direct-message'),
                          show: !isUser,
                          onClick: () => Popup.handleOpenDirectMessage(userId, member.userId),
                        },
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          onClick: () => Popup.handleOpenUserInfo(userId, member.userId),
                        },
                        {
                          id: 'edit-nickname',
                          label: t('edit-nickname'),
                          show: Permission.isMember(member.permissionLevel) && (isUser || (Permission.isServerAdmin(permissionLevel) && isSuperior)),
                          onClick: () => Popup.handleOpenEditNickname(member.userId, serverId),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'block',
                          label: t('block'),
                          show: !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior,
                          onClick: () => Popup.handleOpenBlockMember(member.userId, serverId),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'member-management',
                          label: t('member-management'),
                          show: !isUser && Permission.isMember(member.permissionLevel) && isSuperior,
                          icon: 'submenu',
                          hasSubmenu: true,
                          submenuItems: [
                            {
                              id: 'terminate-member',
                              label: t('terminate-member'),
                              show:
                                !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior && Permission.isMember(member.permissionLevel) && !Permission.isServerOwner(member.permissionLevel),
                              onClick: () => handleTerminateMember(member.userId, serverId, member.name),
                            },
                            {
                              id: 'set-server-admin',
                              label: Permission.isServerAdmin(member.permissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
                              show: canUpdatePermission && Permission.isServerOwner(permissionLevel) && !Permission.isServerOwner(member.permissionLevel),
                              onClick: () =>
                                Permission.isServerAdmin(member.permissionLevel)
                                  ? handleEditServerPermission(member.userId, serverId, { permissionLevel: 2 })
                                  : handleEditServerPermission(member.userId, serverId, { permissionLevel: 5 }),
                            },
                          ],
                        },
                      ];

                      return (
                        <tr
                          key={member.userId}
                          className={`${selectedItemId === `member-${member.userId}` ? popupStyles['selected'] : ''}`}
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
                          <td title={member.nickname || member.name} style={{ width: `${memberColumnWidths[0]}px` }}>
                            <div className={`${permissionStyles[member.gender]} ${permissionStyles[`lv-${member.permissionLevel}`]}`} />
                            <div className={`${popupStyles['name']} ${member.nickname ? popupStyles['highlight'] : ''}`}>{member.nickname || member.name}</div>
                          </td>
                          <td style={{ width: `${memberColumnWidths[1]}px` }}>{Language.getPermissionText(t, member.permissionLevel)}</td>
                          <td style={{ width: `${memberColumnWidths[2]}px` }}>{member.contribution}</td>
                          <td style={{ width: `${memberColumnWidths[3]}px` }}>{new Date(member.joinAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className={settingStyles['note-text']}>{t('right-click-to-process')}</div>
              </div>
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={popupStyles['header']}>
                <div className={popupStyles['label']}>{t('access-permission')}</div>
              </div>
              <div className={popupStyles['col']}>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input
                    name="visibility"
                    type="radio"
                    value="public"
                    checked={serverVisibility === 'public'}
                    onChange={() => setServer((prev) => ({ ...prev, visibility: 'public' }))}
                    readOnly={!Permission.isServerAdmin(permissionLevel)}
                  />
                  <div className={popupStyles['label']}>{t('public-server')}</div>
                </div>
                <div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                    <input
                      name="visibility"
                      type="radio"
                      value="private"
                      checked={serverVisibility === 'private'}
                      onChange={() => setServer((prev) => ({ ...prev, visibility: 'private' }))}
                      readOnly={!Permission.isServerAdmin(permissionLevel)}
                    />
                    <div className={popupStyles['label']}>{t('semi-public-server')}</div>
                  </div>
                  <div className={popupStyles['hint-text']}>{t('semi-public-server-description')}</div>
                </div>
                <div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                    <input
                      name="visibility"
                      type="radio"
                      value="invisible"
                      checked={serverVisibility === 'invisible'}
                      onChange={() => setServer((prev) => ({ ...prev, visibility: 'invisible' }))}
                      readOnly={!Permission.isServerAdmin(permissionLevel)}
                    />
                    <div className={popupStyles['label']}>{t('private-server')}</div>
                  </div>
                  <div className={popupStyles['hint-text']}>{t('private-server-description')}</div>
                </div>
              </div>
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>{`${t('applicants')} (${totalApplications})`}</div>
                <div className={popupStyles['row']}>
                  <div className={popupStyles['button']} onClick={() => Popup.handleOpenMemberApplicationSetting(userId, serverId)}>
                    {t('apply-setting')}
                  </div>
                  <div className={settingStyles['search-box']}>
                    <div className={settingStyles['search-icon']}></div>
                    <input
                      name="search-query"
                      type="text"
                      className={settingStyles['search-input']}
                      placeholder={t('search-placeholder')}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                        <th key={field.key} style={{ width: `${applicationColumnWidths[index]}px` }} onClick={() => handleApplicationSort(field.key as keyof Types.MemberApplication)}>
                          {`${t(field.tKey)} ${sortField === field.key ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                          <div
                            className={popupStyles['resizer']}
                            onPointerDown={(e) => handleApplicationColumnHandleDown(e, index)}
                            onPointerMove={(e) => handleApplicationColumnHandleMove(e, index)}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={settingStyles['table-container']}>
                    {filteredApplications.map((application) => {
                      // Variables
                      const isUser = application.userId === userId;

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          show: !isUser,
                          onClick: () => Popup.handleOpenUserInfo(userId, application.userId),
                        },
                        {
                          id: 'accept-application',
                          label: t('accept-application'),
                          show: !isUser && Permission.isServerAdmin(permissionLevel),
                          onClick: () => {
                            handleApproveMemberApplication(application.userId, serverId);
                          },
                        },
                        {
                          id: 'deny-application',
                          label: t('deny-application'),
                          show: !isUser && Permission.isServerAdmin(permissionLevel),
                          onClick: () => {
                            handleRejectMemberApplication(application.userId, serverId);
                          },
                        },
                      ];

                      return (
                        <tr
                          key={application.userId}
                          className={`${selectedItemId === `application-${application.userId}` ? popupStyles['selected'] : ''}`}
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
                          <td style={{ width: `${applicationColumnWidths[0]}px` }}>{application.name}</td>
                          <td style={{ width: `${applicationColumnWidths[1]}px` }}>{application.description}</td>
                          <td style={{ width: `${applicationColumnWidths[2]}px` }}>{new Date(application.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className={settingStyles['note-text']}>{t('right-click-to-process')}</div>
              </div>
            </div>
          </div>
          <div className={settingStyles['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>{`${t('blacklist')} (${filteredBlockMembers.length})`}</div>
                <div className={settingStyles['search-box']}>
                  <div className={settingStyles['search-icon']}></div>
                  <input
                    name="search-query"
                    type="text"
                    className={settingStyles['search-input']}
                    placeholder={t('search-placeholder')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <table style={{ height: '330px' }}>
                  <thead>
                    <tr>
                      {BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                        <th key={field.key} style={{ width: `${blockMemberColumnWidths[index]}px` }} onClick={() => handleMemberSort(field.key as keyof Types.Member)}>
                          {`${t(field.tKey)} ${sortField === field.key ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                          <div
                            className={popupStyles['resizer']}
                            onPointerDown={(e) => handleBlockMemberColumnHandleDown(e, index)}
                            onPointerMove={(e) => handleBlockMemberColumnHandleMove(e, index)}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={settingStyles['table-container']}>
                    {filteredBlockMembers.map((member) => {
                      // Variables
                      const isUser = member.userId === userId;

                      // Handlers
                      const getContextMenuItems = () => [
                        {
                          id: 'view-profile',
                          label: t('view-profile'),
                          show: !isUser,
                          onClick: () => Popup.handleOpenUserInfo(userId, member.userId),
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
                          className={`${selectedItemId === `blocked-${member.userId}` ? popupStyles['selected'] : ''}`}
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
                          <td style={{ width: `${blockMemberColumnWidths[0]}px` }}>{member.nickname || member.name}</td>
                          <td style={{ width: `${blockMemberColumnWidths[1]}px` }}>
                            {member.blockedUntil === -1 ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className={settingStyles['note-text']}>{t('right-click-to-process')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={popupStyles['popup-footer']} style={Permission.isServerAdmin(permissionLevel) ? {} : { display: 'none' }}>
          <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => handleEditServer(serverId, ObjDiff(server, serverData))}>
            {t('save')}
          </div>
          <div className={popupStyles['button']} onClick={() => handleClose()}>
            {t('cancel')}
          </div>
        </div>
        <div className={popupStyles['popup-footer']} style={!Permission.isServerAdmin(permissionLevel) ? {} : { display: 'none' }}>
          <div className={popupStyles['button']} onClick={() => handleClose()}>
            {t('close')}
          </div>
        </div>
      </div>
    );
  },
);

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;
