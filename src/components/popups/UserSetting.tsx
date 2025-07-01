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
import setting from '@/styles/popups/editProfile.module.css';
import grade from '@/styles/grade.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';
import emoji from '@/styles/emoji.module.css';

// Utils
import Default from '@/utils/default';

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
  const [reloadAvatarKey, setReloadAvatarKey] = useState(0);

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
  const canSubmit =
    userName.trim() && userGender.trim() && userCountry.trim() && userBirthYear && userBirthMonth && userBirthDay;
  const joinedServers = servers
    .filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7)
    .sort((a, b) => b.permissionLevel - a.permissionLevel);
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

  const yearOptions = useMemo(
    () => Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i),
    [CURRENT_YEAR],
  );

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const dayOptions = useMemo(
    () => Array.from({ length: new Date(userBirthYear, userBirthMonth, 0).getDate() }, (_, i) => i + 1),
    [userBirthYear, userBirthMonth],
  );

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

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleServerSelect = (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
    window.localStorage.setItem(
      'trigger-handle-server-select',
      JSON.stringify({ serverDisplayId, serverId, timestamp: Date.now() }),
    );
  };

  // Effects
  useEffect(() => {
    if (!targetId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.user({
          userId: targetId,
        }),
        getService.userServers({
          userId: targetId,
        }),
        getService.friend({
          userId: userId,
          targetId: targetId,
        }),
      ]).then(([user, servers, friend]) => {
        if (user) {
          setUser(user);
        }
        if (servers) {
          setServers(servers);
        }
        if (friend) {
          setFriend(friend);
        }
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
    return <div className={setting['userRecentVisitsPrivate']}>{text}</div>;
  };

  return (
    <div className={`${popup['popupContainer']} ${setting['userProfile']}`}>
      <div className={setting['profileBox']}>
        {/* Header */}
        <div className={setting['header']}>
          <div className={setting['windowActionButtons']}>
            <div className={setting['minimizeBtn']} onClick={() => handleMinimize()} />
            <div className={setting['closeBtn']} onClick={() => handleClose()} />
          </div>

          <div
            className={`${setting['avatar']} ${isSelf ? setting['editable'] : ''}`}
            style={{
              backgroundImage: `url(${userAvatarUrl}?v=${reloadAvatarKey})`,
            }}
            onClick={() => {
              if (!isSelf) return;
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/*';
              fileInput.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const formData = new FormData();
                  formData.append('_type', 'user');
                  formData.append('_fileName', userId);
                  formData.append('_file', reader.result as string);
                  const data = await apiService.post('/upload', formData);
                  if (data) {
                    setUser((prev) => ({
                      ...prev,
                      avatar: data.avatar,
                      avatarUrl: data.avatarUrl,
                    }));
                    setReloadAvatarKey((prev) => prev + 1);
                    handleEditUser({
                      avatar: data.avatar,
                      avatarUrl: data.avatarUrl,
                    });
                  }
                };
                reader.readAsDataURL(file);
              };
              fileInput.click();
            }}
          />

          <div className={`${popup['row']} ${setting['noDrag']}`} style={{ gap: '2px' }}>
            <div className={setting['userName']}>{userName}</div>
            {userVip > 0 && <div className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`} />}
            <div
              className={`
                  ${grade['grade']} 
                  ${grade[`lv-${Math.min(56, userLevel)}`]}
                `}
              title={`${t('level')}：${userLevel}，${t('xp')}：${userXP}，${t('required-xp')}：${
                userRequiredXP - userXP
              }`}
            />
          </div>

          <div
            className={setting['userAccount']}
            onClick={() => {
              navigator.clipboard.writeText(userId);
            }}
          >
            @{userName}
          </div>

          <div className={setting['userContent']}>
            {t(userGender === 'Male' ? 'male' : 'female')} . {userAge} .{t(userCountry as keyof typeof t)}
          </div>

          <div className={setting['userSignature']} dangerouslySetInnerHTML={{ __html: userSignature }} />

          <div className={setting['tab']}>
            <div
              className={`${setting['item']} ${setting['about']}
                ${selectedTabId === 'userSetting' ? `${setting['selected']} ${setting['editable']}` : ''}
                ${selectedTabId === 'about' ? setting['selected'] : ''}`}
              onClick={() => {
                if (selectedTabId !== 'userSetting') {
                  setSelectedTabId('about');
                }
              }}
            >
              {t('about-me')}
            </div>
            <div
              className={`${setting['item']} ${setting['groups']}
                ${selectedTabId === 'userSetting' ? setting['editable'] : ''}
                ${selectedTabId === 'groups' ? setting['selected'] : ''}`}
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
        <div className={setting['editTabBar']} style={isSelf && selectedTabId !== 'groups' ? {} : { display: 'none' }}>
          {selectedTabId === 'userSetting' ? (
            <>
              <button
                className={`${setting['confirmedButton']} ${setting['blueBtn']}`}
                disabled={!canSubmit}
                onClick={() => {
                  if (!canSubmit) return;
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
              </button>
              <button className={setting['button']} onClick={() => setSelectedTabId('about')}>
                {t('cancel')}
              </button>
            </>
          ) : (
            <button className={setting['button']} onClick={() => setSelectedTabId('userSetting')}>
              {t('edit-profile')}
            </button>
          )}
        </div>

        {/* About */}
        <div className={setting['body']} style={selectedTabId === 'about' ? {} : { display: 'none' }}>
          {userSignature && (
            <div className={setting['userAboutMeShow']}>
              <div className={setting['userAboutMeShowText']} dangerouslySetInnerHTML={{ __html: userSignature }} />
            </div>
          )}
          <div className={setting['userProfileContent']}>
            <div className={setting['title']}>{t('recently-join-server')}</div>
            <div className={setting['serverItems']}>
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
                    <div
                      key={server.serverId}
                      className={setting['serverItem']}
                      onClick={() => handleServerSelect(server.serverId, server.displayId)}
                    >
                      <div
                        className={setting['serverAvatarPicture']}
                        style={{
                          backgroundImage: `url(${server.avatarUrl})`,
                        }}
                      />
                      <div className={setting['serverBox']}>
                        <div className={setting['serverName']}>{server.name}</div>
                        <div className={setting['serverInfo']}>
                          <div className={`${isSelf && server.ownerId === userId ? setting['isOwner'] : ''}`} />
                          <div className={setting['id']} />
                          <div className={setting['displayId']}>{server.displayId}</div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          <div className={`${setting['userProfileContent']}`}>
            <div className={setting['title']}>{t('recently-earned-badges')}</div>
            <div className={setting['badgeViewer']}>
              <BadgeListViewer badges={userBadges} maxDisplay={13} />
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className={setting['body']} style={selectedTabId === 'groups' ? {} : { display: 'none' }}>
          <div className={setting['userProfileContent']}>
            <div className={`${popup['inputBox']}`}>
              <div className={`${popup['selectBox']}`}>
                <select value={serversView} onChange={(e) => setServersView(e.target.value)}>
                  <option value="joined">{t('joined-servers')}</option>
                  <option value="favorite">{t('favorited-servers')}</option>
                </select>
              </div>
            </div>
            <div className={setting['serverItems']} style={serversView === 'joined' ? {} : { display: 'none' }}>
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
                    <div
                      key={server.serverId}
                      className={setting['serverItem']}
                      onClick={() => handleServerSelect(server.serverId, server.displayId)}
                    >
                      <div
                        className={setting['serverAvatarPicture']}
                        style={{
                          backgroundImage: `url(${server.avatarUrl})`,
                        }}
                      />
                      <div className={setting['serverBox']}>
                        <div className={setting['serverName']}>{server.name}</div>
                        <div className={`${setting['serverInfo']} ${setting['around']}`}>
                          <div
                            className={`
                                ${setting['permission']}
                                ${permission[userGender]} 
                                ${
                                  server.ownerId === targetId
                                    ? permission[`lv-6`]
                                    : permission[`lv-${server.permissionLevel}`]
                                }`}
                          />
                          <div className={setting['contributionBox']}>
                            <div className={setting['contributionIcon']} />
                            <div className={setting['contributionValue']}>{server.contribution}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
            <div className={setting['serverItems']} style={serversView === 'favorite' ? {} : { display: 'none' }}>
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
                    <div
                      key={server.serverId}
                      className={setting['serverItem']}
                      onClick={() => handleServerSelect(server.serverId, server.displayId)}
                    >
                      <div
                        className={setting['serverAvatarPicture']}
                        style={{
                          backgroundImage: `url(${server.avatarUrl})`,
                        }}
                      />
                      <div className={setting['serverBox']}>
                        <div className={setting['serverName']}>{server.name}</div>
                        <div className={`${setting['serverInfo']} ${setting['around']}`}>
                          <div
                            className={`
                              ${setting['permission']}
                              ${permission[userGender]} 
                              ${
                                server.ownerId === targetId
                                  ? permission[`lv-6`]
                                  : permission[`lv-${server.permissionLevel}`]
                              }`}
                          />
                          <div className={setting['contributionBox']}>
                            <div className={setting['contributionIcon']} />
                            <div className={setting['contributionValue']}>{server.contribution}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* User Setting */}
        <div className={setting['body']} style={selectedTabId === 'userSetting' ? {} : { display: 'none' }}>
          <div className={setting['userProfileContent']}>
            <div className={popup['col']}>
              <div className={popup['row']}>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('nickname')}</div>
                  <input
                    name="name"
                    type="text"
                    value={userName}
                    maxLength={32}
                    onChange={(e) => setUser((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('gender')}</div>
                  <div className={`${popup['selectBox']} ${popup['selectBoxMax']}`}>
                    <select
                      value={userGender}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          gender: e.target.value as User['gender'],
                        }))
                      }
                    >
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={popup['row']}>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('country')}</div>
                  <div className={popup['selectBox']}>
                    <select
                      value={userCountry}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                    >
                      <option value="taiwan">{t('taiwan')}</option>
                      <option value="china">{t('china')}</option>
                      <option value="japan">{t('japan')}</option>
                      <option value="korea">{t('korea')}</option>
                      <option value="usa">{t('usa')}</option>
                      <option value="uk">{t('uk')}</option>
                      <option value="france">{t('france')}</option>
                      <option value="germany">{t('germany')}</option>
                      <option value="italy">{t('italy')}</option>
                      <option value="spain">{t('spain')}</option>
                      <option value="portugal">{t('portugal')}</option>
                      <option value="brazil">{t('brazil')}</option>
                      <option value="argentina">{t('argentina')}</option>
                      <option value="mexico">{t('mexico')}</option>
                      <option value="colombia">{t('colombia')}</option>
                      <option value="chile">{t('chile')}</option>
                      <option value="peru">{t('peru')}</option>
                      <option value="venezuela">{t('venezuela')}</option>
                      <option value="bolivia">{t('bolivia')}</option>
                      <option value="ecuador">{t('ecuador')}</option>
                      <option value="paraguay">{t('paraguay')}</option>
                      <option value="uruguay">{t('uruguay')}</option>
                      <option value="nigeria">{t('nigeria')}</option>
                      <option value="southAfrica">{t('southAfrica')}</option>
                      <option value="india">{t('india')}</option>
                      <option value="indonesia">{t('indonesia')}</option>
                      <option value="malaysia">{t('malaysia')}</option>
                      <option value="philippines">{t('philippines')}</option>
                      <option value="thailand">{t('thailand')}</option>
                      <option value="vietnam">{t('vietnam')}</option>
                      <option value="turkey">{t('turkey')}</option>
                      <option value="saudiArabia">{t('saudiArabia')}</option>
                      <option value="qatar">{t('qatar')}</option>
                      <option value="kuwait">{t('kuwait')}</option>
                      <option value="oman">{t('oman')}</option>
                      <option value="bahrain">{t('bahrain')}</option>
                      <option value="algeria">{t('algeria')}</option>
                      <option value="morocco">{t('morocco')}</option>
                      <option value="tunisia">{t('tunisia')}</option>
                      <option value="nigeria">{t('nigeria')}</option>
                    </select>
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>{t('birthdate')}</div>
                  <div className={popup['row']}>
                    <div className={popup['selectBox']}>
                      <select
                        id="birthYear"
                        value={userBirthYear}
                        onChange={(e) =>
                          setUser((prev) => ({
                            ...prev,
                            birthYear: Number(e.target.value),
                          }))
                        }
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year} disabled={year > CURRENT_YEAR}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['selectBox']}>
                      <select
                        className={popup['input']}
                        id="birthMonth"
                        value={userBirthMonth}
                        onChange={(e) =>
                          setUser((prev) => ({
                            ...prev,
                            birthMonth: Number(e.target.value),
                          }))
                        }
                      >
                        {monthOptions.map((month) => (
                          <option
                            key={month}
                            value={month}
                            disabled={userBirthYear === CURRENT_YEAR && month > CURRENT_MONTH}
                          >
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['selectBox']}>
                      <select
                        className={popup['input']}
                        id="birthDay"
                        value={userBirthDay}
                        onChange={(e) =>
                          setUser((prev) => ({
                            ...prev,
                            birthDay: Number(e.target.value),
                          }))
                        }
                      >
                        {dayOptions.map((day) => (
                          <option
                            key={day}
                            value={day}
                            disabled={
                              userBirthYear === CURRENT_YEAR && userBirthMonth === CURRENT_MONTH && day > CURRENT_DAY
                            }
                          >
                            {day.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('signature')}</div>
                <div className={popup['row']}>
                  <input
                    name="signature"
                    type="text"
                    value={userSignature}
                    onChange={(e) => {
                      setUser((prev) => ({
                        ...prev,
                        signature: e.target.value,
                      }));
                    }}
                  />
                  <div
                    ref={emojiIconRef}
                    className={emoji['emojiIcon']}
                    onClick={() => {
                      if (!emojiIconRef.current) return;
                      const x = emojiIconRef.current.getBoundingClientRect().x;
                      const y = emojiIconRef.current.getBoundingClientRect().y;
                      contextMenu.showEmojiPicker(x, y, true, 'unicode', (emoji) => {
                        setUser((prev) => ({
                          ...prev,
                          signature: prev.signature + emoji,
                        }));
                      });
                    }}
                  />
                </div>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}>
                <div className={popup['label']}>{t('about')}</div>
                <textarea name="about" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        {!isFriend && !isSelf && (
          <div
            className={`${setting['confirmedButton']} ${setting['greenBtn']}`}
            onClick={() => handleOpenApplyFriend(userId, targetId)}
          >
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
