'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/LocateMe';
import { useLoading } from '@/providers/Loading';

import { useAppSelector } from '@/hooks/Store';

import Header from '@/components/Header';
import SocketManager from '@/components/SocketManager';
import StoreSyncer from '@/components/StoreSyncer';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationToaster from '@/components/NotificationToaster';

import FriendPage from '@/page-components/Friend';
import HomePage from '@/page-components/Home';
import ServerPage from '@/page-components/Server';

const RootPageComponent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { getIsLoading, loadServer, stopLoading } = useLoading();

  const [selectedTab, setSelectedTab] = useState<'home' | 'friends' | 'server'>('home');

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      name: state.user.data.name,
      currentServerId: state.currentServer.data.serverId,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      name: state.currentServer.data.name,
    }),
    shallowEqual,
  );

  const onlineMembersLength = useAppSelector((state) => state.onlineMembers.data.length, shallowEqual);
  const isSocketConnected = useAppSelector((state) => state.socket.isSocketConnected, shallowEqual);

  const isSelectedHomePage = selectedTab === 'home';
  const isSelectedFriendsPage = selectedTab === 'friends';
  const isSelectedServerPage = selectedTab === 'server';

  const handleTabSelect = (tabId: 'home' | 'friends' | 'server') => {
    setSelectedTab(tabId);
  };

  useEffect(() => {
    ipc.tray.title.set(user.name);
  }, [user.name]);

  useEffect(() => {
    if (user.currentServerId) setSelectedTab('server');
    else if (!user.currentServerId) setSelectedTab('home');
    stopLoading();
  }, [user.currentServerId, stopLoading]);

  useEffect(() => {
    const onServerSelect = (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }) => {
      if (getIsLoading() || user.currentServerId === data.serverId) return;
      loadServer(data.serverDisplayId);
      ipc.socket.send('connectServer', { serverId: data.serverId });
    };
    const unsub = ipc.server.onSelect(onServerSelect);
    return () => unsub();
  }, [user.currentServerId, getIsLoading, loadServer]);

  useEffect(() => {
    switch (selectedTab) {
      case 'home':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-home-page'),
          state: `${t('rpc:user', { '0': user.name })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RiceCall',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:home-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
      case 'friends':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-friend-page'),
          state: `${t('rpc:user', { '0': user.name })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RiceCall',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:vewing-friend-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
      case 'server':
        ipc.discord.updatePresence({
          details: `${t('in')} ${currentServer.name}`,
          state: `${t('rpc:chat-with-members', { '0': onlineMembersLength.toString() })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RiceCall',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:viewing-server-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
    }
  }, [selectedTab, user.name, currentServer.name, onlineMembersLength, t]);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <SocketManager />
          <StoreSyncer.Master />
          <Header selectedTab={selectedTab} onTabSelect={handleTabSelect} />
          {!user.userId || !isSocketConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage display={isSelectedHomePage} />
              <FriendPage display={isSelectedFriendsPage} />
              <ServerPage display={isSelectedServerPage} />
              <NotificationToaster />
            </>
          )}
        </ExpandedProvider>
      </ActionScannerProvider>
    </WebRTCProvider>
  );
});

RootPageComponent.displayName = 'RootPageComponent';

const RootPage = dynamic(() => Promise.resolve(RootPageComponent), { ssr: false });

export default RootPage;
