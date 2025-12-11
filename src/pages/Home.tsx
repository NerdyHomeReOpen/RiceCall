import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';

// CSS
import styles from '@/styles/home.module.css';

// Components
import ServerList from '@/components/ServerList';
import MarkdownContent from '@/components/MarkdownContent';
import RecommendServerCard from '@/components/RecommendServerCard';

// Type
import type { User, Server, Announcement, RecommendServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipc from '@/ipc';

// Utils
import { handleOpenCreateServer } from '@/utils/popup';
import { getFormatDate } from '@/utils/language';

// Constants
import { ANNOUNCEMENT_SLIDE_INTERVAL, RECOMMEND_SERVER_CATEGORY_TABS } from '@/constant';

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
        <div className={styles['server-id-text']}>{server.specialId || server.displayId}</div>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);

  // States
  const [exactMatch, setExactMatch] = useState<Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Server[]>([]);
  const [section, setSection] = useState<number>(0);
  const [selectedAnnIndex, setSelectedAnnIndex] = useState<number>(0);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
  const [selectReommendServerCategory, setSelectRecommendServerCategory] = useState<string>('all');

  // Variables
  const { userId, currentServerId } = user;
  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);
  const filteredAnns = useMemo(() => announcements.sort((a, b) => b.timestamp - a.timestamp), [announcements]);
  const filteredRecommendServers = useMemo(
    () => recommendServers.filter((server) => !server.tags.includes('official') && (selectReommendServerCategory === 'all' || server.tags.includes(selectReommendServerCategory))),
    [recommendServers, selectReommendServerCategory],
  );
  const filteredOfficialServers = useMemo(() => recommendServers.filter((server) => server.tags.includes('official')), [recommendServers]);

  // Handlers
  const handleSearchServer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    if (!query) {
      handleClearSearchState(true);
      return;
    }

    if (!canSearchRef.current) return;

    ipc.data.searchServer(query).then((serverResults) => {
      const q = searchQueryRef.current;

      handleClearSearchState();

      if (!serverResults.length) return;

      const sorted = [...serverResults].sort((a, b) => {
        const aHasId = a.displayId.toString().includes(q);
        const bHasId = b.displayId.toString().includes(q);
        return aHasId === bHasId ? 0 : aHasId ? -1 : 1;
      });

      const { exact, personal, related } = sorted.reduce(
        (acc, s) => {
          if (s.specialId === q || s.displayId === q) acc.exact = s;
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

  const handleServerSelect = useCallback(
    (server: Server) => {
      if (loadingBox.isLoading) return;
      if (server.serverId === currentServerId) {
        mainTab.setSelectedTabId('server');
        return;
      }
      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(server.specialId || server.displayId);
      ipc.socket.send('connectServer', { serverId: server.serverId });
      handleClearSearchState();
    },
    [currentServerId, mainTab, loadingBox],
  );

  const handleNextAnn = () => {
    setSelectedAnnIndex((prev) => (prev + 1) % filteredAnns.length);
  };

  const handlePrevAnn = () => {
    setSelectedAnnIndex((prev) => (prev === 0 ? filteredAnns.length - 1 : prev - 1));
  };

  const defaultAnnouncement = (ann: Announcement) => (
    <>
      <Image src="/ricecall_logo.webp" alt="ricecall logo" height={80} width={-1} />
      <span>{ann.title}</span>
    </>
  );

  // Effects
  useEffect(() => {
    if (!containerRef.current) return;
    const number = selectedAnnIndex % filteredAnns.length;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: width * number,
      behavior: 'smooth',
    });
  }, [selectedAnnIndex, filteredAnns]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSelectedAnnIndex((prev) => (prev + 1) % filteredAnns.length), ANNOUNCEMENT_SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [filteredAnns]);

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
    const unsub = ipc.deepLink.onDeepLink((serverDisplayId: string) => {
      if (!userId || !serverDisplayId) return;
      ipc.data.searchServer(serverDisplayId).then((servers) => {
        const target = servers.find((s) => s.specialId === serverDisplayId || s.displayId === serverDisplayId);
        if (!target) return;
        handleServerSelect(target);
      });
    });
    return () => unsub();
  }, [userId, handleServerSelect]);

  return (
    <main className={styles['home']} style={display ? {} : { display: 'none' }}>
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
                handleServerSelect(exactMatch);
              }}
            />
            <div className={styles['search-input-clear-btn']} onClick={() => handleClearSearchState(true)} style={searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={styles['search-input-icon']} style={!searchInputRef.current?.value.trim() ? {} : { display: 'none' }} />
            <div className={styles['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${styles['header-text']} ${styles['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server', { '0': searchQueryRef.current })}
                  </div>
                  <SearchResultItem key={exactMatch.serverId} server={exactMatch} onClick={() => handleServerSelect(exactMatch)} />
                </>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('personal-exclusive')}</div>
                  {personalResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleServerSelect(server)} />
                  ))}
                </>
              )}
              {relatedResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('related-search')}</div>
                  {relatedResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onClick={() => handleServerSelect(server)} />
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
            {t('announcement')}
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
          {section !== 4 && (
            <div className={styles['navegate-tab']} data-key="60004" onClick={() => setSection(4)}>
              {t('personal-exclusive')}
            </div>
          )}
          {section === 4 && (
            <div className={styles['navegate-tab']} data-key="60005" onClick={() => setSection(0)}>
              {t('back')}
            </div>
          )}
        </div>
      </header>
      <main className={styles['home-body']} style={section === 0 ? {} : { display: 'none' }}>
        <div className={styles['banner-wrapper']}>
          <div className={styles['banner-container']}>
            <div ref={containerRef} className={styles['banners']}>
              {filteredAnns.length > 0 ? (
                filteredAnns.map((ann) => (
                  <div key={ann.announcementId} className={styles['banner']} style={ann.attachmentUrl ? { backgroundImage: `url(${ann.attachmentUrl})` } : {}} onClick={() => setSelectedAnn(ann)}>
                    {!ann.attachmentUrl ? defaultAnnouncement(ann) : null}
                  </div>
                ))
              ) : (
                <div className={styles['banner']}>{defaultAnnouncement({} as Announcement)}</div>
              )}
            </div>
            {filteredAnns.length > 0 && (
              <>
                <div className={styles['number-list']}>
                  {filteredAnns.map((_, index) => (
                    <nav key={index} className={`${index === selectedAnnIndex ? styles['active'] : ''}`} onClick={() => setSelectedAnnIndex(index)}></nav>
                  ))}
                </div>
                <nav className={`${styles['nav']} ${styles['prev-btn']}`} onClick={handlePrevAnn}>
                  {'◀'}
                </nav>
                <nav className={`${styles['nav']} ${styles['next-btn']}`} onClick={handleNextAnn}>
                  {'▶'}
                </nav>
              </>
            )}
          </div>
        </div>
        <div className={styles['home-wrapper']}>
          <div className={styles['server-list-title']}>{t('recommend-server')}</div>
          <div className={styles['recommend-server-tabs']}>
            {RECOMMEND_SERVER_CATEGORY_TABS.map((tab) => (
              <div
                key={tab.key}
                data-category={tab.key}
                className={`${styles['recommend-server-tab']} ${selectReommendServerCategory === tab.key ? styles['active'] : ''}`}
                onClick={() => setSelectRecommendServerCategory(tab.key)}
              >
                {t(tab.tKey)}
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
        <div className={styles['home-wrapper']}>
          <div className={styles['server-list-title']}>{t('official-server')}</div>
          <section className={styles['servers-container']}>
            {filteredOfficialServers.length > 0 && (
              <div className={styles['server-list']}>
                {filteredOfficialServers.map((server) => (
                  <RecommendServerCard key={server.serverId} user={user} recommendServer={server} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <div className={styles['announcement-detail-wrapper']} style={selectedAnn ? {} : { display: 'none' }} onClick={() => setSelectedAnn(null)}>
        {selectedAnn && (
          <div className={styles['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['announcement-detail-header']}>
              <div className={styles['announcement-type']} data-category={selectedAnn?.category}>
                {t(`${selectedAnn?.category}`)}
              </div>
              <div className={styles['announcement-detail-title']}>{selectedAnn?.title}</div>
              <div className={styles['announcement-datail-date']}>{selectedAnn && getFormatDate(selectedAnn.timestamp)}</div>
            </div>
            {selectedAnn.attachmentUrl && <div className={styles['banner']} style={{ backgroundImage: `url(${selectedAnn.attachmentUrl})` }} />}
            <div className={styles['announcement-detail-content']}>
              <MarkdownContent markdownText={selectedAnn?.content ?? ''} />
            </div>
          </div>
        )}
      </div>
      <main className={styles['home-body']} style={section === 4 ? {} : { display: 'none' }}>
        <div className={styles['home-wrapper']}>
          <ServerList title={t('recent-servers')} servers={recentServers} user={user} />
          <ServerList title={t('my-servers')} servers={ownedServers} user={user} />
          <ServerList title={t('favorited-servers')} servers={favoriteServers} user={user} />
        </div>
      </main>
      <main className={styles['home-body']} style={section === 2 || section === 3 ? {} : { display: 'none' }}>
        <div>{t('not-available-page')}</div>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;
