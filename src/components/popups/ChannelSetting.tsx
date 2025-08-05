import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import markdown from '@/styles/markdown.module.css';

// Types
import type { Channel, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface ChannelSettingPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ userId, serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [channel, setChannel] = useState<Channel>(Default.channel());
  const [server, setServer] = useState<Server>(Default.server());

  // Variables
  const { lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = server;
  const {
    name: channelName,
    announcement: channelAnnouncement,
    visibility: channelVisibility,
    password: channelPassword,
    userLimit: channelUserLimit,
    voiceMode: channelVoiceMode,
    // queueSecs: channelQueueSecs,
    order: channelOrder,
    forbidText: channelForbidText,
    forbidGuestText: channelForbidGuestText,
    forbidGuestUrl: channelForbidGuestUrl,
    guestTextMaxLength: channelGuestTextMaxLength,
    guestTextWaitTime: channelGuestTextWaitTime,
    guestTextGapTime: channelGuestTextGapTime,
    bitrate: channelBitrate,
  } = channel;
  const isLobby = serverLobbyId === channelId;
  const isReceptionLobby = serverReceptionLobbyId === channelId;
  const canSubmit = channelName.trim();

  // Handlers
  const handleEditChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipcService.socket.send('editChannel', { serverId, channelId, update });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!channelId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.channel({ serverId: serverId, channelId: channelId }).then((channel) => {
        if (channel) setChannel(channel);
      });
      getService.server({ userId: userId, serverId: serverId }).then((server) => {
        if (server) setServer(server);
      });
    };
    refresh();
  }, [channelId, serverId, userId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[t('channel-info'), t('channel-announcement'), t('access-permission'), t('speaking-permission'), t('text-permission'), t('channel-management')].map((title, index) => (
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
                <div className={popup['label']}>{t('channel-name-label')}</div>
                <input name="channel-name" type="text" value={isLobby ? t(`${channelName}`) : channelName} maxLength={32} onChange={(e) => setChannel((prev) => ({ ...prev, name: e.target.value }))} />
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
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      userLimit: Math.max(0, Math.min(999, parseInt(e.target.value) || 0)),
                    }))
                  }
                />
              </div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('channel-mode')}</div>
                <div className={popup['select-box']}>
                  <select value={channelVoiceMode} onChange={(e) => setChannel((prev) => ({ ...prev, voiceMode: e.target.value as Channel['voiceMode'] }))}>
                    <option value="free">{t('free-speech')}</option>
                    <option value="forbidden" disabled>
                      {t('forbid-speech')}
                    </option>
                    <option value="queue">{t('queue-speech')}</option>
                  </select>
                </div>
              </div>
              {/* {channelVoiceMode === 'queue' && (
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('queue-secs')}</div>
                  <input
                    name="queue-secs"
                    type="number"
                    value={channelQueueSecs}
                    max={1000}
                    min={5}
                    onChange={(e) =>
                      setChannel((prev) => {
                        const value = +e.target.value;
                        if (Number.isNaN(value)) return prev;
                        if (value > 1000) return { ...prev, queueSecs: 1000 };
                        if (value < 5) return { ...prev, queueSecs: 5 };
                        return { ...prev, queueSecs: value };
                      })
                    }
                  />
                </div>
              )} */}
            </div>
          </div>
          <div className={setting['separator']} />
          <div className={popup['col']}>
            <div className={popup['label']}>{t('channel-audio-quality')}</div>
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="bitrate-64000"
                  type="radio"
                  checked={channelBitrate === 64000}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, bitrate: 64000 }));
                  }}
                />
                <div className={popup['label']}>{t('chat-mode')}</div>
              </div>
              <div className={popup['hint-text']}>{t('chat-mode-description')}</div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="bitrate-256000"
                  type="radio"
                  checked={channelBitrate === 256000}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, bitrate: 256000 }));
                  }}
                />
                <div className={popup['label']}>{t('entertainment-mode')}</div>
              </div>
              <div className={popup['hint-text']}>{t('entertainment-mode-description')}</div>
            </div>
          </div>
        </div>

        {/* Channel Announcement */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
              <div className={popup['label']}>{t('input-announcement')}</div>
              <div
                className={popup['button']}
                onClick={async () => {
                  if (showPreview) {
                    setShowPreview(false);
                  } else {
                    setShowPreview(true);
                  }
                }}
              >
                {showPreview ? t('edit') : t('preview')}
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              {showPreview ? (
                <div className={markdown['setting-markdown-container']} style={{ minHeight: '330px' }}>
                  <MarkdownViewer markdownText={channelAnnouncement} />
                </div>
              ) : (
                <textarea
                  name="channel-announcement"
                  style={{ minHeight: '330px' }}
                  value={channelAnnouncement}
                  maxLength={1000}
                  onChange={(e) => setChannel((prev) => ({ ...prev, announcement: e.target.value }))}
                />
              )}
              <div className={setting['note-text']}>{t('markdown-support')}</div>
            </div>
          </div>
        </div>

        {/* Access Permissions */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('access-permission')}</div>
            </div>
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'public'}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, visibility: 'public' }));
                  }}
                />
                <div className={popup['label']}>{t('anyone-can-access')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'member'}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, visibility: 'member' }));
                  }}
                />
                <div className={popup['label']}>{t('forbid-guest-access')}</div>
              </div>

              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'readonly'}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, visibility: 'readonly' }));
                  }}
                />
                <div className={popup['label']}>{t('message-only')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${isLobby || isReceptionLobby ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'private'}
                  onChange={() => {
                    setChannel((prev) => ({ ...prev, visibility: 'private' }));
                  }}
                />
                <div className={popup['label']}>{t('require-password')}</div>
              </div>
              {channelVisibility === 'private' && (
                <div className={popup['input-box']}>
                  <input
                    name="channel-password"
                    type="text"
                    value={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={(e) => {
                      setChannel((prev) => ({ ...prev, password: e.target.value }));
                    }}
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
              <div className={popup['label']}>{t('speaking-permission') + t('soon')}</div>
            </div>
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
                <input name="forbidGuestQueue" type="checkbox" checked={false} onChange={() => {}} />
                <div className={popup['label']}>{t('forbid-guest-queue')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
                <input name="forbidGuestVoice" type="checkbox" checked={false} onChange={() => {}} />
                <div className={popup['label']}>{t('forbid-guest-voice')}</div>
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
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="forbid-text"
                  type="checkbox"
                  checked={channelForbidText}
                  onChange={(e) => {
                    setChannel((prev) => ({ ...prev, forbidText: e.target.checked }));
                  }}
                />
                <div className={popup['label']}>{t('forbid-only-admin-text')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-guest-text" type="checkbox" checked={channelForbidGuestText} onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestText: e.target.checked }))} />
                <div className={popup['label']}>{t('forbid-guest-text')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-guest-url" type="checkbox" checked={channelForbidGuestUrl} onChange={(e) => setChannel((prev) => ({ ...prev, forbidGuestUrl: e.target.checked }))} />
                <div className={popup['label']}>{t('forbid-guest-url')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-max-length')}
                  <input
                    name="guest-text-max-length"
                    type="number"
                    value={channelGuestTextMaxLength}
                    min={0}
                    max={9999}
                    onChange={(e) =>
                      setChannel((prev) => ({
                        ...prev,
                        guestTextMaxLength: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)),
                      }))
                    }
                    style={{ width: '60px' }}
                  />
                  {t('characters')}
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-wait-time')}
                  <input
                    name="guest-text-wait-time"
                    type="number"
                    value={channelGuestTextWaitTime}
                    min={0}
                    max={9999}
                    onChange={(e) =>
                      setChannel((prev) => ({
                        ...prev,
                        guestTextWaitTime: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)),
                      }))
                    }
                    style={{ width: '60px' }}
                  />
                  {t('second')}
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>
                  {t('guest-text-gap-time')}
                  <input
                    name="guest-text-gap-time"
                    type="number"
                    value={channelGuestTextGapTime}
                    min={0}
                    max={9999}
                    onChange={(e) =>
                      setChannel((prev) => ({
                        ...prev,
                        guestTextGapTime: Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)),
                      }))
                    }
                    style={{ width: '60px' }}
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
      <div className={popup['popup-footer']}>
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
              forbidGuestUrl: !!channelForbidGuestUrl,
              visibility: channelVisibility,
              voiceMode: channelVoiceMode,
            });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;
