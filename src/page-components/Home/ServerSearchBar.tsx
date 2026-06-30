import React, { useEffect, useRef, useState, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useLoading } from '@/providers/Loading';

import { useAppSelector } from '@/hooks/useStore';

import SearchResultItem from './SearchResultItem';

import styles from './Home.module.css';

const ServerSearchBar: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { getIsLoading, loadServer } = useLoading();

  const searchBarEl = useRef<HTMLDivElement>(null);
  const canSearch = useRef<boolean>(true);
  const searchInputEl = useRef<HTMLInputElement>(null);
  const lastQuery = useRef<string>('');
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const userId = useAppSelector((state) => state.user.data.userId);
  const currentServerId = useAppSelector((state) => state.user.data.currentServerId);
  const servers = useAppSelector((state) => state.servers.data, shallowEqual);

  const [exactMatch, setExactMatch] = useState<Types.Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Types.Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Types.Server[]>([]);

  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const hasInput = !!searchInputEl.current?.value.trim();

  const searchServers = async (query: string) => {
    if (!query) {
      clearSearchState(true);
      return;
    }

    ipc.api.searchServer({ query }).then((serverResults) => {
      clearSearchState();

      if (!serverResults.length) return;

      const sortedServerResults = [...serverResults].sort((a, b) => {
        const aHasId = a.displayId.toString().includes(query);
        const bHasId = b.displayId.toString().includes(query);
        return aHasId === bHasId ? 0 : aHasId ? -1 : 1;
      });

      const { exact, personal, related } = sortedServerResults.reduce<{ exact: Types.Server | null; personal: Types.Server[]; related: Types.Server[] }>(
        (acc, s) => {
          if (s.specialId === query || s.displayId === query) acc.exact = s;
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

    lastQuery.current = query;
    canSearch.current = false;

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      canSearch.current = true;
      if (lastQuery.current !== searchInputEl.current?.value) {
        searchServers(searchInputEl.current?.value || '');
      }
    }, 500);
  };

  const clearSearchState = (clearQuery: boolean = false) => {
    if (clearQuery && searchInputEl.current) {
      searchInputEl.current.value = '';
    }

    setExactMatch((prev) => (prev ? null : prev));
    setPersonalResults((prev) => (prev.length ? [] : prev));
    setRelatedResults((prev) => (prev.length ? [] : prev));
  };

  const selectServer = useCallback(
    (server: Types.Server) => {
      if (getIsLoading() || currentServerId === server.serverId) return;
      loadServer(server.specialId || server.displayId);
      ipc.socket.send('connectServer', { serverId: server.serverId });

      clearSearchState();
    },
    [currentServerId, getIsLoading, loadServer],
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canSearch.current) return;
    searchServers(e.target.value);
  };

  const handleSearchInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!canSearch.current) return;
    searchServers(e.target.value);
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (searchBarEl.current && !searchBarEl.current.contains(event.target as Node)) {
        clearSearchState(true);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handleDeepLink = (serverDisplayId: string) => {
      if (!userId || !serverDisplayId) return;

      ipc.api.searchServer({ query: serverDisplayId }).then((servers) => {
        const target = servers.find((s) => s.specialId === serverDisplayId || s.displayId === serverDisplayId);
        if (!target) return;

        selectServer(target);
      });
    };

    const unsub = ipc.deepLink.onDeepLink(handleDeepLink);
    return () => unsub();
  }, [userId, selectServer]);

  return (
    <div className={styles['search-bar']} ref={searchBarEl}>
      <input
        ref={searchInputEl}
        placeholder={t('search-server-placeholder')}
        className={styles['search-input']}
        onFocus={handleSearchInputFocus}
        onChange={handleSearchInputChange}
        onKeyDown={handleSearchInputKeyDown}
      />
      <div className={styles['search-clear-button']} onClick={handleClearSearchInputBtnClick} style={hasInput ? {} : { display: 'none' }} />
      <div className={styles['search-icon']} style={hasInput ? {} : { display: 'none' }} />
      <div className={styles['dropdown']} style={hasResults ? {} : { display: 'none' }}>
        {exactMatch && (
          <>
            <div className={`${styles['dropdown-header-text']} ${styles['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
              {t('quick-enter-server', { '0': lastQuery.current })}
            </div>
            <SearchResultItem key={exactMatch.serverId} server={exactMatch} onServerSelect={handleServerSelect} />
          </>
        )}
        {personalResults.length > 0 && (
          <>
            <div className={styles['dropdown-header-text']}>{t('personal-exclusive')}</div>
            {personalResults.map((server) => (
              <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
            ))}
          </>
        )}
        {relatedResults.length > 0 && (
          <>
            <div className={styles['dropdown-header-text']}>{t('related-search')}</div>
            {relatedResults.map((server) => (
              <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

ServerSearchBar.displayName = 'ServerSearchBar';

export default ServerSearchBar;
