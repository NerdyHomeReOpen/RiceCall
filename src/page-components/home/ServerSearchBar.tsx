import React, { useEffect, useRef, useState, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { useLoading } from '@/providers/Loading';

import { useAppSelector } from '@/hooks/useStore';

import SearchResultItem from './SearchResultItem';

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

    ipc.api.searchServer({ query }).then((serverResults) => {
      const q = queryRef.current;
      clearSearchState();
      if (!serverResults.length) return;

      const sorted = [...serverResults].sort((a, b) => {
        const aHasId = a.displayId.toString().includes(q);
        const bHasId = b.displayId.toString().includes(q);
        return Number(bHasId) - Number(aHasId);
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

      ipc.api.searchServer({ query: serverDisplayId }).then((servers) => {
        const target = servers.find((s) => s.specialId === serverDisplayId || s.displayId === serverDisplayId);
        if (!target) return;
        selectServer(target);
      });
    });

    return () => unsub();
  }, [user.userId, selectServer]);

  return (
    <div className="relative flex items-center min-w-[180px] mr-[15px] bg-background" ref={searchRef}>
      <input
        ref={inputRef}
        placeholder={t('search-server-placeholder')}
        className="flex-1 w-auto px-[10px] py-[5px] text-text-color-quinary border border-border rounded-[5px]"
        onFocus={handleSearchInputFocus}
        onChange={handleSearchInputChange}
        onKeyDown={handleSearchInputKeyDown}
      />
      <div
        className="absolute right-[5px] flex w-[13px] h-[13px] cursor-pointer bg-background bg-[url('/channel/searchCancel.svg')] bg-position-[0_0] bg-auto hover:bg-position-[-13px_0] active:bg-position-[-26px_0]"
        onClick={handleClearSearchInputBtnClick}
        style={hasInput ? {} : { display: 'none' }}
      />
      <div className="absolute right-[5px] block w-[16px] h-[16px] bg-background bg-[url('/icon_search.svg')] bg-position-[0_0] bg-auto" style={hasInput ? {} : { display: 'none' }} />
      <div
        className="absolute top-full right-0 left-0 z-10000 w-[220px] max-h-[400px] mt-[4px] overflow-y-auto bg-background rounded-[3px] shadow-box-shadow [&::-webkit-scrollbar]:w-0"
        style={hasResults ? {} : { display: 'none' }}
      >
        {exactMatch && (
          <>
            <div className="block items-center w-full p-[10px] truncate bg-hover" style={exactMatch ? {} : { display: 'none' }}>
              {t('quick-enter-server', { '0': queryRef.current })}
            </div>
            <SearchResultItem key={exactMatch.serverId} server={exactMatch} onServerSelect={handleServerSelect} />
          </>
        )}
        {personalResults.length > 0 && (
          <>
            <div className="block items-center w-full p-[10px] truncate">{t('personal-exclusive')}</div>
            {personalResults.map((server) => (
              <SearchResultItem key={server.serverId} server={server} onServerSelect={handleServerSelect} />
            ))}
          </>
        )}
        {relatedResults.length > 0 && (
          <>
            <div className="block items-center w-full p-[10px] truncate">{t('related-search')}</div>
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
