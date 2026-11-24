import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission, RelationStatus } from '@/types';

import * as ipc from '@/main/ipc';

import { openImageCropper, openAlertDialog, editUser, openApplyFriend, openDirectMessage, openErrorDialog } from '@/services';

import { MAX_FILE_SIZE, DEFAULT_USER_AVATAR_URL } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';
import { useCountries } from '@/hooks/useCountries';

import RecentServerCard from './RecentServerCard';
import JoinedServerCard from './JoinedServerCard';
import FavoriteServerCard from './FavoriteServerCard';
import LevelIcon from '@/components/level-icon';
import BadgeItem from '@/components/badge-item';

import { objDiff } from '@/utils';

type UserInfoPopupProps = Types.PopupProps<'userInfo'>;

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
  const isRecentServersHidden = !isSelf && !target.shareRecentServers;
  const isJoinedServersHidden = !isSelf && !target.shareJoinedServers;
  const isFavoriteServersHidden = !isSelf && !target.shareFavoriteServers;
  const isFriend = friends.find((f) => f.targetId === target.userId && f.relationStatus === RelationStatus.Friend) !== undefined;
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
    return targetServers.filter((s) => s.isFavorite && s.permissionLevel < Permission.ServerAdmin).sort((a, b) => b.permissionLevel - a.permissionLevel);
  }, [targetServers]);

  const recentServers = useMemo(() => {
    return targetServers
      .filter((s) => s.isRecent)
      .sort((a, b) => b.lastConnectedAt - a.lastConnectedAt)
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
    openDirectMessage(target.userId);
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

  const renderServerListContent = (isHidden: boolean, hiddenTipKey: string, emptyTipKey: string, serverCards: React.ReactNode[]) => {
    if (isHidden) {
      return (
        <div className="flex items-center justify-center w-full h-[76px] [font-family:'Noto_Sans_TC',sans-serif] text-[16px] leading-[1.2] text-[#436da1] text-center bg-[url('/card/bg_list_tips.svg')] bg-no-repeat bg-center bg-auto">
          {t(`${hiddenTipKey}.top`)}
          <br />
          {t(`${hiddenTipKey}.bottom`)}
        </div>
      );
    }
    if (!serverCards.length)
      return (
        <div className="flex items-center justify-center w-full h-[76px] [font-family:'Noto_Sans_TC',sans-serif] text-[16px] leading-[1.2] text-[#436da1] text-center bg-[url('/card/bg_list_tips.svg')] bg-no-repeat bg-center bg-auto">
          {t(emptyTipKey)}
        </div>
      );
    return serverCards;
  };

  return (
    <div className="popup-wrapper flex flex-col justify-between h-full min-h-0 [background-image:unset]!">
      <div className="flex flex-col justify-between h-full min-h-0 [background-image:unset]!">
        <div
          data-draggable
          className="relative flex flex-col gap-[5px] items-center justify-center w-full min-h-[225px] pt-[30px] pb-[60px] text-white bg-[url('/im/wallpaper.svg')] bg-cover [-webkit-app-region:drag]"
        >
          <div className="absolute top-[10px] right-0 flex items-center justify-evenly w-[50px] [-webkit-app-region:no-drag]">
            <div
              className="inline-block w-[14px] h-[14px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-14px_0] active:bg-position-[-28px_0] bg-[url('/im/btn-min.svg')]"
              onClick={handleMinimizeBtnClick}
            />
            <div
              className="inline-block w-[14px] h-[14px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-14px_0] active:bg-position-[-28px_0] bg-[url('/im/btn-close.svg')]"
              onClick={handleCloseBtnClick}
            />
          </div>
          <div
            className={`relative inline-block w-[74px] h-[74px] transition-all duration-300 ease-[ease-in-out] [-webkit-app-region:no-drag] after:absolute after:-top-[7px] after:-left-[7px] after:z-1 after:w-[88px] after:h-[88px] after:content-[''] after:bg-[url('/im/avatar_border.svg')] after:bg-no-repeat after:bg-position-[0_0] ${isSelf ? 'cursor-pointer hover:rounded-[3px] hover:[box-shadow:0_0_3px_6px_rgb(255_255_255/100%)]' : ''}`}
            onClick={handleAvatarClick}
          >
            <Image src={target.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="user_avatar" width={74} height={74} loading="lazy" draggable="false" />
          </div>
          <div className="row" style={{ gap: '3px', marginTop: '5px' }}>
            <p className="max-w-[250px] overflow-hidden text-ellipsis text-[1.5em] font-bold text-white whitespace-nowrap cursor-text select-text [-webkit-app-region:no-drag]">{target.name}</p>
            {target.vip > 0 && <div className={`vip-icon vip-${target.vip}`} />}
            <LevelIcon level={target.level} xp={target.xp} requiredXp={target.requiredXp} showTooltip={true} />
            {target.isVerified ? <div className="w-[17px] h-[16px] [image-rendering:auto] bg-[url('/official.svg')] bg-no-repeat bg-center bg-cover" title={t('is-official')} /> : null}
          </div>
          <p className="text-white cursor-pointer select-text [-webkit-app-region:no-drag]" onClick={handleAccountTextClick}>
            @{target.displayId}
          </p>
          <p className="text-white [-webkit-app-region:no-drag]">
            {t(target.gender.toLowerCase())} · {getUserAge()} · {t(target.country, { ns: 'country' })}
          </p>
          <p className="flex flex-wrap items-center justify-center max-w-[75%] overflow-auto [-webkit-line-clamp:2] [line-clamp:2] text-white text-center cursor-text select-text [-webkit-box-orient:vertical]">
            {target.signature}
          </p>
          <div className="absolute bottom-0 flex w-full">
            <div
              className={`flex gap-[5px] items-center justify-center w-1/2 h-[38px] pb-[6px] cursor-pointer bg-[url('/im/userpage_tab.svg')] bg-repeat bg-auto [-webkit-app-region:no-drag] before:content-[''] before:bg-no-repeat before:bg-position-[0_0] before:bg-contain before:min-w-[13px] before:min-h-[14px] before:bg-[url('/im/icon-about.svg')] ${isEditTab || isAboutTab ? 'bg-position-[0_-38px]' : 'bg-position-[0_0]'} ${isEditTab ? 'disabled' : ''}`}
              onClick={handleAboutTabClick}
            >
              {t('about-me')}
            </div>
            <div
              className={`flex gap-[5px] items-center justify-center w-1/2 h-[38px] pb-[6px] cursor-pointer bg-[url('/im/userpage_tab.svg')] bg-repeat bg-auto [-webkit-app-region:no-drag] before:content-[''] before:bg-no-repeat before:bg-position-[0_0] before:bg-contain before:min-w-[18px] before:min-h-[14px] before:bg-[url('/im/icon-group.svg')] ${isGroupsTab ? 'bg-position-[0_-38px]' : 'bg-position-[0_0]'} ${isEditTab ? 'disabled' : ''}`}
              onClick={handleGroupsTabClick}
            >
              {t('servers')}
            </div>
          </div>
        </div>
        <div
          className="z-1 flex gap-[10px] items-center justify-end min-h-[45px] p-[10px] bg-[linear-gradient(to_bottom,var(--background),var(--sidebar))] border-b border-border"
          style={isSelf && !isGroupsTab ? {} : { display: 'none' }}
        >
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
        <div className="flex flex-[2] flex-col justify-start w-full p-[10px] overflow-y-auto" style={isAboutTab ? {} : { display: 'none' }}>
          {target.about && (
            <div className="flex flex-1 items-center justify-between py-[10px] px-[15px] mb-[10px] text-text-color-quaternary border-b border-border before:block before:self-start before:min-w-[23px] before:min-h-[19px] before:mr-[10px] before:content-[''] before:bg-[url('/card/bg_left_quote.svg')] before:bg-no-repeat before:bg-cover after:block after:self-end after:min-w-[23px] after:min-h-[19px] after:ml-[10px] after:content-[''] after:bg-[url('/card/bg_right_quote.svg')] after:bg-no-repeat after:bg-cover">
              <div className="flex flex-wrap items-center justify-start break-all cursor-text select-text">{target.about}</div>
            </div>
          )}
          <div className="label">{t('recent-servers')}</div>
          <div className="flex flex-row flex-wrap gap-[5px] items-center justify-start py-[5px] px-0">
            {renderServerListContent(
              isRecentServersHidden,
              'not-public-recent-servers',
              'no-recent-servers',
              recentServers.map((server) => <RecentServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />),
            )}
          </div>
          <div className="label">{t('recent-earned')}</div>
          <div className="flex gap-[2px] items-center min-h-[30px] p-[2px] bg-background-secondary border border-border">
            {badges.map((badge: Types.Badge) => (
              <div key={badge.badgeId} className="flex p-[2px] border border-[#fff0] hover:bg-hover hover:border-border hover:rounded-[2px]">
                <BadgeItem key={badge.badgeId} badge={badge} position="left-top" direction="right-top" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-[2] flex-col justify-start w-full p-[10px] overflow-y-auto" style={isGroupsTab ? {} : { display: 'none' }}>
          <div className="select-box">
            <select value={serversView} onChange={handleServersViewChange}>
              <option value="joined">{t('joined-servers')}</option>
              <option value="favorite">{t('favorited-servers')}</option>
            </select>
          </div>
          <div className="flex flex-row flex-wrap gap-[5px] items-center justify-start py-[5px] px-0" style={isJoinedServersView ? {} : { display: 'none' }}>
            {renderServerListContent(
              isJoinedServersHidden,
              'not-public-joined-servers',
              'no-joined-servers',
              joinedServers.map((server) => <JoinedServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />),
            )}
          </div>
          <div className="flex flex-row flex-wrap gap-[5px] items-center justify-start py-[5px] px-0" style={isFavoriteServersView ? {} : { display: 'none' }}>
            {renderServerListContent(
              isFavoriteServersHidden,
              'not-public-favorite-servers',
              'no-favorite-servers',
              favoriteServers.map((server) => <FavoriteServerCard key={server.serverId} target={target} server={server} onServerSelect={handleServerSelect} />),
            )}
          </div>
        </div>
        <div className="flex flex-[2] flex-col justify-start w-full p-[10px] overflow-y-auto" style={isEditTab ? {} : { display: 'none' }}>
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
              <div className="relative flex items-center">
                <input
                  ref={signatureInputRef}
                  name="signature"
                  type="text"
                  value={editedTarget.signature}
                  maxLength={100}
                  onChange={handleSignatureChange}
                  style={{ paddingRight: '28px', width: '100%' }}
                />
                <div
                  className="absolute right-[5px] w-[18px] h-[18px] cursor-pointer bg-[url('/channel/FaceButton.svg')] bg-no-repeat bg-position-[0_0] hover:bg-position-[-18px_0] active:bg-position-[-36px_0]"
                  onMouseDown={handleEmojiPickerClick}
                />
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
