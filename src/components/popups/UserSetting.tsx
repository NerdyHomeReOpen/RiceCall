import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
import { Server, User, UserServer, PopupType, Friend } from '@/types';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';
import apiService from '@/services/api.service';

// CSS
import styles from '@/styles/popups/userSetting.module.css';
import grade from '@/styles/grade.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';
import emoji from '@/styles/emoji.module.css';

// Utils
import Default from '@/utils/default';

// Country
import { countries } from '@/country';

interface UserSettingPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
}

const UserSettingPopup: React.FC<UserSettingPopupProps> = React.memo(({ userId, targetId }) => {
  // Props
  const socket = useSocket();
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const refreshRef = useRef(false);
  const emojiIconRef = useRef<HTMLDivElement>(null);

  // Constants
  const TODAY = useMemo(() => new Date(), []);
  const CURRENT_YEAR = TODAY.getFullYear();
  const CURRENT_MONTH = TODAY.getMonth() + 1;
  const CURRENT_DAY = TODAY.getDate();

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [friend, setFriend] = useState<Friend>(Default.friend());
  const [servers, setServers] = useState<UserServer[]>([]);
  const [serversView, setServersView] = useState('joined');
  const [selectedTabId, setSelectedTabId] = useState<'about' | 'groups' | 'userSetting'>('about');

  // Variables
  const {
    name: userName,
    // avatar: userAvatar,
    avatarUrl: userAvatarUrl,
    gender: userGender,
    signature: userSignature,
    level: userLevel,
    xp: userXP,
    requiredXp: userRequiredXP,
    vip: userVip,
    birthYear: userBirthYear,
    birthMonth: userBirthMonth,
    birthDay: userBirthDay,
    country: userCountry,
    badges: userBadges,
    currentServerId: userCurrentServerId,
  } = user;
  const isSelf = targetId === userId;
  const isFriend = !!friend.targetId;
  const isProfilePrivate = false; // TODO: 隱私設定開關，等設定功能完工
  const canSubmit = userName.trim() && userGender.trim() && userCountry.trim() && userBirthYear && userBirthMonth && userBirthDay;
  const joinedServers = servers.filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7).sort((a, b) => b.permissionLevel - a.permissionLevel);
  const favoriteServers = servers
    .filter((s) => s.favorite)
    .filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7)
    .sort((a, b) => b.permissionLevel - a.permissionLevel);
  const recentServers = servers
    .filter((s) => s.recent)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  const isFutureDate = useCallback(
    (year: number, month: number, day: number) => {
      if (year > CURRENT_YEAR) return true;
      if (year === CURRENT_YEAR && month > CURRENT_MONTH) return true;
      if (year === CURRENT_YEAR && month === CURRENT_MONTH && day > CURRENT_DAY) return true;
      return false;
    },
    [CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY],
  );

  const calculateAge = (birthYear: number, birthMonth: number, birthDay: number) => {
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    let age = CURRENT_YEAR - birthDate.getFullYear();
    const monthDiff = CURRENT_MONTH - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && CURRENT_DAY < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateAge(userBirthYear, userBirthMonth, userBirthDay);

  const yearOptions = useMemo(() => Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i), [CURRENT_YEAR]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const dayOptions = useMemo(() => Array.from({ length: new Date(userBirthYear, userBirthMonth, 0).getDate() }, (_, i) => i + 1), [userBirthYear, userBirthMonth]);

  // Handlers
  const handleEditUser = (user: Partial<User>) => {
    if (!socket) return;
    socket.send.editUser({ user, userId });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
    ipcService.initialData.onRequest('applyFriend', {
      userId,
      targetId,
    });
  };

  const handleOpenErrorDialog = (message: string) => {
    ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
    ipcService.initialData.onRequest('errorDialog', {
      message: message,
      submitTo: 'errorDialog',
    });
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    window.localStorage.setItem('trigger-handle-server-select', JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }));
  };

  const handleAvatarCropper = (userId: User['userId'], avatarData: string) => {
    ipcService.popup.open(PopupType.AVATAR_CROPPER, 'avatarCropper');
    ipcService.initialData.onRequest('avatarCropper', {
      avatarData: avatarData,
      submitTo: 'avatarCropper',
    });
    ipcService.popup.onSubmit('avatarCropper', async (data) => {
      const formData = new FormData();
      formData.append('_type', 'user');
      formData.append('_fileName', userId);
      formData.append('_file', data.imageDataUrl as string);
      const response = await apiService.post('/upload', formData);
      if (response) {
        setUser((prev) => ({
          ...prev,
          avatar: response.avatar,
          avatarUrl: response.avatarUrl,
        }));
        handleEditUser({
          avatar: response.avatar,
          avatarUrl: response.avatarUrl,
        });
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: targetId }).then((user) => {
        if (user) setUser(user);
      });
      getService.userServers({ userId: targetId }).then((servers) => {
        if (servers) setServers(servers);
      });
      getService.friend({ userId: userId, targetId: targetId }).then((friend) => {
        if (friend) setFriend(friend);
      });
    };
    refresh();
  }, [userId, targetId, userCurrentServerId]);

  useEffect(() => {
    const daysInMonth = new Date(userBirthYear, userBirthMonth, 0).getDate();
    if (userBirthDay > daysInMonth) {
      setUser((prev) => ({ ...prev, birthDay: daysInMonth }));
    }
    if (isFutureDate(userBirthYear, userBirthMonth, userBirthDay)) {
      setUser((prev) => ({
        ...prev,
        birthYear: CURRENT_YEAR,
        birthMonth: CURRENT_MONTH,
        birthDay: CURRENT_DAY,
      }));
    }
  }, [userBirthYear, userBirthMonth, userBirthDay, CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY, isFutureDate]);

  const PrivateElement = (text: React.ReactNode) => {
    return <div className={styles['user-recent-visits-private']}>{text}</div>;
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
            style={{ backgroundImage: `url(${userAvatarUrl})` }}
            onClick={() => {
              if (!isSelf) return;
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/png, image/jpg, image/jpeg, image/webp';
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  handleOpenErrorDialog(t('image-too-large'));
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = async () => {
                  handleAvatarCropper(userId, reader.result as string);
                };
                reader.readAsDataURL(file);
              };
              fileInput.click();
            }}
          />

          <div className={`${popup['row']} ${styles['no-drag']}`} style={{ gap: '3px', marginTop: '5px' }}>
            <div className={styles['user-name-text']}>{userName}</div>
            {userVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${userVip}`]}`} />}
            <div
              className={`${grade['grade']} ${grade[`lv-${Math.min(56, userLevel)}`]}`}
              title={`${t('level')}: ${userLevel}, ${t('xp')}:${userXP}, ${t('required-xp')}:${userRequiredXP - userXP}`}
            />
          </div>

          <div className={styles['user-account-text']} onClick={() => navigator.clipboard.writeText(userId)}>
            @{userName}
          </div>

          <div className={styles['user-info-text']}>
            {t(userGender === 'Male' ? 'male' : 'female')} . {userAge} .{t(userCountry, { ns: 'country' })}
          </div>

          <div className={styles['user-signature']} dangerouslySetInnerHTML={{ __html: userSignature }} />

          <div className={styles['tabs']}>
            <div
              className={`${styles['tab']} ${styles['about']} ${
                selectedTabId === 'userSetting' ? `${styles['selected']} ${styles['editable']}` : ''
              } ${selectedTabId === 'about' ? styles['selected'] : ''}`}
              onClick={() => {
                if (selectedTabId !== 'userSetting') {
                  setSelectedTabId('about');
                }
              }}
            >
              {t('about-me')}
            </div>
            <div
              className={`${styles['tab']} ${styles['groups']} ${selectedTabId === 'userSetting' ? styles['editable'] : ''} ${selectedTabId === 'groups' ? styles['selected'] : ''}`}
              onClick={() => {
                if (selectedTabId !== 'userSetting') {
                  setSelectedTabId('groups');
                }
              }}
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
                  handleEditUser({
                    name: userName,
                    gender: userGender,
                    country: userCountry,
                    birthYear: userBirthYear,
                    birthMonth: userBirthMonth,
                    birthDay: userBirthDay,
                    signature: userSignature,
                  });
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
          {userSignature && (
            <div className={styles['user-about-me-show']}>
              <div className={styles['user-about-me-show-text']} dangerouslySetInnerHTML={{ __html: userSignature }} />
            </div>
          )}
          <div className={styles['user-profile-content']}>
            <div className={popup['label']}>{t('recently-join-server')}</div>
            <div className={styles['server-list']}>
              {isProfilePrivate
                ? PrivateElement(
                    <>
                      {t('not-public-recent-servers-top')}
                      <br />
                      {t('not-public-recent-servers-bottom')}
                    </>,
                  )
                : recentServers.length === 0
                  ? PrivateElement(t('no-recent-servers'))
                  : recentServers.map((server) => (
                      <div key={server.serverId} className={styles['server-card']} onClick={() => handleServerSelect(server.serverId, server.displayId)}>
                        <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                        <div className={styles['server-info-box']}>
                          <div className={styles['server-name-text']}>{server.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <div className={`${isSelf && server.ownerId === userId ? styles['is-owner'] : ''}`} />
                            <div className={styles['display-id-text']}>{server.displayId}</div>
                          </div>
                        </div>
                      </div>
                    ))}
            </div>
          </div>
          <div className={`${styles['user-profile-content']}`}>
            <div className={popup['label']}>{t('recently-earned-badges')}</div>
            <div className={styles['badge-viewer']}>
              <BadgeListViewer badges={userBadges} maxDisplay={13} />
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
              {isProfilePrivate
                ? PrivateElement(
                    <>
                      {t('not-public-joined-servers-top')}
                      <br />
                      {t('not-public-joined-servers-bottom')}
                    </>,
                  )
                : joinedServers.length === 0
                  ? PrivateElement(t('no-joined-servers'))
                  : joinedServers.map((server) => (
                      <div key={server.serverId} className={styles['server-card']} onClick={() => handleServerSelect(server.serverId, server.displayId)}>
                        <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                        <div className={styles['server-info-box']}>
                          <div className={styles['server-name-text']}>{server.name}</div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div className={`${permission[userGender]} ${server.ownerId === targetId ? permission[`lv-6`] : permission[`lv-${server.permissionLevel}`]}`} />
                            <div className={styles['contribution-value-text']}>{server.contribution}</div>
                          </div>
                        </div>
                      </div>
                    ))}
            </div>
            <div className={styles['server-list']} style={serversView === 'favorite' ? {} : { display: 'none' }}>
              {isProfilePrivate
                ? PrivateElement(
                    <>
                      {t('not-public-favorite-servers-top')}
                      <br />
                      {t('not-public-favorite-servers-bottom')}
                    </>,
                  )
                : favoriteServers.length === 0
                  ? PrivateElement(t('no-favorite-servers'))
                  : favoriteServers.map((server) => (
                      <div key={server.serverId} className={styles['server-card']} onClick={() => handleServerSelect(server.serverId, server.displayId)}>
                        <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
                        <div className={styles['server-info-box']}>
                          <div className={styles['server-name-text']}>{server.name}</div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div className={`${styles['permission']} ${permission[userGender]} ${server.ownerId === targetId ? permission[`lv-6`] : permission[`lv-${server.permissionLevel}`]}`} />
                            <div className={styles['contribution-box']}>
                              <div className={styles['contribution-icon']} />
                              <div className={styles['contribution-value-text']}>{server.contribution}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <input name="name" type="text" value={userName} maxLength={32} onChange={(e) => setUser((prev) => ({ ...prev, name: e.target.value }))} />
                </div>

                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('gender')}</div>
                  <div className={popup['select-box']}>
                    <select value={userGender} onChange={(e) => setUser((prev) => ({ ...prev, gender: e.target.value as User['gender'] }))}>
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={popup['row']}>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('country')}</div>
                  <div className={popup['select-box']}>
                    <select value={userCountry} onChange={(e) => setUser((prev) => ({ ...prev, country: e.target.value }))}>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {t(country, { ns: 'country' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={`${popup['input-box']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('birthdate')}</div>
                  <div className={popup['row']}>
                    <div className={popup['select-box']}>
                      <select id="birthYear" value={userBirthYear} onChange={(e) => setUser((prev) => ({ ...prev, birthYear: Number(e.target.value) }))}>
                        {yearOptions.map((year) => (
                          <option key={year} value={year} disabled={year > CURRENT_YEAR}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['select-box']}>
                      <select id="birthMonth" value={userBirthMonth} onChange={(e) => setUser((prev) => ({ ...prev, birthMonth: Number(e.target.value) }))}>
                        {monthOptions.map((month) => (
                          <option key={month} value={month} disabled={userBirthYear === CURRENT_YEAR && month > CURRENT_MONTH}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['select-box']}>
                      <select id="birthDay" value={userBirthDay} onChange={(e) => setUser((prev) => ({ ...prev, birthDay: Number(e.target.value) }))}>
                        {dayOptions.map((day) => (
                          <option key={day} value={day} disabled={userBirthYear === CURRENT_YEAR && userBirthMonth === CURRENT_MONTH && day > CURRENT_DAY}>
                            {day.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('signature')}</div>
                <div className={popup['row']}>
                  <input name="signature" type="text" value={userSignature} onChange={(e) => setUser((prev) => ({ ...prev, signature: e.target.value }))} />
                  <div
                    ref={emojiIconRef}
                    className={emoji['emoji-icon']}
                    onClick={() => {
                      if (!emojiIconRef.current) return;
                      const x = emojiIconRef.current.getBoundingClientRect().x;
                      const y = emojiIconRef.current.getBoundingClientRect().y;
                      contextMenu.showEmojiPicker(x, y, true, 'unicode', (emoji) => {
                        setUser((prev) => ({ ...prev, signature: prev.signature + emoji }));
                      });
                    }}
                  />
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']} ${'disabled'}`}>
                <div className={popup['label']}>{t('about-me')}</div>
                <textarea name="about" />
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

UserSettingPopup.displayName = 'UserSettingPopup';

export default UserSettingPopup;
