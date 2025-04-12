import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';
import apiService from '@/services/api.service';

// CSS
import grade from '@/styles/common/grade.module.css';
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';
import vip from '@/styles/common/vip.module.css';

// Utils
import { createDefault } from '@/utils/createDefault';

interface UserSettingPopupProps {
  userId: User['userId'];
}

const UserSettingPopup: React.FC<UserSettingPopupProps> = React.memo(
  (initialData: UserSettingPopupProps) => {
    // Props
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Date related constants
    const today = useMemo(() => new Date(), []);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

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

    // Computed values
    const { userId } = initialData;
    const userGrade = Math.min(56, userLevel);

    const getDaysInMonth = useCallback((year: number, month: number) => {
      return new Date(year, month, 0).getDate();
    }, []);

    const calculateAge = useCallback(
      (birthYear: number, birthMonth: number, birthDay: number) => {
        const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age;
      },
      [today],
    );

    const userAge = useMemo(
      () => calculateAge(userBirthYear, userBirthMonth, userBirthDay),
      [calculateAge, userBirthYear, userBirthMonth, userBirthDay],
    );

    // Date options
    const years = useMemo(
      () =>
        Array.from(
          { length: currentYear - 1900 + 1 },
          (_, i) => currentYear - i,
        ),
      [currentYear],
    );

    const months = useMemo(
      () => Array.from({ length: 12 }, (_, i) => i + 1),
      [],
    );

    const days = useMemo(
      () =>
        Array.from(
          { length: getDaysInMonth(userBirthYear, userBirthMonth) },
          (_, i) => i + 1,
        ),
      [userBirthYear, userBirthMonth, getDaysInMonth],
    );

    // Date validation
    const isFutureDate = useCallback(
      (year: number, month: number, day: number) => {
        if (year > currentYear) return true;
        if (year === currentYear && month > currentMonth) return true;
        if (year === currentYear && month === currentMonth && day > currentDay)
          return true;
        return false;
      },
      [currentYear, currentMonth, currentDay],
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
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.user({
            userId: userId,
          }),
        ]).then(([user]) => {
          handleUserUpdate(user);
        });
      };
      refresh();
    }, [userId]);

    useEffect(() => {
      if (isFutureDate(userBirthYear, userBirthMonth, userBirthDay)) {
        setUserBirthYear(currentYear);
        setUserBirthMonth(currentMonth);
        setUserBirthDay(currentDay);
      }
    }, [
      userBirthYear,
      userBirthMonth,
      userBirthDay,
      currentYear,
      currentMonth,
      currentDay,
      isFutureDate,
    ]);

    useEffect(() => {
      const daysInMonth = getDaysInMonth(userBirthYear, userBirthMonth);
      let newDay = userBirthDay;

      if (newDay > daysInMonth) {
        newDay = daysInMonth;
      }

      if (isFutureDate(userBirthYear, userBirthMonth, newDay)) {
        if (userBirthYear === currentYear && userBirthMonth === currentMonth) {
          newDay = Math.min(newDay, currentDay);
        }
      }

      if (newDay !== userBirthDay) {
        setUserBirthDay(newDay);
      }
    }, [
      userBirthYear,
      userBirthMonth,
      userBirthDay,
      currentYear,
      currentMonth,
      currentDay,
      getDaysInMonth,
      isFutureDate,
    ]);

    return (
      <div className={`${popup['popupContainer']} ${popup['userProfile']}`}>
        <div className={`${popup['popupBody']} ${popup['col']}`}>
          <div className={popup['header']}>
            <div
              className={popup['avatar']}
              style={{ backgroundImage: `url(${userAvatarUrl})` }}
              onClick={() => {
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
                    formData.append('_fileName', userId); //FIX: Change back to userAvatar
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
              className={popup['row']}
              style={{ alignItems: 'center', gap: '5px' }}
            >
              <div className={popup['h3']}>{userName}</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
              <div
                className={`${grade['grade']} ${grade[`lv-${userGrade}`]}`}
              />
            </div>
            <div
              className={popup['p1']}
              style={{ color: '#fff' }}
              onClick={() => {
                navigator.clipboard.writeText(userId);
              }}
            >
              @{userName}
            </div>
            <div className={popup['p1']} style={{ color: '#fff' }}>
              {lang.tr[userGender === 'Male' ? 'male' : 'female']} . {userAge} .
              {lang.tr[userCountry as keyof typeof lang.tr]}
            </div>
            <div className={popup['p1']} style={{ color: '#fff' }}>
              {userSignature}
            </div>

            <div className={popup['tab']}>
              <div
                className={`${popup['item']} ${popup['about']} ${popup['selected']}`}
              >
                {lang.tr.about}
              </div>
              <div className={`${popup['item']} ${popup['groups']}`}>
                {lang.tr.groups}
              </div>
            </div>
          </div>
          <div className={setting['body']}>
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
                  <div className={popup['selectBox']}>
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
                      <option value="southAfrica">{lang.tr.southAfrica}</option>
                      <option value="india">{lang.tr.india}</option>
                      <option value="indonesia">{lang.tr.indonesia}</option>
                      <option value="malaysia">{lang.tr.malaysia}</option>
                      <option value="philippines">{lang.tr.philippines}</option>
                      <option value="thailand">{lang.tr.thailand}</option>
                      <option value="vietnam">{lang.tr.vietnam}</option>
                      <option value="turkey">{lang.tr.turkey}</option>
                      <option value="saudiArabia">{lang.tr.saudiArabia}</option>
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
                        {years.map((year) => (
                          <option
                            key={year}
                            value={year}
                            disabled={year > currentYear}
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
                        {months.map((month) => (
                          <option
                            key={month}
                            value={month}
                            disabled={
                              userBirthYear === currentYear &&
                              month > currentMonth
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
                        {days.map((day) => (
                          <option
                            key={day}
                            value={day}
                            disabled={
                              userBirthYear === currentYear &&
                              userBirthMonth === currentMonth &&
                              day > currentDay
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
                <label className={popup['label']} htmlFor="profile-form-about">
                  {lang.tr.about}
                </label>
                <textarea id="profile-form-about" />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <div className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </div>
          <div
            className={`${popup['button']} ${
              !userName ||
              !userGender ||
              !userCountry ||
              !userBirthYear ||
              !userBirthMonth ||
              !userBirthDay
                ? popup['disabled']
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
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </div>
        </div>
      </div>
    );
  },
);

UserSettingPopup.displayName = 'UserSettingPopup';

export default UserSettingPopup;
