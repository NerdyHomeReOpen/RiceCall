import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// CSS
import homePage from '@/styles/home.module.css';
import announcementStyle from '@/styles/announcement.module.css';

// Components
import ServerList from '@/components/ServerList';
import RecommendServerList from '@/components/RecommendServerList';
import MarkdownContent from '@/components/MarkdownContent';

// Type
import type { User, Server, Announcement, RecommendServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenCreateServer } from '@/utils/popup';
import { getFormatDate } from '@/utils/language';

interface SearchResultItemProps {
  server: Server;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onClick }) => (
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
));

SearchResultItem.displayName = 'SearchResultItem';

interface HomePageProps {
  user: User;
  servers: Server[];
  announcements: Announcement[];
  recommendServers: RecommendServer[];
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user, servers, announcements, recommendServers, display }) => {
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
  const [selectedAnnouncementCategory, setSelectedAnnouncementCategory] = useState<Announcement['category']>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Variables
  const { userId, currentServerId } = user;
  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);

  const filteredAnnouncements = useMemo(
    () => announcements.filter((a) => a.category === selectedAnnouncementCategory || selectedAnnouncementCategory === 'all').sort((a, b) => b.timestamp - a.timestamp),
    [announcements, selectedAnnouncementCategory],
  );

  const categoryTabs = [
    { key: 'all', label: t('all') },
    { key: 'general', label: t('general') },
    { key: 'event', label: t('event') },
    { key: 'update', label: t('update') },
    { key: 'system', label: t('system') },
  ];

  // Handlers
  const handleSearchServer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    if (!query) {
      handleClearSearchState();
      return;
    }

    if (!canSearchRef.current) return;

    ipc.socket.send('searchServer', { query });
    searchQueryRef.current = query;
    canSearchRef.current = false;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      canSearchRef.current = true;
      if (searchQueryRef.current !== searchInputRef.current?.value) {
        handleSearchServer(e);
      }
    }, 500);
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
      ipc.socket.send('connectServer', { serverId });

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
    async (serverId: string) => {
      if (!userId || !serverId) return;
      ipc.socket.send('searchServer', { query: serverId });
      const servers: Server[] = await new Promise((resolve) => {
        const off = ipc.socket.on('serverSearch', (...args: Server[]) => {
          off();
          resolve(args);
        });
      });
      const target = servers.find((s) => s.displayId === serverId);
      if (!target) {
        return;
      }
      handleConnectServer(target.serverId, target.displayId);
    },
    [userId, handleConnectServer]
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
    if (announcements.length > 0) {
      setSelectedAnnouncement(announcements[announcements.length - 1]);
    }
  }, [announcements]);

  useEffect(() => {
    const unsubscribe = [ipc.socket.on('serverSearch', handleServerSearch), ipc.deepLink.onDeepLink(handleDeepLink)];
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
            <div className={homePage['search-input-clear-btn']} onClick={handleClearSearchState} style={searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={homePage['search-input-icon']} style={!searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={homePage['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${homePage['header-text']} ${homePage['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server', { '0': exactMatch.displayId })}
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
              <div className={`${homePage['item']} ${homePage['input-empty-item']}`} style={!searchInputRef.current?.value.trim() ? {} : { display: 'none' }}>
                {t('search-empty')}
              </div>
            </div>
          </div>
        </div>

        <div className={homePage['mid']}>
          <div className={`${homePage['navegate-tab']} ${section === 0 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(0)}>
            {t('home')}
          </div>
          <div className={`${homePage['navegate-tab']} ${section === 1 ? homePage['active'] : ''}`} data-key="60060" onClick={() => setSection(1)}>
            {t('recommend')}
          </div>
          {/* <div className={`${homePage['navegate-tab']} ${section === 2 ? homePage['active'] : ''}`} data-key="40007" onClick={() => setSection(2)}>
            {t('game')}
          </div>
          <div className={`${homePage['navegate-tab']} ${section === 3 ? homePage['active'] : ''}`} data-key="30375" onClick={() => setSection(3)}>
            {t('live')}
          </div> */}
        </div>

        <div className={homePage['right']}>
          <div className={homePage['navegate-tab']} data-key="30014" onClick={() => handleOpenCreateServer(userId)}>
            {t('create-server')}
          </div>
          <div className={homePage['navegate-tab']} data-key="60004" onClick={() => setSection(4)}>
            {t('personal-exclusive')}
          </div>
        </div>
      </header>

      {/* Announcement */}
      <main className={homePage['home-body']} style={section === 0 ? {} : { display: 'none' }}>
        <div className={announcementStyle['announcement-wrapper']}>
          <div className={announcementStyle['announcement-header']}>
            {categoryTabs.map((categoryTab) => (
              <div
                key={categoryTab.key}
                className={`${announcementStyle['announcement-tab']} ${selectedAnnouncementCategory === categoryTab.key ? announcementStyle['active'] : ''}`}
                onClick={() => setSelectedAnnouncementCategory(categoryTab.key)}
              >
                {t(categoryTab.label)}
              </div>
            ))}
          </div>
          <div className={announcementStyle['announcement-list']}>
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.announcementId} className={announcementStyle['announcement-item']} onClick={() => setSelectedAnnouncement(announcement)}>
                <div className={announcementStyle['announcement-type']} data-category={announcement.category}>
                  {t(`${announcement.category}`)}
                </div>
                <div className={announcementStyle['announcement-title']}>{announcement.title}</div>
                <div className={announcementStyle['announcement-date']}>{getFormatDate(announcement.timestamp)}</div>
              </div>
            ))}
          </div>
          <div className={announcementStyle['announcement-detail-wrapper']} style={selectedAnnouncement ? {} : { display: 'none' }} onClick={() => setSelectedAnnouncement(null)}>
            <div className={announcementStyle['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
              <div className={announcementStyle['announcement-detail-header']}>
                <div className={announcementStyle['announcement-type']} data-category={selectedAnnouncement?.category}>
                  {t(`${selectedAnnouncement?.category}`)}
                </div>
                <div className={announcementStyle['announcement-detail-title']}>{selectedAnnouncement?.title}</div>
                <div className={announcementStyle['announcement-datail-date']}>{selectedAnnouncement && getFormatDate(selectedAnnouncement.timestamp)}</div>
              </div>
              <div className={announcementStyle['announcement-detail-content']}>
                <MarkdownContent markdownText={selectedAnnouncement?.content ?? ''} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Recommended servers */}
      <main className={homePage['recommended-servers-wrapper']} style={section === 1 ? {} : { display: 'none' }}>
        <RecommendServerList recommendServers={recommendServers} user={user} />
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
