import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
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
  friend: Types.Friend | null;
  target: Types.User;
  targetServers: Types.Server[];
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = React.memo(({ friend, target: targetData, targetServers }) => {
  // Hooks
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Refs
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef<boolean>(false);

  // States
  const [target, setTarget] = useState(targetData);
  const [serversView, setServersView] = useState('joined');
  const [selectedTabId, setSelectedTabId] = useState<'about' | 'groups' | 'userSetting'>('about');
  const [countries, setCountries] = useState<string[]>([]);

  // Variables
  const { userId } = user;
  const {
    userId: targetId,
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

  // Functions
  const getUserAge = () => {
    const birthDate = new Date(targetBirthYear, targetBirthMonth - 1, targetBirthDay);
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

  // Handlers
  const handleServerSelect = (server: Types.Server) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId: server.specialId || server.displayId, serverId: server.serverId, timestamp: Date.now() }));
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
        Popup.openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
          isUploadingRef.current = true;
          if (imageUnit8Array.length > MAX_FILE_SIZE) {
            Popup.openAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
            isUploadingRef.current = false;
            return;
          }
          ipc.data.uploadImage({ folder: 'user', imageName: userId, imageUnit8Array }).then((response) => {
            if (response) {
              setTarget((prev) => ({ ...prev, avatar: response.imageName, avatarUrl: response.imageUrl }));
              Popup.editUser({ avatar: response.imageName, avatarUrl: response.imageUrl });
            }
            isUploadingRef.current = false;
          });
        });
      });
    };
    fileInput.click();
  };

  const handleAccountTextClick = () => {
    navigator.clipboard.writeText(targetId);
  };

  const handleAboutTabClick = () => {
    setSelectedTabId('about');
  };

  const handleGroupsTabClick = () => {
    setSelectedTabId('groups');
  };

  const handleEditProfileBtnClick = () => {
    setSelectedTabId('userSetting');
  };

  const handleCancelBtnClick = () => {
    setTarget(targetData);
    setSelectedTabId('about');
  };

  const handleConfirmBtnClick = () => {
    if (!countries.includes(targetCountry)) {
      Popup.openErrorDialog(t('invalid-country'), () => {});
      return;
    }
    Popup.editUser(ObjDiff(target, targetData));
    setSelectedTabId('about');
  };

  const handleApplyFriendBtnClick = () => {
    Popup.openApplyFriend(userId, targetId);
  };

  const handleChatBtnClick = () => {
    Popup.openDirectMessage(userId, targetId);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTarget((prev) => ({ ...prev, gender: e.target.value as Types.User['gender'] }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTarget((prev) => ({ ...prev, country: e.target.value }));
  };

  const handleBirthYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTarget((prev) => ({ ...prev, birthYear: Number(e.target.value) }));
  };

  const handleBirthMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTarget((prev) => ({ ...prev, birthMonth: Number(e.target.value) }));
  };

  const handleBirthDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTarget((prev) => ({ ...prev, birthDay: Number(e.target.value) }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget((prev) => ({ ...prev, signature: e.target.value }));
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTarget((prev) => ({ ...prev, about: e.target.value }));
  };

  const handleServersViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServersView(e.target.value);
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
    ipc.window.minimize();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

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
            <div className={styles['minimize-btn']} onClick={handleMinimizeBtnClick} />
            <div className={styles['close-btn']} onClick={handleCloseBtnClick} />
          </div>
          <div className={`${styles['avatar-picture']} ${isSelf ? styles['editable'] : ''}`} style={{ backgroundImage: `url(${targetAvatarUrl})` }} onClick={handleAvatarClick} />
          <div className={`${popupStyles['row']} ${styles['no-drag']}`} style={{ gap: '3px', marginTop: '5px' }}>
            <p className={styles['user-name-text']}>{targetName}</p>
            {targetVip > 0 && <div className={`${vipStyles['vip-icon']} ${vipStyles[`vip-${targetVip}`]}`} />}
            <LevelIcon level={targetLevel} xp={targetXP} requiredXp={targetRequiredXp} showTooltip={true} />
            {targetIsVerified ? <div className={styles['official-icon']} title={t('is-official')} /> : null}
          </div>
          <p className={styles['user-account-text']} onClick={handleAccountTextClick}>
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
              onClick={handleAboutTabClick}
            >
              {t('about-me')}
            </div>
            <div
              className={`${styles['tab']} ${styles['groups']} ${selectedTabId === 'userSetting' ? styles['editable'] : ''} ${selectedTabId === 'groups' ? styles['selected'] : ''}`}
              onClick={handleGroupsTabClick}
            >
              {t('servers')}
            </div>
          </div>
        </div>
        <div className={styles['edit-tab-bar']} style={isSelf && selectedTabId !== 'groups' ? {} : { display: 'none' }}>
          {selectedTabId === 'userSetting' ? (
            <>
              <div className={`${popupStyles['button']} ${popupStyles['blue']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
                {t('confirm')}
              </div>
              <div className={popupStyles['button']} onClick={handleCancelBtnClick}>
                {t('cancel')}
              </div>
            </>
          ) : (
            <div className={popupStyles['button']} onClick={handleEditProfileBtnClick}>
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
                recentServers.map((server) => <RecentServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
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
              <select value={serversView} onChange={handleServersViewChange}>
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
                joinedServers.map((server) => <JoinedServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
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
                favoriteServers.map((server) => <FavoriteServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />)
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
                  <input name="name" type="text" value={targetName} maxLength={32} onChange={handleNameChange} />
                </div>
                <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                  <div className={popupStyles['label']}>{t('gender')}</div>
                  <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                    <select value={targetGender} onChange={handleGenderChange}>
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
                    <select value={targetCountry} onChange={handleCountryChange}>
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
                        <select id="birthYear" value={targetBirthYear} onChange={handleBirthYearChange}>
                          {yearOptions.map((year) => (
                            <option key={year} value={year} disabled={year > currentYear}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                        <select id="birthMonth" value={targetBirthMonth} onChange={handleBirthMonthChange}>
                          {monthOptions.map((month) => (
                            <option key={month} value={month} disabled={targetBirthYear === currentYear && month > currentMonth}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                        <select id="birthDay" value={targetBirthDay} onChange={handleBirthDayChange}>
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
                    onChange={handleSignatureChange}
                    style={{ paddingRight: '28px', width: '100%' }}
                  />
                  <div className={`${emojiStyles['emoji-icon']} ${emojiStyles['emoji-in-input']}`} onMouseDown={handleEmojiPickerClick} />
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('about-me')}</div>
                <textarea name="about" value={targetAbout} maxLength={200} onChange={handleAboutChange} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        {!isFriend && !isSelf && (
          <div className={`${popupStyles['button']} ${popupStyles['green']}`} onClick={handleApplyFriendBtnClick}>
            {t('add-friend')}
          </div>
        )}
        {isSelf ? (
          <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
            {t('close')}
          </div>
        ) : (
          <div className={popupStyles['button']} onClick={handleChatBtnClick}>
            {t('chat')}
          </div>
        )}
      </div>
    </div>
  );
});

UserInfoPopup.displayName = 'UserInfoPopup';

export default UserInfoPopup;

interface RecentServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const RecentServerCard: React.FC<RecentServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  // Selectors
  const user = useAppSelector((state) => state.user.data);

  // Variables
  const { userId } = user;
  const { userId: targetId } = target;
  const { serverId, avatarUrl: serverAvatarUrl, name: serverName, ownerId: serverOwnerId, specialId: serverSpecialId, displayId: serverDisplayId } = server;
  const isSelf = userId === targetId;
  const isOwner = serverOwnerId === targetId;

  // Handlers
  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div key={serverId} className={styles['server-card']} onDoubleClick={handleServerDoubleClick}>
      <Image src={serverAvatarUrl} alt={serverName} width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info-box']}>
        <div className={styles['server-name-text']}>{serverName}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div className={`${isSelf && isOwner ? styles['is-owner'] : ''}`} />
          <div className={styles['display-id-text']}>{serverSpecialId || serverDisplayId}</div>
        </div>
      </div>
    </div>
  );
});

RecentServerCard.displayName = 'RecentServerCard';

interface JoinedServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const JoinedServerCard: React.FC<JoinedServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  // Variables
  const { gender: targetGender } = target;
  const { serverId, avatarUrl: serverAvatarUrl, name: serverName, permissionLevel: serverPermissionLevel, contribution: serverContribution } = server;

  // Handlers
  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div key={serverId} className={styles['server-card']} onDoubleClick={handleServerDoubleClick}>
      <Image src={serverAvatarUrl} alt={serverName} width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info-box']}>
        <div className={styles['server-name-text']}>{serverName}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`${permissionStyles[targetGender]} ${permissionStyles[`lv-${serverPermissionLevel}`]}`} />
          <div className={styles['contribution-value-text']}>{serverContribution}</div>
        </div>
      </div>
    </div>
  );
});

JoinedServerCard.displayName = 'JoinedServerCard';

interface FavoriteServerCardProps {
  target: Types.User;
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const FavoriteServerCard: React.FC<FavoriteServerCardProps> = React.memo(({ target, server, onServerSelect }) => {
  // Variables
  const { gender: targetGender } = target;
  const { serverId, avatarUrl: serverAvatarUrl, name: serverName, permissionLevel: serverPermissionLevel, contribution: serverContribution } = server;

  // Handlers
  const handleServerDoubleClick = () => {
    onServerSelect(server);
  };

  return (
    <div key={serverId} className={styles['server-card']} onDoubleClick={handleServerDoubleClick}>
      <Image src={serverAvatarUrl} alt={serverName} width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info-box']}>
        <div className={styles['server-name-text']}>{serverName}</div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`${permissionStyles[targetGender]} ${permissionStyles[`lv-${serverPermissionLevel}`]}`} />
          <div className={styles['contribution-box']}>
            <div className={styles['contribution-icon']} />
            <div className={styles['contribution-value-text']}>{serverContribution}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

FavoriteServerCard.displayName = 'FavoriteServerCard';
