import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';

// CSS
import friendPage from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Components
import FriendListViewer from '@/components/viewers/FriendList';
import BadgeListViewer from '@/components/viewers/BadgeList';

// Types
import { User, UserFriend, FriendGroup } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

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

    // Constants
    const MAXLENGTH = 300;

    // States
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [signatureInput, setSignatureInput] = useState<string>(
      user.signature,
    );

    // Variables
    const {
      userId,
      name: userName,
      avatarUrl: userAvatarUrl,
      signature: userSignature,
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
          />
          <div className={friendPage['baseInfoBox']}>
            <div className={friendPage['container']}>
              <div className={friendPage['levelIcon']} />
              <div
                className={`${grade['grade']} ${
                  grade[`lv-${Math.min(56, userLevel)}`]
                }`}
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
          <div className={friendPage['signatureBox']}>
            <textarea
              className={friendPage['signatureInput']}
              value={signatureInput}
              placeholder={lang.tr.signaturePlaceholder}
              data-placeholder="30018"
              onChange={(e) => {
                if (e.target.value.length > MAXLENGTH) return;
                setSignatureInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.shiftKey) return;
                if (e.key !== 'Enter') return;
                if (isComposing) return;
                e.currentTarget.blur();
              }}
              onBlur={() => {
                if (signatureInput == userSignature) return;
                if (signatureInput.length > MAXLENGTH) return;
                handleChangeSignature(signatureInput, userId);
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
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

// use dynamic import to disable SSR
const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;
