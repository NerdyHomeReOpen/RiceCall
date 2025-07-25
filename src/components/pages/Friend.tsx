import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import friendPage from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import emoji from '@/styles/emoji.module.css';

// Components
import FriendListViewer from '@/components/FriendList';
import BadgeListViewer from '@/components/BadgeList';

// Types
import { User, UserFriend, FriendGroup } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

interface FriendPageProps {
  user: User;
  friends: UserFriend[];
  friendGroups: FriendGroup[];
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ user, friends, friendGroups, display }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();
  const contextMenu = useContextMenu();

  // Refs
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const emojiIconRef = useRef<HTMLDivElement>(null);

  // States
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(270);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [signatureInput, setSignatureInput] = useState<string>('');

  // Variables
  const {
    userId,
    name: userName,
    signature: userSignature,
    avatarUrl: userAvatarUrl,
    xp: userXP,
    requiredXp: userRequiredXP,
    level: userLevel,
    vip: userVip,
    badges: userBadges,
  } = user;

  // Handlers
  const handleChangeSignature = (signature: User['signature'], userId: User['userId']) => {
    if (!socket) return;
    if (signature === userSignature) return;
    socket.send.editUser({ user: { signature }, userId });
  };

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      setSidebarWidth(newWidth);
    },
    [isResizing],
  );

  // Effects
  useEffect(() => {
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', () => setIsResizing(false));
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', () => setIsResizing(false));
    };
  }, [handleResize]);

  useEffect(() => {
    setSignatureInput(userSignature);
  }, [userSignature]);

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
        <div
          className={friendPage['avatar-picture']}
          style={{ backgroundImage: `url(${userAvatarUrl})` }}
          datatype={''}
        />
        <div className={friendPage['base-info-wrapper']}>
          <div className={friendPage['box']}>
            <div className={friendPage['level-icon']} />
            <div
              className={`${grade['grade']} ${grade[`lv-${Math.min(56, userLevel)}`]}`}
              title={`${t('level')}: ${userLevel}, ${t('xp')}: ${userXP}, ${t('required-xp')}: ${
                userRequiredXP - userXP
              }`}
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
            value={signatureInput}
            placeholder={t('signature-placeholder')}
            maxLength={300}
            onChange={(e) => setSignatureInput(e.target.value)}
            onBlur={() => {
              handleChangeSignature(signatureInput, userId);
            }}
            onKeyDown={(e) => {
              if (isComposing) return;
              if (e.key === 'Enter') signatureInputRef.current?.blur();
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
          />
          <div
            ref={emojiIconRef}
            className={emoji['emoji-icon']}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!emojiIconRef.current) return;
              const x = emojiIconRef.current.getBoundingClientRect().x;
              const y =
                emojiIconRef.current.getBoundingClientRect().y + emojiIconRef.current.getBoundingClientRect().height;
              contextMenu.showEmojiPicker(x, y, false, 'unicode', (emoji) => {
                setSignatureInput((prev) => prev + emoji);
                if (signatureInputRef.current) signatureInputRef.current.focus();
              });
            }}
          />
        </div>
      </header>

      {/* Body */}
      <main className={friendPage['friend-body']}>
        {/* Left Sidebar */}
        <aside className={friendPage['sidebar']} style={{ width: `${sidebarWidth}px` }}>
          <FriendListViewer friendGroups={friendGroups} friends={friends} user={user} />
        </aside>

        {/* Resize Handle */}
        <div className="resize-handle" onMouseDown={() => setIsResizing(true)} onMouseUp={() => setIsResizing(false)} />

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
