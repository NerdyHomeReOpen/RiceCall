import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';
import Sorter from '@/utils/sorter';
import ObjDiff from '@/utils/objDiff';

import { MAX_FILE_SIZE, MEMBER_MANAGEMENT_TABLE_FIELDS, MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constant';

import settingStyles from '@/styles/setting.module.css';
import popupStyles from '@/styles/popup.module.css';
import permissionStyles from '@/styles/permission.module.css';

interface ServerSettingPopupProps {
  server: Types.Server;
  serverMembers: Types.Member[];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(({ server: serverData, serverMembers: serverMembersData }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const memberApplications = useAppSelector((state) => state.memberApplications.data);

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
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [memberSortDirection, setMemberSortDirection] = useState<1 | -1>(-1);
  const [applicationSortDirection, setApplicationSortDirection] = useState<1 | -1>(-1);
  const [blockMemberSortDirection, setBlockMemberSortDirection] = useState<1 | -1>(-1);
  const [memberSortField, setMemberSortField] = useState<keyof Types.Member>('permissionLevel');
  const [applicationSortField, setApplicationSortField] = useState<keyof Types.MemberApplication>('name');
  const [blockMemberSortField, setBlockMemberSortField] = useState<keyof Types.Member>('name');
  const [memberQuery, setMemberQuery] = useState('');
  const [applicationQuery, setApplicationQuery] = useState('');
  const [blockMemberQuery, setBlockMemberQuery] = useState('');
  const [memberColumnWidths, setMemberColumnWidths] = useState<number[]>(MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
  const [applicationColumnWidths, setApplicationColumnWidths] = useState<number[]>(MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
  const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>(BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));

  // Variables
  const { userId } = user;
  const {
    serverId,
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
  const isReadOnly = !Permission.isServerAdmin(permissionLevel);
  const canSubmit = serverName.trim();

  const { totalMembersCount, sortedMembers } = useMemo(() => {
    const total = serverMembers.filter((m) => Permission.isMember(m.permissionLevel) && !Permission.isStaff(m.permissionLevel));
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(memberQuery.toLowerCase()) || m.name.toLowerCase().includes(memberQuery.toLowerCase()));
    const sorted = filtered.sort(Sorter(memberSortField, memberSortDirection));

    return { totalMembersCount: total.length, filteredMembers: filtered, sortedMembers: sorted };
  }, [serverMembers, memberQuery, memberSortField, memberSortDirection]);

  const { totalApplicationsCount, sortedApplications } = useMemo(() => {
    const total = memberApplications;
    const filtered = total.filter((a) => a.name.toLowerCase().includes(applicationQuery.toLowerCase()) || a.description.toLowerCase().includes(applicationQuery.toLowerCase()));
    const sorted = filtered.sort(Sorter(applicationSortField, applicationSortDirection));

    return { totalApplicationsCount: total.length, filteredApplications: filtered, sortedApplications: sorted };
  }, [memberApplications, applicationQuery, applicationSortField, applicationSortDirection]);

  const { totalBlockMembersCount, sortedBlockMembers } = useMemo(() => {
    const total = serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now());
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(blockMemberQuery.toLowerCase()) || m.name.toLowerCase().includes(blockMemberQuery.toLowerCase()));
    const sorted = filtered.sort(Sorter(blockMemberSortField, blockMemberSortDirection));

    return { totalBlockMembersCount: total.length, filteredBlockMembers: filtered, sortedBlockMembers: sorted };
  }, [serverMembers, blockMemberQuery, blockMemberSortField, blockMemberSortDirection]);

  const settingPages = Permission.isServerAdmin(permissionLevel)
    ? [
        t('server-info'),
        t('server-announcement'),
        t('member-management'),
        t('access-permission'),
        `${t('member-application-management')} (${totalApplicationsCount})`,
        `${t('blacklist-management')} (${totalBlockMembersCount})`,
      ]
    : Permission.isMember(permissionLevel)
      ? [t('server-info'), t('server-announcement'), t('member-management')]
      : [t('server-info'), t('server-announcement')];

  // Handlers
  const handleMemberSort = (field: keyof Types.Member) => {
    setMemberSortField(field);
    setMemberSortDirection((d) => (field === memberSortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleApplicationSort = (field: keyof Types.MemberApplication) => {
    setApplicationSortField(field);
    setApplicationSortDirection((d) => (field === applicationSortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleBlockMemberSort = (field: keyof Types.Member) => {
    setBlockMemberSortField(field);
    setBlockMemberSortDirection((d) => (field === blockMemberSortField ? (d === 1 ? -1 : 1) : -1));
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

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploadingRef.current) return;
    file.arrayBuffer().then((arrayBuffer) => {
      Popup.openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
        isUploadingRef.current = true;
        if (imageUnit8Array.length > MAX_FILE_SIZE) {
          Popup.openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
          isUploadingRef.current = false;
          return;
        }
        ipc.data.uploadImage({ folder: 'server', imageName: serverId, imageUnit8Array }).then((response) => {
          if (response) {
            setServer((prev) => ({ ...prev, avatar: response.imageName, avatarUrl: response.imageUrl }));
          }
          isUploadingRef.current = false;
        });
      });
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServer((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleSloganChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServer((prev) => ({ ...prev, slogan: e.target.value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServer((prev) => ({ ...prev, type: e.target.value as Types.Server['type'] }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setServer((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleShowPreviewBtnClick = () => {
    setShowPreview((prev) => !prev);
  };

  const handleAnnouncementChange = (value: string) => {
    setServer((prev) => ({ ...prev, announcement: value }));
  };

  const handleMemberQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemberQuery(e.target.value);
  };

  const handleApplicationQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApplicationQuery(e.target.value);
  };

  const handleBlockMemberQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlockMemberQuery(e.target.value);
  };

  const handleVisibilityPublicClick = () => {
    setServer((prev) => ({ ...prev, visibility: 'public' }));
  };

  const handleVisibilityPrivateClick = () => {
    setServer((prev) => ({ ...prev, visibility: 'private' }));
  };

  const handleVisibilityInvisibleClick = () => {
    setServer((prev) => ({ ...prev, visibility: 'invisible' }));
  };

  const handleApplySettingBtnClick = () => {
    Popup.openMemberApplicationSetting(userId, serverId);
  };

  const handleSaveBtnClick = () => {
    if (!canSubmit) return;
    Popup.editServer(serverId, ObjDiff(server, serverData));
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
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
                    <input name="name" type="text" value={serverName} maxLength={32} onChange={handleNameChange} readOnly={isReadOnly} />
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('id')}</div>
                    <input name="server-display-id" type="text" value={serverSpecialId || serverDisplayId} readOnly />
                  </div>
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('slogan')}</div>
                  <input name="slogan" type="text" value={serverSlogan} maxLength={100} onChange={handleSloganChange} readOnly={isReadOnly} />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('type')}</div>
                  <div className={popupStyles['select-box']}>
                    <select name="type" value={serverType} onChange={handleTypeChange} datatype={isReadOnly ? 'read-only' : ''}>
                      <option value="other">{t('other')}</option>
                      <option value="game">{t('game')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={settingStyles['avatar-wrapper']}>
                <div className={settingStyles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
                <input name="avatar" type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" onInput={handleImageInput} />
                {!isReadOnly ? (
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
                <input name="link" type="text" value={`https://ricecall.com/join?sid=${serverSpecialId || serverDisplayId}`} readOnly />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('description')}</div>
                <textarea name="description" value={serverDescription} onChange={handleDescriptionChange} readOnly={isReadOnly} />
              </div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
              <div className={popupStyles['label']}>{t('input-announcement')}</div>
              {!isReadOnly && (
                <div className={popupStyles['button']} onClick={handleShowPreviewBtnClick}>
                  {showPreview ? t('edit') : t('preview')}
                </div>
              )}
            </div>
            <AnnouncementEditor announcement={serverAnnouncement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
              <div className={popupStyles['label']}>{`${t('member')} (${totalMembersCount})`}</div>
              <div className={settingStyles['search-box']}>
                <div className={settingStyles['search-icon']} />
                <input name="search-query" type="text" className={settingStyles['search-input']} placeholder={t('search-placeholder')} value={memberQuery} onChange={handleMemberQueryChange} />
              </div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${memberColumnWidths[index]}px` }} onClick={() => handleMemberSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${memberSortField === field.key ? (memberSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className={popupStyles['resizer']} onPointerDown={(e) => handleMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleMemberColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={settingStyles['table-container']}>
                  {sortedMembers.map((member) => {
                    // Variables
                    const {
                      userId: memberUserId,
                      name: memberName,
                      nickname: memberNickname,
                      gender: memberGender,
                      permissionLevel: memberPermissionLevel,
                      joinAt: memberJoinAt,
                      contribution: memberContribution,
                    } = member;
                    const isSelf = memberUserId === userId;
                    const isSuperior = permissionLevel > memberPermissionLevel;
                    const isSelected = selectedItemId === `member-${memberUserId}`;

                    // Functions
                    const getMemberManagementSubmenuItems = () =>
                      new CtxMenuBuilder()
                        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isSuperior }, () =>
                          Popup.terminateMember(memberUserId, serverId, memberName),
                        )
                        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isSuperior }, () =>
                          Permission.isServerAdmin(memberPermissionLevel)
                            ? Popup.editServerPermission(memberUserId, serverId, { permissionLevel: 2 })
                            : Popup.editServerPermission(memberUserId, serverId, { permissionLevel: 5 }),
                        )
                        .build();

                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, memberUserId))
                        .addViewProfileOption(() => Popup.openUserInfo(userId, memberUserId))
                        .addEditNicknameOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openEditNickname(memberUserId, serverId))
                        .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(memberUserId, serverId))
                        .addSeparator()
                        .addMemberManagementOption(
                          { permissionLevel, targetPermissionLevel: memberPermissionLevel, isSelf, isSuperior, channelCategoryId: null },
                          () => {},
                          getMemberManagementSubmenuItems(),
                        )
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) setSelectedItemId('');
                      else setSelectedItemId(`member-${memberUserId}`);
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={memberUserId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td title={memberNickname || memberName} style={{ width: `${memberColumnWidths[0]}px` }}>
                          <div className={`${permissionStyles[memberGender]} ${permissionStyles[`lv-${memberPermissionLevel}`]}`} />
                          <div className={`${popupStyles['name']} ${memberNickname ? popupStyles['highlight'] : ''}`}>{memberNickname || memberName}</div>
                        </td>
                        <td style={{ width: `${memberColumnWidths[1]}px` }}>{Language.getPermissionText(t, memberPermissionLevel)}</td>
                        <td style={{ width: `${memberColumnWidths[2]}px` }}>{memberContribution}</td>
                        <td style={{ width: `${memberColumnWidths[3]}px` }}>{new Date(memberJoinAt).toLocaleDateString()}</td>
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
                <input name="visibility" type="radio" value="public" checked={serverVisibility === 'public'} onChange={handleVisibilityPublicClick} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('public-server')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="visibility" type="radio" value="private" checked={serverVisibility === 'private'} onChange={handleVisibilityPrivateClick} readOnly={isReadOnly} />
                  <div className={popupStyles['label']}>{t('semi-public-server')}</div>
                </div>
                <div className={popupStyles['hint-text']}>{t('semi-public-server-description')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="visibility" type="radio" value="invisible" checked={serverVisibility === 'invisible'} onChange={handleVisibilityInvisibleClick} readOnly={isReadOnly} />
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
              <div className={popupStyles['label']}>{`${t('applicants')} (${totalApplicationsCount})`}</div>
              <div className={popupStyles['row']}>
                <div className={popupStyles['button']} onClick={handleApplySettingBtnClick}>
                  {t('apply-setting')}
                </div>
                <div className={settingStyles['search-box']}>
                  <div className={settingStyles['search-icon']} />
                  <input
                    name="search-query"
                    type="text"
                    className={settingStyles['search-input']}
                    placeholder={t('search-placeholder')}
                    value={applicationQuery}
                    onChange={handleApplicationQueryChange}
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
                        {`${t(field.tKey)} ${applicationSortField === field.key ? (applicationSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className={popupStyles['resizer']} onPointerDown={(e) => handleApplicationColumnHandleDown(e, index)} onPointerMove={(e) => handleApplicationColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={settingStyles['table-container']}>
                  {sortedApplications.map((application) => {
                    // Variables
                    const { userId: applicationUserId, name: applicationName, description: applicationDescription, createdAt: applicationCreatedAt } = application;
                    const isSelf = applicationUserId === userId;
                    const isSelected = selectedItemId === `application-${applicationUserId}`;

                    // Functions
                    const getContextMenuItems = () => [
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        show: !isSelf,
                        onClick: () => Popup.openUserInfo(userId, applicationUserId),
                      },
                      {
                        id: 'accept-application',
                        label: t('accept-application'),
                        show: !isSelf && Permission.isServerAdmin(permissionLevel),
                        onClick: () => {
                          Popup.approveMemberApplication(applicationUserId, serverId);
                        },
                      },
                      {
                        id: 'deny-application',
                        label: t('deny-application'),
                        show: !isSelf && Permission.isServerAdmin(permissionLevel),
                        onClick: () => {
                          Popup.rejectMemberApplication(applicationUserId, serverId);
                        },
                      },
                    ];

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) setSelectedItemId('');
                      else setSelectedItemId(`application-${applicationUserId}`);
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={applicationUserId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${applicationColumnWidths[0]}px` }}>{applicationName}</td>
                        <td style={{ width: `${applicationColumnWidths[1]}px` }}>{applicationDescription}</td>
                        <td style={{ width: `${applicationColumnWidths[2]}px` }}>{new Date(applicationCreatedAt).toLocaleDateString()}</td>
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
              <div className={popupStyles['label']}>{`${t('blacklist')} (${totalBlockMembersCount})`}</div>
              <div className={settingStyles['search-box']}>
                <div className={settingStyles['search-icon']} />
                <input
                  name="search-query"
                  type="text"
                  className={settingStyles['search-input']}
                  placeholder={t('search-placeholder')}
                  value={blockMemberQuery}
                  onChange={handleBlockMemberQueryChange}
                />
              </div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${blockMemberColumnWidths[index]}px` }} onClick={() => handleBlockMemberSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${blockMemberSortField === field.key ? (blockMemberSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className={popupStyles['resizer']} onPointerDown={(e) => handleBlockMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleBlockMemberColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={settingStyles['table-container']}>
                  {sortedBlockMembers.map((member) => {
                    // Variables
                    const { userId: memberUserId, name: memberName, nickname: memberNickname, blockedUntil: memberBlockedUntil } = member;
                    const isSelf = memberUserId === userId;
                    const isSelected = selectedItemId === `blocked-${memberUserId}`;

                    // Functions
                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addViewProfileOption(() => Popup.openUserInfo(userId, memberUserId))
                        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => Popup.unblockUserFromServer(memberUserId, serverId, memberName))
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) setSelectedItemId('');
                      else setSelectedItemId(`blocked-${memberUserId}`);
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={memberUserId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${blockMemberColumnWidths[0]}px` }}>{memberNickname || memberName}</td>
                        <td style={{ width: `${blockMemberColumnWidths[1]}px` }}>{memberBlockedUntil === -1 ? t('permanent') : `${t('until')} ${new Date(memberBlockedUntil).toLocaleString()}`}</td>
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
      <div className={popupStyles['popup-footer']} style={!isReadOnly ? {} : { display: 'none' }}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleSaveBtnClick}>
          {t('save')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={isReadOnly ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;
