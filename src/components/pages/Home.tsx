import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Components
import ServerList from '@/components/ServerList';
import RecommendServerList from '@/components/RecommendServerList';

// Type
import type { RecommendServerList as RecommendServerListType, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipcService from '@/services/ipc.service';

const SearchResultItem: React.FC<{
  server: Server;
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
  servers: Server[];
  recommendServerList: RecommendServerListType;
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user, servers, recommendServerList, display }) => {
  // Hooks
  const { t } = useTranslation();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // Refs
  const canSearchRef = useRef<boolean>(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchQueryRef = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [exactMatch, setExactMatch] = useState<Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Server[]>([]);
  const [section, setSection] = useState<number>(0);

  // Variables
  const { userId, name: userName, currentServerId } = user;
  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);

  // Handlers
  const handleSearchServer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    if (!query || !canSearchRef.current) return;

    ipcService.socket.send('searchServer', { query });
    searchQueryRef.current = query;
    canSearchRef.current = false;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      canSearchRef.current = true;
    }, 500);
  };

  const handleOpenCreateServer = (userId: User['userId']) => {
    ipcService.popup.open('createServer', 'createServer', { userId });
  };

  const handleClearSearchState = () => {
    if (searchInputRef.current) searchInputRef.current.value = '';
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);
  };

  const handleConnectServer = useCallback(
    (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
      if (loadingBox.isLoading) return;

      if (currentServerId == serverId) {
        mainTab.setSelectedTabId('server');
        return;
      }

      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);
      ipcService.socket.send('connectServer', { serverId });

      setExactMatch(null);
      setPersonalResults([]);
      setRelatedResults([]);
    },
    [currentServerId, mainTab, loadingBox],
  );

  const handleServerSearch = useCallback(
    (...args: Server[]) => {
      const q = searchQueryRef.current;

      setExactMatch(null);
      setPersonalResults([]);
      setRelatedResults([]);

      if (!args.length) return;

      const sorted = [...args].sort((a, b) => {
        const aHasId = a.displayId.toString().includes(q);
        const bHasId = b.displayId.toString().includes(q);
        return aHasId === bHasId ? 0 : aHasId ? -1 : 1;
      });

      const { exact, personal, related } = sorted.reduce(
        (acc, s) => {
          if (s.displayId.toString() === q) acc.exact = s;
          else if (servers.some((ps) => ps.serverId === s.serverId)) acc.personal.push(s);
          else acc.related.push(s);
          return acc;
        },
        { exact: null as Server | null, personal: [] as Server[], related: [] as Server[] },
      );

      setExactMatch(exact);
      setPersonalResults(personal);
      setRelatedResults(related);
    },
    [servers],
  );

  const handleDeepLink = useCallback(
    (serverId: string) => {
      if (!userId) return;
      handleConnectServer(serverId, userId);
    },
    [userId, handleConnectServer],
  );

  // Effects
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setExactMatch(null);
        setPersonalResults([]);
        setRelatedResults([]);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    const unsubscribe = [ipcService.socket.on('serverSearch', handleServerSearch), ipcService.deepLink.onDeepLink(handleDeepLink)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleServerSearch, handleDeepLink]);

  return (
    <main className={homePage['home']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={homePage['home-header']}>
        <div className={homePage['left']}>
          <div className={homePage['back-btn']} />
          <div className={homePage['forward-btn']} />
          <div className={homePage['search-bar']} ref={searchRef}>
            <input
              ref={searchInputRef}
              placeholder={t('search-server-placeholder')}
              className={homePage['search-input']}
              onFocus={handleSearchServer}
              onChange={handleSearchServer}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !exactMatch) return;
                handleConnectServer(exactMatch.serverId, exactMatch.displayId);
              }}
            />
            <div className={homePage['search-input-clear-btn']} onClick={handleClearSearchState} style={searchInputRef.current?.value ? {} : { display: 'none' }} />
            <div className={homePage['search-input-icon']} style={!searchInputRef.current?.value ? {} : { display: 'none' }} />
            <div className={homePage['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${homePage['header-text']} ${homePage['exactMatch']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server')}
                  </div>
                  <SearchResultItem key={exactMatch.serverId} server={exactMatch} onClick={() => handleConnectServer(exactMatch.serverId, exactMatch.displayId)} />
                </>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={homePage['header-text']}>{t('personal-exclusive')}</div>
                  {personalResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleConnectServer(server.serverId, server.displayId)} />
                  ))}
                </>
              )}
              {relatedResults.length > 0 && (
                <>
                  <div className={homePage['header-text']}>{t('related-search')}</div>
                  {relatedResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleConnectServer(server.serverId, server.displayId)} />
                  ))}
                </>
              )}
              <div className={`${homePage['item']} ${homePage['input-empty-item']}`} style={!searchQueryRef.current ? {} : { display: 'none' }}>
                {t('searchEmpty')}
              </div>
            </div>
          </div>
        </div>

        <div className={homePage['mid']}>
          <div className={`${homePage['navegate-tab']} ${section === 0 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(0)}>
            {t('home')}
          </div>
          <div className={`${homePage['navegate-tab']} ${section === 1 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(1)}>
            {t('recommended-servers')}
          </div>
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
        <RecommendServerList servers={recommendServerList} user={user} />
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
