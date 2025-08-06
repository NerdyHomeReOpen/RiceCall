import React, { useEffect, useMemo, useRef, useState } from 'react';

// CSS
import styles from '@/styles/popups/createServer.module.css';
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Types
import type { User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface CreateServerPopupProps {
  userId: User['userId'];
}

const CreateServerPopup: React.FC<CreateServerPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [servers, setServers] = useState<Server[]>([]);
  const [server, setServer] = useState<Server>(Default.server());
  const [section, setSection] = useState<number>(0);

  // Memos
  const SERVER_TYPES = useMemo(
    () => [
      { value: 'game', name: t('game') },
      { value: 'entertainment', name: t('entertainment') },
      { value: 'other', name: t('other') },
    ],
    [t],
  );
  const MAX_GROUPS = useMemo(() => {
    const { level } = user;
    return level >= 16 ? 5 : level >= 6 && level < 16 ? 4 : 3;
  }, [user]);

  // Variables
  const { name: serverName, type: serverType, avatar: serverAvatar, avatarUrl: serverAvatarUrl, slogan: serverSlogan } = server;
  const remainingServers = MAX_GROUPS - servers.filter((s) => s.owned).length;
  const canSubmit = remainingServers > 0 && serverName.trim();

  // Handlers
  const handleCreateServer = (preset: Partial<Server>) => {
    ipcService.socket.send('createServer', { preset });
  };

  const handleOpenErrorDialog = (message: string) => {
    ipcService.popup.open('dialogError', 'errorDialog', { message, submitTo: 'errorDialog' });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleAvatarCropper = (serverId: Server['serverId'], avatarData: string) => {
    ipcService.popup.open('avatarCropper', 'avatarCropper', { avatarData: avatarData, submitTo: 'avatarCropper' });
    ipcService.popup.onSubmit('avatarCropper', async (data) => {
      if (data.imageDataUrl.length > 5 * 1024 * 1024) {
        handleOpenErrorDialog(t('image-too-large', { '0': '5MB' }));
        return;
      }

      const formData = new FormData();
      formData.append('_type', 'server');
      formData.append('_fileName', serverId);
      formData.append('_file', data.imageDataUrl as string);
      const response = await apiService.post('/upload', formData);
      if (response) {
        setServer((prev) => ({ ...prev, avatar: response.avatar, avatarUrl: response.avatarUrl }));
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: userId }).then((user) => {
        if (user) setUser(user);
      });
      getService.servers({ userId: userId }).then((servers) => {
        if (servers) setServers(servers);
      });
    };
    refresh();
  }, [userId]);

  return (
    <>
      <div className={popup['popup-wrapper']} style={section === 0 ? {} : { display: 'none' }}>
        {/* Tab */}
        <div className={popup['popup-tabs']}>
          <div className={`${popup['tab']} ${popup['active']}`}>{t('select-server-type')}</div>
          <div className={popup['tab']}>{t('fill-info')}</div>
        </div>

        {/* Body */}
        <div className={popup['popup-body']}>
          <div className={setting['content']}>
            <div className={`${styles['message']}`}>{t('remaining-server', { '0': remainingServers.toString() })}</div>
            <div className={styles['select-type-text']}>{t('select-server-type-description')}</div>
            <div className={styles['button-group']}>
              {SERVER_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`${styles['button']} ${serverType === type.value ? styles['selected'] : ''}`}
                  onClick={() => {
                    setServer((prev) => ({ ...prev, type: type.value as Server['type'] }));
                    setSection(1);
                  }}
                >
                  {type.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popup-footer']}>
          <div className={popup['button']} onClick={handleClose}>
            {t('cancel')}
          </div>
        </div>
      </div>

      <div className={popup['popup-wrapper']} style={section === 1 ? {} : { display: 'none' }}>
        {/* Tab */}
        <div className={popup['popup-tabs']}>
          <div className={popup['tab']}>{t('select-server-type')}</div>
          <div className={`${popup['tab']}  ${popup['active']}`}>{t('fill-info')}</div>
        </div>

        {/* Body */}
        <div className={popup['popup-body']}>
          <div className={`${setting['content']} ${popup['col']}`} style={{ justifyContent: 'space-evenly' }}>
            <div className={styles['avatar-wrapper']}>
              <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
              <input
                name="avatar"
                type="file"
                id="avatar-upload"
                style={{ display: 'none' }}
                accept="image/png, image/jpg, image/jpeg, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => handleAvatarCropper(serverAvatar, reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="avatar-upload" style={{ marginTop: '10px' }} className={popup['button']}>
                {t('upload-avatar')}
              </label>
            </div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']} style={{ width: '100px' }}>
                  {t('server-type')}
                </div>
                <input name="type" type="text" disabled value={t(serverType as keyof typeof t)} />
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']} style={{ width: '100px' }}>
                  {t('server-name')}
                </div>
                <input
                  name="server-name"
                  type="text"
                  value={serverName}
                  placeholder={t('server-name-placeholder')}
                  maxLength={32}
                  onChange={(e) => setServer((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']} style={{ width: '100px' }}>
                  {t('server-slogan')}
                </div>
                <input
                  name="server-slogan"
                  type="text"
                  value={serverSlogan}
                  placeholder={t('server-slogan-placeholder')}
                  maxLength={32}
                  onChange={(e) => setServer((prev) => ({ ...prev, slogan: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popup-footer']}>
          <div className={popup['button']} onClick={() => setSection(0)}>
            {t('previous')}
          </div>
          <div
            className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
            onClick={() => {
              handleCreateServer({
                name: serverName,
                avatar: serverAvatar,
                avatarUrl: serverAvatarUrl,
                slogan: serverSlogan,
                type: serverType,
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
      </div>
    </>
  );
});

CreateServerPopup.displayName = 'CreateServerPopup';

export default CreateServerPopup;
