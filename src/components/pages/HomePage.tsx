/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// CSS
import homePage from '@/styles/homePage.module.css';

// Components
import ServerListViewer from '@/components/viewers/ServerListViewer';

// Type
import { popupType, type Server, type User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

const HomePageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Socket
  const socket = useSocket();

  // Language
  const lang = useLanguage();

  // Variables
  const userName = user.name;
  const userOwnedServers = user.ownedServers || [];
  const userRecentServers = user.recentServers || [];
  const userFavServers = user.favServers || [];

  // Search Results Control
  const [searchResults, setSearchResults] = useState<Server[]>([]);

  // Update Discord Presence
  useEffect(() => {
    ipcService.discord.updatePresence({
      details: lang.tr.RPCHomePage,
      state: `${lang.tr.RPCUser} ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: lang.tr.RPCHome,
      timestamp: Date.now(),
      buttons: [
        {
          label: lang.tr.RPCJoinServer,
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [userName]);

  // Refresh User
  useEffect(() => {
    socket?.send.refreshUser(null);
  }, []);

  // Handlers
  const handleSearch = (query: string) => {
    socket?.send.searchServer({ query });
    socket?.on.serverSearch((results: Server[]) => {
      setSearchResults(results);
    });
  };

  const handleOpenCreateServerPopup = () => {
    ipcService.popup.open(popupType.CREATE_SERVER);
    ipcService.initialData.onRequest(popupType.CREATE_SERVER, { user: user });
  };

  return (
    <div className={homePage['homeWrapper']}>
      {/* Header */}
      <header className={homePage['homeHeader']}>
        <div className={homePage['left']}>
          <div className={homePage['backBtn']} />
          <div className={homePage['forwardBtn']} />
          <div className={homePage['searchBar']}>
            <input
              type="search"
              placeholder={lang.tr.searchPlaceholder}
              data-placeholder="60021"
              className={homePage['searchInput']}
              onKeyDown={(e) => {
                if (e.key != 'Enter') return;
                if (e.currentTarget.value.trim() === '') return;
                handleSearch(e.currentTarget.value);
              }}
            />
            <div className={homePage['searchIcon']} />
          </div>
        </div>
        <div className={homePage['mid']}>
          <button
            className={`${homePage['navegateItem']} ${homePage['active']}`}
            data-key="60060"
          >
            <div></div>
            {lang.tr.home}
          </button>
          <button className={homePage['navegateItem']} data-key="40007">
            <div></div>
            {lang.tr.game}
          </button>
          <button className={homePage['navegateItem']} data-key="30375">
            <div></div>
            {lang.tr.live}
          </button>
        </div>
        <div className={homePage['right']}>
          <button
            className={homePage['navegateItem']}
            data-key="30014"
            onClick={handleOpenCreateServerPopup}
          >
            <div></div>
            {lang.tr.createGroup}
          </button>
          <button className={homePage['navegateItem']} data-key="60004">
            <div></div>
            {lang.tr.personalExclusive}
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className={homePage['myGroupsWrapper']}>
        <div className={homePage['myGroupsContain']}>
          <div className={homePage['myGroupsView']}>
            {searchResults.length > 0 && (
              <div className={homePage['myGroupsItem']}>
                <div className={homePage['myGroupsTitle']} data-key="60005">
                  {lang.tr.recentVisits}
                </div>
                <ServerListViewer servers={searchResults} />
              </div>
            )}
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                {lang.tr.recentVisits}
              </div>
              <ServerListViewer servers={userRecentServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="30283">
                {lang.tr.myGroups}
              </div>
              <ServerListViewer servers={userOwnedServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                {lang.tr.favoriteGroups}
              </div>
              <ServerListViewer servers={userFavServers} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
