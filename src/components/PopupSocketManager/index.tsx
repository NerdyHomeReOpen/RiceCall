import React, { useEffect } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { useSoundPlayer } from '@/providers/SoundPlayer';

import { useAppDispatch } from '@/hooks/Store';

const PopupSocketManager: React.FC = React.memo(() => {
  const { playSound } = useSoundPlayer();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const syncStoreState = (snapshot: Types.StoreStateSnapshot) => {
      dispatch(Store.setUser(snapshot.user));
      dispatch(Store.setFriends(snapshot.friends));
      dispatch(Store.setFriendActivities(snapshot.friendActivities));
      dispatch(Store.setFriendGroups(snapshot.friendGroups));
      dispatch(Store.setFriendApplications(snapshot.friendApplications));
      dispatch(Store.setMemberInvitations(snapshot.memberInvitations));
      dispatch(Store.setServers(snapshot.servers));
      dispatch(Store.setCurrentServer(snapshot.currentServer));
      dispatch(Store.setChannels(snapshot.channels));
      dispatch(Store.setChannelEvents(snapshot.channelEvents));
      dispatch(Store.setOnlineMembers(snapshot.onlineMembers));
      dispatch(Store.setMemberApplications(snapshot.memberApplications));
      dispatch(Store.setCurrentChannel(snapshot.currentChannel));
      dispatch(Store.setAnnouncements(snapshot.announcements));
      dispatch(Store.setNotifications(snapshot.notifications));
      dispatch(Store.setRecommendServers(snapshot.recommendServers));
      dispatch(Store.setIsSocketConnected(true));
    };

    const snapshot = ipc.storeState.get();
    if (snapshot) syncStoreState(snapshot);

    const unsub = ipc.storeState.onUpdate(syncStoreState);
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('playSound', (...args) => {
      args.forEach((s) => playSound(s));
    });
    return () => unsub();
  }, [playSound]);

  return null;
});

PopupSocketManager.displayName = 'PopupSocketManager';

export default PopupSocketManager;
