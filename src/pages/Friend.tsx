import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

interface FriendPageProps {
  user: Types.User;
  friends: Types.Friend[];
  friendActivities: Types.FriendActivity[];
  friendGroups: Types.FriendGroup[];
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ user, friends, friendActivities, friendGroups, display }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingSidebarRef = useRef<boolean>(false);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef<boolean>(false);

  // Variables
  const { userId, signature: userSignature, avatarUrl: userAvatarUrl, xp: userXP, requiredXp: userRequiredXP, level: userLevel, vip: userVip, badges: userBadges } = user;

  // Handlers
  const handleChangeSignature = (signature: Types.User['signature']) => {
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
        <div className={friendStyles['avatar-picture']} style={{ backgroundImage: `url(${userAvatarUrl})` }} datatype={''} />
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
            onBlur={(e) => handleChangeSignature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              else e.preventDefault();
              if (isComposingRef.current || !signatureInputRef.current) return;
              signatureInputRef.current.blur();
            }}
            onCompositionStart={() => (isComposingRef.current = true)}
            onCompositionEnd={() => (isComposingRef.current = false)}
          />
          <div
            className={emojiStyles['emoji-icon']}
            onMouseDown={(e) => {
              e.preventDefault();
              const x = e.currentTarget.getBoundingClientRect().left;
              const y = e.currentTarget.getBoundingClientRect().bottom;
              contextMenu.showEmojiPicker(x, y, 'right-bottom', e.currentTarget as HTMLElement, false, false, undefined, undefined, (_, full) => {
                signatureInputRef.current?.focus();
                document.execCommand('insertText', false, full);
              });
            }}
          />
        </div>
      </header>
      <main className={friendStyles['friend-body']}>
        <aside ref={sidebarRef} className={friendStyles['sidebar']}>
          <FriendList friendGroups={friendGroups} friends={friends} user={user} />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={friendStyles['content']}>
          <header className={friendStyles['header']}>{t('friend-active')}</header>
          <div className={`${friendStyles['scroll-view']} ${friendStyles['friend-active-wrapper']}`}>
            <div className={friendStyles['friend-active-list']}>
              {friendActivities.map((friendActivity, index) => (
                <div key={index} className={friendStyles['user-activity']}>
                  <div
                    className={friendStyles['user-avatar']}
                    style={{ backgroundImage: `url(${friendActivity.avatarUrl})` }}
                    onClick={() => Popup.handleOpenUserInfo(userId, friendActivity.userId)}
                  />
                  <div className={friendStyles['right-info']}>
                    <div className={friendStyles['user-activity-top']}>
                      {friendActivity.vip !== 0 && <div className={`${friendStyles['vip-icon']} ${vipStyles['vip-icon']} ${vipStyles[`vip-${friendActivity.vip}`]}`}></div>}
                      <div className={friendStyles['user-name']} onClick={() => Popup.handleOpenUserInfo(userId, friendActivity.userId)}>
                        {friendActivity.name}
                      </div>
                      <div className={friendStyles['timestamp']}>{Language.getFormatTimeDiff(t, friendActivity.timestamp)}</div>
                    </div>
                    <div className={friendStyles['signature']}>{friendActivity.content}</div>
                  </div>
                </div>
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
