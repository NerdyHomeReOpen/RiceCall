import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
import type { Badge, Friend, Server, User } from '@/types';

// Components
import LevelIcon from '@/components/LevelIcon';
import BadgeItem from '@/components/BadgeItem';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// CSS
import styles from '@/styles/userSetting.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';
import emoji from '@/styles/emoji.module.css';

// Utils
import { handleOpenAlertDialog, handleOpenErrorDialog, handleOpenApplyFriend, handleOpenImageCropper } from '@/utils/popup';
import { isMember, isStaff } from '@/utils/permission';
import { objDiff } from '@/utils/objDiff';

// Constants
import { MAX_FILE_SIZE } from '@/constant';

interface UserInfoPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  friend: Friend | null;
  target: User;
  targetServers: Server[];
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = React.memo(({ userId, targetId, friend, target: targetData, targetServers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const signatureInputRef = useRef<HTMLInputElement>(null);

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
    return targetServers.filter((s) => isMember(s.permissionLevel) && !isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);
  const favoriteServers = useMemo(() => {
    return targetServers.filter((s) => s.favorite && !isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel);
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
        .sort((a: Badge, b: Badge) => a.order - b.order),
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

  const handleEditUser = (update: Partial<User>) => {
    ipc.socket.send('editUser', { update });
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }));
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

  const RecentServerNotPublicElement = () => {
    return (
      <div className={styles['user-recent-visits-private']}>
        {t('not-public-recent-servers.top')}
        <br />
        {t('not-public-recent-servers.bottom')}
      </div>
    );
  };

  const FavoriteServerNotPublicElement = () => {
    return (
      <div className={styles['user-recent-visits-private']}>
        {t('not-public-favorite-servers.top')}
        <br />
        {t('not-public-favorite-servers.bottom')}
      </div>
    );
  };

  const JoinServerNotPublicElement = () => {
    return (
      <div className={styles['user-recent-visits-private']}>
        {t('not-public-joined-servers.top')}
        <br />
        {t('not-public-joined-servers.bottom')}
      </div>
    );
  };

  return (
    <div className={`${popup['popup-wrapper']} ${styles['user-profile']}`}>
      <div className={styles['profile-box']}>
        {/* Header */}
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
              fileInput.accept = 'image/png, image/jpg, image/jpeg, image/webp';
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = async () =>
                  handleOpenImageCropper(reader.result as string, async (imageDataUrl) => {
                    if (imageDataUrl.length > MAX_FILE_SIZE) {
                      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
                      return;
                    }
                    const response = await ipc.data.upload('user', userId, imageDataUrl);
                    if (response) {
                      setTarget((prev) => ({ ...prev, avatar: response.avatar, avatarUrl: response.avatarUrl }));
                      handleEditUser({ avatar: response.avatar, avatarUrl: response.avatarUrl });
                    }
                  });
                reader.readAsDataURL(file);
              };
              fileInput.click();
            }}
          />

          <div className={`${popup['row']} ${styles['no-drag']}`} style={{ gap: '3px', marginTop: '5px' }}>
            <p className={styles['user-name-text']}>{targetName}</p>
            {targetVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${targetVip}`]}`} />}
            <LevelIcon level={targetLevel} xp={targetXP} requiredXp={targetRequiredXp} isSelf={isSelf} isHover={true} />
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

        {/* Action Buttons */}
        <div className={styles['edit-tab-bar']} style={isSelf && selectedTabId !== 'groups' ? {} : { display: 'none' }}>
          {selectedTabId === 'userSetting' ? (
            <>
              <div
                className={`${popup['button']} ${popup['blue']} ${!canSubmit ? 'disabled' : ''}`}
                onClick={() => {
                  // extra country validation
                  if (!countries.includes(targetCountry)) {
                    handleOpenErrorDialog(t('invalid-country'), () => {});
                    return;
                  }

                  handleEditUser(objDiff(target, targetData));
                  setSelectedTabId('about');
                }}
              >
                {t('confirm')}
              </div>
              <div className={popup['button']} onClick={() => setSelectedTabId('about')}>
                {t('cancel')}
              </div>
            </>
          ) : (
            <div className={popup['button']} onClick={() => setSelectedTabId('userSetting')}>
              {t('edit-profile')}
            </div>
          )}
        </div>

        {/* About */}
        <div className={styles['content']} style={selectedTabId === 'about' ? {} : { display: 'none' }}>
          {targetAbout && (
            <div className={styles['user-about-me']}>
              <div className={styles['user-about-me-text']}>{targetAbout}</div>
            </div>
          )}
          <div className={styles['user-profile-content']}>
            <div className={popup['label']}>{t('recent-servers')}</div>
            <div className={styles['server-list']}>
              {!isSelf && !targetShareRecentServers ? (
                <RecentServerNotPublicElement />
              ) : recentServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-recent-servers')}</div>
              ) : (
                recentServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server.serverId, server.displayId)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <div className={`${isSelf && server.ownerId === userId ? styles['is-owner'] : ''}`} />
                        <div className={styles['display-id-text']} onDoubleClick={(e) => e.stopPropagation()}>
                          {server.displayId}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={popup['label']}>{t('recent-earned')}</div>
            <div className={styles['badge-viewer']}>
              {filteredBadges.map((badge: Badge) => (
                <div key={badge.badgeId} className={styles['badge-item']}>
                  <BadgeItem key={badge.badgeId} badge={badge} position="left-top" direction="right-top" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className={styles['content']} style={selectedTabId === 'groups' ? {} : { display: 'none' }}>
          <div className={styles['user-profile-content']}>
            <div className={popup['select-box']}>
              <select value={serversView} onChange={(e) => setServersView(e.target.value)}>
                <option value="joined">{t('joined-servers')}</option>
                <option value="favorite">{t('favorited-servers')}</option>
              </select>
            </div>
            <div className={styles['server-list']} style={serversView === 'joined' ? {} : { display: 'none' }}>
              {!isSelf && !targetShareJoinedServers ? (
                <JoinServerNotPublicElement />
              ) : joinedServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-joined-servers')}</div>
              ) : (
                joinedServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server.serverId, server.displayId)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className={`${permission[targetGender]} ${permission[`lv-${server.permissionLevel}`]}`} />
                        <div className={styles['contribution-value-text']}>{server.contribution}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles['server-list']} style={serversView === 'favorite' ? {} : { display: 'none' }}>
              {!isSelf && !targetShareFavoriteServers ? (
                <FavoriteServerNotPublicElement />
              ) : favoriteServers.length === 0 ? (
                <div className={styles['user-recent-visits-private']}>{t('no-favorite-servers')}</div>
              ) : (
                favoriteServers.map((server) => (
                  <div key={server.serverId} className={styles['server-card']} onDoubleClick={() => handleServerSelect(server.serverId, server.displayId)}>
                    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                    <div className={styles['server-info-box']}>
                      <div className={styles['server-name-text']}>{server.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className={`${permission[targetGender]} ${permission[`lv-${server.permissionLevel}`]}`} />
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

        {/* User Setting */}
        <div className={styles['content']} style={selectedTabId === 'userSetting' ? {} : { display: 'none' }}>
          <div className={styles['user-profile-content']}>
            <div className={popup['col']}>
              <div className={popup['row']}>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('nickname')}</div>
                  <input name="name" type="text" value={targetName} maxLength={32} onChange={(e) => setTarget((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('gender')}</div>
                  <div className={popup['select-box']} style={{ width: '100%' }}>
                    <select value={targetGender} onChange={(e) => setTarget((prev) => ({ ...prev, gender: e.target.value as User['gender'] }))}>
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={popup['row']}>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('country')}</div>
                  <div className={popup['select-box']} style={{ width: '100%' }}>
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
                  <div className={`${popup['input-box']} ${popup['col']}`}>
                    <div className={popup['label']}>{t('birthdate')}</div>
                    <div className={popup['row']}>
                      <div className={popup['select-box']} style={{ width: '100%' }}>
                        <select id="birthYear" value={targetBirthYear} onChange={(e) => setTarget((prev) => ({ ...prev, birthYear: Number(e.target.value) }))}>
                          {yearOptions.map((year) => (
                            <option key={year} value={year} disabled={year > currentYear}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['select-box']} style={{ width: '100%' }}>
                        <select id="birthMonth" value={targetBirthMonth} onChange={(e) => setTarget((prev) => ({ ...prev, birthMonth: Number(e.target.value) }))}>
                          {monthOptions.map((month) => (
                            <option key={month} value={month} disabled={targetBirthYear === currentYear && month > currentMonth}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['select-box']} style={{ width: '100%' }}>
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

              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('signature')}</div>
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
                    className={`${emoji['emoji-icon']} ${emoji['emoji-in-input']}`}
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
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('about-me')}</div>
                <textarea name="about" value={targetAbout} maxLength={200} onChange={(e) => setTarget((prev) => ({ ...prev, about: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        {!isFriend && !isSelf && (
          <div className={`${popup['button']} ${popup['green']}`} onClick={() => handleOpenApplyFriend(userId, targetId)}>
            {t('add-friend')}
          </div>
        )}
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('close')}
        </div>
      </div>
    </div>
  );
});

UserInfoPopup.displayName = 'UserInfoPopup';

export default UserInfoPopup;
