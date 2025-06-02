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
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';

interface FriendPageProps {
  user: User;
  friends: UserFriend[];
  friendGroups: FriendGroup[];
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(
  ({ user, friends, friendGroups, display }) => {
    // Hooks
    const lang = useLanguage();
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
    const handleChangeSignature = (
      signature: User['signature'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      if (signature === userSignature) return;
      socket.send.updateUser({ user: { signature }, userId });
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
      if (!lang) return;
      ipcService.discord.updatePresence({
        details: lang.tr.RPCFriendPage,
        state: `${lang.tr.RPCUser} ${userName}`,
        largeImageKey: 'app_icon',
        largeImageText: 'RC Voice',
        smallImageKey: 'home_icon',
        smallImageText: lang.tr.RPCFriend,
        timestamp: Date.now(),
        buttons: [
          {
            label: lang.tr.RPCJoinServer,
            url: 'https://discord.gg/adCWzv6wwS',
          },
        ],
      });
    }, [lang, userName]);

    return (
      <div
        className={friendPage['friendWrapper']}
        style={display ? {} : { display: 'none' }}
      >
        {/* Header */}
        <header className={friendPage['friendHeader']}>
          <div
            className={friendPage['avatarPicture']}
            style={{ backgroundImage: `url(${userAvatarUrl})` }}
            datatype={''}
          />
          <div className={friendPage['baseInfoBox']}>
            <div className={friendPage['container']}>
              <div className={friendPage['levelIcon']} />
              <div
                className={`${grade['grade']} ${
                  grade[`lv-${Math.min(56, userLevel)}`]
                }`}
                title={
                  `${lang.tr.level}：${userLevel}，${lang.tr.xp}：${userXP}，${lang.tr.xpDifference}：${userRequiredXP}` /** LEVEL:{userLevel} EXP:{userXP} LEVEL UP REQUIRED:{userRequiredXP}**/
                }
              />
              <div className={friendPage['wealthIcon']} />
              <div className={friendPage['wealthValue']}>0</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
            </div>
            <div
              className={`${friendPage['container']} ${friendPage['myBadges']}`}
            >
              <BadgeListViewer badges={userBadges} maxDisplay={5} />
            </div>
          </div>
          <div className={`${friendPage['signatureBox']}`}>
            <textarea
              ref={signatureInputRef}
              className={friendPage['signatureInput']}
              value={signatureInput}
              placeholder={lang.tr.signaturePlaceholder}
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
              className={emoji['emojiIcon']}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!emojiIconRef.current) return;
                const x = emojiIconRef.current.getBoundingClientRect().x;
                const y =
                  emojiIconRef.current.getBoundingClientRect().y +
                  emojiIconRef.current.getBoundingClientRect().height;
                contextMenu.showEmojiPicker(x, y, false, 'unicode', (emoji) => {
                  setSignatureInput((prev) => prev + emoji);
                  if (signatureInputRef.current)
                    signatureInputRef.current.focus();
                });
              }}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className={friendPage['friendContent']}>
          {/* Left Sidebar */}
          <div
            className={friendPage['sidebar']}
            style={{ width: `${sidebarWidth}px` }}
          >
            <FriendListViewer
              friendGroups={friendGroups}
              friends={friends}
              user={user}
            />
          </div>

          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={() => setIsResizing(true)}
            onMouseUp={() => setIsResizing(false)}
          />

          {/* Right Content */}
          <div className={friendPage['mainContent']}>
            <div className={friendPage['header']}>{lang.tr.friendActive}</div>
          </div>
        </main>
      </div>
    );
  },
);

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;
