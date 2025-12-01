import React, { useMemo, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/setting.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Member, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Components
import AnnouncementEditor from '@/components/AnnouncementEditor';

// Utils
import { handleOpenAlertDialog, handleOpenDirectMessage, handleOpenUserInfo, handleOpenEditNickname, handleOpenBlockMember } from '@/utils/popup';
import Sorter from '@/utils/sorter';
import { getPermissionText } from '@/utils/language';
import { isMember, isServerAdmin, isChannelMod, isServerOwner, isChannelAdmin } from '@/utils/permission';
import { objDiff } from '@/utils/objDiff';

interface ChannelSettingPopupProps {
  userId: User['userId'];
  user: User;
  server: Server;
  channel: Channel;
  channelMembers: Member[];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ userId, user, server, channel: channelData, channelMembers: channelMembersData }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // States
  const [channel, setChannel] = useState<Channel>(channelData);
  const [channelMembers, setChannelMembers] = useState<Member[]>(channelMembersData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
  const [sortField, setSortField] = useState<string>('contribution');
  const [searchText, setSearchText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [memberColumnWidths, setMemberColumnWidths] = useState<number[]>([150, 90, 80, 90]);
  const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>([150, 150]);

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
  const totalModerators = useMemo(() => channelMembers.filter((m) => isChannelMod(m.permissionLevel) && !isServerAdmin(m.permissionLevel)).length, [channelMembers]);
  const totalBlockMembers = useMemo(() => channelMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now()).length, [channelMembers]);
  const canSubmit = channelName.trim();
  const filteredModerators = useMemo(
    () =>
      channelMembers
        .filter(
          (m) =>
            isChannelMod(m.permissionLevel) &&
            !isServerAdmin(m.permissionLevel) &&
            (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
        )
        .sort(Sorter(sortField as keyof Member, sortDirection)),
    [channelMembers, searchText, sortField, sortDirection],
  );

  const filteredBlockMembers = useMemo(
    () =>
      channelMembers
        .filter(
          (m) => (m.blockedUntil === -1 || m.blockedUntil > Date.now()) && (m.nickname?.toLowerCase().includes(searchText.toLowerCase()) || m.name.toLowerCase().includes(searchText.toLowerCase())),
        )
        .sort(Sorter(sortField as keyof Member, sortDirection)),
    [channelMembers, searchText, sortField, sortDirection],
  );

  const settingPages = isChannelMod(permissionLevel)
    ? [
      t('channel-info'),
      t('channel-announcement'),
      t('access-permission'),
      t('speaking-permission'),
      t('text-permission'),
      `${t('channel-management')} (${totalModerators})`,
      `${t('blacklist-management')} (${totalBlockMembers})`,
    ]
    : [t('channel-info'), t('channel-announcement')];

  const memberTableFields = [
    { name: t('name'), field: 'name' },
    { name: t('permission'), field: 'permissionLevel' },
    { name: t('contribution'), field: 'contribution' },
    { name: t('join-date'), field: 'createdAt' },
  ];

  const blockMemberTableFields = [
    { name: t('name'), field: 'name' },
    { name: t('unblock-date'), field: 'isBlocked' },
  ];

  const formatDate = (value: number | string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleColumnResize =
    (index: number, columnWidths: number[], setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>, defaultWidths: number[]) =>
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidths = [...columnWidths];
        const minWidth = defaultWidths[index] ?? 60;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          setColumnWidths((prev) => {
            const next = [...prev];
            const base = startWidths[index] ?? prev[index] ?? minWidth;
            const maxWidth = minWidth * 2.5;
            next[index] = Math.max(minWidth, Math.min(maxWidth, base + deltaX));
            return next;
          });
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
    ipc.window.close();
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleUnblockUserFromChannel = (userId: User['userId'], userName: User['name'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromChannel', { userId, serverId, channelId }));
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleSort = <T extends Member>(field: keyof T) => {
    setSortField(String(field));
    setSortDirection((d) => (field === sortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleMemberSort = (field: keyof Member) => {
    handleSort(field);
  };

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Channel> }[]) => {
      const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
      setChannel((prev) => (update.has(`${prev.channelId}`) ? { ...prev, ...update.get(`${prev.channelId}`) } : prev));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberAdd', (...args: { data: Member }[]) => {
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setChannelMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelMemberUpdate', (...args: { userId: string; serverId: string; channelId: string; update: Partial<Member> }[]) => {
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

        {/* Basic Info */}
        <div className={setting['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('channel-name')}</div>
                <input
                  name="channel-name"
                  type="text"
                  value={isLobby ? t(`${channelName}`) : channelName}
                  maxLength={32}
                  disabled={isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('user-limit')}</div>
                <input
                  name="user-limit"
                  type="number"
                  value={channelUserLimit}
                  min={0}
                  max={999}
                  disabled={channelVisibility === 'readonly' || isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, userLimit: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
              </div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('channel-mode')}</div>
                <div className={popup['select-box']}>
                  <select
                    value={channelVoiceMode}
                    onChange={(e) => setChannel((prev) => ({ ...prev, voiceMode: e.target.value as Channel['voiceMode'] }))}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                  >
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {channelVoiceMode === 'queue' && (
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('queue-time')}</div>
                  <input
                    name="queue-time"
                    type="number"
                    value={channelQueueTime}
                    min={10}
                    max={3600}
                    onChange={(e) => setChannel((prev) => ({ ...prev, queueTime: Math.max(10, Math.min(3600, parseInt(e.target.value) || 0)) }))}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={setting['separator']} />
          <div className={popup['col']}>
            <div className={popup['label']}>{t('channel-audio-quality')}</div>
            <div className={popup['col']}>
              <div>
                <div className={`${popup['input-box']} ${popup['row']}`}>
                  <input
                    name="bitrate-64000"
                    type="radio"
                    checked={channelBitrate === 64000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 64000 }))}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                  <div className={popup['label']}>{t('chat-mode')}</div>
                </div>
                <div className={popup['hint-text']}>{t('chat-mode-description')}</div>
              </div>
              <div>
                <div className={`${popup['input-box']} ${popup['row']}`}>
                  <input
                    name="bitrate-256000"
                    type="radio"
                    checked={channelBitrate === 256000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 256000 }))}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                  <div className={popup['label']}>{t('entertainment-mode')}</div>
                </div>
                <div className={popup['hint-text']}>{t('entertainment-mode-description')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Announcement */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Header */}
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{t('input-announcement')}</div>
              {isChannelMod(permissionLevel) && (
                <div className={popup['button']} onClick={() => setShowPreview((prev) => !prev)}>
                  {showPreview ? t('edit') : t('preview')}
                </div>
              )}
            </div>
            <AnnouncementEditor
              announcement={channelAnnouncement}
              showPreview={showPreview || !isChannelMod(permissionLevel)}
              onChange={(value) => setChannel((prev) => ({ ...prev, announcement: value }))}
            />
          </div>
        </div>

        {/* Access Permissions */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('access-permission')}</div>
            </div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'public'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'public' }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('anyone-can-access-label')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'member'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'member' }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-guest-access-label')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'readonly'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'readonly' }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('message-only-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'private'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'private' }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('require-password-label')}</div>
              </div>
              {channelVisibility === 'private' && isChannelMod(permissionLevel) && (
                <div className={popup['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    value={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={(e) => setChannel((prev) => ({ ...prev, password: e.target.value }))}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Speaking Permissions */}
        <div className={setting['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('speaking-permission')}</div>
            </div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbidGuestQueue"
                  type="checkbox"
                  checked={channelForbidGuestQueue}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestQueue: e.target.checked }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-guest-queue-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbidGuestVoice"
                  type="checkbox"
                  checked={channelForbidGuestVoice}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestVoice: e.target.checked }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-guest-voice-label')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Permissions */}
        <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('text-permission')}</div>
            </div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-text"
                  type="checkbox"
                  checked={channelForbidText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidText: e.target.checked }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-only-admin-text-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-guest-text"
                  type="checkbox"
                  checked={channelForbidGuestText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestText: e.target.checked }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-guest-text-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-guest-url"
                  type="checkbox"
                  checked={channelForbidGuestUrl}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestUrl: e.target.checked }))}
                  readOnly={!isChannelMod(permissionLevel)}
                />
                <div className={popup['label']}>{t('forbid-guest-url-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-max-length-label')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    value={channelGuestTextMaxLength}
                    min={0}
                    max={3000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextMaxLength: Math.max(0, Math.min(3000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                  {t('characters')}
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-wait-time-label')}
                  <input
                    name="guest-text-wait-time"
                    type="number"
                    value={channelGuestTextWaitTime}
                    min={0}
                    max={1000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextWaitTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                  {t('second')}
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-gap-time-label')}
                  <input
                    name="guest-text-gap-time"
                    type="number"
                    value={channelGuestTextGapTime}
                    min={0}
                    max={1000}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextGapTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    readOnly={!isChannelMod(permissionLevel)}
                  />
                  {t('second')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Management */}
        <div className={setting['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{`${t('channel-management')} (${totalModerators})`}</div>
              <div className={setting['search-box']}>
                <div className={setting['search-icon']}></div>
                <input name="search-query" type="text" className={setting['search-input']} placeholder={t('search-placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {memberTableFields.map((field, index) => (
                      <th
                        key={field.field}
                        style={{ flex: `0 0 ${memberColumnWidths[index] ?? [150, 90, 80, 90][index]}px` }}
                      >
                        <div
                          className={setting['th-content']}
                          onClick={() => handleMemberSort(field.field as keyof Member)}
                        >
                          {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        </div>
                        <div
                          className={setting['col-resizer']}
                          onMouseDown={handleColumnResize(index, memberColumnWidths, setMemberColumnWidths, [150, 90, 80, 90])}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['table-container']}>
                  {filteredModerators.map((moderator) => {
                    // Variables
                    const isUser = moderator.userId === userId;
                    const isSuperior = permissionLevel > moderator.permissionLevel;
                    const canUpdatePermission = !isUser && isSuperior && isMember(moderator.permissionLevel);

                    // Handlers
                    const getContextMenuItems = () => [
                      {
                        id: 'direct-message',
                        label: t('direct-message'),
                        show: !isUser,
                        onClick: () => handleOpenDirectMessage(userId, moderator.userId),
                      },
                      {
                        id: 'view-profile',
                        label: t('view-profile'),
                        onClick: () => handleOpenUserInfo(userId, moderator.userId),
                      },
                      {
                        id: 'edit-nickname',
                        label: t('edit-nickname'),
                        show: isMember(moderator.permissionLevel) && (isUser || (isServerAdmin(permissionLevel) && isSuperior)),
                        onClick: () => handleOpenEditNickname(moderator.userId, serverId),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'block',
                        label: t('block'),
                        show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
                        onClick: () => handleOpenBlockMember(moderator.userId, serverId),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'member-management',
                        label: t('member-management'),
                        show: !isUser && isMember(moderator.permissionLevel) && isSuperior,
                        icon: 'submenu',
                        hasSubmenu: true,
                        submenuItems: [
                          {
                            id: 'terminate-member',
                            label: t('terminate-member'),
                            show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(moderator.permissionLevel) && !isServerOwner(moderator.permissionLevel),
                            onClick: () => handleTerminateMember(moderator.userId, serverId, moderator.name),
                          },
                          {
                            id: 'set-channel-mod',
                            label: isChannelMod(moderator.permissionLevel) ? t('unset-channel-mod') : t('set-channel-mod'),
                            show: canUpdatePermission && isChannelAdmin(permissionLevel) && !isChannelAdmin(moderator.permissionLevel) && channelCategoryId !== null,
                            onClick: () =>
                              isChannelMod(moderator.permissionLevel)
                                ? handleEditChannelPermission(moderator.userId, serverId, channelId, { permissionLevel: 2 })
                                : handleEditChannelPermission(moderator.userId, serverId, channelId, { permissionLevel: 3 }),
                          },
                          {
                            id: 'set-channel-admin',
                            label: isChannelAdmin(moderator.permissionLevel) ? t('unset-channel-admin') : t('set-channel-admin'),
                            show: canUpdatePermission && isServerAdmin(permissionLevel) && !isServerAdmin(moderator.permissionLevel),
                            onClick: () =>
                              isChannelAdmin(moderator.permissionLevel)
                                ? handleEditChannelPermission(moderator.userId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
                                : handleEditChannelPermission(moderator.userId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
                          },
                          {
                            id: 'set-server-admin',
                            label: isServerAdmin(moderator.permissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
                            show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(moderator.permissionLevel),
                            onClick: () =>
                              isServerAdmin(moderator.permissionLevel)
                                ? handleEditServerPermission(moderator.userId, serverId, { permissionLevel: 2 })
                                : handleEditServerPermission(moderator.userId, serverId, { permissionLevel: 5 }),
                          },
                        ],
                      },
                    ];

                    return (
                      <tr
                        key={moderator.userId}
                        className={`${selectedItemId === `member-${moderator.userId}` ? popup['selected'] : ''}`}
                        onClick={() => {
                          if (selectedItemId === `member-${moderator.userId}`) setSelectedItemId('');
                          else setSelectedItemId(`member-${moderator.userId}`);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                        }}
                      >
                        <td style={{ flex: `0 0 ${memberColumnWidths[0] ?? 150}px` }}>
                          <div className={`${permission[moderator.gender]} ${permission[`lv-${moderator.permissionLevel}`]}`} />
                          <div className={`${popup['name']} ${moderator.nickname ? popup['highlight'] : ''}`}>{moderator.nickname || moderator.name}</div>
                        </td>
                        <td style={{ flex: `0 0 ${memberColumnWidths[1] ?? 90}px` }}>{getPermissionText(t, moderator.permissionLevel)}</td>
                        <td style={{ flex: `0 0 ${memberColumnWidths[2] ?? 80}px` }}>{moderator.contribution}</td>
                        <td style={{ flex: `0 0 ${memberColumnWidths[3] ?? 90}px` }}>{formatDate(moderator.createdAt)}</td>
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
        <div className={setting['right']} style={activeTabIndex === 6 ? {} : { display: 'none' }}>
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
                    {blockMemberTableFields.map((field, index) => (
                      <th
                        key={field.field}
                        style={{ flex: `0 0 ${blockMemberColumnWidths[index] ?? [150, 150][index]}px` }}
                      >
                        <div
                          className={setting['th-content']}
                          onClick={() => handleMemberSort(field.field as keyof Member)}
                        >
                          {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        </div>
                        <div
                          className={setting['col-resizer']}
                          onMouseDown={handleColumnResize(index, blockMemberColumnWidths, setBlockMemberColumnWidths, [150, 150])}
                        />
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
                        onClick: () => handleUnblockUserFromChannel(member.userId, member.name, serverId, channelId),
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
                        <td style={{ flex: `0 0 ${blockMemberColumnWidths[0] ?? 150}px` }}>{member.nickname || member.name}</td>
                        <td style={{ flex: `0 0 ${blockMemberColumnWidths[1] ?? 150}px` }}>{member.blockedUntil === -1 ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}</td>
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
      <div className={popup['popup-footer']} style={isChannelMod(permissionLevel) ? {} : { display: 'none' }}>
        <div className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => handleEditChannel(serverId, channelId, objDiff(channel, channelData))}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={!isChannelMod(permissionLevel) ? {} : { display: 'none' }}>
        <div className={popup['button']} onClick={handleClose}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;
