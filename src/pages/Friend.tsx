import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

// CSS
import friendPage from '@/styles/friend.module.css';
import vip from '@/styles/vip.module.css';
import emoji from '@/styles/emoji.module.css';

// Components
import FriendList from '@/components/FriendList';
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

// Types
import type { User, Friend, FriendGroup, FriendActivity } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { getFormatTimeDiff } from '@/utils/language';
import { handleOpenUserInfo } from '@/utils/popup';

interface FriendPageProps {
  user: User;
  friends: Friend[];
  friendActivities: FriendActivity[];
  friendGroups: FriendGroup[];
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
  const handleChangeSignature = (signature: User['signature']) => {
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
    <main className={friendPage['friend']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={friendPage['friend-header']}>
        <div className={friendPage['avatar-picture']} style={{ backgroundImage: `url(${userAvatarUrl})` }} datatype={''} />
        <div className={friendPage['base-info-wrapper']}>
          <div className={friendPage['box']}>
            <div className={friendPage['level-icon']} />
            <LevelIcon level={userLevel} xp={userXP} requiredXp={userRequiredXP} isSelf={true} isHover={true} />
            <div className={friendPage['wealth-icon']} />
            <div className={friendPage['wealth-value-text']}>0</div>
            {userVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${userVip}`]}`} />}
          </div>
          <div className={friendPage['box']}>
            <BadgeList badges={JSON.parse(userBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
          </div>
        </div>
        <div className={friendPage['signature-wrapper']}>
          <textarea
            ref={signatureInputRef}
            className={friendPage['signature-input']}
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
            className={emoji['emoji-icon']}
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

      {/* Body */}
      <main className={friendPage['friend-body']}>
        {/* Left Sidebar */}
        <aside ref={sidebarRef} className={friendPage['sidebar']}>
          <FriendList friendGroups={friendGroups} friends={friends} user={user} />
        </aside>

        {/* Resize Handle */}
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />

        {/* Friend Active Content */}
        <main className={friendPage['content']}>
          <header className={friendPage['header']}>{t('friend-active')}</header>
          <div className={`${friendPage['scroll-view']} ${friendPage['friend-active-wrapper']}`}>
            <div className={friendPage['friend-active-list']}>
              {friendActivities.map((friendActivity, index) => (
                <div key={index} className={friendPage['user-activity']}>
                  <div className={friendPage['user-avatar']} style={{ backgroundImage: `url(${friendActivity.avatarUrl})` }} onClick={() => handleOpenUserInfo(userId, friendActivity.userId)} />
                  <div className={friendPage['right-info']}>
                    <div className={friendPage['user-activity-top']}>
                      {friendActivity.vip !== 0 && <div className={`${friendPage['vip-icon']} ${vip['vip-icon']} ${vip[`vip-${friendActivity.vip}`]}`}></div>}
                      <div className={friendPage['user-name']} onClick={() => handleOpenUserInfo(userId, friendActivity.userId)}>
                        {friendActivity.name}
                      </div>
                      <div className={friendPage['timestamp']}>{getFormatTimeDiff(t, friendActivity.timestamp)}</div>
                    </div>
                    <div className={friendPage['signature']}>{friendActivity.content}</div>
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
