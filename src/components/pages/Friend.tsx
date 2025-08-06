import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

// CSS
import friendPage from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import emoji from '@/styles/emoji.module.css';

// Components
import FriendListViewer from '@/components/FriendList';
import BadgeListViewer from '@/components/BadgeList';

// Types
import type { User, Friend, FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

interface FriendPageProps {
  user: User;
  friends: Friend[];
  friendGroups: FriendGroup[];
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ user, friends, friendGroups, display }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingSidebarRef = useRef<boolean>(false);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef<boolean>(false);
  const emojiIconRef = useRef<HTMLDivElement>(null);

  // Variables
  const { name: userName, signature: userSignature, avatarUrl: userAvatarUrl, xp: userXP, requiredXp: userRequiredXP, level: userLevel, vip: userVip, badges: userBadges } = user;

  // Handlers
  const handleChangeSignature = (signature: User['signature']) => {
    if (signature === userSignature) return;
    ipcService.socket.send('editUser', { update: { signature } });
  };

  const onSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingSidebarRef.current = true;
  };

  const onSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebarRef.current || !sidebarRef.current) return;
    sidebarRef.current.style.width = `${e.clientX}px`;
  };

  const onSidebarHandleUp = () => (isResizingSidebarRef.current = false);

  // Effects
  useEffect(() => {
    ipcService.discord.updatePresence({
      details: t('rpc:friend-page'),
      state: `${t('rpc:user')} ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: t('rpc:vewing-friend-page'),
      timestamp: Date.now(),
      buttons: [
        {
          label: t('rpc:join-discord-server'),
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [t, userName]);

  return (
    <main className={friendPage['friend']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={friendPage['friend-header']}>
        <div className={friendPage['avatar-picture']} style={{ backgroundImage: `url(${userAvatarUrl})` }} datatype={''} />
        <div className={friendPage['base-info-wrapper']}>
          <div className={friendPage['box']}>
            <div className={friendPage['level-icon']} />
            <div
              className={`${grade['grade']} ${grade[`lv-${Math.min(56, userLevel)}`]}`}
              title={`${t('level')}: ${userLevel}, ${t('xp')}: ${userXP}, ${t('required-xp')}: ${userRequiredXP - userXP}`}
            />
            <div className={friendPage['wealth-icon']} />
            <div className={friendPage['wealth-value-text']}>0</div>
            {userVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${userVip}`]}`} />}
          </div>
          <div className={friendPage['box']}>
            <BadgeListViewer badges={userBadges} maxDisplay={5} />
          </div>
        </div>
        <div className={friendPage['signature-wrapper']}>
          <textarea
            ref={signatureInputRef}
            className={friendPage['signature-input']}
            defaultValue={userSignature}
            placeholder={t('signature-placeholder')}
            maxLength={300}
            onBlur={(e) => handleChangeSignature(e.target.value)}
            onKeyDown={(e) => {
              if (isComposingRef.current || !signatureInputRef.current) return;
              if (e.key === 'Enter') signatureInputRef.current.blur();
            }}
            onCompositionStart={() => (isComposingRef.current = true)}
            onCompositionEnd={() => (isComposingRef.current = false)}
          />
          <div
            ref={emojiIconRef}
            className={emoji['emoji-icon']}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!emojiIconRef.current) return;
              const x = emojiIconRef.current.getBoundingClientRect().x;
              const y = emojiIconRef.current.getBoundingClientRect().y + emojiIconRef.current.getBoundingClientRect().height;
              contextMenu.showEmojiPicker(x, y, false, 'unicode', (emoji) => {
                if (!signatureInputRef.current) return;
                signatureInputRef.current.value += emoji;
                signatureInputRef.current.focus();
              });
            }}
          />
        </div>
      </header>

      {/* Body */}
      <main className={friendPage['friend-body']}>
        {/* Left Sidebar */}
        <aside ref={sidebarRef} className={friendPage['sidebar']}>
          <FriendListViewer friendGroups={friendGroups} friends={friends} user={user} />
        </aside>

        {/* Resize Handle */}
        <div className="resize-handle" onPointerDown={onSidebarHandleDown} onPointerMove={onSidebarHandleMove} onPointerUp={onSidebarHandleUp} />

        {/* Right Content */}
        <main className={friendPage['content']}>
          <header className={friendPage['header']}>{t('friend-active')}</header>
        </main>
      </main>
    </main>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;
