import React, { useEffect, useState, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openImageCropper, openAlertDialog, editServer, openMemberApplicationSetting, openUserInfo, approveMemberApplication, rejectMemberApplication } from '@/services';

import { MAX_FILE_SIZE, MEMBER_MANAGEMENT_TABLE_FIELDS, MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useServerSettingMemberContextMenu } from '@/hooks/ContextMenus/ServerSettingMember';
import { useServerSettingBlockedMemberContextMenu } from '@/hooks/ContextMenus/ServerSettingBlockedMember';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import { getPermissionText } from '@/utils/language';
import { sorter } from '@/utils/sorter';
import { objDiff } from '@/utils';

import styles from './ServerSetting.module.css';

interface ServerSettingPopupProps {
  id: string;
  server: Types.Server;
  serverMembers: Types.Member[];
  memberApplications: Types.MemberApplication[];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(({ id, server: serverData, serverMembers: serverMembersData, memberApplications: memberApplicationsData }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingMemberColumn = useRef<boolean>(false);
  const isResizingApplicationColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  const [server, setServer] = useState<Types.Server>(serverData);
  const [serverMembers, setServerMembers] = useState<Types.Member[]>(serverMembersData);
  const [memberApplications, setMemberApplications] = useState<Types.MemberApplication[]>(memberApplicationsData);
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

  const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel);
  const isReadOnly = permissionLevel < Permission.ServerAdmin;
  const canSubmit = server.name.trim();

  const { totalMembersCount, sortedMembers } = useMemo(() => {
    const total = serverMembers.filter((m) => m.permissionLevel >= Permission.Member && m.permissionLevel < Permission.ServerAdmin);
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(memberQuery.toLowerCase()) || m.name.toLowerCase().includes(memberQuery.toLowerCase()));
    const sorted = filtered.sort(sorter(memberSortField, memberSortDirection));
    return { totalMembersCount: total.length, filteredMembers: filtered, sortedMembers: sorted };
  }, [serverMembers, memberQuery, memberSortField, memberSortDirection]);

  const { totalApplicationsCount, sortedApplications } = useMemo(() => {
    const total = memberApplications;
    const filtered = total.filter((a) => a.name.toLowerCase().includes(applicationQuery.toLowerCase()) || a.description.toLowerCase().includes(applicationQuery.toLowerCase()));
    const sorted = filtered.sort(sorter(applicationSortField, applicationSortDirection));
    return { totalApplicationsCount: total.length, filteredApplications: filtered, sortedApplications: sorted };
  }, [memberApplications, applicationQuery, applicationSortField, applicationSortDirection]);

