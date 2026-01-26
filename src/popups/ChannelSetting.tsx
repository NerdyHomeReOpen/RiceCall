import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  const dispatch = useAppDispatch();

  // Refs
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingModeratorColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  // States
  const [channel, setChannel] = useState<Types.Channel>(channelData);
  const [channelMembers, setChannelMembers] = useState<Types.Member[]>(channelMembersData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [moderatorSortDirection, setModeratorSortDirection] = useState<1 | -1>(-1);
  const [blockMemberSortDirection, setBlockMemberSortDirection] = useState<1 | -1>(-1);
  const [moderatorSortField, setModeratorSortField] = useState<keyof Types.Member>('permissionLevel');
  const [blockMemberSortField, setBlockMemberSortField] = useState<keyof Types.Member>('name');
  const [moderatorQuery, setModeratorQuery] = useState('');
  const [blockMemberQuery, setBlockMemberQuery] = useState('');
  const [moderatorColumnWidths, setModeratorColumnWidths] = useState<number[]>(MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));
  const [blockMemberColumnWidths, setBlockMemberColumnWidths] = useState<number[]>(BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS.map((field) => field.minWidth ?? 0));

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, server.permissionLevel, channel.permissionLevel);
  const isReadOnly = !Permission.isChannelMod(permissionLevel);
  const isLobby = server.lobbyId === channel.channelId;
  const isReceptionLobby = server.receptionLobbyId === channel.channelId;
  const canSubmit = channel.name.trim();

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
        : isReadOnly
          ? [t('channel-info'), t('channel-announcement')]
          : [t('channel-info')],
    [isReadOnly, permissionLevel, t, totalModeratorsCount, totalBlockMembersCount],
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
    Popup.editChannel(server.serverId, channel.channelId, ObjDiff(channel, channel));
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
      setChannelMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}#${channel.channelId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}#${channel.channelId}`) } : m)));
    });
    return () => unsub();
  }, [channel.channelId]);

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
                <input
                  name="channel-name"
                  type="text"
                  value={isLobby ? t(`${channel.name}`) : channel.name}
                  maxLength={32}
                  disabled={isLobby}
                  onChange={handleChannelNameChange}
                  readOnly={isReadOnly}
                />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('user-limit')}</div>
                <input name="user-limit" type="number" value={channel.userLimit} min={0} max={999} disabled={isReadOnly || isLobby} onChange={handleUserLimitChange} readOnly={isReadOnly} />
              </div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('channel-mode')}</div>
                <div className={popupStyles['select-box']}>
                  <select value={channel.voiceMode} onChange={handleVoiceModeChange} datatype={isReadOnly ? 'read-only' : ''}>
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {channel.voiceMode === 'queue' && (
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('queue-time')}</div>
                  <input name="queue-time" type="number" value={channel.queueTime} min={10} max={3600} onChange={handleQueueTimeChange} readOnly={isReadOnly} />
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
                  <input name="bitrate-64000" type="radio" checked={channel.bitrate === 64000} onChange={handleBitrateChange} readOnly={isReadOnly} />
                  <div className={popupStyles['label']}>{t('chat-mode')}</div>
                </div>
                <div className={popupStyles['hint-text']}>{t('chat-mode-description')}</div>
              </div>
              <div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="bitrate-256000" type="radio" checked={channel.bitrate === 256000} onChange={handleBitrateChange} readOnly={isReadOnly} />
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
            <AnnouncementEditor announcement={channel.announcement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('access-permission')}</div>
            </div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channel.visibility === 'public'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('anyone-can-access-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channel.visibility === 'member'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-access-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channel.visibility === 'readonly'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('message-only-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" checked={channel.visibility === 'private'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('require-password-label')}</div>
              </div>
              {channel.visibility === 'private' && !isReadOnly && (
                <div className={popupStyles['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    value={channel.password}
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
                <input name="forbidGuestQueue" type="checkbox" checked={channel.forbidGuestQueue} onChange={handleForbidGuestQueueChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-queue-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbidGuestVoice" type="checkbox" checked={channel.forbidGuestVoice} onChange={handleForbidGuestVoiceChange} readOnly={isReadOnly} />
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
                <input name="forbid-text" type="checkbox" checked={channel.forbidText} onChange={handleForbidTextChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-only-admin-text-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbid-guest-text" type="checkbox" checked={channel.forbidGuestText} onChange={handleForbidGuestTextChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-text-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="forbid-guest-url" type="checkbox" checked={channel.forbidGuestUrl} onChange={handleForbidGuestUrlChange} readOnly={isReadOnly} />
                <div className={popupStyles['label']}>{t('forbid-guest-url-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>
                  {t('guest-text-max-length-label')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    value={channel.guestTextMaxLength}
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
                    value={channel.guestTextWaitTime}
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
                    value={channel.guestTextGapTime}
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
                    const isSelf = moderator.userId === user.userId;
                    const isLowerLevel = moderator.permissionLevel < permissionLevel;
                    const isSelected = selectedItemId === `member-${moderator.userId}`;

                    // Handlers
                    const getMemberManagementSubmenuItems = () =>
                      new CtxMenuBuilder()
                        .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
                          Popup.terminateMember(moderator.userId, server.serverId, moderator.name),
                        )
                        .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
                          Permission.isChannelMod(moderator.permissionLevel)
                            ? Popup.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 2 })
                            : Popup.editChannelPermission(moderator.userId, server.serverId, channel.channelId, { permissionLevel: 3 }),
                        )
                        .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId }, () =>
                          Permission.isChannelAdmin(moderator.permissionLevel)
                            ? Popup.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 2 })
                            : Popup.editChannelPermission(moderator.userId, server.serverId, channel.categoryId || channel.channelId, { permissionLevel: 4 }),
                        )
                        .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
                          Permission.isServerAdmin(moderator.permissionLevel)
                            ? Popup.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 2 })
                            : Popup.editServerPermission(moderator.userId, server.serverId, { permissionLevel: 5 }),
                        )
                        .build();

                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, moderator.userId))
                        .addViewProfileOption(() => Popup.openUserInfo(user.userId, moderator.userId))
                        .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openEditNickname(moderator.userId, server.serverId))
                        .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openBlockMember(moderator.userId, server.serverId))
                        .addSeparator()
                        .addMemberManagementOption(
                          { permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId: channel.categoryId },
                          () => {},
                          getMemberManagementSubmenuItems(),
                        )
                        .build();

                    // Handlers
                    const handleClick = () => {
                      if (isSelected) dispatch(setSelectedItemId(null));
                      else dispatch(setSelectedItemId(`member-${moderator.userId}`));
                    };

                    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const { clientX: x, clientY: y } = e;
                      showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                    };

                    return (
                      <tr key={moderator.userId} className={`${isSelected ? popupStyles['selected'] : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
                        <td style={{ width: `${moderatorColumnWidths[0]}px` }}>
                          <div className={`${permissionStyles[moderator.gender]} ${permissionStyles[`lv-${moderator.permissionLevel}`]}`} />
                          <div className={`${popupStyles['name']} ${moderator.nickname ? popupStyles['highlight'] : ''}`}>{moderator.nickname || moderator.name}</div>
                        </td>
                        <td style={{ width: `${moderatorColumnWidths[1]}px` }}>{Language.getPermissionText(t, moderator.permissionLevel)}</td>
                        <td style={{ width: `${moderatorColumnWidths[2]}px` }}>{moderator.contribution}</td>
                        <td style={{ width: `${moderatorColumnWidths[3]}px` }}>{new Date(moderator.joinAt).toLocaleDateString()}</td>
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
                    const isSelf = member.userId === user.userId;
                    const isSelected = selectedItemId === `blocked-${member.userId}`;
                    const isBlockedPermanently = member.blockedUntil === -1;

                    // Functions
                    const getContextMenuItems = () =>
                      new CtxMenuBuilder()
                        .addViewProfileOption(() => Popup.openUserInfo(user.userId, member.userId))
                        .addUnblockUserFromChannelOption({ permissionLevel, isSelf }, () => Popup.unblockUserFromChannel(member.userId, server.serverId, channel.channelId, member.name))
                        .build();

                    // Functions
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
                        <td style={{ width: `${blockMemberColumnWidths[1]}px` }}>{isBlockedPermanently ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}</td>
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
