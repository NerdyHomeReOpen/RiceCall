import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import FriendList from '@/components/FriendList';
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Language from '@/utils/language';
import * as Popup from '@/utils/popup';

import friendStyles from '@/styles/friend.module.css';
import vipStyles from '@/styles/vip.module.css';
import emojiStyles from '@/styles/emoji.module.css';

interface FriendActivityProps {
  userId: Types.User['userId'];
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ userId, friendActivity }) => {
  // Hooks
  const { t } = useTranslation();

  // Variables
  const { userId: friendUserId, name: friendName, avatarUrl: friendAvatarUrl, vip: friendVip, timestamp: ActivityTimestamp, content: ActivityContent } = friendActivity;
  const friendHasVip = friendVip > 0;

  // Handlers
  const handleUserNameClick = () => {
    Popup.openUserInfo(userId, friendUserId);
  };

  return (
    <div className={friendStyles['user-activity']}>
      <Image className={friendStyles['user-avatar']} src={friendAvatarUrl} alt={friendName} width={30} height={30} loading="lazy" draggable="false" />
      <div className={friendStyles['right-info']}>
        <div className={friendStyles['user-activity-top']}>
          {friendHasVip && <div className={`${friendStyles['vip-icon']} ${vipStyles['vip-icon']} ${vipStyles[`vip-${friendVip}`]}`} />}
          <div className={friendStyles['user-name']} onClick={handleUserNameClick}>
            {friendName}
          </div>
          <div className={friendStyles['timestamp']}>{Language.getFormatTimeDiff(t, ActivityTimestamp)}</div>
        </div>
        <div className={friendStyles['signature']}>{ActivityContent}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

interface FriendPageProps {
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ display }) => {
  // Hooks
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const friendActivities = useAppSelector((state) => state.friendActivities.data);

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingSidebarRef = useRef<boolean>(false);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef<boolean>(false);

  // Variables
  const { userId, signature: userSignature, avatarUrl: userAvatarUrl, xp: userXP, requiredXp: userRequiredXP, level: userLevel, vip: userVip, badges: userBadges } = user;

  // Handlers
  const changeSignature = (signature: Types.User['signature']) => {
    if (signature === userSignature) return;
    ipc.socket.send('editUser', { update: { signature } });
  };

  const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingSidebarRef.current = true;
  };

  const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebarRef.current || !sidebarRef.current) return;
    sidebarRef.current.style.width = `${e.clientX}px`;
  };

  const handleSignatureInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    changeSignature(e.target.value);
  };

  const handleSignatureInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    else e.preventDefault();
    if (isComposingRef.current || !signatureInputRef.current) return;
    signatureInputRef.current.blur();
  };

  const handleSignatureInputCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleSignatureInputCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'right-bottom', e.currentTarget as HTMLElement, false, false, undefined, undefined, (_, full) => {
      signatureInputRef.current?.focus();
      document.execCommand('insertText', false, full);
    });
  };

  // Effects
  useEffect(() => {
    signatureInputRef.current!.value = userSignature;
  }, [userSignature]);

  useEffect(() => {
    const onPointerup = () => {
      isResizingSidebarRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  return (
    <main className={friendStyles['friend']} style={display ? {} : { display: 'none' }}>
      <header className={friendStyles['friend-header']}>
        <Image className={friendStyles['avatar-picture']} src={userAvatarUrl} alt={user.name} width={40} height={40} loading="lazy" draggable="false" />
        <div className={friendStyles['base-info-wrapper']}>
          <div className={friendStyles['box']}>
            <div className={friendStyles['level-icon']} />
            <LevelIcon level={userLevel} xp={userXP} requiredXp={userRequiredXP} showTooltip={true} />
            <div className={friendStyles['wealth-icon']} />
            <div className={friendStyles['wealth-value-text']}>0</div>
            {userVip > 0 && <div className={`${vipStyles['vip-icon']} ${vipStyles[`vip-${userVip}`]}`} />}
          </div>
          <div className={friendStyles['box']}>
            <BadgeList badges={JSON.parse(userBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
          </div>
        </div>
        <div className={friendStyles['signature-wrapper']}>
          <textarea
            ref={signatureInputRef}
            className={friendStyles['signature-input']}
            defaultValue={userSignature}
            maxLength={100}
            placeholder={t('signature-placeholder')}
            onBlur={handleSignatureInputBlur}
            onKeyDown={handleSignatureInputKeyDown}
            onCompositionStart={handleSignatureInputCompositionStart}
            onCompositionEnd={handleSignatureInputCompositionEnd}
          />
          <div className={emojiStyles['emoji-icon']} onMouseDown={handleEmojiPickerClick} />
        </div>
      </header>
      <main className={friendStyles['friend-body']}>
        <aside ref={sidebarRef} className={friendStyles['sidebar']}>
          <FriendList />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={friendStyles['content']}>
          <header className={friendStyles['header']}>{t('friend-active')}</header>
          <div className={`${friendStyles['scroll-view']} ${friendStyles['friend-active-wrapper']}`}>
            <div className={friendStyles['friend-active-list']}>
              {friendActivities.map((friendActivity, index) => (
                <FriendActivity key={index} userId={userId} friendActivity={friendActivity} />
              ))}
            </div>
          </div>
        </main>
      </main>
    </main>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), { ssr: false });

export default FriendPage;
