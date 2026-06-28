'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/LocateMe';
import { useLoading } from '@/providers/Loading';

import { useAppSelector } from '@/hooks/useStore';

import Header from '@/components/Header';
import SocketManager from '@/components/SocketManager';
import StoreSyncer from '@/components/StoreSyncer';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationToaster from '@/components/NotificationToaster';

import FriendPage from '@/page-components/Friend';
import HomePage from '@/page-components/Home';
import ServerPage from '@/page-components/Server';

type Tab = 'home' | 'friends' | 'server';

const RootPageComponent: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { getIsLoading, loadServer, stopLoading } = useLoading();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const userId = useAppSelector((state) => state.user.data.userId);
  const userName = useAppSelector((state) => state.user.data.name);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerName = useAppSelector((state) => state.currentServer.data.name);
  const onlineMembersLength = useAppSelector((state) => state.onlineMembers.data.length);
  const isSocketConnected = useAppSelector((state) => state.socket.isSocketConnected, shallowEqual);

  const handleTabSelect = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  const handleMaximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    const closeToTray = ipc.systemSettings.closeToTray.get();

    if (closeToTray) {
      ipc.window.close();
    } else {
      ipc.exit();
    }
  };

  useEffect(() => {
    ipc.tray.title.set(userName);
  }, [userName]);

  useEffect(() => {
    if (currentServerId) {
      setActiveTab('server');
    } else if (!currentServerId) {
      setActiveTab('home');
    }

    stopLoading();
  }, [currentServerId, stopLoading]);

  useEffect(() => {
    const handleMaximize = () => {
      setIsFullscreen(true);
    };

    const handleUnmaximize = () => {
      setIsFullscreen(false);
    };

    const unsubs = [ipc.window.onMaximize(handleMaximize), ipc.window.onUnmaximize(handleUnmaximize)];

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    const handleServerSelect = (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }) => {
      if (getIsLoading() || currentServerId === data.serverId) return;
      loadServer(data.serverDisplayId);
      ipc.socket.send('connectServer', { serverId: data.serverId });
    };

    const unsub = ipc.server.onSelect(handleServerSelect);

    return () => unsub();
  }, [currentServerId, getIsLoading, loadServer]);

  useEffect(() => {
    switch (activeTab) {
      case 'home':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-home-page'),
          state: `${t('rpc:user', { '0': userName })}`,
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
          state: `${t('rpc:user', { '0': userName })}`,
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
          details: `${t('in')} ${currentServerName}`,
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
  }, [activeTab, userName, currentServerName, onlineMembersLength, t]);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <SocketManager />
          <StoreSyncer.Master />
          <Header
            activeTab={activeTab}
            isFullscreen={isFullscreen}
            onTabSelect={handleTabSelect}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onUnmaximize={handleUnmaximize}
            onClose={handleClose}
          />
          {!userId || !isSocketConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage display={activeTab === 'home'} />
              <FriendPage display={activeTab === 'friends'} />
              <ServerPage display={activeTab === 'server'} />
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
