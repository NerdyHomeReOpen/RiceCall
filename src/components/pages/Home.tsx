/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Components
import ServerListViewer from '@/components/viewers/ServerList';

// Type
import { PopupType, SocketServerEvent, User, UserServer } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';
import { useMainTab } from '@/providers/MainTab';

// Services
import ipcService from '@/services/ipc.service';

export interface ServerListSectionProps {
  title: string;
  servers: UserServer[];
  user: User;
  onServerClick?: (server: UserServer) => void;
}

const ServerListSection: React.FC<ServerListSectionProps> = ({
  title,
  user,
  servers,
  onServerClick,
}) => {
  // Hooks
  const lang = useLanguage();

  // States
  const [expanded, setExpanded] = useState(false);

  // Variables
  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  return (
    <div className={homePage['serverList']}>
      <div className={homePage['serverListTitle']}>{title}</div>
      <ServerListViewer
        user={user}
        servers={displayedServers}
        onServerClick={onServerClick}
      />
      {canExpand && (
        <button
          className={`
            ${homePage['viewMoreBtn']} 
            ${expanded ? homePage['moreIcon'] : homePage['lessIcon']}
          `}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? lang.tr.viewLess : lang.tr.viewMore}
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
  currentServer: UserServer;
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(
  ({ user, servers, currentServer, display }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const mainTab = useMainTab();

    // Refs
    const searchRef = useRef<HTMLDivElement>(null);

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [exactMatch, setExactMatch] = useState<UserServer | null>(null);
    const [personalResults, setPersonalResults] = useState<UserServer[]>([]);
    const [relatedResults, setRelatedResults] = useState<UserServer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingServerID, setLoadingServerID] = useState<string>();
    const [section, setSection] = useState<number>(0);

    // Variables
    const { userId, name: userName, currentServerId } = user;
    const hasResults =
      exactMatch || personalResults.length > 0 || relatedResults.length > 0;
    const recentServers = servers
      .filter((s) => s.recent)
      .sort((a, b) => b.timestamp - a.timestamp);
    const favoriteServers = servers.filter((s) => s.favorite);
    const ownedServers = servers.filter((s) => s.permissionLevel > 1);

    // Handlers
    const handleSearchServer = (query: string) => {
      if (!socket || !query.trim()) {
        handleClearSearchState();
        return;
      }
      socket.send.searchServer({ query });
      setSearchQuery(query);
    };

    const handleConnectServer = (
      serverId: UserServer['serverId'],
      serverDisplayId: UserServer['displayId'],
    ) => {
      if (!socket) return;
      if (currentServerId == serverId) {
        mainTab.setSelectedTabId('server');
        return;
      }
      socket.send.connectServer({
        serverId,
        userId: userId,
      });
      handleClearSearchState();
      setIsLoading(true);
      setLoadingServerID(serverDisplayId);
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
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        handleClearSearchState();
      }
    }, []);

    // Effects
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
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
      if (mainTab.selectedTabId == 'server') {
        if (!currentServer) return;
        setIsLoading(false);
        setLoadingServerID('');
        localStorage.removeItem('trigger-handle-server-select');
      }
    }, [currentServer, isLoading, mainTab]);

    useEffect(() => {
      const offDeepLink = ipcService.deepLink.onDeepLink(handleDeepLink);
      return () => offDeepLink();
    }, [handleDeepLink]);

    useEffect(() => {
      if (!lang) return;
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
    }, [lang, userName]);

    useEffect(() => {
      const handler = ({ key, newValue }: StorageEvent) => {
        if (key !== 'trigger-handle-server-select' || !newValue) return;
        const { serverDisplayId } = JSON.parse(newValue);
        mainTab.setSelectedTabId('home');
        setIsLoading(true);
        setLoadingServerID(serverDisplayId);
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }, [mainTab]);

    return (
      <div
        className={homePage['homeWrapper']}
        style={display ? {} : { display: 'none' }}
      >
        {/* Header */}
        <header className={homePage['homeHeader']}>
          <div className={homePage['left']}>
            <div className={homePage['backBtn']} />
            <div className={homePage['forwardBtn']} />
            <div className={homePage['searchBar']} ref={searchRef}>
              <input
                placeholder={lang.tr.searchPlaceholder}
                className={homePage['searchInput']}
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  handleSearchServer(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && exactMatch) {
                    handleConnectServer(
                      exactMatch.serverId,
                      exactMatch.displayId,
                    );
                  }
                }}
              />
              <div
                className={homePage['searchInputClear']}
                onClick={handleClearSearchState}
                style={searchQuery ? {} : { display: 'none' }}
              />
              <div
                className={homePage['searchInputIcon']}
                style={!searchQuery ? {} : { display: 'none' }}
              />
              <div
                className={homePage['searchDropdown']}
                style={hasResults ? {} : { display: 'none' }}
              >
                {exactMatch && (
                  <div
                    className={`${homePage['dropdownHeaderText']} ${homePage['exactMatch']}`}
                    style={exactMatch ? {} : { display: 'none' }}
                  >
                    {lang.tr.quickEnterServer}
                    {exactMatch.displayId}
                  </div>
                )}
                {personalResults.length > 0 && (
                  <>
                    <div className={homePage['dropdownHeaderText']}>
                      <div>{lang.tr.personalExclusive}</div>
                    </div>
                    {personalResults.map((server) => (
                      <SearchResultItem
                        key={server.serverId}
                        server={server}
                        onClick={() => {
                          handleConnectServer(
                            server.serverId,
                            server.displayId,
                          );
                        }}
                      />
                    ))}
                  </>
                )}
                {relatedResults.length > 0 && (
                  <>
                    <div className={homePage['dropdownHeaderText']}>
                      <div>{lang.tr.relatedSearch}</div>
                    </div>
                    {relatedResults.map((server) => (
                      <SearchResultItem
                        key={server.serverId}
                        server={server}
                        onClick={() => {
                          handleConnectServer(
                            server.serverId,
                            server.displayId,
                          );
                        }}
                      />
                    ))}
                  </>
                )}
                <div
                  className={`${homePage['dropdownItem']} ${homePage['inputEmptyItem']}`}
                  style={!searchQuery ? {} : { display: 'none' }}
                >
                  {lang.tr.searchEmpty}
                </div>
              </div>
            </div>
          </div>

          <div className={homePage['mid']}>
            <div
              className={`${homePage['navegateItem']} ${
                section === 0 ? homePage['active'] : ''
              }`}
              data-key="60060"
              onClick={() => setSection(0)}
            >
              {lang.tr.home}
            </div>
            <div
              className={`${homePage['navegateItem']} ${
                section === 1 ? homePage['active'] : ''
              }`}
              data-key="40007"
              onClick={() => setSection(1)}
            >
              {lang.tr.game}
            </div>
            <div
              className={`${homePage['navegateItem']} ${
                section === 2 ? homePage['active'] : ''
              }`}
              data-key="30375"
              onClick={() => setSection(2)}
            >
              {lang.tr.live}
            </div>
          </div>

          <div className={homePage['right']}>
            <div
              className={homePage['navegateItem']}
              data-key="30014"
              onClick={() => handleOpenCreateServer(userId)}
            >
              {lang.tr.createServers}
            </div>
            <div
              className={homePage['navegateItem']}
              data-key="60004"
              onClick={() => setSection(3)}
            >
              {lang.tr.personalExclusive}
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
        <main
          className={homePage['homeContent']}
          style={section === 3 ? {} : { display: 'none' }}
        >
          <ServerListSection
            title={lang.tr.recentVisits}
            servers={recentServers}
            user={user}
            onServerClick={(server) => {
              handleConnectServer(server.serverId, server.displayId);
            }}
          />
          <ServerListSection
            title={lang.tr.myServers}
            servers={ownedServers}
            user={user}
            onServerClick={(server) => {
              handleConnectServer(server.serverId, server.displayId);
            }}
          />
          <ServerListSection
            title={lang.tr.favoriteServers}
            servers={favoriteServers}
            user={user}
            onServerClick={(server) => {
              handleConnectServer(server.serverId, server.displayId);
            }}
          />
        </main>

        {/* Not Available */}
        <main
          className={homePage['homeContent']}
          style={section === 1 || section === 2 ? {} : { display: 'none' }}
        >
          <div>{'抱歉，此頁面尚未開放'}</div>
        </main>

        {/* Loading */}
        {isLoading && (
          <div className={homePage['loadingWrapper']}>
            <div className={homePage['loadingBox']}>
              <div className={homePage['loadingTitleContain']}>
                <div>{lang.tr.connectingServer}</div>
                <div className={homePage['loadingServerID']}>
                  {loadingServerID}
                </div>
              </div>
              <div className={homePage['loadingGif']}></div>
              <div
                className={homePage['loadingCloseBtn']}
                onClick={() => setIsLoading(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