  const { totalBlockMembersCount, sortedBlockMembers } = useMemo(() => {
    const total = serverMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now());
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(blockMemberQuery.toLowerCase()) || m.name.toLowerCase().includes(blockMemberQuery.toLowerCase()));
    const sorted = filtered.sort(sorter(blockMemberSortField, blockMemberSortDirection));
    return { totalBlockMembersCount: total.length, filteredBlockMembers: filtered, sortedBlockMembers: sorted };
  }, [serverMembers, blockMemberQuery, blockMemberSortField, blockMemberSortDirection]);

  const settingPages =
    permissionLevel >= Permission.ServerAdmin
      ? [
          t('server-info'),
          t('server-announcement'),
          t('member-management'),
          t('access-permission'),
          `${t('member-application-management')} (${totalApplicationsCount})`,
          `${t('blacklist-management')} (${totalBlockMembersCount})`,
        ]
      : permissionLevel >= Permission.Member
        ? [t('server-info'), t('server-announcement'), t('member-management')]
        : [t('server-info'), t('server-announcement')];

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
      openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
        isUploadingRef.current = true;
        if (imageUnit8Array.length > MAX_FILE_SIZE) {
          openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
          isUploadingRef.current = false;
          return;
        }
        ipc.api.uploadImage({ folder: 'server', imageName: server.serverId, imageUnit8Array }).then((response) => {
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
    openMemberApplicationSetting(user.userId, server.serverId);
  };

  const handleSaveBtnClick = () => {
    if (!canSubmit) return;
    editServer(server.serverId, objDiff(server, serverData));
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

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

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: Types.MemberApplication }[]) => {
      setMemberApplications((prev) => prev.concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.MemberApplication> }[]) => {
      const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
      setMemberApplications((prev) => prev.map((ma) => (update.has(`${ma.userId}#${ma.serverId}`) ? { ...ma, ...update.get(`${ma.userId}#${ma.serverId}`) } : ma)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationRemove', (...args: { userId: string; serverId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
      setMemberApplications((prev) => prev.filter((ma) => !remove.has(`${ma.userId}#${ma.serverId}`)));
    });
    return () => unsub();
  }, []);

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-sidebar">
          <div className="popup-sidebar-tabs">
            {settingPages.map((title, index) => (
              <div className={`popup-sidebar-tab ${activeTabIndex === index ? 'active' : ''}`} onClick={() => setActiveTabIndex(index)} key={index}>
                {title}
              </div>
            ))}
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="row">
              <div className="col">
                <div className="row">
                  <div className="input-box col">
                    <div className="label">{t('name')}</div>
                    <input name="name" type="text" value={server.name} maxLength={32} onChange={handleNameChange} readOnly={isReadOnly} />
                  </div>
                  <div className="input-box col">
                    <div className="label">{t('id')}</div>
                    <input name="server-display-id" type="text" value={server.specialId || server.displayId} readOnly />
                  </div>
                </div>
                <div className="input-box col">
                  <div className="label">{t('slogan')}</div>
                  <input name="slogan" type="text" value={server.slogan} maxLength={100} onChange={handleSloganChange} readOnly={isReadOnly} />
                </div>
                <div className="input-box col">
                  <div className="label">{t('type')}</div>
                  <div className="select-box">
                    <select name="type" value={server.type} onChange={handleTypeChange} datatype={isReadOnly ? 'read-only' : ''}>
                      <option value="other">{t('other')}</option>
                      <option value="game">{t('game')}</option>
                      <option value="entertainment">{t('entertainment')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles['avatar-wrapper']}>
                <div className={styles['avatar']}>
                  <Image src={server.avatarUrl} alt="server_avatar" width={100} height={100} loading="lazy" draggable="false" />
                </div>
                <input name="avatar" type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" onInput={handleImageInput} />
                {!isReadOnly ? (
                  <label htmlFor="avatar-upload" className="button" style={{ marginTop: '10px', height: '2em' }}>
                    {t('change-avatar')}
                  </label>
                ) : (
                  <div style={{ marginTop: '10px', height: '2em' }} />
                )}
              </div>
            </div>
            <div className="col">
              <div className="row">
                <div className="input-box col">
                  <div className="label">{t('level')}</div>
                  <input name="level" type="text" value={server.level} readOnly />
                </div>
                <div className="input-box col">
                  <div className="label">{t('create-at')}</div>
                  <input name="created-at" type="text" value={new Date(server.createdAt).toLocaleString()} readOnly />
                </div>
                <div className="input-box col">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="label">{t('wealth')}</div>
                    <div className={styles['wealth-coin-icon']} />
                  </div>
                  <input name="wealth" type="text" value={server.wealth} readOnly />
                </div>
              </div>
              <div className="input-box col">
                <div className="label">{t('server-link')}</div>
                <input name="link" type="text" value={`https://ricecall.com/join?sid=${server.specialId || server.displayId}`} readOnly />
              </div>
              <div className="input-box col">
                <div className="label">{t('description')}</div>
                <textarea name="description" value={server.description} onChange={handleDescriptionChange} readOnly={isReadOnly} />
              </div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="input-box row" style={{ justifyContent: 'space-between' }}>
              <div className="label">{t('input-announcement')}</div>
              {!isReadOnly && (
                <div className="button" onClick={handleShowPreviewBtnClick}>
                  {showPreview ? t('edit') : t('preview')}
                </div>
              )}
            </div>
            <AnnouncementEditor announcement={server.announcement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="input-box row" style={{ justifyContent: 'space-between' }}>
              <div className="label">{`${t('member')} (${totalMembersCount})`}</div>
              <div className="search-box">
                <div className="search-icon" />
                <input name="search-query" type="text" className="search-input" placeholder={t('search-placeholder')} value={memberQuery} onChange={handleMemberQueryChange} />
              </div>
            </div>
            <div className="input-box col">
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${memberColumnWidths[index]}px` }} onClick={() => handleMemberSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${memberSortField === field.key ? (memberSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className="resizer" onPointerDown={(e) => handleMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleMemberColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table">
                  {sortedMembers.map((member) => (
                    <ServerSettingMemberRow key={member.userId} user={user} server={server} member={member} permissionLevel={permissionLevel} columnWidths={memberColumnWidths} />
                  ))}
                </tbody>
              </table>
              <div className="note-text">{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="label-header">
              <div className="label">{t('access-permission')}</div>
            </div>
            <div className="col">
              <div className="input-box row">
                <input name="visibility" type="radio" value="public" checked={server.visibility === 'public'} onChange={handleVisibilityPublicClick} readOnly={isReadOnly} />
                <div className="label">{t('public-server')}</div>
              </div>
              <div>
                <div className="input-box row">
                  <input name="visibility" type="radio" value="private" checked={server.visibility === 'private'} onChange={handleVisibilityPrivateClick} readOnly={isReadOnly} />
                  <div className="label">{t('semi-public-server')}</div>
                </div>
                <div className="hint-text">{t('semi-public-server-description')}</div>
              </div>
              <div>
                <div className="input-box row">
                  <input name="visibility" type="radio" value="invisible" checked={server.visibility === 'invisible'} onChange={handleVisibilityInvisibleClick} readOnly={isReadOnly} />
                  <div className="label">{t('private-server')}</div>
                </div>
                <div className="hint-text">{t('private-server-description')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="input-box row" style={{ justifyContent: 'space-between' }}>
              <div className="label">{`${t('applicants')} (${totalApplicationsCount})`}</div>
              <div className="row">
                <div className="button" onClick={handleApplySettingBtnClick}>
                  {t('apply-setting')}
                </div>
                <div className="search-box">
                  <div className="search-icon" />
                  <input name="search-query" type="text" className="search-input" placeholder={t('search-placeholder')} value={applicationQuery} onChange={handleApplicationQueryChange} />
                </div>
              </div>
            </div>
            <div className="input-box col">
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_APPLICATION_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${applicationColumnWidths[index]}px` }} onClick={() => handleApplicationSort(field.key as keyof Types.MemberApplication)}>
                        {`${t(field.tKey)} ${applicationSortField === field.key ? (applicationSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className="resizer" onPointerDown={(e) => handleApplicationColumnHandleDown(e, index)} onPointerMove={(e) => handleApplicationColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table">
                  {sortedApplications.map((application) => {
                    const isSelf = application.userId === user.userId;
                    const isSelected = selectedItemId === `application-${application.userId}`;

                    const getContextMenuItems = () => [
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        show: !isSelf,
                        onClick: () => openUserInfo(user.userId, application.userId),
                      },
                      {
                        id: 'accept-application',
                        label: t('accept-application'),
                        show: !isSelf && permissionLevel >= Permission.ServerAdmin,
                        onClick: () => {
                          approveMemberApplication(application.userId, server.serverId);
                        },
                      },
                      {
                        id: 'deny-application',
                        label: t('deny-application'),
                        show: !isSelf && permissionLevel >= Permission.ServerAdmin,
                        onClick: () => {
                          rejectMemberApplication(application.userId, server.serverId);
                        },
                      },
                    ];

                    const handleClick = () => {
                      if (isSelected) dispatch(Store.setSelectedItemId(null));
                      else dispatch(Store.setSelectedItemId(`application-${application.userId}`));
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={application.userId} className={`${isSelected ? 'selected' : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${applicationColumnWidths[0]}px` }}>{application.name}</td>
                        <td style={{ width: `${applicationColumnWidths[1]}px` }}>{application.description}</td>
                        <td style={{ width: `${applicationColumnWidths[2]}px` }}>{new Date(application.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="note-text">{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="input-box row" style={{ justifyContent: 'space-between' }}>
              <div className="label">{`${t('blacklist')} (${totalBlockMembersCount})`}</div>
              <div className="search-box">
                <div className="search-icon" />
                <input name="search-query" type="text" className="search-input" placeholder={t('search-placeholder')} value={blockMemberQuery} onChange={handleBlockMemberQueryChange} />
              </div>
            </div>
            <div className="input-box col">
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${blockMemberColumnWidths[index]}px` }} onClick={() => handleBlockMemberSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${blockMemberSortField === field.key ? (blockMemberSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className="resizer" onPointerDown={(e) => handleBlockMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleBlockMemberColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table">
                  {sortedBlockMembers.map((member) => (
                    <ServerSettingBlockedMemberRow key={member.userId} user={user} server={server} member={member} permissionLevel={permissionLevel} columnWidths={blockMemberColumnWidths} />
                  ))}
                </tbody>
              </table>
              <div className="note-text">{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="popup-footer" style={!isReadOnly ? {} : { display: 'none' }}>
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleSaveBtnClick}>
          {t('save')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
      <div className="popup-footer" style={isReadOnly ? {} : { display: 'none' }}>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;

interface ServerSettingMemberRowProps {
  user: { userId: string };
  server: Pick<Types.Server, 'serverId'>;
  member: Types.Member;
  permissionLevel: Types.Permission;
  columnWidths: number[];
}

const ServerSettingMemberRow: React.FC<ServerSettingMemberRowProps> = React.memo(({ user, server, member, permissionLevel, columnWidths }) => {
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();
  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  const isSelected = selectedItemId === `member-${member.userId}`;

  const { buildContextMenu } = useServerSettingMemberContextMenu({ user, server, member, permissionLevel });

  const handleClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`member-${member.userId}`));
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
  };

  return (
    <tr className={`${isSelected ? 'selected' : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
      <td title={member.nickname || member.name} style={{ width: `${columnWidths[0]}px` }}>
        <div className={`permission-${member.gender} permission-lv-${member.permissionLevel}`} />
        <div className={`name ${member.nickname ? 'highlight' : ''}`}>{member.nickname || member.name}</div>
      </td>
      <td style={{ width: `${columnWidths[1]}px` }}>{getPermissionText(member.permissionLevel)}</td>
      <td style={{ width: `${columnWidths[2]}px` }}>{member.contribution}</td>
      <td style={{ width: `${columnWidths[3]}px` }}>{new Date(member.joinAt).toLocaleDateString()}</td>
    </tr>
  );
});

ServerSettingMemberRow.displayName = 'ServerSettingMemberRow';

interface ServerSettingBlockedMemberRowProps {
  user: { userId: string };
  server: Pick<Types.Server, 'serverId'>;
  member: Types.Member;
  permissionLevel: Types.Permission;
  columnWidths: number[];
}

const ServerSettingBlockedMemberRow: React.FC<ServerSettingBlockedMemberRowProps> = React.memo(({ user, server, member, permissionLevel, columnWidths }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();
  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  const isSelected = selectedItemId === `blocked-${member.userId}`;

  const { buildContextMenu } = useServerSettingBlockedMemberContextMenu({ user, server, member, permissionLevel });

  const handleClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`blocked-${member.userId}`));
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
  };

  return (
    <tr className={`${isSelected ? 'selected' : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
      <td style={{ width: `${columnWidths[0]}px` }}>{member.nickname || member.name}</td>
      <td style={{ width: `${columnWidths[1]}px` }}>{member.blockedUntil === -1 ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}</td>
    </tr>
  );
});

ServerSettingBlockedMemberRow.displayName = 'ServerSettingBlockedMemberRow';
