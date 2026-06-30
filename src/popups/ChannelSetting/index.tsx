import React, { useMemo, useState, useEffect, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { editChannel, openBlockMember, editChannelPermission, editServerPermission, openDirectMessage, openEditNickname, openUserInfo, unblockUserFromChannel, terminateMember } from '@/services';

import { MEMBER_MANAGEMENT_TABLE_FIELDS, BLOCK_MEMBER_MANAGEMENT_TABLE_FIELDS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import AnnouncementEditor from '@/components/AnnouncementEditor';

import ContextMenu from '@/utils/contextMenu';
import { objDiff, sorter, getPermissionText } from '@/utils';

import styles from './ChannelSetting.module.css';

interface ChannelSettingPopupProps {
  id: string;
  server: Types.Server;
  channel: Types.Channel;
  channelMembers: Types.Member[];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ id, server, channel: channelData, channelMembers: channelMembersData }) => {
  const { t } = useTranslation();

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingModeratorColumn = useRef<boolean>(false);
  const isResizingBlockMemberColumn = useRef<boolean>(false);

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);

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

  const permissionLevel = Math.max(userPermissionLevel, server.permissionLevel, channel.permissionLevel);
  const isReadOnly = permissionLevel < Types.Permission.ChannelMod;
  const isLobby = server.lobbyId === channel.channelId;
  const isReceptionLobby = server.receptionLobbyId === channel.channelId;
  const canSubmit = channel.name.trim();

  const { totalModeratorsCount, sortedModerators } = useMemo(() => {
    const total = channelMembers.filter((m) => m.permissionLevel >= Types.Permission.ChannelMod && m.permissionLevel < Types.Permission.ServerAdmin);
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(moderatorQuery.toLowerCase()) || m.name.toLowerCase().includes(moderatorQuery.toLowerCase()));
    const sorted = filtered.sort(sorter(moderatorSortField, moderatorSortDirection));
    return { totalModeratorsCount: total.length, filteredModerators: filtered, sortedModerators: sorted };
  }, [channelMembers, moderatorQuery, moderatorSortField, moderatorSortDirection]);

  const { totalBlockMembersCount, sortedBlockMembers } = useMemo(() => {
    const total = channelMembers.filter((m) => m.blockedUntil === -1 || m.blockedUntil > Date.now());
    const filtered = total.filter((m) => m.nickname?.toLowerCase().includes(blockMemberQuery.toLowerCase()) || m.name.toLowerCase().includes(blockMemberQuery.toLowerCase()));
    const sorted = filtered.sort(sorter(blockMemberSortField, blockMemberSortDirection));
    return { totalBlockMembersCount: total.length, filteredBlockMembers: filtered, sortedBlockMembers: sorted };
  }, [channelMembers, blockMemberQuery, blockMemberSortField, blockMemberSortDirection]);

  const settingPages = useMemo(
    () =>
      permissionLevel >= Types.Permission.ChannelMod
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
    editChannel(server.serverId, channel.channelId, objDiff(channel, channelData));
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  useEffect(() => {
    const handlePointerUp = () => {
      isResizingModeratorColumn.current = false;
      isResizingBlockMemberColumn.current = false;
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
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
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-sidebar">
          <div className="popup-sidebar-tabs">
            {settingPages.map((title, index) => (
              <div key={index} className={`popup-sidebar-tab ${activeTabIndex === index ? 'active' : ''}`} onClick={() => setActiveTabIndex(index)}>
                {title}
              </div>
            ))}
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="row">
              <div className="input-box col">
                <div className="label">{t('channel-name')}</div>
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
              <div className="input-box col">
                <div className="label">{t('user-limit')}</div>
                <input name="user-limit" type="number" value={channel.userLimit} min={0} max={999} disabled={isReadOnly || isLobby} onChange={handleUserLimitChange} readOnly={isReadOnly} />
              </div>
            </div>
            <div className="row">
              <div className="input-box col">
                <div className="label">{t('channel-mode')}</div>
                <div className="select-box">
                  <select value={channel.voiceMode} onChange={handleVoiceModeChange} datatype={isReadOnly ? 'read-only' : ''}>
                    <option value="free">{t('free-speech')}</option>
                    <option value="admin">{t('admin-speech')}</option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {channel.voiceMode === 'queue' && (
                <div className="input-box col">
                  <div className="label">{t('queue-time')}</div>
                  <input name="queue-time" type="number" value={channel.queueTime} min={10} max={3600} onChange={handleQueueTimeChange} readOnly={isReadOnly} />
                </div>
              )}
            </div>
          </div>
          <div className={styles['separator']} />
          <div className="col">
            <div className="label">{t('channel-audio-quality')}</div>
            <div className="col">
              <div>
                <div className="input-box row">
                  <input name="bitrate-64000" type="radio" checked={channel.bitrate === 64000} onChange={handleBitrateChange} readOnly={isReadOnly} />
                  <div className="label">{t('chat-mode')}</div>
                </div>
                <div className="hint-text">{t('chat-mode-description')}</div>
              </div>
              <div>
                <div className="input-box row">
                  <input name="bitrate-256000" type="radio" checked={channel.bitrate === 256000} onChange={handleBitrateChange} readOnly={isReadOnly} />
                  <div className="label">{t('entertainment-mode')}</div>
                </div>
                <div className="hint-text">{t('entertainment-mode-description')}</div>
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
            <AnnouncementEditor announcement={channel.announcement} showPreview={showPreview || isReadOnly} onChange={handleAnnouncementChange} />
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="label-header">
              <div className="label">{t('access-permission')}</div>
            </div>
            <div className="col">
              <div className={`input-box row ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" value="public" checked={channel.visibility === 'public'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className="label">{t('anyone-can-access-label')}</div>
              </div>
              <div className={`input-box row ${isLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" value="member" checked={channel.visibility === 'member'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-guest-access-label')}</div>
              </div>
              <div className={`input-box row ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" value="readonly" checked={channel.visibility === 'readonly'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className="label">{t('message-only-label')}</div>
              </div>
              <div className={`input-box row ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input type="radio" name="visibility" value="private" checked={channel.visibility === 'private'} onChange={handleVisibilityChange} readOnly={isReadOnly} />
                <div className="label">{t('require-password-label')}</div>
              </div>
              {channel.visibility === 'private' && !isReadOnly && (
                <div className="input-box">
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
        <div className="popup-content" style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="label-header">
              <div className="label">{t('speaking-permission')}</div>
            </div>
            <div className="col">
              <div className="input-box row">
                <input name="forbidGuestQueue" type="checkbox" checked={channel.forbidGuestQueue} onChange={handleForbidGuestQueueChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-guest-queue-label')}</div>
              </div>
              <div className="input-box row">
                <input name="forbidGuestVoice" type="checkbox" checked={channel.forbidGuestVoice} onChange={handleForbidGuestVoiceChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-guest-voice-label')}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="label-header">
              <div className="label">{t('text-permission')}</div>
            </div>
            <div className="col">
              <div className="input-box row">
                <input name="forbid-text" type="checkbox" checked={channel.forbidText} onChange={handleForbidTextChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-only-admin-text-label')}</div>
              </div>
              <div className="input-box row">
                <input name="forbid-guest-text" type="checkbox" checked={channel.forbidGuestText} onChange={handleForbidGuestTextChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-guest-text-label')}</div>
              </div>
              <div className="input-box row">
                <input name="forbid-guest-url" type="checkbox" checked={channel.forbidGuestUrl} onChange={handleForbidGuestUrlChange} readOnly={isReadOnly} />
                <div className="label">{t('forbid-guest-url-label')}</div>
              </div>
              <div className="input-box row">
                <div className="label">
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
              <div className="input-box row">
                <div className="label">
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
              <div className="input-box row">
                <div className="label">
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
        <div className="popup-content" style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className="col">
            <div className="input-box row" style={{ justifyContent: 'space-between' }}>
              <div className="label">{`${t('channel-management')} (${totalModeratorsCount})`}</div>
              <div className="search-box">
                <div className="search-icon" />
                <input name="search-query" type="text" className="search-input" placeholder={t('search-placeholder')} value={moderatorQuery} onChange={handleModeratorQueryChange} />
              </div>
            </div>
            <div className="input-box col">
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    {MEMBER_MANAGEMENT_TABLE_FIELDS.map((field, index) => (
                      <th key={field.key} style={{ width: `${moderatorColumnWidths[index]}px` }} onClick={() => handleModeratorSort(field.key as keyof Types.Member)}>
                        {`${t(field.tKey)} ${moderatorSortField === field.key ? (moderatorSortDirection === 1 ? '⏶' : '⏷') : ''}`}
                        <div className="resizer" onPointerDown={(e) => handleModeratorColumnHandleDown(e, index)} onPointerMove={(e) => handleModeratorColumnHandleMove(e, index)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table">
                  {sortedModerators.map((moderator) => (
                    <ChannelSettingModeratorRow
                      key={moderator.userId}
                      userId={userId}
                      serverId={server.serverId}
                      channelId={channel.channelId}
                      channelCategoryId={channel.categoryId}
                      moderator={moderator}
                      permissionLevel={permissionLevel}
                      columnWidths={moderatorColumnWidths}
                    />
                  ))}
                </tbody>
              </table>
              <div className="note-text">{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
        <div className="popup-content" style={activeTabIndex === 6 ? {} : { display: 'none' }}>
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
                    <ChannelSettingBlockedMemberRow
                      key={member.userId}
                      userId={userId}
                      serverId={server.serverId}
                      channelId={channel.channelId}
                      member={member}
                      permissionLevel={permissionLevel}
                      columnWidths={blockMemberColumnWidths}
                    />
                  ))}
                </tbody>
              </table>
              <div className="note-text">{t('right-click-to-process')}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="popup-footer" style={!isReadOnly ? {} : { display: 'none' }}>
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
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

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;

interface ChannelSettingModeratorRowProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  channelCategoryId: Types.Channel['categoryId'];
  moderator: Types.Member;
  permissionLevel: Types.Permission;
  columnWidths: number[];
}

const ChannelSettingModeratorRow: React.FC<ChannelSettingModeratorRowProps> = React.memo(({ userId, serverId, channelId, channelCategoryId, moderator, permissionLevel, columnWidths }) => {
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();
  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  const isSelected = selectedItemId === `member-${moderator.userId}`;
  const isSelf = moderator.userId === userId;
  const isLowerLevel = moderator.permissionLevel < permissionLevel;

  const handleClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`member-${moderator.userId}`));
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addDirectMessageOption({ isSelf }, () => openDirectMessage(userId, moderator.userId))
      .addViewProfileOption(() => openUserInfo(userId, moderator.userId))
      .addEditNicknameOption({ permissionLevel, isSelf, isLowerLevel }, () => openEditNickname(moderator.userId, serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => openBlockMember(moderator.userId, serverId))
      .addSeparator()
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () => terminateMember(moderator.userId, serverId, moderator.name))
          .addSetChannelModOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId }, () =>
            moderator.permissionLevel >= Types.Permission.ChannelMod
              ? editChannelPermission(moderator.userId, serverId, channelId, { permissionLevel: 2 })
              : editChannelPermission(moderator.userId, serverId, channelId, { permissionLevel: 3 }),
          )
          .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel, channelCategoryId }, () =>
            moderator.permissionLevel >= Types.Permission.ChannelAdmin
              ? editChannelPermission(moderator.userId, serverId, channelCategoryId || channelId, { permissionLevel: 2 })
              : editChannelPermission(moderator.userId, serverId, channelCategoryId || channelId, { permissionLevel: 4 }),
          )
          .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: moderator.permissionLevel, isSelf, isLowerLevel }, () =>
            moderator.permissionLevel >= Types.Permission.ServerAdmin
              ? editServerPermission(moderator.userId, serverId, { permissionLevel: 2 })
              : editServerPermission(moderator.userId, serverId, { permissionLevel: 5 }),
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  return (
    <tr className={`${isSelected ? 'selected' : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
      <td style={{ width: `${columnWidths[0]}px` }}>
        <div className={`permission-${moderator.gender} permission-lv-${moderator.permissionLevel}`} />
        <div className={`name ${moderator.nickname ? 'highlight' : ''}`}>{moderator.nickname || moderator.name}</div>
      </td>
      <td style={{ width: `${columnWidths[1]}px` }}>{getPermissionText(moderator.permissionLevel)}</td>
      <td style={{ width: `${columnWidths[2]}px` }}>{moderator.contribution}</td>
      <td style={{ width: `${columnWidths[3]}px` }}>{new Date(moderator.joinAt).toLocaleDateString()}</td>
    </tr>
  );
});

ChannelSettingModeratorRow.displayName = 'ChannelSettingModeratorRow';

interface ChannelSettingBlockedMemberRowProps {
  userId: Types.User['userId'];
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
  member: Types.Member;
  permissionLevel: Types.Permission;
  columnWidths: number[];
}

const ChannelSettingBlockedMemberRow: React.FC<ChannelSettingBlockedMemberRowProps> = React.memo(({ userId, serverId, channelId, member, permissionLevel, columnWidths }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const dispatch = useAppDispatch();
  const selectedItemId = useAppSelector((state) => state.ui.selectedItemId, shallowEqual);

  const isSelected = selectedItemId === `blocked-${member.userId}`;
  const isBlockedPermanently = member.blockedUntil === -1;
  const isSelf = member.userId === userId;

  const handleClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`blocked-${member.userId}`));
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addViewProfileOption(() => openUserInfo(userId, member.userId))
      .addUnblockUserFromChannelOption({ permissionLevel, isSelf }, () => unblockUserFromChannel(member.userId, serverId, channelId, member.name))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  return (
    <tr className={`${isSelected ? 'selected' : ''}`} onClick={handleClick} onContextMenu={handleContextMenu}>
      <td style={{ width: `${columnWidths[0]}px` }}>{member.nickname || member.name}</td>
      <td style={{ width: `${columnWidths[1]}px` }}>{isBlockedPermanently ? t('permanent') : `${t('until')} ${new Date(member.blockedUntil).toLocaleString()}`}</td>
    </tr>
  );
});

ChannelSettingBlockedMemberRow.displayName = 'ChannelSettingBlockedMemberRow';
