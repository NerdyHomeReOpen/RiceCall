import React, { useMemo, useRef, useState } from 'react';

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

// Constants
import { MAX_FILE_SIZE } from '@/constant';

interface CreateServerPopupProps {
  user: User;
  servers: Server[];
}

const CreateServerPopup: React.FC<CreateServerPopupProps> = React.memo(({ user, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const isUploadingRef = useRef<boolean>(false);

  // States
  const [section, setSection] = useState<number>(0);
  const [serverType, setServerType] = useState<Server['type']>(Default.server().type);
  const [serverName, setServerName] = useState<Server['name']>(Default.server().name);
  const [serverSlogan, setServerSlogan] = useState<Server['slogan']>(Default.server().slogan);
  const [serverAvatar, setServerAvatar] = useState<Server['avatar']>(Default.server().avatar);
  const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(Default.server().avatarUrl);

  // Variables
  const { level: userLevel } = user;
  const remainingServers = useMemo(() => {
    const maxGroups = userLevel >= 16 ? 5 : userLevel >= 6 && userLevel < 16 ? 4 : 3;
    return maxGroups - servers.filter((s) => s.owned).length;
  }, [userLevel, servers]);
  const canSubmit = remainingServers > 0 && serverName.trim();
  const serverTypes = [
    { value: 'game', name: t('game') },
    { value: 'entertainment', name: t('entertainment') },
    { value: 'other', name: t('other') },
  ];

  // Handlers
  const handleCreateServer = (preset: Partial<Server>) => {
    ipc.socket.send('createServer', { preset });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleUploadImage = (imageUnit8Array: Uint8Array) => {
    isUploadingRef.current = true;
    if (imageUnit8Array.length > MAX_FILE_SIZE) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    ipc.data.uploadImage('server', serverAvatar, imageUnit8Array).then((response) => {
      if (response) {
        setServerAvatar(response.imageName);
        setServerAvatarUrl(response.imageUrl);
      }
      isUploadingRef.current = false;
    });
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
                accept="image/png, image/jpg, image/jpeg, image/webp, image/gif"
                onChange={(e) => {
                  const image = e.target.files?.[0];
                  if (!image || isUploadingRef.current) return;
                  image.arrayBuffer().then((arrayBuffer) => {
                    handleOpenImageCropper(new Uint8Array(arrayBuffer), handleUploadImage);
                  });
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
