import React, { useMemo, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Types
import type { Channel, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Components
import AnnouncementEditor from '@/components/AnnouncementEditor';

// Utils
import { isChannelMod } from '@/utils/permission';

interface ChannelSettingPopupProps {
  user: User;
  server: Server;
  channel: Channel;
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ user, server, channel: channelData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [channel, setChannel] = useState<Channel>(channelData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);

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
  } = channel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(userPermissionLevel, serverPermissionLevel), [userPermissionLevel, serverPermissionLevel]);
  const isLobby = useMemo(() => serverLobbyId === channelId, [serverLobbyId, channelId]);
  const isReceptionLobby = useMemo(() => serverReceptionLobbyId === channelId, [serverReceptionLobbyId, channelId]);
  const canSubmit = useMemo(() => channelName.trim(), [channelName]);
  const settingPages = useMemo(
    () =>
      isChannelMod(permissionLevel)
        ? [t('channel-info'), t('channel-announcement'), t('access-permission'), t('speaking-permission'), t('text-permission'), t('channel-management')]
        : [t('channel-info'), t('channel-announcement'), t('access-permission'), t('speaking-permission'), t('text-permission')],
    [t, permissionLevel],
  );

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannel', { serverId, channelId, update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

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
            <div className={popup['header']}>
              <div className={popup['label']}>{t('channel-management') + t('soon')}</div>
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
