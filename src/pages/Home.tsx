import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// CSS
import styles from '@/styles/home.module.css';

// Components
import ServerList from '@/components/ServerList';
import RecommendServerList from '@/components/RecommendServerList';
import MarkdownContent from '@/components/MarkdownContent';
import RecommendServerCard from '@/components/RecommendServerCard';

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
  <div className={styles['item']} onClick={onClick}>
    <div className={styles['server-avatar-picture']} style={{ backgroundImage: `url(${server.avatarUrl})` }} />
    <div className={styles['server-info-text']}>
      <div className={styles['server-name-text']}>{server.name}</div>
      <div className={styles['server-id-box']}>
        <div className={styles['id-icon']} />
        <div className={styles['server-id-text']}>{server.displayId}</div>
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
  const [selectedAnnCategory, setSelectedAnnCategory] = useState<Announcement['category']>('all');
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const [selectReommendServerCategory, setSelectRecommendServerCategory] = useState<string>('all');

  // Variables
  const { userId, currentServerId } = user;
  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);
  const filteredAnnouncements = useMemo(
    () => announcements.filter((a) => a.category === selectedAnnCategory || selectedAnnCategory === 'all').sort((a, b) => b.timestamp - a.timestamp),
    [announcements, selectedAnnCategory],
  );
  const categoryTabs = useMemo(
    () => [
      { key: 'all', label: t('all') },
      { key: 'general', label: t('general') },
      { key: 'event', label: t('event') },
      { key: 'update', label: t('update') },
      { key: 'system', label: t('system') },
    ],
    [t],
  );

  const filteredRecommendServers = useMemo(
    () => recommendServers.filter((server) => selectReommendServerCategory === 'all' || server.tags.includes(selectReommendServerCategory)),
    [recommendServers, selectReommendServerCategory],
  );

  const announcementCategoryTabs = [
    { key: 'all', label: t('all') },
    { key: 'general', label: t('general') },
    { key: 'event', label: t('event') },
    { key: 'update', label: t('update') },
    { key: 'system', label: t('system') },
  ];

  const recommendServerCategoryTabs = [
    { key: 'all', label: t('all') },
    { key: 'entertainment', label: t('entertainment-server') },
    { key: 'community', label: t('community-server') },
    { key: 'game', label: t('game-server') },
    { key: 'education', label: t('education-server') },
    { key: 'official', label: t('official-server') },
  ];

  // Handlers
  const handleSearchServer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    if (!query) {
      handleClearSearchState(true);
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

  const handleClearSearchState = (clearSearchQuery: boolean = false) => {
    if (clearSearchQuery && searchInputRef.current) searchInputRef.current.value = '';
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);
  };

  const handleConnectServer = useCallback(
    (serverId: Server['serverId'], serverDisplayId: Server['displayId']) => {
      if (loadingBox.isLoading) return;
      if (serverId === currentServerId) {
        mainTab.setSelectedTabId('server');
        return;
      }
      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);
      ipc.socket.send('connectServer', { serverId });
      handleClearSearchState();
    },
    [currentServerId, mainTab, loadingBox],
  );

  // Effects
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClearSearchState(true);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (announcements.length > 0) setSelectedAnn(announcements[announcements.length - 1]);
  }, [announcements]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverSearch', (...args: Server[]) => {
      const q = searchQueryRef.current;

      handleClearSearchState();

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
    });
    return () => unsub();
  }, [servers]);

  useEffect(() => {
    const unsub = ipc.deepLink.onDeepLink(async (serverId: string) => {
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
    });
    return () => unsub();
  }, [userId, handleConnectServer]);

  return (
    <main className={styles['home']} style={display ? {} : { display: 'none' }}>
      {/* Header */}
      <header className={styles['home-header']}>
        <div className={styles['left']}>
          <div className={styles['back-btn']} />
          <div className={styles['forward-btn']} />
          <div className={styles['search-bar']} ref={searchRef}>
            <input
              ref={searchInputRef}
              placeholder={t('search-server-placeholder')}
              className={styles['search-input']}
              onFocus={handleSearchServer}
              onChange={handleSearchServer}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !exactMatch) return;
                handleConnectServer(exactMatch.serverId, exactMatch.displayId);
              }}
            />
            <div className={styles['search-input-clear-btn']} onClick={() => handleClearSearchState(true)} style={searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={styles['search-input-icon']} style={!searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={styles['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${styles['header-text']} ${styles['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server', { '0': exactMatch.displayId })}
                  </div>
                  <SearchResultItem key={exactMatch.serverId} server={exactMatch} onClick={() => handleConnectServer(exactMatch.serverId, exactMatch.displayId)} />
                </>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('personal-exclusive')}</div>
                  {personalResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleConnectServer(server.serverId, server.displayId)} />
                  ))}
                </>
              )}
              {relatedResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('related-search')}</div>
                  {relatedResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleConnectServer(server.serverId, server.displayId)} />
                  ))}
                </>
              )}
              <div className={`${styles['item']} ${styles['input-empty-item']}`} style={!searchInputRef.current?.value.trim() ? {} : { display: 'none' }}>
                {t('search-empty')}
              </div>
            </div>
          </div>
        </div>

        <div className={styles['mid']}>
          <div className={`${styles['navegate-tab']} ${section === 0 ? styles['active'] : ''}`} data-key="60060" onClick={() => setSection(0)}>
            {t('home')}
          </div>
          {/* <div className={`${styles['navegate-tab']} ${section === 1 ? styles['active'] : ''}`} data-key="60060" onClick={() => setSection(1)}>
            {t('recommend')}
          </div> */}
          {/* <div className={`${styles['navegate-tab']} ${section === 2 ? styles['active'] : ''}`} data-key="40007" onClick={() => setSection(2)}>
            {t('game')}
          </div>
          <div className={`${styles['navegate-tab']} ${section === 3 ? styles['active'] : ''}`} data-key="30375" onClick={() => setSection(3)}>
            {t('live')}
          </div> */}
        </div>

        <div className={styles['right']}>
          <div className={styles['navegate-tab']} data-key="30014" onClick={() => handleOpenCreateServer(userId)}>
            {t('create-server')}
          </div>
          <div className={styles['navegate-tab']} data-key="60004" onClick={() => setSection(4)}>
            {t('personal-exclusive')}
          </div>
        </div>
      </header>

      {/* HomePage */}
      <main className={styles['home-body']} style={section === 0 ? {} : { display: 'none' }}>
        {/* Announcement */}
        {/* <div className={styles['announcement-wrapper']}>
          <div className={styles['announcement-header']}>
            {announcementCategoryTabs.map((categoryTab) => (
              <div
                key={categoryTab.key}
                className={`${styles['announcement-tab']} ${selectedAnnouncementCategory === categoryTab.key ? styles['active'] : ''}`}
                onClick={() => setSelectedAnnouncementCategory(categoryTab.key)}
              >
                {t(categoryTab.label)}
              </div>
            ))}
          </div>
          <div className={styles['announcement-list']}>
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.announcementId} className={styles['announcement-item']} onClick={() => setSelectedAnnouncement(announcement)}>
                <div className={styles['announcement-type']} data-category={announcement.category}>
                  {t(`${announcement.category}`)}
                </div>
                <div className={styles['announcement-title']}>{announcement.title}</div>
                <div className={styles['announcement-date']}>{getFormatDate(announcement.timestamp)}</div>
              </div>
            ))}
          </div>
          <div className={styles['announcement-detail-wrapper']} style={selectedAnnouncement ? {} : { display: 'none' }} onClick={() => setSelectedAnnouncement(null)}>
            <div className={styles['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['announcement-detail-header']}>
                <div className={styles['announcement-type']} data-category={selectedAnnouncement?.category}>
                  {t(`${selectedAnnouncement?.category}`)}
                </div>
                <div className={styles['announcement-detail-title']}>{selectedAnnouncement?.title}</div>
                <div className={styles['announcement-datail-date']}>{selectedAnnouncement && getFormatDate(selectedAnnouncement.timestamp)}</div>
              </div>
              <div className={styles['announcement-detail-content']}>
                <MarkdownContent markdownText={selectedAnnouncement?.content ?? ''} />
              </div>
            </div>
          </div>
        </div> */}
        {/* Recommend Server */}
        <div className={styles['home-wrapper']}>
          <div className={styles['label']}>{t('recommend-server')}</div>
          <div className={styles['recommend-server-tabs']}>
            {recommendServerCategoryTabs.map((tab) => (
              <div
                key={tab.key}
                className={`${styles['recommend-server-tab']} ${selectReommendServerCategory === tab.key ? styles['active'] : ''}`}
                onClick={() => setSelectRecommendServerCategory(tab.key)}
              >
                {t(tab.label)}
              </div>
            ))}
          </div>
          <section className={styles['servers-container']}>
            {filteredRecommendServers.length > 0 && (
              <div className={styles['server-list']}>
                {filteredRecommendServers.map((server) => (
                  <RecommendServerCard key={server.serverId} user={user} recommendServer={server} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Recommended servers */}
      <main className={styles['recommended-servers-wrapper']} style={section === 1 ? {} : { display: 'none' }}>
        <RecommendServerList recommendServers={recommendServers} user={user} />
      </main>

      {/* Personal Exclusive */}
      <main className={styles['home-body']} style={section === 4 ? {} : { display: 'none' }}>
        <ServerList title={t('recent-servers')} servers={recentServers} user={user} />
        <ServerList title={t('my-servers')} servers={ownedServers} user={user} />
        <ServerList title={t('favorited-servers')} servers={favoriteServers} user={user} />
      </main>

      {/* Not Available */}
      <main className={styles['home-body']} style={section === 2 || section === 3 ? {} : { display: 'none' }}>
        <div>{t('not-available-page')}</div>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;
