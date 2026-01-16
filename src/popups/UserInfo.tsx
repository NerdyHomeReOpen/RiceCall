import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import LevelIcon from '@/components/LevelIcon';
import BadgeItem from '@/components/BadgeItem';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import ObjDiff from '@/utils/objDiff';

import { MAX_FILE_SIZE } from '@/constant';

import styles from '@/styles/userSetting.module.css';
import popupStyles from '@/styles/popup.module.css';
import vipStyles from '@/styles/vip.module.css';
import permissionStyles from '@/styles/permission.module.css';
import emojiStyles from '@/styles/emoji.module.css';

interface UserInfoPopupProps {
  userId: Types.User['userId'];
  targetId: Types.User['userId'];
  friend: Types.Friend | null;
  target: Types.User;
  targetServers: Types.Server[];
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = React.memo(({ userId, targetId, friend, target: targetData, targetServers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef<boolean>(false);

  // States
  const [target, setTarget] = useState(targetData);
  const [serversView, setServersView] = useState('joined');
  const [selectedTabId, setSelectedTabId] = useState<'about' | 'groups' | 'userSetting'>('about');
  const [countries, setCountries] = useState<string[]>([]);

  // Variables
  const {
    name: targetName,
    displayId: targetDisplayId,
    avatarUrl: targetAvatarUrl,
    gender: targetGender,
    signature: targetSignature,
    about: targetAbout,
    level: targetLevel,
    xp: targetXP,
    requiredXp: targetRequiredXp,
    vip: targetVip,
    birthYear: targetBirthYear,
    birthMonth: targetBirthMonth,
    birthDay: targetBirthDay,
    country: targetCountry,
    badges: targetBadges,
    isVerified: targetIsVerified,
    shareFavoriteServers: targetShareFavoriteServers,
    shareJoinedServers: targetShareJoinedServers,
    shareRecentServers: targetShareRecentServers,
  } = target;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayOptions = Array.from({ length: new Date(targetBirthYear, targetBirthMonth, 0).getDate() }, (_, i) => i + 1);
  const isSelf = userId === targetId;
  const isFriend = friend?.relationStatus === 2;
  const canSubmit = targetName.trim() && targetGender.trim() && targetCountry.trim() && targetBirthYear && targetBirthMonth && targetBirthDay;
  const joinedServers = useMemo(() => {
    return targetServers.filter((s) => Permission.isMember(s.permissionLevel) && !Permission.isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);
  const favoriteServers = useMemo(() => {
    return targetServers.filter((s) => s.favorite && !Permission.isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);
  const recentServers = useMemo(() => {
    return targetServers
      .filter((s) => s.recent)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);
  }, [targetServers]);
  const filteredBadges = useMemo(
    () =>
      JSON.parse(targetBadges)
        .slice(0, 13)
        .sort((a: Types.Badge, b: Types.Badge) => a.order - b.order),
    [targetBadges],
  );

  // Handlers
  const getUserAge = () => {
    const birthDate = new Date(targetBirthYear, targetBirthMonth - 1, targetBirthDay);
    let age = currentYear - birthDate.getFullYear();
    const monthDiff = currentMonth - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDate.getDate())) age--;
    return age;
  };

  const handleEditUser = (update: Partial<Types.User>) => {
    ipc.socket.send('editUser', { update });
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleServerSelect = (server: Types.Server) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() }));
  };

  const handleUploadImage = (imageUnit8Array: Uint8Array) => {
    isUploadingRef.current = true;
    if (imageUnit8Array.length > MAX_FILE_SIZE) {
      Popup.handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    ipc.data.uploadImage({ folder: 'user', imageName: userId, imageUnit8Array }).then((response) => {
      if (response) {
        setTarget((prev) => ({ ...prev, avatar: response.imageName, avatarUrl: response.imageUrl }));
        handleEditUser({ avatar: response.imageName, avatarUrl: response.imageUrl });
      }
      isUploadingRef.current = false;
    });
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

  // Effects
  useEffect(() => {
    (async () => {
      const res = await fetch('https://nerdyhomereopen.github.io/Details/country.json');
      if (!res.ok) return;
      const json = await res.json();
      setCountries(json);
    })();
  }, []);

  useEffect(() => {
    const daysInMonth = new Date(targetBirthYear, targetBirthMonth, 0).getDate();
    if (targetBirthDay > daysInMonth) {
      setTarget((prev) => ({ ...prev, birthDay: daysInMonth }));
    }
    if (isFutureDate(targetBirthYear, targetBirthMonth, targetBirthDay)) {
      setTarget((prev) => ({ ...prev, birthYear: currentYear, birthMonth: currentMonth, birthDay: currentDay }));
    }
  }, [targetBirthYear, targetBirthMonth, targetBirthDay, currentYear, currentMonth, currentDay, isFutureDate]);

  return (
    <div className={`${popupStyles['popup-wrapper']} ${styles['user-profile']}`}>
      <div className={styles['profile-box']}>
        <div className={styles['header']}>
          <div className={styles['window-action-buttons']}>
            <div className={styles['minimize-btn']} onClick={() => handleMinimize()} />
            <div className={styles['close-btn']} onClick={() => handleClose()} />
          </div>
          <div
            className={`${styles['avatar-picture']} ${isSelf ? styles['editable'] : ''}`}
            style={{ backgroundImage: `url(${targetAvatarUrl})` }}
            onClick={() => {
              if (!isSelf) return;
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/png, image/jpg, image/jpeg, image/webp, image/gif';
              fileInput.onchange = (e) => {
                const image = (e.target as HTMLInputElement).files?.[0];
                if (!image || isUploadingRef.current) return;
                image.arrayBuffer().then((arrayBuffer) => {
                  if (image.type === 'image/gif') {
                    handleUploadImage(new Uint8Array(arrayBuffer));
                  } else {
                    Popup.handleOpenImageCropper(new Uint8Array(arrayBuffer), handleUploadImage);
                  }
                });
              };
              fileInput.click();
            }}
          />
          <div className={`${popupStyles['row']} ${styles['no-drag']}`} style={{ gap: '3px', marginTop: '5px' }}>
            <p className={styles['user-name-text']}>{targetName}</p>
            {targetVip > 0 && <div className={`${vipStyles['vip-icon']} ${vipStyles[`vip-${targetVip}`]}`} />}
            <LevelIcon level={targetLevel} xp={targetXP} requiredXp={targetRequiredXp} showTooltip={true} />
            {targetIsVerified ? <div className={styles['official-icon']} title={t('is-official')} /> : null}
          </div>
          <p className={styles['user-account-text']} onClick={() => navigator.clipboard.writeText(targetId)}>
            @{targetDisplayId}
          </p>
          <p className={styles['user-info-text']}>
            {t(targetGender === 'Male' ? 'male' : 'female')} · {getUserAge()} · {t(targetCountry, { ns: 'country' })}
          </p>
          <p className={styles['user-signature']}>{targetSignature}</p>
          <div className={styles['tabs']}>
            <div
              className={`${styles['tab']} ${styles['about']} ${
                selectedTabId === 'userSetting' ? `${styles['selected']} ${styles['editable']}` : ''
              } ${selectedTabId === 'about' ? styles['selected'] : ''}`}
              onClick={() => setSelectedTabId('about')}
            >
              {t('about-me')}
            </div>
            <div
              className={`${styles['tab']} ${styles['groups']} ${selectedTabId === 'userSetting' ? styles['editable'] : ''} ${selectedTabId === 'groups' ? styles['selected'] : ''}`}
              onClick={() => setSelectedTabId('groups')}
            >
              {t('servers')}
            </div>
          </div>
        </div>
        <div className={styles['edit-tab-bar']} style={isSelf && selectedTabId !== 'groups' ? {} : { display: 'none' }}>
          {selectedTabId === 'userSetting' ? (
            <>
              <div
                className={`${popupStyles['button']} ${popupStyles['blue']} ${!canSubmit ? 'disabled' : ''}`}
                onClick={() => {
                  if (!countries.includes(targetCountry)) {
                    Popup.handleOpenErrorDialog(t('invalid-country'), () => {});
                    return;
                  }
                  handleEditUser(ObjDiff(target, targetData));
                  setSelectedTabId('about');
                }}
              >
                {t('confirm')}
              </div>
              <div className={popupStyles['button']} onClick={() => setSelectedTabId('about')}>
                {t('cancel')}
              </div>
            </>
          ) : (
            <div className={popupStyles['button']} onClick={() => setSelectedTabId('userSetting')}>
              {t('edit-profile')}
            </div>
          )}
        </div>
        <div className={styles['content']} style={selectedTabId === 'about' ? {} : { display: 'none' }}>
          {targetAbout && (
            <div className={styles['user-about-me']}>
              <div className={styles['user-about-me-text']}>{targetAbout}</div>
            </div>
          )}
          <div className={styles['user-profile-content']}>
            <div className={popupStyles['label']}>{t('recent-servers')}</div>
            <div className={styles['server-list']}>
              {!isSelf && !targetShareRecentServers ? (
                <div className={styles['user-recent-visits-private']}>
                  {t('not-public-recent-servers.top')}
                  <br />
                  {t('not-public-recent-servers.bottom')}
                </div>
              ) : recentServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-recent-servers')}</div>
              ) : (
                recentServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <div className={`${isSelf && server.ownerId === userId ? styles['is-owner'] : ''}`} />
                        <div className={styles['display-id-text']} onDoubleClick={(e) => e.stopPropagation()}>
                          {server.specialId || server.displayId}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={popupStyles['label']}>{t('recent-earned')}</div>
            <div className={styles['badge-viewer']}>
              {filteredBadges.map((badge: Types.Badge) => (
                <div key={badge.badgeId} className={styles['badge-item']}>
                  <BadgeItem key={badge.badgeId} badge={badge} position="left-top" direction="right-top" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles['content']} style={selectedTabId === 'groups' ? {} : { display: 'none' }}>
          <div className={styles['user-profile-content']}>
            <div className={popupStyles['select-box']}>
              <select value={serversView} onChange={(e) => setServersView(e.target.value)}>
                <option value="joined">{t('joined-servers')}</option>
                <option value="favorite">{t('favorited-servers')}</option>
              </select>
            </div>
            <div className={styles['server-list']} style={serversView === 'joined' ? {} : { display: 'none' }}>
              {!isSelf && !targetShareJoinedServers ? (
                <div className={styles['user-recent-visits-private']}>
                  {t('not-public-joined-servers.top')}
                  <br />
                  {t('not-public-joined-servers.bottom')}
                </div>
              ) : joinedServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-joined-servers')}</div>
              ) : (
                joinedServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className={`${permissionStyles[targetGender]} ${permissionStyles[`lv-${server.permissionLevel}`]}`} />
                        <div className={styles['contribution-value-text']}>{server.contribution}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles['server-list']} style={serversView === 'favorite' ? {} : { display: 'none' }}>
              {!isSelf && !targetShareFavoriteServers ? (
                <div className={styles['user-recent-visits-private']}>
                  {t('not-public-favorite-servers.top')}
                  <br />
                  {t('not-public-favorite-servers.bottom')}
                </div>
              ) : favoriteServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-favorite-servers')}</div>
              ) : (
                favoriteServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className={`${permissionStyles[targetGender]} ${permissionStyles[`lv-${server.permissionLevel}`]}`} />
                        <div className={styles['contribution-box']}>
                          <div className={styles['contribution-icon']} />
                          <div className={styles['contribution-value-text']}>{server.contribution}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className={styles['content']} style={selectedTabId === 'userSetting' ? {} : { display: 'none' }}>
          <div className={styles['user-profile-content']}>
            <div className={popupStyles['col']}>
              <div className={popupStyles['row']}>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('nickname')}</div>
                  <input name="name" type="text" value={targetName} maxLength={32} onChange={(e) => setTarget((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('gender')}</div>
                  <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                    <select value={targetGender} onChange={(e) => setTarget((prev) => ({ ...prev, gender: e.target.value as Types.User['gender'] }))}>
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={popupStyles['row']}>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('country')}</div>
                  <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                    <select value={targetCountry} onChange={(e) => setTarget((prev) => ({ ...prev, country: e.target.value }))}>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {t(country, { ns: 'country' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ width: '100%' }}>
                  <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                    <div className={popupStyles['label']}>{t('birthdate')}</div>
                    <div className={popupStyles['row']}>
                      <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                        <select id="birthYear" value={targetBirthYear} onChange={(e) => setTarget((prev) => ({ ...prev, birthYear: Number(e.target.value) }))}>
                          {yearOptions.map((year) => (
                            <option key={year} value={year} disabled={year > currentYear}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                        <select id="birthMonth" value={targetBirthMonth} onChange={(e) => setTarget((prev) => ({ ...prev, birthMonth: Number(e.target.value) }))}>
                          {monthOptions.map((month) => (
                            <option key={month} value={month} disabled={targetBirthYear === currentYear && month > currentMonth}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                        <select id="birthDay" value={targetBirthDay} onChange={(e) => setTarget((prev) => ({ ...prev, birthDay: Number(e.target.value) }))}>
                          {dayOptions.map((day) => (
                            <option key={day} value={day} disabled={targetBirthYear === currentYear && targetBirthMonth === currentMonth && day > currentDay}>
                              {day.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('signature')}</div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    ref={signatureInputRef}
                    name="signature"
                    type="text"
                    value={targetSignature}
                    maxLength={100}
                    onChange={(e) => setTarget((prev) => ({ ...prev, signature: e.target.value }))}
                    style={{ paddingRight: '28px', width: '100%' }}
                  />
                  <div
                    className={`${emojiStyles['emoji-icon']} ${emojiStyles['emoji-in-input']}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const x = e.currentTarget.getBoundingClientRect().left;
                      const y = e.currentTarget.getBoundingClientRect().top;
                      contextMenu.showEmojiPicker(x, y, 'left-top', e.currentTarget as HTMLElement, false, true, undefined, undefined, (_, full) => {
                        signatureInputRef.current?.focus();
                        document.execCommand('insertText', false, full);
                      });
                    }}
                  />
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('about-me')}</div>
                <textarea name="about" value={targetAbout} maxLength={200} onChange={(e) => setTarget((prev) => ({ ...prev, about: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        {!isFriend && !isSelf && (
          <div className={`${popupStyles['button']} ${popupStyles['green']}`} onClick={() => Popup.handleOpenApplyFriend(userId, targetId)}>
            {t('add-friend')}
          </div>
        )}
        {isSelf ? (
          <div className={popupStyles['button']} onClick={() => handleClose()}>
            {t('close')}
          </div>
        ) : (
          <div className={popupStyles['button']} onClick={() => Popup.handleOpenDirectMessage(userId, targetId)}>
            {t('chat')}
          </div>
        )}
      </div>
    </div>
  );
});

UserInfoPopup.displayName = 'UserInfoPopup';

export default UserInfoPopup;
