import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as ipc from '@/main/ipc';

import { openImageCropper, openAlertDialog, editUser, openApplyFriend, openDirectMessage, openErrorDialog } from '@/services';

import { MAX_FILE_SIZE } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';
import { useCountries } from '@/hooks/Countries';

import RecentServerCard from './RecentServerCard';
import JoinedServerCard from './JoinedServerCard';
import FavoriteServerCard from './FavoriteServerCard';
import LevelIcon from '@/components/LevelIcon';
import BadgeItem from '@/components/BadgeItem';

import { objDiff } from '@/utils';

import styles from './UserSetting.module.css';

interface UserInfoPopupProps {
  id: string;
  target: Types.User;
  targetServers: Types.Server[];
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = React.memo(({ id, target: targetData, targetServers }) => {
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();
  const { countries } = useCountries();

  const signatureInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef<boolean>(false);

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const [target, setTarget] = useState(targetData);
  const [editedTarget, setEditedTarget] = useState(targetData);
  const [serversView, setServersView] = useState<'joined' | 'favorite'>('joined');
  const [selectedTabId, setSelectedTabId] = useState<'about' | 'groups' | 'edit'>('about');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayOptions = Array.from({ length: new Date(target.birthYear, target.birthMonth, 0).getDate() }, (_, i) => i + 1);
  const isSelf = user.userId === target.userId;
  const isFriend = friends.find((f) => f.targetId === target.userId && f.relationStatus === 2) !== undefined;
  const isAboutTab = selectedTabId === 'about';
  const isGroupsTab = selectedTabId === 'groups';
  const isEditTab = selectedTabId === 'edit';
  const isJoinedServersView = serversView === 'joined';
  const isFavoriteServersView = serversView === 'favorite';
  const canSubmit = target.name.trim() && target.gender.trim() && target.country.trim() && target.birthYear && target.birthMonth && target.birthDay;
  const badges = typeof target.badges === 'string' ? JSON.parse(target.badges) : target.badges;

  const joinedServers = useMemo(() => {
    return targetServers.filter((s) => s.permissionLevel >= Permission.Member && s.permissionLevel < Permission.ServerAdmin).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);

  const favoriteServers = useMemo(() => {
    return targetServers.filter((s) => s.favorite && s.permissionLevel < Permission.ServerAdmin).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);

  const recentServers = useMemo(() => {
    return targetServers
      .filter((s) => s.recent)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);
  }, [targetServers]);

  const getUserAge = () => {
    const birthDate = new Date(target.birthYear, target.birthMonth - 1, target.birthDay);
    let age = currentYear - birthDate.getFullYear();
    const monthDiff = currentMonth - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDate.getDate())) age--;
    return age;
  };

  const isFutureDate = useCallback(
    (year: number, month: number, day: number) => {
      if (year > currentYear) return true;
      if (year === currentYear && month > currentMonth) return true;
      if (year === currentYear && month === currentMonth && day > currentDay) return true;
      return false;
    },
    [currentYear, currentMonth, currentDay],
  );

  const handleServerSelect = (server: Types.Server) => {
    ipc.server.select({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() });
  };

  const handleAvatarClick = () => {
    if (!isSelf) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png, image/jpg, image/jpeg, image/webp, image/gif';
    fileInput.onchange = (e) => {
      const image = (e.target as HTMLInputElement).files?.[0];
      if (!image || isUploadingRef.current) return;
      image.arrayBuffer().then((arrayBuffer) => {
        openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
          isUploadingRef.current = true;
          if (imageUnit8Array.length > MAX_FILE_SIZE) {
            openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
            isUploadingRef.current = false;
            return;
          }
          ipc.api.uploadImage({ folder: 'user', imageName: target.userId, imageUnit8Array }).then((response) => {
            if (response) {
              setTarget((prev) => ({ ...prev, avatar: response.imageName, avatarUrl: response.imageUrl }));
              editUser({ avatar: response.imageName, avatarUrl: response.imageUrl });
            }
            isUploadingRef.current = false;
          });
        });
      });
    };
    fileInput.click();
  };

  const handleAccountTextClick = () => {
    navigator.clipboard.writeText(target.userId);
  };

  const handleAboutTabClick = () => {
    setSelectedTabId('about');
  };

  const handleGroupsTabClick = () => {
    setSelectedTabId('groups');
  };

  const handleEditProfileBtnClick = () => {
    setEditedTarget(target);
    setSelectedTabId('edit');
  };

  const handleCancelBtnClick = () => {
    setTarget(target);
    setSelectedTabId('about');
  };

  const handleConfirmBtnClick = () => {
    if (!countries.includes(editedTarget.country)) {
      openErrorDialog(new Error('invalid-country'), () => {});
      return;
    }
    editUser(objDiff(editedTarget, target));
    setTarget(editedTarget);
    setSelectedTabId('about');
  };

  const handleApplyFriendBtnClick = () => {
    openApplyFriend(user.userId, target.userId);
  };

  const handleChatBtnClick = () => {
    openDirectMessage(user.userId, target.userId);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTarget((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedTarget((prev) => ({ ...prev, gender: e.target.value as Types.User['gender'] }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedTarget((prev) => ({ ...prev, country: e.target.value }));
  };

  const handleBirthYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedTarget((prev) => ({ ...prev, birthYear: Number(e.target.value) }));
  };

  const handleBirthMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedTarget((prev) => ({ ...prev, birthMonth: Number(e.target.value) }));
  };

  const handleBirthDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedTarget((prev) => ({ ...prev, birthDay: Number(e.target.value) }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTarget((prev) => ({ ...prev, signature: e.target.value }));
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTarget((prev) => ({ ...prev, about: e.target.value }));
  };

  const handleServersViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServersView(e.target.value as 'joined' | 'favorite');
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'left-top', e.currentTarget as HTMLElement, false, undefined, undefined, (_, full) => {
      signatureInputRef.current?.focus();
      document.execCommand('insertText', false, full as string);
    });
  };

  const handleMinimizeBtnClick = () => {
    ipc.window.minimize(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  useEffect(() => {
    const daysInMonth = new Date(target.birthYear, target.birthMonth, 0).getDate();
    if (target.birthDay > daysInMonth) {
      setTarget((prev) => ({ ...prev, birthDay: daysInMonth }));
    }
    if (isFutureDate(target.birthYear, target.birthMonth, target.birthDay)) {
      setTarget((prev) => ({ ...prev, birthYear: currentYear, birthMonth: currentMonth, birthDay: currentDay }));
    }
  }, [target.birthYear, target.birthMonth, target.birthDay, currentYear, currentMonth, currentDay, isFutureDate]);

  return (
    <div className={`popup-wrapper ${styles['user-profile']}`}>
      <div className={styles['user-profile']}>
        <div data-draggable className={styles['header']}>
          <div className={styles['window-action-buttons']}>
            <div className={styles['minimize-btn']} onClick={handleMinimizeBtnClick} />
            <div className={styles['close-btn']} onClick={handleCloseBtnClick} />
          </div>
          <div className={`${styles['user-avatar']} ${isSelf ? styles['editable'] : ''}`} onClick={handleAvatarClick}>
            <Image src={target.avatarUrl} alt="user_avatar" width={74} height={74} loading="lazy" draggable="false" />
          </div>
          <div className="row" style={{ gap: '3px', marginTop: '5px' }}>
            <p className={styles['user-name-text']}>{target.name}</p>
            {target.vip > 0 && <div className={`vip-icon vip-${target.vip}`} />}
            <LevelIcon level={target.level} xp={target.xp} requiredXp={target.requiredXp} showTooltip={true} />
            {target.isVerified ? <div className={styles['official-icon']} title={t('is-official')} /> : null}
          </div>
          <p className={styles['user-account-text']} onClick={handleAccountTextClick}>
            @{target.displayId}
          </p>
          <p className={styles['user-info-text']}>
            {t(target.gender.toLowerCase())} · {getUserAge()} · {t(target.country, { ns: 'country' })}
          </p>
          <p className={styles['user-signature-text']}>{target.signature}</p>
          <div className={styles['tabs']}>
            <div className={`${styles['tab']} ${styles['about']} ${isEditTab ? `${styles['selected']} disabled` : ''} ${isAboutTab ? styles['selected'] : ''}`} onClick={handleAboutTabClick}>
              {t('about-me')}
            </div>
            <div className={`${styles['tab']} ${styles['groups']} ${isEditTab ? 'disabled' : ''} ${isGroupsTab ? styles['selected'] : ''}`} onClick={handleGroupsTabClick}>
              {t('servers')}
            </div>
          </div>
        </div>
        <div className={styles['edit-tab-bar']} style={isSelf && !isGroupsTab ? {} : { display: 'none' }}>
          {isEditTab ? (
            <>
              <div className={`button button-primary ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
                {t('confirm')}
              </div>
              <div className="button" onClick={handleCancelBtnClick}>
                {t('cancel')}
              </div>
            </>
          ) : (
            <div className="button" onClick={handleEditProfileBtnClick}>
              {t('edit-profile')}
            </div>
          )}
        </div>
        <div className={styles['content']} style={isAboutTab ? {} : { display: 'none' }}>
          {target.about && (
            <div className={styles['user-about-me']}>
              <div className={styles['user-about-me-text']}>{target.about}</div>
            </div>
          )}
          <div className="label">{t('recent-servers')}</div>
          <div className={styles['server-list']}>
            {!isSelf && !target.shareRecentServers ? (
              <div className={styles['server-list-tips']}>
                {t('not-public-recent-servers.top')}
                <br />
                {t('not-public-recent-servers.bottom')}
              </div>
            ) : !recentServers.length ? (
              <div className={styles['server-list-tips']}>{t('no-recent-servers')}</div>
            ) : (
              recentServers.map((server) => <RecentServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
            )}
          </div>
          <div className="label">{t('recent-earned')}</div>
          <div className={styles['badge-viewer']}>
            {badges.map((badge: Types.Badge) => (
              <div key={badge.badgeId} className={styles['badge-item']}>
                <BadgeItem key={badge.badgeId} badge={badge} position="left-top" direction="right-top" />
              </div>
            ))}
          </div>
        </div>
        <div className={styles['content']} style={isGroupsTab ? {} : { display: 'none' }}>
          <div className="select-box">
            <select value={serversView} onChange={handleServersViewChange}>
              <option value="joined">{t('joined-servers')}</option>
              <option value="favorite">{t('favorited-servers')}</option>
            </select>
          </div>
          <div className={styles['server-list']} style={isJoinedServersView ? {} : { display: 'none' }}>
            {!isSelf && !target.shareJoinedServers ? (
              <div className={styles['server-list-tips']}>
                {t('not-public-joined-servers.top')}
                <br />
                {t('not-public-joined-servers.bottom')}
              </div>
            ) : !joinedServers.length ? (
              <div className={styles['server-list-tips']}>{t('no-joined-servers')}</div>
            ) : (
              joinedServers.map((server) => <JoinedServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
            )}
          </div>
          <div className={styles['server-list']} style={isFavoriteServersView ? {} : { display: 'none' }}>
            {!isSelf && !target.shareFavoriteServers ? (
              <div className={styles['server-list-tips']}>
                {t('not-public-favorite-servers.top')}
                <br />
                {t('not-public-favorite-servers.bottom')}
              </div>
            ) : !favoriteServers.length ? (
              <div className={styles['server-list-tips']}>{t('no-favorite-servers')}</div>
            ) : (
              favoriteServers.map((server) => <FavoriteServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
            )}
          </div>
        </div>
        <div className={styles['content']} style={isEditTab ? {} : { display: 'none' }}>
          <div className="col">
            <div className="row">
              <div className="input-box col">
                <div className="label">{t('nickname')}</div>
                <input name="name" type="text" value={editedTarget.name} maxLength={32} onChange={handleNameChange} />
              </div>
              <div className="input-box col">
                <div className="label">{t('gender')}</div>
                <div className="select-box" style={{ width: '100%' }}>
                  <select value={editedTarget.gender} onChange={handleGenderChange}>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="input-box col">
                <div className="label">{t('country')}</div>
                <div className="select-box" style={{ width: '100%' }}>
                  <select value={editedTarget.country} onChange={handleCountryChange}>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {t(country, { ns: 'country' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <div className="input-box col">
                  <div className="label">{t('birthdate')}</div>
                  <div className="row">
                    <div className="select-box" style={{ width: '100%' }}>
                      <select id="birthYear" value={editedTarget.birthYear} onChange={handleBirthYearChange}>
                        {yearOptions.map((year) => (
                          <option key={year} value={year} disabled={year > currentYear}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="select-box" style={{ width: '100%' }}>
                      <select id="birthMonth" value={editedTarget.birthMonth} onChange={handleBirthMonthChange}>
                        {monthOptions.map((month) => (
                          <option key={month} value={month} disabled={editedTarget.birthYear === currentYear && month > currentMonth}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="select-box" style={{ width: '100%' }}>
                      <select id="birthDay" value={editedTarget.birthDay} onChange={handleBirthDayChange}>
                        {dayOptions.map((day) => (
                          <option key={day} value={day} disabled={editedTarget.birthYear === currentYear && editedTarget.birthMonth === currentMonth && day > currentDay}>
                            {day.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="input-box col">
              <div className="label">{t('signature')}</div>
              <div className={styles['signature-input']}>
                <input
                  ref={signatureInputRef}
                  name="signature"
                  type="text"
                  value={editedTarget.signature}
                  maxLength={100}
                  onChange={handleSignatureChange}
                  style={{ paddingRight: '28px', width: '100%' }}
                />
                <div className={styles['emoji-btn']} onMouseDown={handleEmojiPickerClick} />
              </div>
            </div>
            <div className="input-box col">
              <div className="label">{t('about-me')}</div>
              <textarea name="about" value={editedTarget.about} maxLength={200} onChange={handleAboutChange} />
            </div>
          </div>
        </div>
      </div>
      <div className="popup-footer">
        {!isFriend && !isSelf && (
          <div className="button button-success" onClick={handleApplyFriendBtnClick}>
            {t('add-friend')}
          </div>
        )}
        {isSelf ? (
          <div className="button" onClick={handleCloseBtnClick}>
            {t('close')}
          </div>
        ) : (
          <div className="button" onClick={handleChatBtnClick}>
            {t('chat')}
          </div>
        )}
      </div>
    </div>
  );
});

UserInfoPopup.displayName = 'UserInfoPopup';

export default UserInfoPopup;
