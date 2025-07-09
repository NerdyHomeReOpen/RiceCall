import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import markdown from '@/styles/markdown.module.css';

// Types
import { Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

interface ChannelSettingPopupProps {
  serverId: Server['serverId'];
  channelId: Channel['channelId'];
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(({ serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();

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
  const handleEditChannel = (
    channel: Partial<Channel>,
    channelId: Channel['channelId'],
    serverId: Server['serverId'],
  ) => {
    if (!socket) return;
    socket.send.editChannel({ channel, channelId, serverId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!channelId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.channel({
          channelId: channelId,
        }),
        getService.server({
          serverId: serverId,
        }),
      ]).then(([channel, server]) => {
        if (channel) {
          setChannel(channel);
        }
        if (server) {
          setServer(server);
        }
      });
    };
    refresh();
  }, [channelId, serverId]);

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[
              t('channel-info'),
              t('channel-announcement'),
              t('access-permission'),
              t('speaking-permission'),
              t('text-permission'),
              t('channel-management'),
            ].map((title, index) => (
              <div
                className={`${setting['item']} ${activeTabIndex === index ? setting['active'] : ''}`}
                onClick={() => setActiveTabIndex(index)}
                key={index}
              >
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className={setting['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['row']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('channel-name-label')}</div>
                <input
                  name="name"
                  type="text"
                  value={channelName}
                  maxLength={32}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('user-limit')}</div>
                <input
                  name="userLimit"
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
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              <div className={popup['label']}>{t('channel-mode')}</div>
              <div className={popup['selectBox']}>
                <select
                  value={channelVoiceMode}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      voiceMode: e.target.value as Channel['voiceMode'],
                    }))
                  }
                >
                  <option value="free">{t('free-speech')}</option>
                  <option value="forbidden" disabled>
                    {t('forbid-speech')}
                  </option>
                  <option value="queue" disabled>
                    {t('queue-speech')}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className={setting['saperator']} />
          <div className={popup['col']}>
            <div className={popup['label']}>{t('channel-audio-quality')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="bitrate"
                  type="radio"
                  checked={channelBitrate === 64000}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      bitrate: 64000,
                    }));
                  }}
                />
                <div>
                  <div className={popup['label']}>{t('chat-mode')}</div>
                  <div className={popup['hint']}>{t('chat-mode-description')}</div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="bitrate"
                  type="radio"
                  checked={channelBitrate === 256000}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      bitrate: 256000,
                    }));
                  }}
                />
                <div>
                  <div className={popup['label']}>{t('entertainment-mode')}</div>
                  <div className={popup['hint']}>{t('entertainment-mode-description')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Announcement */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={setting['headerTextBox']}>
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
            <div className={`${popup['inputBox']} ${popup['col']}`}>
              {showPreview ? (
                <div className={markdown['settingMarkdownContainer']} style={{ minHeight: '330px' }}>
                  <MarkdownViewer markdownText={channelAnnouncement} />
                </div>
              ) : (
                <textarea
                  name="announcement"
                  style={{ minHeight: '330px' }}
                  value={channelAnnouncement}
                  maxLength={1000}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      announcement: e.target.value,
                    }))
                  }
                />
              )}
              <div>{t('markdown-support')}</div>
            </div>
          </div>
        </div>

        {/* Access Permissions */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['label']}>{t('access-permission')}</div>
            <div className={popup['inputGroup']}>
              <div
                className={`
                    ${popup['inputBox']} 
                    ${popup['row']} 
                    ${isLobby ? popup['disabled'] : ''}
                  `}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'public'}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      visibility: 'public',
                    }));
                  }}
                />
                <div>
                  <div className={popup['label']}>{t('anyone-can-access')}</div>
                </div>
              </div>

              <div
                className={`
                    ${popup['inputBox']} 
                    ${popup['row']}
                    ${isLobby ? popup['disabled'] : ''}
                  `}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'member'}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      visibility: 'member',
                    }));
                  }}
                />
                <div>
                  <div className={popup['label']}>{t('forbid-guest-access')}</div>
                </div>
              </div>

              <div
                className={`
                    ${popup['inputBox']} 
                    ${popup['row']}
                    ${isLobby || isReceptionLobby ? popup['disabled'] : ''}
                  `}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'readonly'}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      visibility: 'readonly',
                    }));
                  }}
                />
                <div>
                  <div className={popup['label']}>{t('message-only')}</div>
                </div>
              </div>

              <div
                className={`
                    ${popup['inputBox']} 
                    ${popup['row']}
                    ${isLobby || isReceptionLobby ? popup['disabled'] : ''}
                  `}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={channelVisibility === 'private'}
                  onChange={() => {
                    setChannel((prev) => ({
                      ...prev,
                      visibility: 'private',
                    }));
                  }}
                />
                <div className={popup['label']}>{t('require-password')}</div>
              </div>

              {channelVisibility === 'private' && (
                <div className={popup['inputBox']}>
                  <input
                    name="password"
                    type="text"
                    value={channelPassword}
                    maxLength={4}
                    placeholder={t('require-password-placeholder')}
                    onChange={(e) => {
                      setChannel((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }));
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
            <div className={popup['label']}>{t('speaking-permission') + t('soon')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}>
                <input name="forbidGuestQueue" type="checkbox" checked={false} onChange={() => {}} />
                <div>
                  <div className={popup['label']}>{t('forbid-guest-queue')}</div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}>
                <input name="forbidGuestVoice" type="checkbox" checked={false} onChange={() => {}} />
                <div>
                  <div className={popup['label']}>{t('forbid-guest-voice')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Permissions */}
        <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['label']}>{t('text-permission')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="forbidText"
                  type="checkbox"
                  checked={channelForbidText}
                  onChange={(e) => {
                    setChannel((prev) => ({
                      ...prev,
                      forbidText: e.target.checked,
                    }));
                  }}
                />
                <div className={popup['label']}>{t('forbid-only-admin-text')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="forbidGuestText"
                  type="checkbox"
                  checked={channelForbidGuestText}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      forbidGuestText: e.target.checked,
                    }))
                  }
                />
                <div className={popup['label']}>{t('forbid-guest-text')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="forbidGuestUrl"
                  type="checkbox"
                  checked={channelForbidGuestUrl}
                  onChange={(e) =>
                    setChannel((prev) => ({
                      ...prev,
                      forbidGuestUrl: e.target.checked,
                    }))
                  }
                />
                <div className={popup['label']}>{t('forbid-guest-url')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <div className={popup['label']}>{t('guest-text-max-length')}</div>
                <input
                  name="guestTextMaxLength"
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
                <div className={popup['label']}>{t('characters')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <div className={popup['label']}>{t('guest-text-wait-time')}</div>
                <input
                  name="guestTextWaitTime"
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
                <div className={popup['label']}>{t('second')}</div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <div className={popup['label']}>{t('guest-text-gap-time')}</div>
                <input
                  name="guestTextGapTime"
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
                <div className={popup['label']}>{t('second')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div
          className={popup['button']}
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) return;
            handleEditChannel(
              {
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
              },
              channelId,
              serverId,
            );
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
