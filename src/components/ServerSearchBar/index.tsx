import React, { useEffect, useRef, useState, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import { useLoading } from '@/providers/Loading';

import { useAppSelector } from '@/hooks/Store';

import SearchResultItem from './SearchResultItem';

import styles from './ServerSearchBar.module.css';

const ServerSearchBar: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { getIsLoading, loadServer } = useLoading();

  const searchRef = useRef<HTMLDivElement>(null);
  const canSearchRef = useRef<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const servers = useAppSelector((state) => state.servers.data, shallowEqual);

  const [exactMatch, setExactMatch] = useState<Types.Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Types.Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Types.Server[]>([]);

  const hasResults = !!exactMatch || !!personalResults.length || !!relatedResults.length;
  const hasInput = !!inputRef.current?.value.trim();

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
    setExactMatch((prev) => (prev ? null : prev));
    setPersonalResults((prev) => (prev.length ? [] : prev));
    setRelatedResults((prev) => (prev.length ? [] : prev));
  };

  const selectServer = useCallback(
    (server: Types.Server) => {
      if (getIsLoading() || user.currentServerId === server.serverId) return;
      loadServer(server.specialId || server.displayId);
      ipc.socket.send('connectServer', { serverId: server.serverId });
      clearSearchState();
    },
    [user.currentServerId, getIsLoading, loadServer],
  );

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
      if (!user.userId || !serverDisplayId) return;
      ipc.data.searchServer({ query: serverDisplayId }).then((servers) => {
        const target = servers.find((s) => s.specialId === serverDisplayId || s.displayId === serverDisplayId);
        if (!target) return;
        selectServer(target);
      });
    });
    return () => unsub();
  }, [user.userId, selectServer]);

  return (
    <div className={styles['server-search-bar']} ref={searchRef}>
      <input
        ref={inputRef}
        placeholder={t('search-server-placeholder')}
        className={styles['server-search-input']}
        onFocus={handleSearchInputFocus}
        onChange={handleSearchInputChange}
        onKeyDown={handleSearchInputKeyDown}
      />
      <div className={styles['server-search-input-clear-button']} onClick={handleClearSearchInputBtnClick} style={hasInput ? {} : { display: 'none' }} />
      <div className={styles['server-search-input-icon']} style={hasInput ? {} : { display: 'none' }} />
      <div className={styles['server-search-dropdown']} style={hasResults ? {} : { display: 'none' }}>
        {exactMatch && (
          <>
            <div className={`${styles['server-search-dropdown-header-text']} ${styles['exact-match']}`} style={exactMatch ? {} : { display: 'none' }}>
              {t('quick-enter-server', { '0': queryRef.current })}
            </div>
            <SearchResultItem key={exactMatch.serverId} server={exactMatch} onServerSelect={handleServerSelect} />
          </>
        )}
        {personalResults.length > 0 && (
          <>
            <div className={styles['server-search-dropdown-header-text']}>{t('personal-exclusive')}</div>
            {personalResults.map((server) => (
              <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
            ))}
          </>
        )}
        {relatedResults.length > 0 && (
          <>
            <div className={styles['server-search-dropdown-header-text']}>{t('related-search')}</div>
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
