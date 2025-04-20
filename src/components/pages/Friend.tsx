import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import friendPage from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';

// Components
import FriendListViewer from '@/components/viewers/FriendList';
import BadgeViewer from '@/components/viewers/Badge';

// Types
import { FriendGroup, SocketServerEvent, User, UserFriend } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

interface FriendPageProps {
  user: User;
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(
  ({ user, display }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Constants
    const MAXLENGTH = 300;

    // Refs
    const refreshed = useRef(false);

    // States
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>([]);
    const [userFriends, setUserFriends] = useState<UserFriend[]>([]);
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
    const userGrade = Math.min(56, userLevel); // 56 is max level

    // Handlers
    const handleChangeSignature = (
      signature: User['signature'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.updateUser({ user: { signature }, userId });
    };

    const handleUserFriendGroupsUpdate = (data: FriendGroup[] | null) => {
      if (!data) data = [];
      setUserFriendGroups(data);
    };

    const handleUserFriendsUpdate = (data: UserFriend[] | null) => {
      if (!data) data = [];
      setUserFriends(data);
    };

    const handleStartResizing = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    const handleStopResizing = useCallback(() => {
      setIsResizing(false);
    }, []);

    const handleResize = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(270, Math.min(e.clientX, maxWidth));
        setSidebarWidth(newWidth);
      },
      [isResizing],
    );

    // Effects
    useEffect(() => {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleStopResizing);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleStopResizing);
      };
    }, [handleResize, handleStopResizing]);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_FRIEND_GROUPS_UPDATE]:
          handleUserFriendGroupsUpdate,
        [SocketServerEvent.USER_FRIENDS_UPDATE]: handleUserFriendsUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!userId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.userFriendGroups({
            userId: userId,
          }),
          refreshService.userFriends({
            userId: userId,
          }),
        ]).then(([userFriendGroups, userFriends]) => {
          handleUserFriendGroupsUpdate(userFriendGroups);
          handleUserFriendsUpdate(userFriends);
        });
      };
      refresh();
    }, [userId]);

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
        style={{ display: display ? 'flex' : 'none' }}
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
                className={`${grade['grade']} ${grade[`lv-${userGrade}`]}`}
              />
              <div className={friendPage['wealthIcon']} />
              <label className={friendPage['wealthValue']}>0</label>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
            </div>
            <div
              className={`${friendPage['container']} ${friendPage['myBadges']}`}
            >
              <BadgeViewer badges={userBadges} maxDisplay={5} />
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
              friendGroups={userFriendGroups || []}
              friends={userFriends || []}
              userId={userId}
            />
          </div>
          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={handleStartResizing}
            onMouseUp={handleStopResizing}
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
