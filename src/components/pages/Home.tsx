/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Components
import ServerListViewer from '@/components/ServerList';

// Type
import { PopupType, SocketServerEvent, User, UserServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipcService from '@/services/ipc.service';

export interface ServerListSectionProps {
  title: string;
  servers: UserServer[];
  user: User;
}

const ServerListSection: React.FC<ServerListSectionProps> = ({ title, user, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [expanded, setExpanded] = useState(false);

  // Variables
  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  return (
    <div className={homePage['serverList']}>
      <div className={homePage['serverListTitle']}>{title}</div>
      <ServerListViewer user={user} servers={displayedServers} />
      {canExpand && (
        <button
          className={`
            ${homePage['viewMoreBtn']} 
            ${expanded ? homePage['moreIcon'] : homePage['lessIcon']}
          `}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t('viewLess') : t('viewMore')}
        </button>
      )}
    </div>
  );
};

const SearchResultItem: React.FC<{
  server: UserServer;
  onClick: () => void;
}> = ({ server, onClick }) => (
  <div className={homePage['dropdownItem']} onClick={onClick}>
    <div
      className={homePage['serverAvatarPicture']}
      style={{
        backgroundImage: `url(${server.avatarUrl})`,
      }}
    />
    <div className={homePage['serverInfoText']}>
      <div className={homePage['serverNameText']}>{server.name}</div>
      <div className={homePage['serverIdBox']}>
        <div className={homePage['idIcon']} />
        <div className={homePage['serverIdText']}>{server.displayId}</div>
      </div>
    </div>
  </div>
);

interface HomePageProps {
  user: User;
  servers: UserServer[];
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user, servers, display }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

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
    if (!socket || !query.trim()) {
      handleClearSearchState();
      return;
    }
    setSearchQuery(query);
    if (searchTimeerRef.current) {
      clearTimeout(searchTimeerRef.current);
    }
    searchTimeerRef.current = setTimeout(() => {
      socket.send.searchServer({ query });
    }, 500);
  };

  const handleConnectServer = (serverId: UserServer['serverId'], serverDisplayId: UserServer['displayId']) => {
    if (!socket) return;
    if (currentServerId == serverId) {
      mainTab.setSelectedTabId('server');
      return;
    }

    if (currentServerId) {
      socket.send.disconnectServer({
        serverId: currentServerId,
        userId: userId,
      });
    }

    handleClearSearchState();
    loadingBox.setIsLoading(true);
    loadingBox.setLoadingServerId(serverDisplayId);

    setTimeout(() => {
      socket.send.connectServer({
        serverId,
        userId: userId,
      });
    }, loadingBox.loadingTimeStamp);
  };

  const handleServerSearch = (results: UserServer[]) => {
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);

    if (!results.length) return;

    const sortedServers = results.sort((a, b) => {
      const aHasId = a.displayId.toString().includes(searchQuery);
      const bHasId = b.displayId.toString().includes(searchQuery);
      if (aHasId && !bHasId) return -1;
      if (!aHasId && bHasId) return 1;
      return 0;
    });

    const {
      exact,
      personal,
      related,
    }: {
      exact: UserServer | null;
      personal: UserServer[];
      related: UserServer[];
    } = sortedServers.reduce(
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
      {
        exact: null,
        personal: [],
        related: [],
      } as {
        exact: UserServer | null;
        personal: UserServer[];
        related: UserServer[];
      },
    );

    setExactMatch(exact);
    setPersonalResults(personal);
    setRelatedResults(related);
  };

  const handleOpenCreateServer = (userId: User['userId']) => {
    ipcService.popup.open(PopupType.CREATE_SERVER, 'createServer');
    ipcService.initialData.onRequest(PopupType.CREATE_SERVER, { userId });
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
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.SERVER_SEARCH]: handleServerSearch,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket, searchQuery]);

  useEffect(() => {
    const offDeepLink = ipcService.deepLink.onDeepLink(handleDeepLink);
    return () => offDeepLink();
  }, [handleDeepLink]);

  useEffect(() => {
    ipcService.discord.updatePresence({
      details: t('RPCHomePage'),
      state: `${t('RPCUser')} ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: t('RPCHome'),
      timestamp: Date.now(),
      buttons: [
        {
          label: t('RPCJoinServer'),
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [t, userName]);

  return (
    <div className={homePage['homeWrapper']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={homePage['homeHeader']}>
        <div className={homePage['left']}>
          <div className={homePage['backBtn']} />
          <div className={homePage['forwardBtn']} />
          <div className={homePage['searchBar']} ref={searchRef}>
            <input
              placeholder={t('searchPlaceholder')}
              className={homePage['searchInput']}
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
            <div
              className={homePage['searchInputClear']}
              onClick={handleClearSearchState}
              style={searchQuery ? {} : { display: 'none' }}
            />
            <div className={homePage['searchInputIcon']} style={!searchQuery ? {} : { display: 'none' }} />
            <div className={homePage['searchDropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <div
                  className={`${homePage['dropdownHeaderText']} ${homePage['exactMatch']}`}
                  style={exactMatch ? {} : { display: 'none' }}
                >
                  {t('quickEnterServer')}
                  {exactMatch.displayId}
                </div>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={homePage['dropdownHeaderText']}>
                    <div>{t('personalExclusive')}</div>
                  </div>
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
                  <div className={homePage['dropdownHeaderText']}>
                    <div>{t('relatedSearch')}</div>
                  </div>
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
              <div
                className={`${homePage['dropdownItem']} ${homePage['inputEmptyItem']}`}
                style={!searchQuery ? {} : { display: 'none' }}
              >
                {t('searchEmpty')}
              </div>
            </div>
          </div>
        </div>

        <div className={homePage['mid']}>
          <div
            className={`${homePage['navegateItem']} ${section === 0 ? homePage['active'] : ''}`}
            data-key="60060"
            onClick={() => setSection(0)}
          >
            {t('home')}
          </div>
          <div
            className={`${homePage['navegateItem']} ${section === 1 ? homePage['active'] : ''}`}
            data-key="40007"
            onClick={() => setSection(1)}
          >
            {t('game')}
          </div>
          <div
            className={`${homePage['navegateItem']} ${section === 2 ? homePage['active'] : ''}`}
            data-key="30375"
            onClick={() => setSection(2)}
          >
            {t('live')}
          </div>
        </div>

        <div className={homePage['right']}>
          <div className={homePage['navegateItem']} data-key="30014" onClick={() => handleOpenCreateServer(userId)}>
            {t('createServers')}
          </div>
          <div className={homePage['navegateItem']} data-key="60004" onClick={() => setSection(3)}>
            {t('personalExclusive')}
          </div>
        </div>
      </header>

      {/* Announcement */}
      <webview
        src="https://ricecall.com.tw/announcement"
        className={homePage['webview']}
        style={section === 0 ? {} : { display: 'none' }}
      />

      {/* Personal Exclusive */}
      <main className={homePage['homeContent']} style={section === 3 ? {} : { display: 'none' }}>
        <ServerListSection title={t('recentVisits')} servers={recentServers} user={user} />
        <ServerListSection title={t('myServers')} servers={ownedServers} user={user} />
        <ServerListSection title={t('favoriteServers')} servers={favoriteServers} user={user} />
      </main>

      {/* Not Available */}
      <main className={homePage['homeContent']} style={section === 1 || section === 2 ? {} : { display: 'none' }}>
        <div>{t('notAvailablePageMessage')}</div>
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
