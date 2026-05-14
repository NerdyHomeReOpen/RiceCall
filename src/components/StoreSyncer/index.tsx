import React, { useEffect } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import * as ipc from '@/main/ipc';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

const StoreSyncerMaster: React.FC = () => {
  const user = useAppSelector((state) => state.user.data, shallowEqual);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendActivities = useAppSelector((state) => state.friendActivities.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);
  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);
  const servers = useAppSelector((state) => state.servers.data, shallowEqual);
  const currentServer = useAppSelector((state) => state.currentServer.data, shallowEqual);
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const channelEvents = useAppSelector((state) => state.channelEvents.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const memberApplications = useAppSelector((state) => state.memberApplications.data, shallowEqual);
  const currentChannel = useAppSelector((state) => state.currentChannel.data, shallowEqual);
  const announcements = useAppSelector((state) => state.announcements.data, shallowEqual);
  const notifications = useAppSelector((state) => state.notifications.data, shallowEqual);
  const recommendServers = useAppSelector((state) => state.recommendServers.data, shallowEqual);

  useEffect(() => {
    ipc.storeState.sync({
      user,
      friends,
      friendActivities,
      friendGroups,
      friendApplications,
      memberInvitations,
      servers,
      currentServer,
      channels,
      channelEvents,
      onlineMembers,
      memberApplications,
      currentChannel,
      announcements,
      notifications,
      recommendServers,
    });
  }, [
    user,
    friends,
    friendActivities,
    friendGroups,
    friendApplications,
    memberInvitations,
    servers,
    currentServer,
    channels,
    channelEvents,
    onlineMembers,
    memberApplications,
    currentChannel,
    announcements,
    notifications,
    recommendServers,
  ]);

  return null;
};

StoreSyncerMaster.displayName = 'StoreSyncerMaster';

const StoreSyncerSlave: React.FC = React.memo(() => {
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

  return null;
});

StoreSyncerSlave.displayName = 'StoreSyncerSlave';

const StoreSyncer = {
  Master: StoreSyncerMaster,
  Slave: StoreSyncerSlave,
};

export default StoreSyncer;
