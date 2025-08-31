import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
import type { Friend, Server, User } from '@/types';

// Components
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';
import api from '@/services/api.service';

// CSS
import styles from '@/styles/popups/userSetting.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';
import emoji from '@/styles/emoji.module.css';

// Utils
import { isMember, isStaff } from '@/utils/permission';

// Country
import { countries } from '@/country';

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

  // Destructuring
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
  } = target;

  // Memos
  const { CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY } = useMemo(() => {
    const today = new Date();
    return { CURRENT_YEAR: today.getFullYear(), CURRENT_MONTH: today.getMonth() + 1, CURRENT_DAY: today.getDate() };
  }, []);
  const yearOptions = useMemo(() => Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i), [CURRENT_YEAR]);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayOptions = useMemo(() => Array.from({ length: new Date(targetBirthYear, targetBirthMonth, 0).getDate() }, (_, i) => i + 1), [targetBirthYear, targetBirthMonth]);
  const userAge = useMemo(() => {
    const birthDate = new Date(targetBirthYear, targetBirthMonth - 1, targetBirthDay);
    let age = CURRENT_YEAR - birthDate.getFullYear();
    const monthDiff = CURRENT_MONTH - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && CURRENT_DAY < birthDate.getDate())) age--;
    return age;
  }, [targetBirthYear, targetBirthMonth, targetBirthDay, CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY]);
  const joinedServers = useMemo(() => targetServers.filter((s) => isMember(s.permissionLevel) && !isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel), [targetServers]);
  const favoriteServers = useMemo(
    () => targetServers.filter((s) => s.favorite && isMember(s.permissionLevel) && !isStaff(s.permissionLevel)).sort((a, b) => b.permissionLevel - a.permissionLevel),
    [targetServers],
  );
  const recentServers = useMemo(
    () =>
      targetServers
        .filter((s) => s.recent)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 4),
    [targetServers],
  );
  const isProfilePrivate = useMemo(() => false, []); // TODO: implement privacy setting
  const isSelf = useMemo(() => userId === targetId, [userId, targetId]);
  const isFriend = useMemo(() => friend?.relationStatus === 2, [friend]);
  const canSubmit = useMemo(
    () => targetName.trim() && targetGender.trim() && targetCountry.trim() && targetBirthYear && targetBirthMonth && targetBirthDay,
    [targetName, targetGender, targetCountry, targetBirthYear, targetBirthMonth, targetBirthDay],
  );

  // Handlers
  const handleEditUser = (update: Partial<User>) => {
    ipc.socket.send('editUser', { update });
  };

  const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
    ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
  };

  const handleOpenErrorDialog = (message: string) => {
    ipc.popup.open('dialogError', 'errorDialog', { message, submitTo: 'errorDialog' });
  };

  const handleOpenImageCropper = (userId: User['userId'], imageData: string) => {
    ipc.popup.open('imageCropper', 'imageCropper', { imageData, submitTo: 'imageCropper' });
    ipc.popup.onSubmit('imageCropper', async (data) => {
      if (data.imageDataUrl.length > 5 * 1024 * 1024) {
        handleOpenErrorDialog(t('image-too-large', { '0': '5MB' }));
        return;
      }
      const formData = new FormData();
      formData.append('_type', 'user');
      formData.append('_fileName', userId);
      formData.append('_file', data.imageDataUrl as string);
      const response = await api.post('/upload', formData);
      if (response) {
        setTarget((prev) => ({ ...prev, avatar: response.avatar, avatarUrl: response.avatarUrl }));
        handleEditUser({ avatar: response.avatar, avatarUrl: response.avatarUrl });
      }
    });
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
      if (year > CURRENT_YEAR) return true;
      if (year === CURRENT_YEAR && month > CURRENT_MONTH) return true;
      if (year === CURRENT_YEAR && month === CURRENT_MONTH && day > CURRENT_DAY) return true;
      return false;
    },
    [CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY],
  );

  useEffect(() => {
    const daysInMonth = new Date(targetBirthYear, targetBirthMonth, 0).getDate();
    if (targetBirthDay > daysInMonth) {
      setTarget((prev) => ({ ...prev, birthDay: daysInMonth }));
    }
    if (isFutureDate(targetBirthYear, targetBirthMonth, targetBirthDay)) {
      setTarget((prev) => ({ ...prev, birthYear: CURRENT_YEAR, birthMonth: CURRENT_MONTH, birthDay: CURRENT_DAY }));
    }
  }, [targetBirthYear, targetBirthMonth, targetBirthDay, CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY, isFutureDate]);

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
            style={{ backgroundImage: `url(${targetAvatarUrl})` }}
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
                reader.onloadend = async () => handleOpenImageCropper(userId, reader.result as string);
                reader.readAsDataURL(file);
              };
              fileInput.click();
            }}
          />

          <div className={`${popup['row']} ${styles['no-drag']}`} style={{ gap: '3px', marginTop: '5px' }}>
            <div className={styles['user-name-text']}>{targetName}</div>
            {targetVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${targetVip}`]}`} />}
            <LevelIcon level={targetLevel} xp={targetXP} requiredXp={targetRequiredXp} />
          </div>
          <div className={styles['user-account-text']} onClick={() => navigator.clipboard.writeText(targetId)}>
            @{targetDisplayId}
          </div>
          <div className={styles['user-info-text']}>
            {t(targetGender === 'Male' ? 'male' : 'female')} . {userAge} .{t(targetCountry, { ns: 'country' })}
          </div>
          <div className={styles['user-signature']} dangerouslySetInnerHTML={{ __html: targetSignature }} />

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
                  handleEditUser({
                    name: targetName,
                    gender: targetGender,
                    country: targetCountry,
                    birthYear: targetBirthYear,
                    birthMonth: targetBirthMonth,
                    birthDay: targetBirthDay,
                    signature: targetSignature,
                    about: targetAbout,
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
          {targetAbout && (
            <div className={styles['user-about-me']}>
              <div className={styles['user-about-me-text']}>{targetAbout}</div>
            </div>
          )}
          <div className={styles['user-profile-content']}>
            <div className={popup['label']}>{t('recent-servers')}</div>
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
            <div className={popup['label']}>{t('recent-earned')}</div>
            <div className={styles['badge-viewer']}>
              <BadgeList badges={JSON.parse(targetBadges)} position="left-top" direction="right-top" maxDisplay={13} />
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
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className={`${permission[targetGender]} ${server.ownerId === userId ? permission[`lv-6`] : permission[`lv-${server.permissionLevel}`]}`} />
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
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className={`${styles['permission']} ${permission[targetGender]} ${server.ownerId === userId ? permission[`lv-6`] : permission[`lv-${server.permissionLevel}`]}`} />
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
                            <option key={year} value={year} disabled={year > CURRENT_YEAR}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['select-box']} style={{ width: '100%' }}>
                        <select id="birthMonth" value={targetBirthMonth} onChange={(e) => setTarget((prev) => ({ ...prev, birthMonth: Number(e.target.value) }))}>
                          {monthOptions.map((month) => (
                            <option key={month} value={month} disabled={targetBirthYear === CURRENT_YEAR && month > CURRENT_MONTH}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['select-box']} style={{ width: '100%' }}>
                        <select id="birthDay" value={targetBirthDay} onChange={(e) => setTarget((prev) => ({ ...prev, birthDay: Number(e.target.value) }))}>
                          {dayOptions.map((day) => (
                            <option key={day} value={day} disabled={targetBirthYear === CURRENT_YEAR && targetBirthMonth === CURRENT_MONTH && day > CURRENT_DAY}>
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
                <div className={popup['row']}>
                  <input
                    ref={signatureInputRef}
                    name="signature"
                    type="text"
                    defaultValue={targetSignature}
                    maxLength={100}
                    onChange={(e) => setTarget((prev) => ({ ...prev, signature: e.target.value }))}
                  />
                  <div
                    className={emoji['emoji-icon']}
                    onClick={(e) => {
                      const x = e.currentTarget.getBoundingClientRect().left;
                      const y = e.currentTarget.getBoundingClientRect().top;
                      contextMenu.showEmojiPicker(x, y, 'left-top', (_, full) => {
                        signatureInputRef.current?.focus();
                        document.execCommand('insertText', false, full);
                      });
                    }}
                  />
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('about-me')}</div>
                <textarea name="about" defaultValue={targetAbout} maxLength={200} onChange={(e) => setTarget((prev) => ({ ...prev, about: e.target.value }))} />
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
