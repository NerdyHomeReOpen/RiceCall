import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import ServerList from '@/components/ServerList';
import MarkdownContent from '@/components/MarkdownContent';
import RecommendServerCard from '@/components/RecommendServerCard';

import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';

import { ANNOUNCEMENT_SLIDE_INTERVAL } from '@/constant';

import styles from '@/styles/home.module.css';

interface HomePageProps {
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ display }) => {
  // Hooks
  const { t } = useTranslation();
  const { setSelectedTabId } = useMainTab();
  const { isLoading, setIsLoading, setLoadingServerId } = useLoading();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const servers = useAppSelector((state) => state.servers.data);
  const announcements = useAppSelector((state) => state.announcements.data);
  const recommendServers = useAppSelector((state) => state.recommendServers.data);

  // Refs
  const canSearchRef = useRef<boolean>(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);

  // States
  const [exactMatch, setExactMatch] = useState<Types.Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Types.Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Types.Server[]>([]);
  const [section, setSection] = useState<'home' | 'personal-exclusive'>('home');
  const [selectedAnnIndex, setSelectedAnnIndex] = useState<number>(0);
  const [selectedAnn, setSelectedAnn] = useState<Types.Announcement | null>(null);

  // Variables
  const { userId, currentServerId } = user;
  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const isSelectedHome = section === 'home';
  const isSelectedPersonalExclusive = section === 'personal-exclusive';
  const hasInput = !!inputRef.current?.value.trim();
  const recentServers = useMemo(() => servers.filter((s) => s.recent).sort((a, b) => b.timestamp - a.timestamp), [servers]);
  const favoriteServers = useMemo(() => servers.filter((s) => s.favorite), [servers]);
  const ownedServers = useMemo(() => servers.filter((s) => s.permissionLevel > 1), [servers]);
  const filteredAnns = useMemo(() => [...announcements].sort((a, b) => b.timestamp - a.timestamp), [announcements]);
  const filteredRecommendServers = useMemo(() => recommendServers.filter((server) => !server.tags.includes('official')), [recommendServers]);
  const filteredOfficialServers = useMemo(() => recommendServers.filter((server) => server.tags.includes('official')), [recommendServers]);

  // Functions
  const searchServers = async (query: string) => {
    if (!query) {
      clearSearchState(true);
      return;
    }

    ipc.data.searchServer({ query }).then((serverResults) => {
      const q = queryRef.current;

      clearSearchState();

      if (!serverResults.length) return;

      const sorted = [...serverResults].sort((a, b) => {
        const aHasId = a.displayId.toString().includes(q);
        const bHasId = b.displayId.toString().includes(q);
        return aHasId === bHasId ? 0 : aHasId ? -1 : 1;
      });

      const { exact, personal, related } = sorted.reduce<{ exact: Types.Server | null; personal: Types.Server[]; related: Types.Server[] }>(
        (acc, s) => {
          if (s.specialId === q || s.displayId === q) acc.exact = s;
          else if (servers.some((ps) => ps.serverId === s.serverId)) acc.personal.push(s);
          else acc.related.push(s);
          return acc;
        },
        { exact: null, personal: [], related: [] },
      );

      setExactMatch(exact);
      setPersonalResults(personal);
      setRelatedResults(related);
    });
    queryRef.current = query;
    canSearchRef.current = false;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      canSearchRef.current = true;
      if (queryRef.current !== inputRef.current?.value) {
        searchServers(inputRef.current?.value || '');
      }
    }, 500);
  };

  const clearSearchState = (clearQuery: boolean = false) => {
    if (clearQuery && inputRef.current) inputRef.current.value = '';
    setExactMatch(null);
    setPersonalResults([]);
    setRelatedResults([]);
  };

  const selectServer = useCallback(
    (server: Types.Server) => {
      if (isLoading) return;
      if (server.serverId === currentServerId) {
        setSelectedTabId('server');
        return;
      }
      setIsLoading(true);
      setLoadingServerId(server.specialId || server.displayId);
      ipc.socket.send('connectServer', { serverId: server.serverId });
      clearSearchState();
    },
    [currentServerId, isLoading, setSelectedTabId, setIsLoading, setLoadingServerId],
  );

  // Handlers
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (canSearchRef.current) searchServers(e.target.value);
  };

  const handleSearchInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (canSearchRef.current) searchServers(e.target.value);
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !exactMatch) return;
    selectServer(exactMatch);
  };

  const handleClearSearchInputBtnClick = () => {
    clearSearchState(true);
  };

  const handleServerSelect = (server: Types.Server) => {
    selectServer(server);
  };

  const handleNextAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev + 1) % filteredAnns.length);
  };

  const handlePrevAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev === 0 ? filteredAnns.length - 1 : prev - 1));
  };

  const handleCreateServerClick = () => {
    Popup.openCreateServer(userId);
  };

  const handlePersonalExclusiveSectionBtnClick = () => {
    setSection('personal-exclusive');
  };

  const handleHomeSectionBtnClick = () => {
    setSection('home');
  };

  const handleBackBtnClick = () => {
    setSection('home');
  };

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
        clearSearchState(true);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const unsub = ipc.deepLink.onDeepLink((serverDisplayId: string) => {
      if (!userId || !serverDisplayId) return;
      ipc.data.searchServer({ query: serverDisplayId }).then((servers) => {
        const target = servers.find((s) => s.specialId === serverDisplayId || s.displayId === serverDisplayId);
        if (!target) return;
        selectServer(target);
      });
    });
    return () => unsub();
  }, [userId, selectServer]);

  return (
    <main className={styles['home']} style={display ? {} : { display: 'none' }}>
      <header className={styles['home-header']}>
        <div className={styles['left']}>
          <div className={styles['back-btn']} />
          <div className={styles['forward-btn']} />
          <div className={styles['search-bar']} ref={searchRef}>
            <input
              ref={inputRef}
              placeholder={t('search-server-placeholder')}
              className={styles['search-input']}
              onFocus={handleSearchInputFocus}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchInputKeyDown}
            />
            <div className={styles['search-input-clear-btn']} onClick={handleClearSearchInputBtnClick} style={hasInput ? {} : { display: 'none' }} />
            <div className={styles['search-input-icon']} style={hasInput ? {} : { display: 'none' }} />
            <div className={styles['search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
              {exactMatch && (
                <>
                  <div className={`${styles['header-text']} ${styles['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
                    {t('quick-enter-server', { '0': queryRef.current })}
                  </div>
                  <SearchResultItem key={exactMatch.serverId} server={exactMatch} onServerSelect={handleServerSelect} />
                </>
              )}
              {personalResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('personal-exclusive')}</div>
                  {personalResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
                  ))}
                </>
              )}
              {relatedResults.length > 0 && (
                <>
                  <div className={styles['header-text']}>{t('related-search')}</div>
                  {relatedResults.map((server) => (
                    <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        <div className={styles['mid']}>
          <div className={`${styles['navegate-tab']} ${isSelectedHome ? styles['active'] : ''}`} data-key="60060" onClick={handleHomeSectionBtnClick}>
            {t('home')}
          </div>
        </div>
        <div className={styles['right']}>
          <div className={styles['navegate-tab']} data-key="30014" onClick={handleCreateServerClick}>
            {t('create-server')}
          </div>
          {!isSelectedPersonalExclusive && (
            <div className={styles['navegate-tab']} data-key="60004" onClick={handlePersonalExclusiveSectionBtnClick}>
              {t('personal-exclusive')}
            </div>
          )}
          {isSelectedPersonalExclusive && (
            <div className={styles['navegate-tab']} data-key="60005" onClick={handleBackBtnClick}>
              {t('back')}
            </div>
          )}
        </div>
      </header>
      <main className={styles['home-body']} style={isSelectedHome ? {} : { display: 'none' }}>
        <div className={styles['banner-wrapper']}>
          <div className={styles['banner-container']}>
            <div ref={containerRef} className={styles['banners']}>
              {filteredAnns.length > 0 ? (
                filteredAnns.map((ann) => (
                  <div key={ann.announcementId} className={styles['banner']} style={ann.attachmentUrl ? { backgroundImage: `url(${ann.attachmentUrl})` } : {}} onClick={() => setSelectedAnn(ann)}>
                    {!ann.attachmentUrl ? <DefaultAnnouncement announcement={ann} /> : null}
                  </div>
                ))
              ) : (
                <div className={styles['banner']}>
                  <DefaultAnnouncement announcement={{} as Types.Announcement} />
                </div>
              )}
            </div>
            {filteredAnns.length > 0 && (
              <>
                <div className={styles['number-list']}>
                  {filteredAnns.map((_, index) => (
                    <nav key={index} className={`${index === selectedAnnIndex ? styles['active'] : ''}`} onClick={() => setSelectedAnnIndex(index)} />
                  ))}
                </div>
                <nav className={`${styles['nav']} ${styles['prev-btn']}`} onClick={handlePrevAnnBtnClick}>
                  {'◀'}
                </nav>
                <nav className={`${styles['nav']} ${styles['next-btn']}`} onClick={handleNextAnnBtnClick}>
                  {'▶'}
                </nav>
              </>
            )}
          </div>
        </div>
        <div className={styles['home-wrapper']}>
          <div className={styles['server-list-title']}>{t('recommend-server')}</div>
          <section className={styles['servers-container']}>
            <div className={styles['server-list']}>
              {filteredRecommendServers.map((server) => (
                <RecommendServerCard key={server.serverId} recommendServer={server} />
              ))}
            </div>
          </section>
        </div>
        <div className={styles['home-wrapper']}>
          <div className={styles['server-list-title']}>{t('official-server')}</div>
          <section className={styles['servers-container']}>
            <div className={styles['server-list']}>
              {filteredOfficialServers.map((server) => (
                <RecommendServerCard key={server.serverId} recommendServer={server} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <div className={styles['announcement-detail-wrapper']} style={selectedAnn ? {} : { display: 'none' }} onClick={() => setSelectedAnn(null)}>
        {selectedAnn && (
          <div className={styles['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['announcement-detail-header']}>
              <div className={styles['announcement-type']} data-category={selectedAnn.category}>
                {t(`${selectedAnn.category}`)}
              </div>
              <div className={styles['announcement-detail-title']}>{selectedAnn.title}</div>
              <div className={styles['announcement-datail-date']}>{Language.getFormatDate(selectedAnn.timestamp)}</div>
            </div>
            {selectedAnn.attachmentUrl && <Image className={styles['banner']} src={selectedAnn.attachmentUrl} alt="announcement" width={-1} height={-1} loading="lazy" draggable="false" />}
            <div className={styles['announcement-detail-content']}>
              <MarkdownContent markdownText={selectedAnn.content} />
            </div>
          </div>
        )}
      </div>
      <main className={styles['home-body']} style={isSelectedPersonalExclusive ? {} : { display: 'none' }}>
        <div className={styles['home-wrapper']}>
          <ServerList title={t('recent-servers')} servers={recentServers} />
          <ServerList title={t('my-servers')} servers={ownedServers} />
          <ServerList title={t('favorited-servers')} servers={favoriteServers} />
        </div>
      </main>
      <main className={styles['home-body']} style={!isSelectedHome && !isSelectedPersonalExclusive ? {} : { display: 'none' }}>
        <div>{t('not-available-page')}</div>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;

interface SearchResultItemProps {
  server: Types.Server;
  onServerSelect: (server: Types.Server) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(({ server, onServerSelect }) => {
  // Handlers
  const handleClick = () => {
    onServerSelect(server);
  };

  return (
    <div className={styles['item']} onClick={handleClick}>
      <Image className={styles['server-avatar-picture']} src={server.avatarUrl} alt={server.name} width={35} height={35} loading="lazy" draggable="false" />
      <div className={styles['server-info-text']}>
        <div className={styles['server-name-text']}>{server.name}</div>
        <div className={styles['server-id-box']}>
          <div className={styles['id-icon']} />
          <div className={styles['server-id-text']}>{server.specialId || server.displayId}</div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

interface DefaultAnnouncementProps {
  announcement: Types.Announcement;
}

const DefaultAnnouncement: React.FC<DefaultAnnouncementProps> = React.memo(({ announcement }) => (
  <>
    <Image loading="lazy" src="/ricecall_logo.webp" alt="ricecall logo" height={80} width={-1} />
    <span>{announcement.title}</span>
  </>
));

DefaultAnnouncement.displayName = 'DefaultAnnouncement';
