import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/badge-list';
import LevelIcon from '@/components/level-icon';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

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
  const userWealth = 0; // TODO(backlog#8): get user wealth

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
      <div
        className="relative w-[40px] h-[40px] before:absolute before:-top-px before:-left-px before:z-1 before:content-[''] before:bg-[url('/win_border.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-cover before:min-w-[42px] before:min-h-[42px] after:min-w-[13px] after:min-h-[13px] after:absolute after:right-0 after:bottom-0 after:inline-block after:content-[''] after:bg-[url('/user_state.svg')] after:bg-no-repeat after:bg-position-[0_0] [&[datatype='']]:after:bg-none [&[datatype=dnd]]:after:bg-position-[-13px_0] [&[datatype=idle]]:after:bg-position-[-26px_0] [&[datatype=gn]]:after:bg-position-[-39px_0]"
        datatype=""
      >
        <Image src={user.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="user_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-col justify-between h-[40px] overflow-hidden">
        <div className="flex gap-[2px] items-center">
          <div className="min-w-[16px] min-h-[16px] bg-[url('/im/LV.svg')] bg-no-repeat bg-position-[0_0] bg-auto" />
          <LevelIcon level={user.level} xp={user.xp} requiredXp={user.requiredXp} showTooltip={true} />
          <div className="min-w-[16px] min-h-[16px] ml-[20px] bg-[url('/silver_pea.svg')] bg-no-repeat bg-cover border-none" />
          <div className="text-text-color-quaternary text-left">{userWealth}</div>
          {userHasVip && <div className={`vip-icon vip-${user.vip}`} />}
        </div>
        <div className="flex gap-[2px] items-center">
          <BadgeList badges={userBadges} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
      </div>
      <div className="group/signature flex gap-[5px] items-center w-[60%] h-[40px] px-[5px] py-[2px] ml-[100px] border border-[#fff0] focus-within:border-border focus-within:rounded-[3px]">
        <textarea
          ref={signatureInputRef}
          className="z-1 flex flex-wrap items-center justify-start w-full h-full resize-none empty:before:block empty:before:pointer-events-none empty:before:content-[attr(data-placeholder-text)]"
          defaultValue={user.signature}
          maxLength={100}
          placeholder={t('signature-placeholder')}
          onBlur={handleSignatureInputBlur}
          onKeyDown={handleSignatureInputKeyDown}
          onCompositionStart={handleSignatureInputCompositionStart}
          onCompositionEnd={handleSignatureInputCompositionEnd}
        />
        <div
          className="hidden group-focus-within/signature:flex w-[18px] h-[18px] bg-no-repeat bg-center bg-contain before:block before:min-w-[18px] before:min-h-[18px] before:cursor-pointer before:content-[''] before:bg-[url('/channel/FaceButton.svg')] before:bg-no-repeat before:bg-position-[0_0] hover:before:bg-position-[-18px_0] active:before:bg-position-[-36px_0]"
          onMouseDown={handleEmojiPickerClick}
        />
      </div>
    </>
  );
});

FriendPageHeader.displayName = 'FriendPageHeader';

export default FriendPageHeader;
