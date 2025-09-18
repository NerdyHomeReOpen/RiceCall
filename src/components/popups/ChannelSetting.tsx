import React, { useMemo, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, Member, Server, User, Permission } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Components
import AnnouncementEditor from '@/components/AnnouncementEditor';

// Utils
import Sorter from '@/utils/sorter';
import { getPermissionText } from '@/utils/language';
import { isMember, isServerAdmin, isChannelMod, isServerOwner, isChannelAdmin } from '@/utils/permission';

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

  // Destructuring
  const { permissionLevel: userPermissionLevel } = user;
  const { serverId, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId, permissionLevel: serverPermissionLevel } = server;
  const {
    channelId,
    name: channelName,
    announcement: channelAnnouncement,
    visibility: channelVisibility,
    password: channelPassword,
    userLimit: channelUserLimit,
    voiceMode: channelVoiceMode,
    order: channelOrder,
    forbidText: channelForbidText,
    forbidGuestText: channelForbidGuestText,
    forbidGuestVoice: channelForbidGuestVoice,
    forbidGuestQueue: channelForbidGuestQueue,
    forbidGuestUrl: channelForbidGuestUrl,
    guestTextMaxLength: channelGuestTextMaxLength,
    guestTextWaitTime: channelGuestTextWaitTime,
    guestTextGapTime: channelGuestTextGapTime,
    bitrate: channelBitrate,
    permissionLevel: channelPermissionLevel,
    categoryId: channelCategoryId,
  } = channel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(userPermissionLevel, serverPermissionLevel, channelPermissionLevel), [userPermissionLevel, serverPermissionLevel, channelPermissionLevel]);
  const isLobby = useMemo(() => serverLobbyId === channelId, [serverLobbyId, channelId]);
  const isReceptionLobby = useMemo(() => serverReceptionLobbyId === channelId, [serverReceptionLobbyId, channelId]);
  const totalModerators = useMemo(() => channelMembers.filter((m) => isChannelMod(m.permissionLevel) && !isServerAdmin(m.permissionLevel)).length, [channelMembers]);
  const canSubmit = useMemo(() => channelName.trim(), [channelName]);

  const settingPages = useMemo(
    () =>
      isChannelMod(permissionLevel)
        ? [t('channel-info'), t('channel-announcement'), t('access-permission'), t('speaking-permission'), t('text-permission'), t('channel-management')]
        : [t('channel-info'), t('channel-announcement'), t('access-permission'), t('speaking-permission'), t('text-permission')],
    [t, permissionLevel],
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

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Permission>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
  };

  const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
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

  const handleChannelUpdate = (...args: { channelId: string; update: Partial<Channel> }[]) => {
    const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
    setChannel((prev) => (update.has(`${prev.channelId}`) ? { ...prev, ...update.get(`${prev.channelId}`) } : prev));
  };

  const handleChannelMemberAdd = (...args: { data: Member }[]) => {
    const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
    setChannelMembers((prev) => prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`)).concat(args.map((i) => i.data)));
  };

  const handleChannelMemberUpdate = (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => {
    const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
    setChannelMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
  };

  const handleChannelMemberRemove = (...args: { userId: string; serverId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
    setChannelMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipc.socket.on('channelUpdate', handleChannelUpdate),
      ipc.socket.on('channelMemberAdd', handleChannelMemberAdd),
      ipc.socket.on('channelMemberUpdate', handleChannelMemberUpdate),
      ipc.socket.on('channelMemberRemove', handleChannelMemberRemove),
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
                  defaultValue={isLobby ? t(`${channelName}`) : channelName}
                  maxLength={32}
                  disabled={isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('user-limit')}</div>
                <input
                  name="user-limit"
                  type="number"
                  defaultValue={channelUserLimit}
                  min={0}
                  max={999}
                  disabled={channelVisibility === 'readonly' || isLobby}
                  onChange={(e) => setChannel((prev) => ({ ...prev, userLimit: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
              </div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('channel-mode')}</div>
                <div className={popup['select-box']}>
                  <select
                    defaultValue={channelVoiceMode}
                    onChange={(e) => setChannel((prev) => ({ ...prev, voiceMode: e.target.value as Channel['voiceMode'] }))}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                  >
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
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
                    defaultChecked={channelBitrate === 64000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 64000 }))}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                    defaultChecked={channelBitrate === 256000}
                    onChange={() => setChannel((prev) => ({ ...prev, bitrate: 256000 }))}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                  defaultChecked={channelVisibility === 'public'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'public' }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('anyone-can-access-label')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  defaultChecked={channelVisibility === 'member'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'member' }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('forbid-guest-access-label')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  defaultChecked={channelVisibility === 'readonly'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'readonly' }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('message-only-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  defaultChecked={channelVisibility === 'private'}
                  onChange={() => setChannel((prev) => ({ ...prev, visibility: 'private' }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('require-password-label')}</div>
              </div>
              {channelVisibility === 'private' && isChannelMod(permissionLevel) && (
                <div className={popup['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    defaultValue={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={(e) => setChannel((prev) => ({ ...prev, password: e.target.value }))}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                  defaultChecked={channelForbidGuestQueue}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestQueue: e.target.checked }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('forbid-guest-queue-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbidGuestVoice"
                  type="checkbox"
                  defaultChecked={channelForbidGuestVoice}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestVoice: e.target.checked }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                  defaultChecked={channelForbidText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidText: e.target.checked }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('forbid-only-admin-text-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-guest-text"
                  type="checkbox"
                  defaultChecked={channelForbidGuestText}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestText: e.target.checked }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('forbid-guest-text-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-guest-url"
                  type="checkbox"
                  defaultChecked={channelForbidGuestUrl}
                  onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestUrl: e.target.checked }))}
                  datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
                />
                <div className={popup['label']}>{t('forbid-guest-url-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-max-length-label')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    defaultValue={channelGuestTextMaxLength}
                    min={0}
                    max={9999}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextMaxLength: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                    defaultValue={channelGuestTextWaitTime}
                    min={0}
                    max={9999}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextWaitTime: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                    defaultValue={channelGuestTextGapTime}
                    min={0}
                    max={9999}
                    onChange={(e) => setChannel((prev) => ({ ...prev, guestTextGapTime: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)) }))}
                    style={{ width: '60px' }}
                    datatype={!isChannelMod(permissionLevel) ? 'read-only' : ''}
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
                    {memberTableFields.map((field) => (
                      <th key={field.field} onClick={() => handleMemberSort(field.field as keyof Member)}>
                        {`${field.name} ${sortField === field.field ? (sortDirection === 1 ? '↑' : '↓') : ''}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={setting['table-container']}>
                  {filteredModerators.map((moderator) => {
                    const {
                      userId: memberUserId,
                      name: memberName,
                      nickname: memberNickname,
                      gender: memberGender,
                      permissionLevel: memberPermission,
                      contribution: memberContribution,
                      createdAt: memberJoinDate,
                    } = moderator;
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
                                  id: 'set-channel-mod',
                                  label: isChannelMod(memberPermission) ? t('unset-channel-mod') : t('set-channel-mod'),
                                  show: canUpdatePermission && isChannelAdmin(permissionLevel) && !isChannelAdmin(memberPermission) && channelCategoryId !== null,
                                  onClick: () =>
                                    isChannelMod(memberPermission)
                                      ? handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 2 })
                                      : handleEditChannelPermission(memberUserId, serverId, channelId, { permissionLevel: 3 }),
                                },
                                {
                                  id: 'set-channel-admin',
                                  label: isChannelAdmin(memberPermission) ? t('unset-channel-admin') : t('set-channel-admin'),
                                  show: canUpdatePermission && isServerAdmin(permissionLevel) && !isServerAdmin(memberPermission),
                                  onClick: () =>
                                    isChannelAdmin(memberPermission)
                                      ? handleEditChannelPermission(memberUserId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
                                      : handleEditChannelPermission(memberUserId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
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
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']} style={isChannelMod(permissionLevel) ? {} : { display: 'none' }}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleEditChannel(serverId, channelId, {
              name: channelName,
              announcement: channelAnnouncement,
              password: channelPassword,
              order: channelOrder,
              userLimit: channelUserLimit,
              guestTextMaxLength: channelGuestTextMaxLength,
              guestTextWaitTime: channelGuestTextWaitTime,
              guestTextGapTime: channelGuestTextGapTime,
              bitrate: channelBitrate,
              forbidText: !!channelForbidText,
              forbidGuestText: !!channelForbidGuestText,
              forbidGuestVoice: !!channelForbidGuestVoice,
              forbidGuestQueue: !!channelForbidGuestQueue,
              forbidGuestUrl: !!channelForbidGuestUrl,
              visibility: channelVisibility,
              voiceMode: channelVoiceMode,
            });
            handleClose();
          }}
        >
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
