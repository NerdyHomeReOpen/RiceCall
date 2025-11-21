import React, { useMemo, useState } from 'react';

// CSS
import styles from '@/styles/createServer.module.css';
import popup from '@/styles/popup.module.css';
import setting from '@/styles/setting.module.css';

// Types
import type { User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenImageCropper } from '@/utils/popup';
import Default from '@/utils/default';

interface CreateServerPopupProps {
  user: User;
  servers: Server[];
}

const CreateServerPopup: React.FC<CreateServerPopupProps> = React.memo(({ user, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(0);
  const [serverType, setServerType] = useState<Server['type']>(Default.server().type);
  const [serverName, setServerName] = useState<Server['name']>(Default.server().name);
  const [serverSlogan, setServerSlogan] = useState<Server['slogan']>(Default.server().slogan);
  const [serverAvatar, setServerAvatar] = useState<Server['avatar']>(Default.server().avatar);
  const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(Default.server().avatarUrl);

  // Destructuring
  const { level: userLevel } = user;

  // Memos
  const serverTypes = useMemo(
    () => [
      { value: 'game', name: t('game') },
      { value: 'entertainment', name: t('entertainment') },
      { value: 'other', name: t('other') },
    ],
    [t],
  );
  const remainingServers = useMemo(() => {
    const maxGroups = userLevel >= 16 ? 5 : userLevel >= 6 && userLevel < 16 ? 4 : 3;
    return maxGroups - servers.filter((s) => s.owned).length;
  }, [userLevel, servers]);
  const canSubmit = useMemo(() => remainingServers > 0 && serverName.trim(), [remainingServers, serverName]);

  // Handlers
  const handleCreateServer = (preset: Partial<Server>) => {
    ipc.socket.send('createServer', { preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

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
            <div className={styles['select-type-text']}>{t('please-select-server-type')}</div>
            <div className={styles['button-group']}>
              {serverTypes.map((type) => (
                <div
                  key={type.value}
                  className={`${styles['button']} ${serverType === type.value ? styles['selected'] : ''}`}
                  onClick={() => {
                    setServerType(type.value as Server['type']);
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
                  reader.onloadend = () =>
                    handleOpenImageCropper(reader.result as string, async (data) => {
                      if (data.imageDataUrl.length > 5 * 1024 * 1024) {
                        handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
                        return;
                      }
                      const formData = new FormData();
                      formData.append('_type', 'server');
                      formData.append('_fileName', serverAvatar);
                      formData.append('_file', data.imageDataUrl as string);
                      const response = await ipc.data.upload(formData);
                      if (response) {
                        setServerAvatar(response.avatar);
                        setServerAvatarUrl(response.avatarUrl);
                      }
                    });
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
                <input name="server-name" type="text" placeholder={t('server-name-placeholder')} maxLength={32} onChange={(e) => setServerName(e.target.value)} />
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']} style={{ width: '100px' }}>
                  {t('server-slogan')}
                </div>
                <input name="server-slogan" type="text" placeholder={t('server-slogan-placeholder')} maxLength={32} onChange={(e) => setServerSlogan(e.target.value)} />
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
            onClick={() =>
              canSubmit
                ? handleCreateServer({
                    name: serverName,
                    avatar: serverAvatar,
                    avatarUrl: serverAvatarUrl,
                    slogan: serverSlogan,
                    type: serverType,
                  })
                : null
            }
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
