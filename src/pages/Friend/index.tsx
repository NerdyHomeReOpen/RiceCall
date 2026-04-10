import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';

import FriendList from '@/components/FriendList';
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { getFormatTimeDiff } from '@/utils/language';

import styles from './Friend.module.css';

interface FriendActivityProps {
  friendActivity: Types.FriendActivity;
}

const FriendActivity: React.FC<FriendActivityProps> = React.memo(({ friendActivity }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const hasVip = friendActivity.vip > 0;

  const handleUserNameClick = () => {
    Actions.openUserInfo(user.userId, friendActivity.userId);
  };

  return (
    <div className={styles['user-activity']}>
      <Image className={styles['user-avatar']} src={friendActivity.avatarUrl} alt={friendActivity.name} width={30} height={30} loading="lazy" draggable="false" />
      <div className={styles['right-info']}>
        <div className={styles['user-activity-top']}>
          {hasVip && <div className={`vip-icon vip-${friendActivity.vip}`} />}
          <div className={styles['user-name']} onClick={handleUserNameClick}>
            {friendActivity.name}
          </div>
          <div className={styles['timestamp']}>{getFormatTimeDiff(t, friendActivity.timestamp)}</div>
        </div>
        <div className={styles['signature']}>{friendActivity.content}</div>
      </div>
    </div>
  );
});

FriendActivity.displayName = 'FriendActivity';

interface FriendPageProps {
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ display }) => {
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingSidebarRef = useRef<boolean>(false);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef<boolean>(false);

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      avatarUrl: state.user.data.avatarUrl,
      name: state.user.data.name,
      signature: state.user.data.signature,
      vip: state.user.data.vip,
      badges: state.user.data.badges,
      level: state.user.data.level,
      xp: state.user.data.xp,
      requiredXp: state.user.data.requiredXp,
    }),
    shallowEqual,
  );

  const friendActivities = useAppSelector((state) => state.friendActivities.data, shallowEqual);

  const userHasVip = user.vip > 0;
  const userBadges = useMemo(() => (typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges), [user.badges]);

  const changeSignature = (signature: Types.User['signature']) => {
    if (signature === user.signature) return;
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
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showEmojiPicker(x, y, 'right-bottom', e.currentTarget as HTMLElement, false, undefined, undefined, (_, full) => {
      signatureInputRef.current?.focus();
      document.execCommand('insertText', false, full);
    });
  };

  useEffect(() => {
    signatureInputRef.current!.value = user.signature;
  }, [user.signature]);

  useEffect(() => {
    const onPointerup = () => {
      isResizingSidebarRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  return (
    <main className={styles['friend-page']} style={display ? {} : { display: 'none' }}>
      <header className={styles['friend-page-header']}>
        <Image className={styles['user-avatar-picture']} src={user.avatarUrl} alt={user.name} width={40} height={40} loading="lazy" draggable="false" />
        <div className={styles['user-base-info']}>
          <div className={styles['user-base-info-box']}>
            <div className={styles['level-icon']} />
            <LevelIcon level={user.level} xp={user.xp} requiredXp={user.requiredXp} showTooltip={true} />
            <div className={styles['wealth-icon']} />
            <div className={styles['wealth-value-text']}>{'0'}</div>
            {userHasVip && <div className={`vip-icon vip-${user.vip}`} />}
          </div>
          <div className={styles['user-base-info-box']}>
            <BadgeList badges={userBadges} position="left-bottom" direction="right-bottom" maxDisplay={5} />
          </div>
        </div>
        <div className={styles['user-signature-wrapper']}>
          <textarea
            ref={signatureInputRef}
            className={styles['user-signature-input']}
            defaultValue={user.signature}
            maxLength={100}
            placeholder={t('signature-placeholder')}
            onBlur={handleSignatureInputBlur}
            onKeyDown={handleSignatureInputKeyDown}
            onCompositionStart={handleSignatureInputCompositionStart}
            onCompositionEnd={handleSignatureInputCompositionEnd}
          />
          <div className="emoji-icon" onMouseDown={handleEmojiPickerClick} />
        </div>
      </header>
      <main className={styles['friend-page-body']}>
        <aside ref={sidebarRef} className={styles['friend-page-sidebar']}>
          <FriendList />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={styles['friend-page-content']}>
          <header className={styles['friend-page-content-header']}>{t('friend-active')}</header>
          <div className={`${styles['friend-page-content-scroll-view']} ${styles['friend-page-content-friend-active-wrapper']}`}>
            <div className={styles['friend-page-content-friend-active-list']}>
              {friendActivities.map((friendActivity, index) => (
                <FriendActivity key={index} friendActivity={friendActivity} />
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
