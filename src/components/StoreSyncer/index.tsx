import { useEffect } from 'react';
import { shallowEqual } from 'react-redux';

import * as ipc from '@/main/ipc';

import { useAppSelector } from '@/hooks/Store';

const StoreSyncer: React.FC = () => {
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

StoreSyncer.displayName = 'StoreSyncer';

export default StoreSyncer;
