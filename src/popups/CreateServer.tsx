import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';

import { MAX_FILE_SIZE, SERVER_TYPES } from '@/constant';

import styles from '@/styles/createServer.module.css';
import popupStyles from '@/styles/popup.module.css';
import settingStyles from '@/styles/setting.module.css';

const CreateServerPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const servers = useAppSelector((state) => state.servers.data);

  // Refs
  const isUploadingRef = useRef<boolean>(false);

  // States
  const [section, setSection] = useState<number>(0);
  const [serverType, setServerType] = useState<Types.Server['type']>(Default.server().type);
  const [serverName, setServerName] = useState<Types.Server['name']>(Default.server().name);
  const [serverSlogan, setServerSlogan] = useState<Types.Server['slogan']>(Default.server().slogan);
  const [serverAvatar, setServerAvatar] = useState<Types.Server['avatar']>(Default.server().avatar);
  const [serverAvatarUrl, setServerAvatarUrl] = useState<Types.Server['avatarUrl']>(Default.server().avatarUrl);

  // Variables
  const { level: userLevel } = user;
  const remainingServers = useMemo(() => {
    const maxGroups = userLevel >= 16 ? 5 : userLevel >= 6 && userLevel < 16 ? 4 : 3;
    return maxGroups - servers.filter((s) => s.owned).length;
  }, [userLevel, servers]);
  const canSubmit = remainingServers > 0 && serverName.trim();

  // Handlers
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image || isUploadingRef.current) return;
    image.arrayBuffer().then((arrayBuffer) => {
      Popup.openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
        isUploadingRef.current = true;
        if (imageUnit8Array.length > MAX_FILE_SIZE) {
          Popup.openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
          isUploadingRef.current = false;
          return;
        }
        ipc.data.uploadImage({ folder: 'server', imageName: serverAvatar, imageUnit8Array }).then((response) => {
          if (response) {
            setServerAvatar(response.imageName);
            setServerAvatarUrl(response.imageUrl);
          }
          isUploadingRef.current = false;
        });
      });
    });
  };

  const handleServerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerName(e.target.value);
  };

  const handleServerSloganChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerSlogan(e.target.value);
  };

  const handlePreviousBtnClick = () => {
    setSection(0);
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Popup.createServer({ name: serverName, avatar: serverAvatar, avatarUrl: serverAvatarUrl, slogan: serverSlogan, type: serverType });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <>
      <div className={popupStyles['popup-wrapper']} style={section === 0 ? {} : { display: 'none' }}>
        <div className={popupStyles['popup-tabs']}>
          <div className={`${popupStyles['tab']} ${popupStyles['active']}`}>{t('select-server-type')}</div>
          <div className={popupStyles['tab']}>{t('fill-info')}</div>
        </div>
        <div className={popupStyles['popup-body']}>
          <div className={settingStyles['content']}>
            <div className={`${styles['message']}`}>{t('remaining-server', { '0': remainingServers.toString() })}</div>
            <div className={styles['select-type-text']}>{t('please-select-server-type')}</div>
            <div className={styles['button-group']}>
              {SERVER_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`${styles['button']} ${serverType === type.value ? styles['selected'] : ''}`}
                  onClick={() => {
                    setServerType(type.value as Types.Server['type']);
                    setSection(1);
                  }}
                >
                  {t(type.tKey)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={popupStyles['popup-footer']}>
          <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
            {t('cancel')}
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-wrapper']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popupStyles['popup-tabs']}>
          <div className={popupStyles['tab']}>{t('select-server-type')}</div>
          <div className={`${popupStyles['tab']}  ${popupStyles['active']}`}>{t('fill-info')}</div>
        </div>
        <div className={popupStyles['popup-body']}>
          <div className={`${settingStyles['content']} ${popupStyles['col']}`} style={{ justifyContent: 'space-evenly' }}>
            <div className={styles['avatar-wrapper']}>
              <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
              <input name="avatar" type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" onInput={handleImageInput} />
              <label htmlFor="avatar-upload" style={{ marginTop: '10px' }} className={popupStyles['button']}>
                {t('upload-avatar')}
              </label>
            </div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']} style={{ width: '100px' }}>
                  {t('server-type')}
                </div>
                <input name="type" type="text" disabled value={t(serverType as keyof typeof t)} />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']} style={{ width: '100px' }}>
                  {t('server-name')}
                </div>
                <input name="server-name" type="text" placeholder={t('server-name-placeholder')} maxLength={32} onChange={handleServerNameChange} />
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']} style={{ width: '100px' }}>
                  {t('server-slogan')}
                </div>
                <input name="server-slogan" type="text" placeholder={t('server-slogan-placeholder')} maxLength={32} onChange={handleServerSloganChange} />
              </div>
            </div>
          </div>
        </div>
        <div className={popupStyles['popup-footer']}>
          <div className={popupStyles['button']} onClick={handlePreviousBtnClick}>
            {t('previous')}
          </div>
          <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
            {t('confirm')}
          </div>
          <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
            {t('cancel')}
          </div>
        </div>
      </div>
    </>
  );
});

CreateServerPopup.displayName = 'CreateServerPopup';

export default CreateServerPopup;
