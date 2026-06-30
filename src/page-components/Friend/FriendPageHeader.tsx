import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

import styles from './Friend.module.css';

const FriendPageHeader: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showEmojiPicker } = useContextMenu();

  const signatureInput = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef<boolean>(false);

  const userAvatarUrl = useAppSelector((state) => state.user.data.avatarUrl);
  const userSignature = useAppSelector((state) => state.user.data.signature);
  const userVip = useAppSelector((state) => state.user.data.vip);
  const userBadges = useAppSelector((state) => (typeof state.user.data.badges === 'string' ? JSON.parse(state.user.data.badges) : state.user.data.badges));
  const userLevel = useAppSelector((state) => state.user.data.level);
  const userXp = useAppSelector((state) => state.user.data.xp);
  const userRequiredXp = useAppSelector((state) => state.user.data.requiredXp);

  const userHasVip = userVip > 0;
  const userWealth = 0; // TODO: get user wealth

  const changeSignature = (signature: Types.User['signature']) => {
    if (signature === userSignature) return;
    ipc.socket.send('editUser', { update: { signature } });
  };

  const handleSignatureInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    changeSignature(e.target.value);
  };

  const handleSignatureInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (isComposing.current || !signatureInput.current) return;
    signatureInput.current.blur();
  };

  const handleSignatureInputCompositionStart = () => {
    isComposing.current = true;
  };

  const handleSignatureInputCompositionEnd = () => {
    isComposing.current = false;
  };

  const handleEmojiPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();

    showEmojiPicker(x, y, 'right-bottom', e.currentTarget as HTMLElement, false, undefined, undefined, (_, full) => {
      signatureInput.current?.focus();
      document.execCommand('insertText', false, full);
    });
  };

  useEffect(() => {
    signatureInput.current!.value = userSignature;
  }, [userSignature]);

  return (
    <>
      <div className={styles['user-avatar']} datatype="">
        <Image src={userAvatarUrl || DEFAULT_USER_AVATAR_URL} alt="user_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['user-info']}>
        <div className={styles['user-info-row']}>
          <div className={styles['level-icon']} />
          <LevelIcon level={userLevel} xp={userXp} requiredXp={userRequiredXp} showTitle={true} />
          <div className={styles['wealth-icon']} />
          <div className={styles['wealth-value-text']}>{userWealth}</div>
          {userHasVip && <div className={`vip-icon vip-${userVip}`} />}
        </div>
        <div className={styles['user-info-row']}>
          <BadgeList badges={userBadges} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
      </div>
      <div className={styles['user-signature']}>
        <textarea
          ref={signatureInput}
          className={styles['signature-input']}
          defaultValue={userSignature}
          maxLength={100}
          placeholder={t('signature-placeholder')}
          onBlur={handleSignatureInputBlur}
          onKeyDown={handleSignatureInputKeyDown}
          onCompositionStart={handleSignatureInputCompositionStart}
          onCompositionEnd={handleSignatureInputCompositionEnd}
        />
        <div className={styles['emoji-button']} onMouseDown={handleEmojiPickerClick} />
      </div>
    </>
  );
});

FriendPageHeader.displayName = 'FriendPageHeader';

export default FriendPageHeader;
