import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';
import * as Permission from '@/utils/permission';
import ObjDiff from '@/utils/objDiff';
import Sorter from '@/utils/sorter';

import { MEMBER_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constant';

import popupStyles from '@/styles/popup.module.css';
import settingStyles from '@/styles/setting.module.css';
import permissionStyles from '@/styles/permission.module.css';

interface ChannelSettingPopupProps {
  userId: Types.User['userId'];
  user: Types.User;
  server: Types.Server;
  channel: Types.Channel;
  channelMembers: Types.Member[];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ userId, user, server, channel: channelData, channelMembers: channelMembersData }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingMemberColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);

  // States
  const [channel, setChannel] = useState<Types.Channel>(channelData);
  const [channelMembers, setChannelMembers] = useState<Types.Member[]>(channelMembersData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
  const [sortField, setSortField] = useState<string>('contribution');
  const [searchText, setSearchText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [memberColumnWidths, setMemberColumnWidths] = useState<number[]>(MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
  const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>(BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));

  // Variables
  const { serverId, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = server;
  const {
    channelId,
    name: channelName,
    announcement: channelAnnouncement,
    visibility: channelVisibility,
    password: channelPassword,
    userLimit: channelUserLimit,
    voiceMode: channelVoiceMode,
    queueTime: channelQueueTime,
    forbidText: channelForbidText,
    forbidGuestText: channelForbidGuestText,
    forbidGuestVoice: channelForbidGuestVoice,
    forbidGuestQueue: channelForbidGuestQueue,
    forbidGuestUrl: channelForbidGuestUrl,
    guestTextMaxLength: channelGuestTextMaxLength,
    guestTextWaitTime: channelGuestTextWaitTime,
    guestTextGapTime: channelGuestTextGapTime,
    bitrate: channelBitrate,
    categoryId: channelCategoryId,
  } = channel;
  const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel, channel.permissionLevel);
  const isLobby = serverLobbyId === channelId;
  const isReceptionLobby = serverReceptionLobbyId === channelId;
  const totalModerators = useMemo(() => channelMembers.filter((m) => Permission.isChannelMod(m.permissionLevel) && !Permission.isServerAdmin(m.permissionLevel)).length, [channelMembers]);
  const totalBlockMembers = useMemo(() => channelMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length, [channelMembers]);
  const canSubmit = channelName.trim();
  const filteredModerators = useMemo(
    () =>
      channelMembers
        .filter(
          (m) =>
            Permission.isChannelMod(m.permissionLevel) &&
            !Permission.isServerAdmin(m.permissionLevel) &&
            (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
        )
        .sort(Sorter(sortField as keyof Types.Member, sortDirection)),
    [channelMembers, searchText, sortField, sortDirection],
  );

  const filteredBlockMembers = useMemo(
    () =>
      channelMembers
        .filter(
          (m) => (m.blockedUntil === -1 || m.blockedUntil > Date.now()) && (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
        )
        .sort(Sorter(sortField as keyof Types.Member, sortDirection)),
    [channelMembers, searchText, sortField, sortDirection],
  );

  const settingPages = Permission.isChannelMod(permissionLevel)
    ? [
        t('channel-info'),
        t('channel-announcement'),
        t('access-permission'),
        t('speaking-permission'),
        t('text-permission'),
        `${t('channel-management')} (${totalModerators})`,
        `${t('blacklist-management')} (${totalBlockMembers})`,
      ]
    : user.currentChannelId === channelId || (channelVisibility !== 'private' && channelVisibility !== 'readonly')
      ? [t('channel-info'), t('channel-announcement')]
      : [t('channel-info')];

  // Handlers
  const handleEditChannel = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
    ipc.window.close();
  };

  const handleEditServerPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleUnblockUserFromChannel = (userId: Types.User['userId'], userName: Types.User['name'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
    Popup.handleOpenAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromChannel', { userId, serverId, channelId }));
  };

  const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleSort = <T extends Types.Member>(field: keyof T) => {
    setSortField(String(field));
    setSortDirection((d) => (field === sortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleMemberSort = (field: keyof Types.Member) => {
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

  // Effects
  useEffect(() => {
    const onPointerup = () => {
      isResizingMemberColumn.current = false;
      isResizingBlockMemberColumn.current = false;
    };
    window.addEventListener('pointerup', onPointerup);
    return () => window.removeEventListener('pointerup', onPointerup);
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Types.Channel> }[]) => {
      const match = args.find((i) => String(i.channelId) === String(channelId));
      if (match) setChannel((prev) => ({ ...prev, ...match.update }));
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberAdd', (...args: { data: Types.Member }[]) => {
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setChannelMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelMemberUpdate', (...args: { userId: string; serverId: string; channelId: string; update: Partial<Types.Member> }[]) => {
      const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}#${i.channelId}`, i.update] as const));
      setChannelMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}#${channelId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}#${channelId}`) } : m)));
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberRemove', (...args: { userId: string; serverId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
      setChannelMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
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
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('channel-name')}</div>
                <input
                  name="channel-name"
                  type="text"
                  value={isLobby ? t(`${channelName}`) : channelName}
                  maxLength={32}
                  disabled={isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('user-limit')}</div>
                <input
                  name="user-limit"
                  type="number"
                  value={channelUserLimit}
                  min={0}
                  max={999}
                  disabled={channelVisibility === 'readonly' || isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, userLimit: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
              </div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('channel-mode')}</div>
                <div className={popupStyles['select-box']}>
                  <select
                    value={channelVoiceMode}
                    onChange={(e) => setChannel((prev) => ({ ...prev, voiceMode: e.target.value as Types.Channel['voiceMode'] }))}
                    datatype={!Permission.isChannelMod(permissionLevel) ? 'read-only' : ''}
                  >
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {channelVoiceMode === 'queue' && (
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('queue-time')}</div>
                  <input
                    name="queue-time"
                    type="number"
                    value={channelQueueTime}
                    min={10}
                    max={3600}
                    onChange={(e) => setChannel((prev) => ({ ...prev, queueTime: Math.max(10, Math.min(3600, parseInt(e.target.value) || 0)) }))}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={settingStyles['separator']} />
          <div className={popupStyles['col']}>
            <div className={popupStyles['label']}>{t('channel-audio-quality')}</div>
            <div className={popupStyles['col']}>
              <div>
                <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input
                    name="bitrate-64000"
                    type="radio"
                    checked={channelBitrate === 64000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 64000 }))}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                  <div className={popupStyles['label']}>{t('chat-mode')}</div>
                </label>
                <div className={popupStyles['hint-text']}>{t('chat-mode-description')}</div>
              </div>
              <div>
                <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input
                    name="bitrate-256000"
                    type="radio"
                    checked={channelBitrate === 256000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 256000 }))}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                  <div className={popupStyles['label']}>{t('entertainment-mode')}</div>
                </label>
                <div className={popupStyles['hint-text']}>{t('entertainment-mode-description')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
              <div className={popupStyles['label']}>{t('input-announcement')}</div>
              {Permission.isChannelMod(permissionLevel) && (
                <div className={popupStyles['button']} onClick={() => setShowPreview((prev) => !prev)}>
                  {showPreview ? t('edit') : t('preview')}
                </div>
              )}
            </div>
            <AnnouncementEditor
              announcement={channelAnnouncement}
              showPreview={showPreview || !Permission.isChannelMod(permissionLevel)}
              onChange={(value) => setChannel((prev) => ({ ...prev, announcement: value }))}
            />
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('access-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'public'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'public' }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('anyone-can-access-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'member'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'member' }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-guest-access-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'readonly'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'readonly' }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('message-only-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'private'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'private' }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('require-password-label')}</div>
              </label>
              {channelVisibility === 'private' && Permission.isChannelMod(permissionLevel) && (
                <div className={popupStyles['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    value={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={(e) => setChannel((prev) => ({ ...prev, password: e.target.value }))}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('speaking-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input
                  name="forbidGuestQueue"
                  type="checkbox"
                  checked={channelForbidGuestQueue}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestQueue: e.target.checked }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-guest-queue-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input
                  name="forbidGuestVoice"
                  type="checkbox"
                  checked={channelForbidGuestVoice}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestVoice: e.target.checked }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-guest-voice-label')}</div>
              </label>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('text-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input
                  name="forbid-text"
                  type="checkbox"
                  checked={channelForbidText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidText: e.target.checked }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-only-admin-text-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input
                  name="forbid-guest-text"
                  type="checkbox"
                  checked={channelForbidGuestText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestText: e.target.checked }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-guest-text-label')}</div>
              </label>
              <label className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input
                  name="forbid-guest-url"
                  type="checkbox"
                  checked={channelForbidGuestUrl}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestUrl: e.target.checked }))}
                  readOnly={!Permission.isChannelMod(permissionLevel)}
                />
                <div className={popupStyles['label']}>{t('forbid-guest-url-label')}</div>
              </label>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>
                  {t('guest-text-max-length-label')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    value={channelGuestTextMaxLength}
                    min={0}
                    max={3000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextMaxLength: Math.max(0, Math.min(3000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                  {t('characters')}
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>
                  {t('guest-text-wait-time-label')}
                  <input
                    name="guest-text-wait-time"
                    type="number"
                    value={channelGuestTextWaitTime}
                    min={0}
                    max={1000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextWaitTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                  {t('second')}
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>
                  {t('guest-text-gap-time-label')}
                  <input
                    name="guest-text-gap-time"
                    type="number"
                    value={channelGuestTextGapTime}
                    min={0}
                    max={1000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextGapTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!Permission.isChannelMod(permissionLevel)}
                  />
                  {t('second')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={`${popupStyles['input-box']} ${settingStyles['header-bar']} ${popupStyles['row']}`}>
              <div className={popupStyles['label']}>{`${t('channel-management')} (${totalModerators})`}</div>
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
                  {filteredModerators.map((moderator) => {
                    // Variables
                    const {
                      userId: moderatorUserId,
                      name: moderatorName,
                      nickname: moderatorNickname,
                      gender: moderatorGender,
                      permissionLevel: moderatorPermissionLevel,
                      joinAt: moderatorJoinAt,
                      contribution: moderatorContribution,
                    } = moderator;
                    const isSelf = moderatorUserId === userId;
                    const isSuperior = permissionLevel > moderatorPermissionLevel;

                    // Handlers
                    const getContextMenuItems = () => [
                      {
                        id: 'direct-message',
                        label: t('direct-message'),
                        show: !isSelf,
                        onClick: () => Popup.handleOpenDirectMessage(userId, moderatorUserId),
                      },
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        onClick: () => Popup.handleOpenUserInfo(userId, moderatorUserId),
                      },
                      {
                        id: 'edit-nickname',
                        label: t('edit-nickname'),
                        show: (isSelf || (Permission.isServerAdmin(permissionLevel) && isSuperior)) && Permission.isMember(moderator.permissionLevel),
                        onClick: () => Popup.handleOpenEditNickname(moderatorUserId, serverId),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'block',
                        label: t('block'),
                        show: !isSelf && isSuperior && Permission.isServerAdmin(permissionLevel),
                        onClick: () => Popup.handleOpenBlockMember(moderatorUserId, serverId),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'member-management',
                        label: t('member-management'),
                        show: !isSelf && isSuperior && Permission.isMember(moderatorPermissionLevel),
                        icon: 'submenu',
                        hasSubmenu: true,
                        submenuItems: [
                          {
                            id: 'terminate-member',
                            label: t('terminate-member'),
                            show:
                              !isSelf &&
                              isSuperior &&
                              Permission.isMember(moderatorPermissionLevel) &&
                              !Permission.isServerOwner(moderatorPermissionLevel) &&
                              Permission.isServerAdmin(permissionLevel),
                            onClick: () => handleTerminateMember(moderatorUserId, serverId, moderatorName),
                          },
                          {
                            id: 'set-channel-mod',
                            label: Permission.isChannelMod(moderatorPermissionLevel) ? t('unset-channel-mod') : t('set-channel-mod'),
                            show: Permission.isChannelAdmin(permissionLevel) && !Permission.isChannelAdmin(moderatorPermissionLevel) && channelCategoryId !== null,
                            onClick: () =>
                              Permission.isChannelMod(moderatorPermissionLevel)
                                ? handleEditChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 2 })
                                : handleEditChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 3 }),
                          },
                          {
                            id: 'set-channel-admin',
                            label: Permission.isChannelAdmin(moderatorPermissionLevel) ? t('unset-channel-admin') : t('set-channel-admin'),
                            show: Permission.isServerAdmin(permissionLevel) && !Permission.isServerAdmin(moderatorPermissionLevel),
                            onClick: () =>
                              Permission.isChannelAdmin(moderatorPermissionLevel)
                                ? handleEditChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
                                : handleEditChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
                          },
                          {
                            id: 'set-server-admin',
                            label: Permission.isServerAdmin(moderatorPermissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
                            show: Permission.isServerOwner(permissionLevel) && !Permission.isServerOwner(moderatorPermissionLevel),
                            onClick: () =>
                              Permission.isServerAdmin(moderatorPermissionLevel)
                                ? handleEditServerPermission(moderatorUserId, serverId, { permissionLevel: 2 })
                                : handleEditServerPermission(moderatorUserId, serverId, { permissionLevel: 5 }),
                          },
                        ],
                      },
                    ];

                    return (
                      <tr
                        key={moderatorUserId}
                        className={`${selectedItemId === `member-${moderatorUserId}` ? popupStyles['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `member-${moderatorUserId}`) setSelectedItemId('');
                          else setSelectedItemId(`member-${moderatorUserId}`);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                        }}
                      >
                        <td style={{ width: `${memberColumnWidths[0]}px` }}>
                          <div className={`${permissionStyles[moderatorGender]} ${permissionStyles[`lv-${moderatorPermissionLevel}`]}`} />
                          <div className={`${popupStyles['name']} ${moderatorNickname ? popupStyles['highlight'] : ''}`}>{moderatorNickname || moderatorName}</div>
                        </td>
                        <td style={{ width: `${memberColumnWidths[1]}px` }}>{Language.getPermissionText(t, moderatorPermissionLevel)}</td>
                        <td style={{ width: `${memberColumnWidths[2]}px` }}>{moderatorContribution}</td>
                        <td style={{ width: `${memberColumnWidths[3]}px` }}>{new Date(moderatorJoinAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className={settingStyles['note-text']}>{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 6 ? {} : { display: 'none' }}>
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
                        <div className={popupStyles['resizer']} onPointerDown={(e) => handleBlockMemberColumnHandleDown(e, index)} onPointerMove={(e) => handleBlockMemberColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={settingStyles['table-container']}>
                  {filteredBlockMembers.map((member) => {
                    // Variables
                    const { userId: memberUserId, name: memberName, nickname: memberNickname, blockedUntil: memberBlockedUntil } = member;
                    const isSelf = memberUserId === userId;

                    // Handlers
                    const getContextMenuItems = () => [
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        show: !isSelf,
                        onClick: () => Popup.handleOpenUserInfo(userId, memberUserId),
                      },
                      {
                        id: 'unblock',
                        label: t('unblock'),
                        show: true,
                        onClick: () => handleUnblockUserFromChannel(memberUserId, memberName, serverId, channelId),
                      },
                    ];

                    return (
                      <tr
                        key={memberUserId}
                        className={`${selectedItemId === `blocked-${memberUserId}` ? popupStyles['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `blocked-${memberUserId}`) setSelectedItemId('');
                          else setSelectedItemId(`blocked-${memberUserId}`);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                        }}
                      >
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
      <div className={popupStyles['popup-footer']} style={Permission.isChannelMod(permissionLevel) ? {} : { display: 'none' }}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => handleEditChannel(serverId, channelId, ObjDiff(channel, channelData))}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popupStyles['popup-footer']} style={!Permission.isChannelMod(permissionLevel) ? {} : { display: 'none' }}>
        <div className={popupStyles['button']} onClick={handleClose}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;
