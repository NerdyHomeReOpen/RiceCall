import React, { useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Actions from '@/action';

import { MAX_FILE_SIZE, SERVER_TYPES } from '@/constants';

import { useAppSelector } from '@/hooks/Store';

import { getDefaultServer } from '@/utils/default';

import styles from './CreateServer.module.css';

interface CreateServerPopupProps {
  id: string;
}

const CreateServerPopup: React.FC<CreateServerPopupProps> = React.memo(({ id }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      level: state.user.data.level,
    }),
    shallowEqual,
  );

  const servers = useAppSelector((state) => state.servers.data, shallowEqual);

  const isUploadingRef = useRef<boolean>(false);

  const [section, setSection] = useState<number>(0);
  const [serverType, setServerType] = useState<Types.Server['type']>(getDefaultServer().type);
  const [serverName, setServerName] = useState<Types.Server['name']>(getDefaultServer().name);
  const [serverSlogan, setServerSlogan] = useState<Types.Server['slogan']>(getDefaultServer().slogan);
  const [serverAvatar, setServerAvatar] = useState<Types.Server['avatar']>(getDefaultServer().avatar);
  const [serverAvatarUrl, setServerAvatarUrl] = useState<Types.Server['avatarUrl']>(getDefaultServer().avatarUrl);

  const remainingServers = useMemo(() => {
    const maxGroups = user.level >= 16 ? 5 : user.level >= 6 && user.level < 16 ? 4 : 3;
    return maxGroups - servers.filter((s) => s.owned).length;
  }, [user.level, servers]);
  const canSubmit = remainingServers > 0 && serverName.trim();

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image || isUploadingRef.current) return;
    image.arrayBuffer().then((arrayBuffer) => {
      Actions.openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
        isUploadingRef.current = true;
        if (imageUnit8Array.length > MAX_FILE_SIZE) {
          Actions.openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
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
    Actions.createServer({ name: serverName, avatar: serverAvatar, avatarUrl: serverAvatarUrl, slogan: serverSlogan, type: serverType });
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <>
      <div className="popup-wrapper" style={section === 0 ? {} : { display: 'none' }}>
        <div className="popup-tabs">
          <div className="popup-tab active">{t('select-server-type')}</div>
          <div className="popup-tab">{t('fill-info')}</div>
        </div>
        <div className="popup-body">
          <div className={styles['create-server-content']}>
            <div className={styles['message']}>{t('remaining-server', { '0': remainingServers.toString() })}</div>
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
        <div className="popup-footer">
          <div className="button" onClick={handleCloseBtnClick}>
            {t('cancel')}
          </div>
        </div>
      </div>
      <div className="popup-wrapper" style={section === 1 ? {} : { display: 'none' }}>
        <div className="popup-tabs">
          <div className="popup-tab">{t('select-server-type')}</div>
          <div className="popup-tab active">{t('fill-info')}</div>
        </div>
        <div className="popup-body">
          <div className={styles['create-server-content']} style={{ justifyContent: 'space-evenly' }}>
            <div className={styles['avatar-wrapper']}>
              <div className={styles['avatar-picture']}>
                <Image src={serverAvatarUrl} alt="server_avatar" width={100} height={100} loading="lazy" draggable="false" />
              </div>
              <input name="avatar" type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/png, image/jpg, image/jpeg, image/webp, image/gif" onInput={handleImageInput} />
              <label htmlFor="avatar-upload" style={{ marginTop: '10px' }} className="button">
                {t('upload-avatar')}
              </label>
            </div>
            <div className="col">
              <div className="input-box row">
                <div className="label" style={{ width: '100px' }}>
                  {t('server-type')}
                </div>
                <input name="type" type="text" disabled value={t(serverType as keyof typeof t)} />
              </div>
              <div className="input-box row">
                <div className="label" style={{ width: '100px' }}>
                  {t('server-name')}
                </div>
                <input name="server-name" type="text" placeholder={t('server-name-placeholder')} maxLength={32} onChange={handleServerNameChange} />
              </div>
              <div className="input-box row">
                <div className="label" style={{ width: '100px' }}>
                  {t('server-slogan')}
                </div>
                <input name="server-slogan" type="text" placeholder={t('server-slogan-placeholder')} maxLength={32} onChange={handleServerSloganChange} />
              </div>
            </div>
          </div>
        </div>
        <div className="popup-footer">
          <div className="button" onClick={handlePreviousBtnClick}>
            {t('previous')}
          </div>
          <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
            {t('confirm')}
          </div>
          <div className="button" onClick={handleCloseBtnClick}>
            {t('cancel')}
          </div>
        </div>
      </div>
    </>
  );
});

CreateServerPopup.displayName = 'CreateServerPopup';

export default CreateServerPopup;
