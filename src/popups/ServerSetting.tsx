import React, { useEffect, useState, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import { setSelectedItemId } from '@/store/slices/uiSlice';

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
  const dispatch = useAppDispatch();

  // Refs
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingMemberColumn = useRef<boolean>(false);
  const isResizingApplicationColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const memberApplications = useAppSelector((state) => state.memberApplications.data, shallowEqual);
  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  // States
  const [server, setServer] = useState<Types.Server>(serverData);
  const [serverMembers, setServerMembers] = useState<Types.Member[]>(serverMembersData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
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
  const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel);
  const isReadOnly = !Permission.isServerAdmin(permissionLevel);
  const canSubmit = server.name.trim();

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
        ipc.data.uploadImage({ folder: 'server', imageName: server.serverId, imageUnit8Array }).then((response) => {
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
    Popup.openMemberApplicationSetting(user.userId, server.serverId);
  };

  const handleSaveBtnClick = () => {
    if (!canSubmit) return;
    Popup.editServer(server.serverId, ObjDiff(server, serverData));
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
                    <input name="name" type="text" value={server.name} maxLength={32} onChange={handleNameChange} readOnly={isReadOnly} />
                  </div>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('id')}</div>
                    <input name="server-display-id" type="text" value={server.specialId || server.displayId} readOnly />
                  </div>
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('slogan')}</div>
                  <input name="slogan" type="text" value={server.slogan} maxLength={100} onChange={handleSloganChange} readOnly={isReadOnly} />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('type')}</div>
                  <div className={popupStyles['select-box']}>
                    <select name="type" value={server.type} onChange={handleTypeChange} datatype={isReadOnly ? 'read-only' : ''}>
                      <option value="other">{t('other')}</option>
                      <option value="game">{t('game')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={settingStyles['avatar-wrapper']}>
                <div className={settingStyles['avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
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
                  <input name="level" type="text" value={server.level} readOnly />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('create-at')}</div>
                  <input name="created-at" type="text" value={new Date(server.createdAt).toLocaleString()} readOnly />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={popupStyles['label']}>{t('wealth')}</div>
                    <div className={settingStyles['wealth-coin-icon']} />
                  </div>
                  <input name="wealth" type="text" value={server.wealth} readOnly />
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('server-link')}</div>
                <input name="link" type="text" value={`https://ricecall.com/join?sid=${server.specialId || server.displayId}`} readOnly />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('description')}</div>
                <textarea name="description" value={server.description} onChange={handleDescriptionChange} readOnly={isReadOnly} />
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
            <AnnouncementEditor announcement={server.announcement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
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
                    const isSelf = member.userId === user.userId;
                    const isLowerLevel = member.permissionLevel < permissionLevel;
                    const isSelected = selectedItemId === `member-${member.userId}`;

                    // Functions
                    const getMemberManagementSubmenuItems = () =>
                      new CtxMenuBuilder()
                        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
                          Popup.terminateMember(member.userId, server.serverId, member.name),
                        )
                        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel }, () =>
                          Permission.isServerAdmin(member.permissionLevel)
                            ? Popup.editServerPermission(member.userId, server.serverId, { permissionLevel: 2 })
                            : Popup.editServerPermission(member.userId, server.serverId, { permissionLevel: 5 }),
                        )
                        .build();

                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, member.userId))
                        .addViewProfileOption(() => Popup.openUserInfo(user.userId, member.userId))
                        .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openEditNickname(member.userId, server.serverId))
                        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openBlockMember(member.userId, server.serverId))
                        .addSeparator()
                        .addMemberManagementOption(
                          { permissionLevel, targetPermissionLevel: member.permissionLevel, isSelf, isLowerLevel, channelCategoryId: null },
                          () => {},
                          getMemberManagementSubmenuItems(),
                        )
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) setSelectedItemId('');
                      else setSelectedItemId(`member-${member.userId}`);
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={member.userId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
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
                <input name="visibility" type="radio" value="public" checked={server.visibility === 'public'} onChange={handleVisibilityPublicClick} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('public-server')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="visibility" type="radio" value="private" checked={server.visibility === 'private'} onChange={handleVisibilityPrivateClick} readOnly={isReadOnly} />
                  <div className={popupStyles['label']}>{t('semi-public-server')}</div>
                </div>
                <div className={popupStyles['hint-text']}>{t('semi-public-server-description')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="visibility" type="radio" value="invisible" checked={server.visibility === 'invisible'} onChange={handleVisibilityInvisibleClick} readOnly={isReadOnly} />
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
                    const isSelf = application.userId === user.userId;
                    const isSelected = selectedItemId === `application-${application.userId}`;

                    // Functions
                    const getContextMenuItems = () => [
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        show: !isSelf,
                        onClick: () => Popup.openUserInfo(user.userId, application.userId),
                      },
                      {
                        id: 'accept-application',
                        label: t('accept-application'),
                        show: !isSelf && Permission.isServerAdmin(permissionLevel),
                        onClick: () => {
                          Popup.approveMemberApplication(application.userId, server.serverId);
                        },
                      },
                      {
                        id: 'deny-application',
                        label: t('deny-application'),
                        show: !isSelf && Permission.isServerAdmin(permissionLevel),
                        onClick: () => {
                          Popup.rejectMemberApplication(application.userId, server.serverId);
                        },
                      },
                    ];

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) dispatch(setSelectedItemId(null));
                      else dispatch(setSelectedItemId(`application-${application.userId}`));
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={application.userId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
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
                    const isSelf = member.userId === user.userId;
                    const isSelected = selectedItemId === `blocked-${member.userId}`;

                    // Functions
                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addViewProfileOption(() => Popup.openUserInfo(user.userId, member.userId))
                        .addUnblockUserFromServerOption({ permissionLevel, isSelf }, () => Popup.unblockUserFromServer(member.userId, server.serverId, member.name))
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) dispatch(setSelectedItemId(null));
                      else dispatch(setSelectedItemId(`blocked-${member.userId}`));
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={member.userId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${blockMemberColumnWidths[0]}px` }}>{member.nickname || member.name}</td>
                        <td style={{ width: `${blockMemberColumnWidths[1]}px` }}>{member.blockedUntil === -1 ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}</td>
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
