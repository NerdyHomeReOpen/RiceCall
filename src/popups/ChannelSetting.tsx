import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import ObjDiff from '@/utils/objDiff';
import Sorter from '@/utils/sorter';

import { MEMBER_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constant';

import popupStyles from '@/styles/popup.module.css';
import settingStyles from '@/styles/setting.module.css';
import permissionStyles from '@/styles/permission.module.css';

interface ChannelSettingPopupProps {
  server: Types.Server;
  channel: Types.Channel;
  channelMembers: Types.Member[];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ server, channel: channelData, channelMembers: channelMembersData }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Refs
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingModeratorColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);

  // States
  const [channel, setChannel] = useState<Types.Channel>(channelData);
  const [channelMembers, setChannelMembers] = useState<Types.Member[]>(channelMembersData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [moderatorSortDirection, setModeratorSortDirection] = useState<1 | -1>(-1);
  const [blockMemberSortDirection, setBlockMemberSortDirection] = useState<1 | -1>(-1);
  const [moderatorSortField, setModeratorSortField] = useState<keyof Types.Member>('permissionLevel');
  const [blockMemberSortField, setBlockMemberSortField] = useState<keyof Types.Member>('name');
  const [moderatorQuery, setModeratorQuery] = useState('');
  const [blockMemberQuery, setBlockMemberQuery] = useState('');
  const [moderatorColumnWidths, setModeratorColumnWidths] = useState<number[]>(MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
  const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>(BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));

  // Variables
  const { userId } = user;
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
  const isReadOnly = !Permission.isChannelMod(permissionLevel);
  const isLobby = serverLobbyId === channelId;
  const isReceptionLobby = serverReceptionLobbyId === channelId;
  const canSubmit = channelName.trim();

  const { totalModeratorsCount, sortedModerators } = useMemo(() => {
    const total = channelMembers.filter((m) => Permission.isChannelMod(m.permissionLevel) && !Permission.isServerAdmin(m.permissionLevel));
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(moderatorQuery.toLowerCase()) || m.name.toLowerCase().includes(moderatorQuery.toLowerCase()));
    const sorted = filtered.sort(Sorter(moderatorSortField, moderatorSortDirection));

    return { totalModeratorsCount: total.length, filteredModerators: filtered, sortedModerators: sorted };
  }, [channelMembers, moderatorQuery, moderatorSortField, moderatorSortDirection]);

  const { totalBlockMembersCount, sortedBlockMembers } = useMemo(() => {
    const total = channelMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now());
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(blockMemberQuery.toLowerCase()) || m.name.toLowerCase().includes(blockMemberQuery.toLowerCase()));
    const sorted = filtered.sort(Sorter(blockMemberSortField, blockMemberSortDirection));

    return { totalBlockMembersCount: total.length, filteredBlockMembers: filtered, sortedBlockMembers: sorted };
  }, [channelMembers, blockMemberQuery, blockMemberSortField, blockMemberSortDirection]);

  const settingPages = useMemo(
    () =>
      Permission.isChannelMod(permissionLevel)
        ? [
            t('channel-info'),
            t('channel-announcement'),
            t('access-permission'),
            t('speaking-permission'),
            t('text-permission'),
            `${t('channel-management')} (${totalModeratorsCount})`,
            `${t('blacklist-management')} (${totalBlockMembersCount})`,
          ]
        : channelVisibility !== 'readonly'
          ? [t('channel-info'), t('channel-announcement')]
          : [t('channel-info')],
    [channelVisibility, permissionLevel, t, totalModeratorsCount, totalBlockMembersCount],
  );

  // Handlers
  const handleModeratorSort = (field: keyof Types.Member) => {
    setModeratorSortField(field);
    setModeratorSortDirection((d) => (field === moderatorSortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleBlockMemberSort = (field: keyof Types.Member) => {
    setBlockMemberSortField(field);
    setBlockMemberSortDirection((d) => (field === blockMemberSortField ? (d === 1 ? -1 : 1) : -1));
  };

  const handleModeratorColumnHandleDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingModeratorColumn.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = moderatorColumnWidths[index];
  };

  const handleModeratorColumnHandleMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (!isResizingModeratorColumn.current) return;
    const deltaX = e.clientX - startXRef.current;
    const minWidth = MEMBER_MANAGEMENT_TABLE_FIELDS[index].minWidth;
    const maxWidth = minWidth * 2.5;
    setModeratorColumnWidths((prev) => {
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

  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleUserLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, userLimit: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)) }));
  };

  const handleVoiceModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChannel((prev) => ({ ...prev, voiceMode: e.target.value as Types.Channel['voiceMode'] }));
  };

  const handleQueueTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, queueTime: Math.max(10, Math.min(3600, parseInt(e.target.value) || 0)) }));
  };

  const handleBitrateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, bitrate: e.target.value === 'bitrate-64000' ? 64000 : 256000 }));
  };

  const handleShowPreviewBtnClick = () => {
    setShowPreview((prev) => !prev);
  };

  const handleAnnouncementChange = (value: string) => {
    setChannel((prev) => ({ ...prev, announcement: value }));
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, visibility: e.target.value as Types.Channel['visibility'] }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, password: e.target.value }));
  };

  const handleForbidGuestQueueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, forbidGuestQueue: e.target.checked }));
  };

  const handleForbidGuestVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, forbidGuestVoice: e.target.checked }));
  };

  const handleForbidTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, forbidText: e.target.checked }));
  };

  const handleForbidGuestTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, forbidGuestText: e.target.checked }));
  };

  const handleForbidGuestUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, forbidGuestUrl: e.target.checked }));
  };

  const handleGuestTextMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, guestTextMaxLength: Math.max(0, Math.min(3000, parseInt(e.target.value) || 0)) }));
  };

  const handleGuestTextWaitTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, guestTextWaitTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }));
  };

  const handleGuestTextGapTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannel((prev) => ({ ...prev, guestTextGapTime: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) }));
  };

  const handleModeratorQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModeratorQuery(e.target.value);
  };

  const handleBlockMemberQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlockMemberQuery(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    Popup.editChannel(serverId, channelId, ObjDiff(channel, channelData));
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const onPointerup = () => {
      isResizingModeratorColumn.current = false;
      isResizingBlockMemberColumn.current = false;
    };
    window.addEventListener('pointerup', onPointerup);
    return () => window.removeEventListener('pointerup', onPointerup);
  }, []);

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
              <div key={index} className={`${settingStyles['tab']} ${activeTabIndex === index ? settingStyles['active'] : ''}`} onClick={() => setActiveTabIndex(index)}>
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
                <input name="channel-name" type="text" value={isLobby ? t(`${channelName}`) : channelName} maxLength={32} disabled={isLobby} onChange={handleChannelNameChange} readOnly={isReadOnly} />
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
                  onChange={handleUserLimitChange}
                  readOnly={isReadOnly}
                />
              </div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('channel-mode')}</div>
                <div className={popupStyles['select-box']}>
                  <select value={channelVoiceMode} onChange={handleVoiceModeChange} datatype={isReadOnly ? 'read-only' : ''}>
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {channelVoiceMode === 'queue' && (
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('queue-time')}</div>
                  <input name="queue-time" type="number" value={channelQueueTime} min={10} max={3600} onChange={handleQueueTimeChange} readOnly={isReadOnly} />
                </div>
              )}
            </div>
          </div>
          <div className={settingStyles['separator']} />
          <div className={popupStyles['col']}>
            <div className={popupStyles['label']}>{t('channel-audio-quality')}</div>
            <div className={popupStyles['col']}>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="bitrate-64000" type="radio" checked={channelBitrate === 64000} onChange={handleBitrateChange} readOnly={isReadOnly} />
                  <div className={popupStyles['label']}>{t('chat-mode')}</div>
                </div>
                <div className={popupStyles['hint-text']}>{t('chat-mode-description')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="bitrate-256000" type="radio" checked={channelBitrate === 256000} onChange={handleBitrateChange} readOnly={isReadOnly} />
                  <div className={popupStyles['label']}>{t('entertainment-mode')}</div>
                </div>
                <div className={popupStyles['hint-text']}>{t('entertainment-mode-description')}</div>
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
            <AnnouncementEditor announcement={channelAnnouncement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('access-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channelVisibility === 'public'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('anyone-can-access-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channelVisibility === 'member'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-access-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channelVisibility === 'readonly'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('message-only-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channelVisibility === 'private'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('require-password-label')}</div>
              </div>
              {channelVisibility === 'private' && !isReadOnly && (
                <div className={popupStyles['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    value={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={handlePasswordChange}
                    readOnly={isReadOnly}
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
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbidGuestQueue" type="checkbox" checked={channelForbidGuestQueue} onChange={handleForbidGuestQueueChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-queue-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbidGuestVoice" type="checkbox" checked={channelForbidGuestVoice} onChange={handleForbidGuestVoiceChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-voice-label')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('text-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbid-text" type="checkbox" checked={channelForbidText} onChange={handleForbidTextChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-only-admin-text-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbid-guest-text" type="checkbox" checked={channelForbidGuestText} onChange={handleForbidGuestTextChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-text-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbid-guest-url" type="checkbox" checked={channelForbidGuestUrl} onChange={handleForbidGuestUrlChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-url-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>
                  {t('guest-text-max-length-label')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    value={channelGuestTextMaxLength}
                    min={0}
                    max={3000}
                    onChange={handleGuestTextMaxLengthChange}
                    style={{ width: '60px' }}
                    readOnly={isReadOnly}
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
                    onChange={handleGuestTextWaitTimeChange}
                    style={{ width: '60px' }}
                    readOnly={isReadOnly}
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
                    onChange={handleGuestTextGapTimeChange}
                    style={{ width: '60px' }}
                    readOnly={isReadOnly}
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
              <div className={popupStyles['label']}>{`${t('channel-management')} (${totalModeratorsCount})`}</div>
              <div className={settingStyles['search-box']}>
                <div className={settingStyles['search-icon']} />
                <input name="search-query" type="text" className={settingStyles['search-input']} placeholder={t('search-placeholder')} value={moderatorQuery} onChange={handleModeratorQueryChange} />
              </div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${moderatorColumnWidths[index]}px` }} onClick={() => handleModeratorSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${moderatorSortField === field.key ? (moderatorSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className={popupStyles['resizer']} onPointerDown={(e) => handleModeratorColumnHandleDown(e, index)} onPointerMove={(e) => handleModeratorColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={settingStyles['table-container']}>
                  {sortedModerators.map((moderator) => {
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
                    const getMemberManagementSubmenuItems = () =>
                      new CtxMenuBuilder()
                        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isSuperior }, () =>
                          Popup.terminateMember(moderatorUserId, serverId, moderatorName),
                        )
                        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isSuperior, channelCategoryId }, () =>
                          Permission.isChannelMod(moderatorPermissionLevel)
                            ? Popup.editChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 2 })
                            : Popup.editChannelPermission(moderatorUserId, serverId, channelId, { permissionLevel: 3 }),
                        )
                        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isSuperior, channelCategoryId }, () =>
                          Permission.isChannelAdmin(moderatorPermissionLevel)
                            ? Popup.editChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
                            : Popup.editChannelPermission(moderatorUserId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
                        )
                        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isSuperior }, () =>
                          Permission.isServerAdmin(moderatorPermissionLevel)
                            ? Popup.editServerPermission(moderatorUserId, serverId, { permissionLevel: 2 })
                            : Popup.editServerPermission(moderatorUserId, serverId, { permissionLevel: 5 }),
                        )
                        .build();

                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, moderatorUserId))
                        .addViewProfileOption(() => Popup.openUserInfo(userId, moderatorUserId))
                        .addEditNicknameOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openEditNickname(moderatorUserId, serverId))
                        .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(moderatorUserId, serverId))
                        .addSeparator()
                        .addMemberManagementOption(
                          { permissionLevel, targetPermissionLevel: moderatorPermissionLevel, isSelf, isSuperior, channelCategoryId },
                          () => {},
                          getMemberManagementSubmenuItems(),
                        )
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (selectedItemId === `member-${moderatorUserId}`) setSelectedItemId('');
                      else setSelectedItemId(`member-${moderatorUserId}`);
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={moderatorUserId} className={`${selectedItemId === `member-${moderatorUserId}` ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${moderatorColumnWidths[0]}px` }}>
                          <div className={`${permissionStyles[moderatorGender]} ${permissionStyles[`lv-${moderatorPermissionLevel}`]}`} />
                          <div className={`${popupStyles['name']} ${moderatorNickname ? popupStyles['highlight'] : ''}`}>{moderatorNickname || moderatorName}</div>
                        </td>
                        <td style={{ width: `${moderatorColumnWidths[1]}px` }}>{Language.getPermissionText(t, moderatorPermissionLevel)}</td>
                        <td style={{ width: `${moderatorColumnWidths[2]}px` }}>{moderatorContribution}</td>
                        <td style={{ width: `${moderatorColumnWidths[3]}px` }}>{new Date(moderatorJoinAt).toLocaleDateString()}</td>
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
                        .addUnblockUserFromChannelOption({ permissionLevel, isSelf }, () => Popup.unblockUserFromChannel(memberUserId, serverId, channelId, memberName))
                        .build();

                    // Functions
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
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
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

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;
