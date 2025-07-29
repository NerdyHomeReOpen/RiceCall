/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Components
import ServerList from '@/components/ServerList';
import RecommendedServerList from '@/components/RecommendedServerList';

// Type
import { RecommendedServers, User, UserServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipcService from '@/services/ipc.service';

const SearchResultItem: React.FC<{
  server: UserServer;
  onClick: () => void;
}> = ({ server, onClick }) => (
  <div className={homePage['item']} onClick={onClick}>
    <div className={homePage['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
    <div className={homePage['server-info-text']}>
      <div className={homePage['server-name-text']}>{server.name}</div>
      <div className={homePage['server-id-box']}>
        <div className={homePage['id-icon']} />
        <div className={homePage['server-id-text']}>{server.displayId}</div>
      </div>
    </div>
  </div>
);

interface HomePageProps {
  user: User;
  servers: UserServer[];
  recommendedServers: RecommendedServers;
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user, servers, recommendedServers, display }) => {
  // Hooks
  const { t } = useTranslation();
  const mainTab = useMainTab();
  const loadingBox = useLoading();
  const socket = useSocket();

  // Refs
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeerRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [exactMatch, setExactMatch] = useState<UserServer | null>(null);
  const [personalResults, setPersonalResults] = useState<UserServer[]>([]);
  const [relatedResults, setRelatedResults] = useState<UserServer[]>([]);
  const [section, setSection] = useState<number>(0);

  // Variables
  const { userId, name: userName, currentServerId } = user;
  const hasResults = exactMatch || personalResults.length > 0 || relatedResults.length > 0;
  const recentServers = servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp);
  const favoriteServers = servers.filter((s) => s.favorite);
  const ownedServers = servers.filter((s) => s.permissionLevel > 1);

  // Handlers
  const handleSearchServer = (query: string) => {
    if (!query.trim()) {
      handleClearSearchState();
      return;
    }
    setSearchQuery(query);
    if (searchTimeerRef.current) {
      clearTimeout(searchTimeerRef.current);
    }
    searchTimeerRef.current = setTimeout(() => {
      ipcService.socket.send('searchServer', { query });
    }, 500);
  };

  const handleConnectServer = (serverId: UserServer['serverId'], serverDisplayId: UserServer['displayId']) => {
    if (currentServerId == serverId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    handleClearSearchState();
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);

    setTimeout(() => {
      ipcService.socket.send('connectServer', { serverId });
    }, loadingBox.loadingTimeStamp);
  };

  const handleServerSearch = (...args: UserServer[]) => {
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);

    if (!args.length) return;

    const sortedServers = args.sort((a, b) => {
      const aHasId = a.displayId.toString().includes(searchQuery);
      const bHasId = b.displayId.toString().includes(searchQuery);
      if (aHasId && !bHasId) return -1;
      if (!aHasId && bHasId) return 1;
      return 0;
    });

    const { exact, personal, related }: { exact: UserServer | null; personal: UserServer[]; related: UserServer[] } = sortedServers.reduce(
      (acc, server) => {
        if (server.displayId === searchQuery) {
          acc.exact = server;
        } else if (servers.some((s) => s.serverId === server.serverId)) {
          acc.personal.push(server);
        } else {
          acc.related.push(server);
        }
        return acc;
      },
      { exact: null, personal: [], related: [] } as { exact: UserServer | null; personal: UserServer[]; related: UserServer[] },
    );

    setExactMatch(exact);
    setPersonalResults(personal);
    setRelatedResults(related);
  };

  const handleOpenCreateServer = (userId: User['userId']) => {
    ipcService.popup.open('createServer', 'createServer');
    ipcService.initialData.onRequest('createServer', { userId });
  };

  const handleClearSearchState = () => {
    setSearchQuery('');
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);
  };

  const handleDeepLink = (serverId: string) => {
    if (!userId) return;
    handleConnectServer(userId, serverId);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      handleClearSearchState();
    }
  }, []);

  // Effects
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const unsubscribe: (() => void)[] = [ipcService.socket.on('serverSearch', handleServerSearch)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [socket.isConnected]);

  useEffect(() => {
    const offDeepLink = ipcService.deepLink.onDeepLink(handleDeepLink);
    return () => offDeepLink();
  }, [handleDeepLink]);

  useEffect(() => {
    ipcService.discord.updatePresence({
      details: t('rpc:home-page'),
      state: `${t('rpc:user')} ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: t('rpc:home-page'),
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
    <main className={homePage['home']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={homePage['home-header']}>
        <div className={homePage['left']}>
          <div className={homePage['back-btn']} />
          <div className={homePage['forward-btn']} />
          <div className={homePage['search-bar']} ref={searchRef}>
            <input
              placeholder={t('search-server-placeholder')}
              className={homePage['search-input']}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                handleSearchServer(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && exactMatch) {
                  handleConnectServer(exactMatch.serverId, exactMatch.displayId);
                }
              }}
            />
            <div className={homePage['search-input-clear-btn']} onClick={handleClearSearchState} style={searchQuery ? {} : { display: 'none' }} />
            <div className={homePage['search-input-icon']} style={!searchQuery ? {} : { display: 'none' }} />
            <div className={homePage['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${homePage['header-text']} ${homePage['exactMatch']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server')}
                  </div>
                  <SearchResultItem
                    key={exactMatch.serverId}
                    server={exactMatch}
                    onClick={() => {
                      handleConnectServer(exactMatch.serverId, exactMatch.displayId);
                    }}
                  />
                </>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={homePage['header-text']}>{t('personal-exclusive')}</div>
                  {personalResults.map((server) => (
                    <SearchResultItem
                      key={server.serverId}
                      server={server}
                      onClick={() => {
                        handleConnectServer(server.serverId, server.displayId);
                      }}
                    />
                  ))}
                </>
              )}
              {relatedResults.length > 0 && (
                <>
                  <div className={homePage['header-text']}>{t('related-search')}</div>
                  {relatedResults.map((server) => (
                    <SearchResultItem
                      key={server.serverId}
                      server={server}
                      onClick={() => {
                        handleConnectServer(server.serverId, server.displayId);
                      }}
                    />
                  ))}
                </>
              )}
              <div className={`${homePage['item']} ${homePage['input-empty-item']}`} style={!searchQuery ? {} : { display: 'none' }}>
                {t('searchEmpty')}
              </div>
            </div>
          </div>
        </div>

        <div className={homePage['mid']}>
          <div className={`${homePage['navegate-tab']} ${section === 0 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(0)}>
            {t('home')}
          </div>
          {/* <div className={`${homePage['navegate-tab']} ${section === 1 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(1)}>
            {t('recommended-servers')}
          </div> */}
          <div className={`${homePage['navegate-tab']} ${section === 2 ? homePage['active'] : ''}`} data-key="40007" onClick={() => setSection(2)}>
            {t('game')}
          </div>
          <div className={`${homePage['navegate-tab']} ${section === 3 ? homePage['active'] : ''}`} data-key="30375" onClick={() => setSection(3)}>
            {t('live')}
          </div>
        </div>

        <div className={homePage['right']}>
          <div className={homePage['navegate-tab']} data-key="30014" onClick={() => handleOpenCreateServer(userId)}>
            {t('create-servers')}
          </div>
          <div className={homePage['navegate-tab']} data-key="60004" onClick={() => setSection(4)}>
            {t('personal-exclusive')}
          </div>
        </div>
      </header>

      {/* Announcement */}
      <webview src="https://ricecall.com.tw/announcement" className={homePage['webview']} style={section === 0 ? {} : { display: 'none' }} />

      {/* Recommended servers */}
      <main className={homePage['recommended-servers']} style={section === 1 ? {} : { display: 'none' }}>
        <RecommendedServerList servers={recommendedServers} user={user} />
      </main>

      {/* Personal Exclusive */}
      <main className={homePage['home-body']} style={section === 4 ? {} : { display: 'none' }}>
        <ServerList title={t('recent-servers')} servers={recentServers} user={user} />
        <ServerList title={t('my-servers')} servers={ownedServers} user={user} />
        <ServerList title={t('favorited-servers')} servers={favoriteServers} user={user} />
      </main>

      {/* Not Available */}
      <main className={homePage['home-body']} style={section === 2 || section === 3 ? {} : { display: 'none' }}>
        <div>{t('not-available-page')}</div>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
