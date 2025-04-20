import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// Types
import type { Badge, Server, User, UserServer } from '@/types';
import { PopupType } from '@/types';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';
import apiService from '@/services/api.service';

// CSS
import setting from '@/styles/popups/editProfile.module.css';
import grade from '@/styles/grade.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Utils
import { createDefault } from '@/utils/createDefault';

interface UserSettingPopupProps {
  userId: User['userId'];
  targetId: string;
}

const UserSettingPopup: React.FC<UserSettingPopupProps> = React.memo(
  (initialData: UserSettingPopupProps) => {
    // Props
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);
    const isSelectingRef = useRef(false);
    const isLoading = useRef(false);

    // Constants
    const TODAY = useMemo(() => new Date(), []);
    const CURRENT_YEAR = TODAY.getFullYear();
    const CURRENT_MONTH = TODAY.getMonth() + 1;
    const CURRENT_DAY = TODAY.getDate();
    const MAIN_TABS = [
      { id: 'about', label: lang.tr.about },
      { id: 'groups', label: lang.tr.groups },
      { id: 'userSetting', label: '' },
    ];

    // User states
    const [userAvatar, setUserAvatar] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [userAvatarUrl, setUserAvatarUrl] = useState<User['avatarUrl']>(
      createDefault.user().avatarUrl,
    );
    const [userName, setUserName] = useState<User['name']>(
      createDefault.user().name,
    );
    const [userGender, setUserGender] = useState<User['gender']>(
      createDefault.user().gender,
    );
    const [userSignature, setUserSignature] = useState<User['signature']>(
      createDefault.user().signature,
    );
    const [userLevel, setUserLevel] = useState<User['level']>(
      createDefault.user().level,
    );
    const [userXP, setUserXP] = useState<User['xp']>(createDefault.user().xp);
    const [userRequiredXP, setUserRequiredXP] = useState<User['requiredXp']>(
      createDefault.user().requiredXp,
    );
    const [userVip, setUserVip] = useState<User['vip']>(
      createDefault.user().vip,
    );
    const [userBirthYear, setUserBirthYear] = useState<User['birthYear']>(
      createDefault.user().birthYear,
    );
    const [userBirthMonth, setUserBirthMonth] = useState<User['birthMonth']>(
      createDefault.user().birthMonth,
    );
    const [userBirthDay, setUserBirthDay] = useState<User['birthDay']>(
      createDefault.user().birthDay,
    );
    const [userCountry, setUserCountry] = useState<User['country']>(
      createDefault.user().country,
    );
    const [userServers, setUserServers] = useState<UserServer[]>([]);
    const [userBadges, setUserBadges] = useState<Badge[]>([]);
    const [serversView, setServersView] = useState('joined');
    const [isFriend, setIsFriend] = useState(false);
    const [selectedTabId, setSelectedTabId] = useState<
      'about' | 'groups' | 'userSetting'
    >('about');

    // Variables
    const { userId, targetId } = initialData;
    const userGrade = Math.min(56, userLevel);
    const isSelf = targetId === userId;
    const isEditing = isSelf && selectedTabId === 'userSetting';
    const userJoinedServers = userServers
      .filter(
        (server) => server.permissionLevel > 1 && server.permissionLevel < 7,
      )
      .sort((a, b) => b.permissionLevel - a.permissionLevel);
    const userFavoriteServers = userJoinedServers
      .filter((server) => server.favorite)
      .sort((a, b) => b.permissionLevel - a.permissionLevel);
    const userRecentServers = userJoinedServers
      .filter((server) => server.recent)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);

    const isFutureDate = useCallback(
      (year: number, month: number, day: number) => {
        if (year > CURRENT_YEAR) return true;
        if (year === CURRENT_YEAR && month > CURRENT_MONTH) return true;
        if (
          year === CURRENT_YEAR &&
          month === CURRENT_MONTH &&
          day > CURRENT_DAY
        )
          return true;
        return false;
      },
      [CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY],
    );

    const calculateAge = (
      birthYear: number,
      birthMonth: number,
      birthDay: number,
    ) => {
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      let age = CURRENT_YEAR - birthDate.getFullYear();
      const monthDiff = CURRENT_MONTH - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && CURRENT_DAY < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    const userAge = calculateAge(userBirthYear, userBirthMonth, userBirthDay);

    const yearOptions = useMemo(
      () =>
        Array.from(
          { length: CURRENT_YEAR - 1900 + 1 },
          (_, i) => CURRENT_YEAR - i,
        ),
      [CURRENT_YEAR],
    );

    const monthOptions = useMemo(
      () => Array.from({ length: 12 }, (_, i) => i + 1),
      [],
    );

    const dayOptions = useMemo(
      () =>
        Array.from(
          { length: new Date(userBirthYear, userBirthMonth, 0).getDate() },
          (_, i) => i + 1,
        ),
      [userBirthYear, userBirthMonth],
    );

    // Handlers
    const handleUpdateUser = (user: Partial<User>) => {
      if (!socket) return;
      socket.send.updateUser({ user, userId });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserName(data.name);
      setUserAvatar(data.avatar);
      setUserAvatarUrl(data.avatarUrl);
      setUserGender(data.gender);
      setUserSignature(data.signature);
      setUserLevel(data.level);
      setUserVip(data.vip);
      setUserBirthYear(data.birthYear);
      setUserBirthMonth(data.birthMonth);
      setUserBirthDay(data.birthDay);
      setUserCountry(data.country);
      setUserRequiredXP(data.requiredXp);
      setUserXP(data.xp);
      setUserBadges(data.badges);
    };

    const handleUserServerUpdate = (data: UserServer[] | null) => {
      if (!data) return;
      setUserServers(data);
    };

    const handleOpenApplyFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
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

    // FIXME: maybe find a better way to handle this
    const handleServerSelect = (userId: User['userId'], server: Server) => {
      if (isSelectingRef.current || isLoading.current || isSelectingRef.current)
        return;
      isSelectingRef.current = true;
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 3000);
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: server.displayId,
          timestamp: Date.now(),
        }),
      );
      setTimeout(() => {
        socket.send.connectServer({ userId, serverId: server.serverId });
      }, 1500);
    };

    // Effects
    useEffect(() => {
      if (!targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.user({
            userId: targetId,
          }),
          refreshService.userServers({
            userId: targetId,
          }),
          refreshService.userFriends({
            userId: targetId,
          }),
        ]).then(([user, userServers, userFriends]) => {
          handleUserUpdate(user);
          handleUserServerUpdate(userServers);
          setIsFriend(!!userFriends?.find((fd) => fd.targetId === userId));
        });
      };
      refresh();
    }, [userId, targetId]);

    useEffect(() => {
      const daysInMonth = new Date(userBirthYear, userBirthMonth, 0).getDate();

      if (userBirthDay > daysInMonth) {
        setUserBirthDay(daysInMonth);
      }

      if (isFutureDate(userBirthYear, userBirthMonth, userBirthDay)) {
        setUserBirthYear(CURRENT_YEAR);
        setUserBirthMonth(CURRENT_MONTH);
        setUserBirthDay(CURRENT_DAY);
      }
    }, [
      userBirthYear,
      userBirthMonth,
      userBirthDay,
      CURRENT_YEAR,
      CURRENT_MONTH,
      CURRENT_DAY,
      isFutureDate,
    ]);

    const ProfilePrivate = false; // TODO: 隱私設定開關，等設定功能完工
    const PrivateElement = (text: React.ReactNode) => {
      return <div className={setting['userRecentVisitsPrivate']}>{text}</div>;
    };
    const getMainContent = () => {
      switch (selectedTabId) {
        case 'about':
          return (
            <>
              {isSelf && (
                <div className={setting['editTabBar']}>
                  <div
                    className={setting['button']}
                    onClick={() => setSelectedTabId('userSetting')}
                  >
                    {'編輯資料' /** EDIT PROFILE **/}
                  </div>
                </div>
              )}
              <div className={setting['userAboutMeShow']}>{userSignature}</div>
              <div className={setting['userProfileContent']}>
                <div className={setting['title']}>
                  {'最近訪問' /** LAST JOIN GROUP **/}
                </div>
                {!ProfilePrivate && userRecentServers.length ? (
                  <div className={setting['serverItems']}>
                    {userRecentServers.map((server) => (
                      <div
                        key={server.serverId}
                        className={setting['serverItem']}
                        onClick={() => handleServerSelect(userId, server)}
                      >
                        <div
                          className={setting['serverAvatarPicture']}
                          style={{
                            backgroundImage: `url(${server.avatarUrl})`,
                          }}
                        />
                        <div className={setting['serverBox']}>
                          <div className={setting['serverName']}>
                            {server.name}
                          </div>
                          <div className={setting['serverInfo']}>
                            <div
                              className={`${
                                isSelf && server.ownerId === userId
                                  ? setting['isOwner']
                                  : ''
                              }`}
                            />
                            <div className={setting['id']} />
                            <div className={setting['displayId']}>
                              {server.displayId}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ProfilePrivate ? (
                  PrivateElement(
                    <>
                      對方沒有對外
                      <br />
                      公開最近訪問
                    </>,
                  )
                ) : (
                  PrivateElement('最近沒訪問語音群')
                )}
              </div>
              <div className={`${setting['userProfileContent']}`}>
                <div className={setting['title']}>
                  {'最近獲得' /** BADGE TITLE **/}
                </div>
                <div className={setting['badgeViewer']}>
                  <BadgeViewer badges={userBadges} maxDisplay={13} />
                </div>
              </div>
            </>
          );
        case 'groups':
          return (
            <div className={setting['joinedServers']}>
              <div className={`${popup['inputBox']}`}>
                <div className={`${popup['selectBox']}`}>
                  <select
                    value={serversView}
                    onChange={(e) => setServersView(e.target.value)}
                  >
                    <option value="joined">{'加入的群'}</option>
                    <option value="favorite">{'收藏的群'}</option>
                  </select>
                </div>
              </div>
              <div className={setting['serverItems']}>
                {serversView === 'joined'
                  ? ProfilePrivate
                    ? PrivateElement(
                        <>
                          對方沒有對外公開
                          <br />
                          加入的語音群
                        </>,
                      )
                    : userJoinedServers.length === 0
                    ? PrivateElement('沒有加入的語音群')
                    : userJoinedServers.map((server) => (
                        <div
                          key={server.serverId}
                          className={setting['serverItem']}
                          onClick={() => handleServerSelect(userId, server)}
                        >
                          <div
                            className={setting['serverAvatarPicture']}
                            style={{
                              backgroundImage: `url(${server.avatarUrl})`,
                            }}
                          />
                          <div className={setting['serverBox']}>
                            <div className={setting['serverName']}>
                              {server.name}
                            </div>
                            <div
                              className={`${setting['serverInfo']} ${setting['around']}`}
                            >
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
                                <div>{'貢獻:'}</div>
                                <div className={setting['contributionValue']}>
                                  {server.contribution}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  : ProfilePrivate
                  ? PrivateElement(
                      <>
                        對方沒有對外公開
                        <br />
                        收藏的語音群
                      </>,
                    )
                  : userFavoriteServers.length === 0
                  ? PrivateElement('沒有收藏的語音群')
                  : userFavoriteServers.map((server) => (
                      <div
                        key={server.serverId}
                        className={setting['serverItem']}
                        onClick={() => handleServerSelect(userId, server)}
                      >
                        <div
                          className={setting['serverAvatarPicture']}
                          style={{
                            backgroundImage: `url(${server.avatarUrl})`,
                          }}
                        />
                        <div className={setting['serverBox']}>
                          <div className={setting['serverName']}>
                            {server.name}
                          </div>
                          <div
                            className={`${setting['serverInfo']} ${setting['around']}`}
                          >
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
                              <div>{'貢獻:'}</div>
                              <div className={setting['contributionValue']}>
                                {server.contribution}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          );
        case 'userSetting':
          return (
            <>
              <div className={setting['editTabBar']}>
                <div
                  className={`${setting['confirmedButton']} ${
                    setting['blueBtn']
                  } ${
                    !userName ||
                    !userGender ||
                    !userCountry ||
                    !userBirthYear ||
                    !userBirthMonth ||
                    !userBirthDay
                      ? setting['disabled']
                      : ''
                  }`}
                  onClick={() => {
                    handleUpdateUser({
                      avatar: userAvatar,
                      avatarUrl: userAvatarUrl,
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
                  {lang.tr.confirm}
                </div>
                <div
                  className={setting['button']}
                  onClick={() => setSelectedTabId('about')}
                >
                  {lang.tr.cancel}
                </div>
              </div>
              <div className={setting['userProfileContent']}>
                <div className={popup['col']}>
                  <div className={popup['row']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <label
                        className={popup['label']}
                        htmlFor="profile-form-nickname"
                      >
                        {lang.tr.nickname}
                      </label>
                      <input
                        type="text"
                        id="profile-form-nickname"
                        value={userName}
                        maxLength={32}
                        minLength={2}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                    </div>

                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <label
                        className={popup['label']}
                        htmlFor="profile-form-gender"
                      >
                        {lang.tr.gender}
                      </label>
                      <div
                        className={`${popup['selectBox']} ${popup['selectBoxMax']}`}
                      >
                        <select
                          value={userGender}
                          onChange={(e) =>
                            setUserGender(e.target.value as User['gender'])
                          }
                        >
                          <option value="Male">{lang.tr.male}</option>
                          <option value="Female">{lang.tr.female}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={popup['row']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <label
                        className={popup['label']}
                        htmlFor="profile-form-country"
                      >
                        {lang.tr.country}
                      </label>
                      <div className={popup['selectBox']}>
                        <select
                          value={userCountry}
                          onChange={(e) => setUserCountry(e.target.value)}
                        >
                          <option value="taiwan">{lang.tr.taiwan}</option>
                          <option value="china">{lang.tr.china}</option>
                          <option value="japan">{lang.tr.japan}</option>
                          <option value="korea">{lang.tr.korea}</option>
                          <option value="usa">{lang.tr.usa}</option>
                          <option value="uk">{lang.tr.uk}</option>
                          <option value="france">{lang.tr.france}</option>
                          <option value="germany">{lang.tr.germany}</option>
                          <option value="italy">{lang.tr.italy}</option>
                          <option value="spain">{lang.tr.spain}</option>
                          <option value="portugal">{lang.tr.portugal}</option>
                          <option value="brazil">{lang.tr.brazil}</option>
                          <option value="argentina">{lang.tr.argentina}</option>
                          <option value="mexico">{lang.tr.mexico}</option>
                          <option value="colombia">{lang.tr.colombia}</option>
                          <option value="chile">{lang.tr.chile}</option>
                          <option value="peru">{lang.tr.peru}</option>
                          <option value="venezuela">{lang.tr.venezuela}</option>
                          <option value="bolivia">{lang.tr.bolivia}</option>
                          <option value="ecuador">{lang.tr.ecuador}</option>
                          <option value="paraguay">{lang.tr.paraguay}</option>
                          <option value="uruguay">{lang.tr.uruguay}</option>
                          <option value="nigeria">{lang.tr.nigeria}</option>
                          <option value="southAfrica">
                            {lang.tr.southAfrica}
                          </option>
                          <option value="india">{lang.tr.india}</option>
                          <option value="indonesia">{lang.tr.indonesia}</option>
                          <option value="malaysia">{lang.tr.malaysia}</option>
                          <option value="philippines">
                            {lang.tr.philippines}
                          </option>
                          <option value="thailand">{lang.tr.thailand}</option>
                          <option value="vietnam">{lang.tr.vietnam}</option>
                          <option value="turkey">{lang.tr.turkey}</option>
                          <option value="saudiArabia">
                            {lang.tr.saudiArabia}
                          </option>
                          <option value="qatar">{lang.tr.qatar}</option>
                          <option value="kuwait">{lang.tr.kuwait}</option>
                          <option value="oman">{lang.tr.oman}</option>
                          <option value="bahrain">{lang.tr.bahrain}</option>
                          <option value="algeria">{lang.tr.algeria}</option>
                          <option value="morocco">{lang.tr.morocco}</option>
                          <option value="tunisia">{lang.tr.tunisia}</option>
                          <option value="nigeria">{lang.tr.nigeria}</option>
                        </select>
                      </div>
                    </div>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <label
                        className={popup['label']}
                        htmlFor="profile-form-birthdate"
                      >
                        {lang.tr.birthdate}
                      </label>
                      <div className={popup['row']}>
                        <div className={popup['selectBox']}>
                          <select
                            id="birthYear"
                            value={userBirthYear}
                            onChange={(e) =>
                              setUserBirthYear(Number(e.target.value))
                            }
                          >
                            {yearOptions.map((year) => (
                              <option
                                key={year}
                                value={year}
                                disabled={year > CURRENT_YEAR}
                              >
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
                              setUserBirthMonth(Number(e.target.value))
                            }
                          >
                            {monthOptions.map((month) => (
                              <option
                                key={month}
                                value={month}
                                disabled={
                                  userBirthYear === CURRENT_YEAR &&
                                  month > CURRENT_MONTH
                                }
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
                              setUserBirthDay(Number(e.target.value))
                            }
                          >
                            {dayOptions.map((day) => (
                              <option
                                key={day}
                                value={day}
                                disabled={
                                  userBirthYear === CURRENT_YEAR &&
                                  userBirthMonth === CURRENT_MONTH &&
                                  day > CURRENT_DAY
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
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-signature"
                    >
                      {lang.tr.signature}
                    </label>
                    <input
                      type="text"
                      id="profile-form-signature"
                      value={userSignature}
                      maxLength={200}
                      onChange={(e) => setUserSignature(e.target.value)}
                    />
                  </div>

                  <div
                    className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                  >
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-about"
                    >
                      {lang.tr.about}
                    </label>
                    <textarea id="profile-form-about" />
                  </div>
                </div>
              </div>
            </>
          );
      }
    };

    return (
      <div className={`${popup['popupContainer']} ${setting['userProfile']}`}>
        <div
          className={`${popup['col']} ${setting['profileBox']} ${
            !isSelf && setting['hiddenTab']
          }`}
        >
          <div className={setting['header']}>
            <div className={setting['windowActionButtons']}>
              <div
                className={setting['minimizeBtn']}
                onClick={handleMinimize}
              ></div>
              <div className={setting['closeBtn']} onClick={handleClose}></div>
            </div>
            <div
              className={`${setting['avatar']} ${
                isEditing && isSelf ? setting['editable'] : ''
              }`}
              style={{ backgroundImage: `url(${userAvatarUrl})` }}
              onClick={() => {
                if (!isSelf || !isEditing) return;
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
                      setUserAvatar(data.avatar);
                      setUserAvatarUrl(data.avatarUrl);
                    }
                  };
                  reader.readAsDataURL(file);
                };
                fileInput.click();
              }}
            />
            <div
              className={`${popup['row']} ${setting['noDrag']}`}
              style={{ marginTop: '10px', gap: '2px' }}
            >
              <div className={setting['userName']}>{userName}</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
              <div
                className={`${grade['grade']} ${grade[`lv-${userGrade}`]}`}
                title={
                  `等級：${userLevel}級，積分：${userXP}，升級還需：${userRequiredXP}` /** LEVEL:{userLevel} EXP:{userXP} LEVEL UP REQUIRED:{userRequiredXP}**/
                }
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
              {lang.tr[userGender === 'Male' ? 'male' : 'female']} . {userAge} .
              {lang.tr[userCountry as keyof typeof lang.tr]}
            </div>
            <div className={setting['userSignature']}>{userSignature}</div>

            <div className={setting['tab']}>
              {MAIN_TABS.map((Tab) => {
                const TabId = Tab.id;
                const TabLabel = Tab.label;
                if (TabId === 'userSetting') return null;
                return (
                  <div
                    key={`Tabs-${TabId}`}
                    className={`${setting['item']} ${setting[TabId]} ${
                      TabId === selectedTabId ||
                      (selectedTabId === 'userSetting' && TabId !== 'groups')
                        ? setting['selected']
                        : ''
                    }`}
                    onClick={() => {
                      if (selectedTabId !== 'userSetting') {
                        setSelectedTabId(TabId as 'about' | 'groups');
                      }
                    }}
                  >
                    {TabLabel}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className={`${setting['body']} ${
              !userSignature && setting['userAboutEmpty']
            }`}
          >
            {getMainContent()}
          </div>
        </div>

        <div className={popup['popupFooter']}>
          {!isFriend && !isSelf && (
            <div
              className={`${setting['confirmedButton']} ${setting['greenBtn']}`}
              onClick={() => handleOpenApplyFriend(userId, targetId)}
            >
              {lang.tr.addFriend}
            </div>
          )}
          <div className={popup['button']} onClick={() => handleClose()}>
            {'關閉' /** CLOSE **/}
          </div>
        </div>
      </div>
    );
  },
);

UserSettingPopup.displayName = 'UserSettingPopup';

export default UserSettingPopup;
