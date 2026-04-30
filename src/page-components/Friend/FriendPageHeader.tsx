import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import styles from './Friend.module.css';

const FriendPageHeader: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

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

  const userHasVip = user.vip > 0;
  const userBadges = useMemo(() => (typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges), [user.badges]);
  const userWealth = 0; // TODO: get user wealth

  const changeSignature = (signature: Types.User['signature']) => {
    if (signature === user.signature) return;
    ipc.socket.send('editUser', { update: { signature } });
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

  return (
    <>
      <div className={styles['user-avatar']} datatype="">
        <Image src={user.avatarUrl} alt="user_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['user-info']}>
        <div className={styles['user-info-row']}>
          <div className={styles['level-icon']} />
          <LevelIcon level={user.level} xp={user.xp} requiredXp={user.requiredXp} showTooltip={true} />
          <div className={styles['wealth-icon']} />
          <div className={styles['wealth-value-text']}>{userWealth}</div>
          {userHasVip && <div className={`vip-icon vip-${user.vip}`} />}
        </div>
        <div className={styles['user-info-row']}>
          <BadgeList badges={userBadges} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
      </div>
      <div className={styles['user-signature']}>
        <textarea
          ref={signatureInputRef}
          className={styles['signature-input']}
          defaultValue={user.signature}
          maxLength={100}
          placeholder={t('signature-placeholder')}
          onBlur={handleSignatureInputBlur}
          onKeyDown={handleSignatureInputKeyDown}
          onCompositionStart={handleSignatureInputCompositionStart}
          onCompositionEnd={handleSignatureInputCompositionEnd}
        />
        <div className={styles['emoji-btn']} onMouseDown={handleEmojiPickerClick} />
      </div>
    </>
  );
});

FriendPageHeader.displayName = 'FriendPageHeader';

export default FriendPageHeader;
